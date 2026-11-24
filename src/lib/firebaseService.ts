import { database, storage } from './firebase';
import { 
  ref as dbRef, 
  push, 
  set, 
  get, 
  update, 
  remove, 
  runTransaction,
  serverTimestamp,
  child, 
  orderByChild, 
  query, 
  equalTo 
} from 'firebase/database';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getBytes,
  uploadBytesResumable
} from 'firebase/storage';
import { downscaleImage, sniffImageType } from './imageUtils';
import { normaliseRemarks, publicRecordOf, type PeopleKind } from './archive';
import { encryptText } from './tipCrypto';

// Database service functions
export class DatabaseService {
  // Test database connection
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing database connection...');
      const testRef = dbRef(database, '.info/connected');
      const snapshot = await get(testRef);
      const connected = snapshot.val();
      console.log(`📡 Database connection status: ${connected ? 'Connected' : 'Disconnected'}`);
      return connected;
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      return false;
    }
  }

  // Create a new record
  static async create(path: string, data: any): Promise<string> {
    const newRef = push(dbRef(database, path));
    await set(newRef, data);
    return newRef.key!;
  }

  // Update a record
  static async update(path: string, data: any): Promise<void> {
    await update(dbRef(database, path), data);
  }

  // Get a single record
  static async get(path: string): Promise<any> {
    const snapshot = await get(dbRef(database, path));
    return snapshot.exists() ? snapshot.val() : null;
  }

  // Delete a record
  static async delete(path: string): Promise<void> {
    await remove(dbRef(database, path));
  }

  // Query records
  static async query(path: string, orderBy: string, equalTo: any): Promise<any[]> {
    const q = query(dbRef(database, path), orderByChild(orderBy), equalTo(equalTo));
    const snapshot = await get(q);
    const results: any[] = [];
    snapshot.forEach((child) => {
      results.push({ id: child.key, ...child.val() });
    });
    return results;
  }

  // Get all records from a path
  static async getAll(path: string): Promise<any[]> {
    try {
      const snapshot = await get(dbRef(database, path));
      const results: any[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          results.push({ id: child.key, ...child.val() });
        });
      }
      return results;
    } catch (error) {
      console.error(`Error fetching data from path: ${path}`, error);
      throw error;
    }
  }
}

// Storage service functions
export class StorageService {
  // Upload file (optionally forcing a content type — the object name and its
  // actual encoding can differ, so callers set contentType explicitly).
  static async uploadFile(path: string, file: File | Blob, contentType?: string): Promise<string> {
    const fileRef = storageRef(storage, path);
    const metadata = contentType ? { contentType } : undefined;
    const snapshot = await uploadBytes(fileRef, file, metadata);
    return await getDownloadURL(snapshot.ref);
  }

  // Upload file with progress tracking
  static uploadFileWithProgress(
    path: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const fileRef = storageRef(storage, path);
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(progress);
        },
        (error) => reject(error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  }

  // Get file as bytes
  static async getFileBytes(path: string): Promise<ArrayBuffer> {
    const fileRef = storageRef(storage, path);
    return await getBytes(fileRef);
  }

  // Get download URL
  static async getDownloadURL(path: string): Promise<string> {
    const fileRef = storageRef(storage, path);
    return await getDownloadURL(fileRef);
  }

  // Delete file
  static async deleteFile(path: string): Promise<void> {
    const fileRef = storageRef(storage, path);
    await deleteObject(fileRef);
  }

  // Create blob URL from storage path
  static async createBlobURL(path: string, mimeType: string = 'image/jpeg'): Promise<string> {
    try {
      const arrayBuffer = await this.getFileBytes(path);
      const blob = new Blob([arrayBuffer], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error(`Failed to create blob URL for path: ${path}`, error);
      throw new Error(`File not found: ${path}`);
    }
  }
}

// Admin-managed fixed-path images.
//
// The mobile app fetches these objects by FIXED path (rendered by content
// type, not extension), so every upload must overwrite that exact object
// regardless of the source file's type:
//   adverts/<group>/advertisement.png  — banner/interstitial advert slots
//   heroes/<group>/hero.png           — hub-screen hero images
class ManagedImageStore {
  constructor(
    private basePath: string,
    private objectName: string
  ) {}

  objectPath(group: string): string {
    return `${this.basePath}/${group}/${this.objectName}`;
  }

  async upload(group: string, file: File): Promise<{ path: string; url: string }> {
    const objectPath = this.objectPath(group);

    // 1. Downscale/re-encode client-side (<=1600px long edge, ~<=800KB)
    const { blob, contentType } = await downscaleImage(file);

    // 2. Best-effort timestamped backup of the image we're about to replace
    try {
      const existing = await StorageService.getFileBytes(objectPath);
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      await StorageService.uploadFile(
        `${this.basePath}/${group}/history/${stamp}.png`,
        new Blob([existing]),
        sniffImageType(existing)
      );
    } catch {
      // No current object (or it isn't readable) — nothing to back up
    }

    // 3. Overwrite the fixed object the app reads, with the true content type
    const url = await StorageService.uploadFile(objectPath, blob, contentType);

    // 4. Best-effort bookkeeping — the app reads Storage directly, so a
    // failed database write must never fail the upload itself
    try {
      await DatabaseService.update(`${this.basePath}/${group}`, {
        path: objectPath,
        url,
        contentType,
        uploadedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn(`Bookkeeping write failed for ${objectPath}:`, err);
    }

    return { path: objectPath, url };
  }

  // Reads the fixed object the app actually shows (independent of the DB
  // bookkeeping), so the admin preview always matches what mobile displays.
  async get(group: string): Promise<string | null> {
    try {
      return await StorageService.getDownloadURL(this.objectPath(group));
    } catch {
      return null;
    }
  }

  async delete(group: string): Promise<void> {
    await StorageService.deleteFile(this.objectPath(group));
    await DatabaseService.delete(`${this.basePath}/${group}`);
  }
}

// Banner/interstitial advert slots (the 12 slots the mobile app reads)
export const advertImages = new ManagedImageStore('adverts', 'advertisement.png');
// Hub-screen hero images (home, whoWeAre) — brand artwork, not ad campaigns
export const heroImages = new ManagedImageStore('heroes', 'hero.png');

/** What an admin can change about a listed missing person. */
export type MissingPersonDetails = {
  name: string;
  age: string;
  gender: string;
  alias: string;
  description: string;
  last_known_address: string;
};

/** The same for a wanted person, who also has what they are wanted for. */
export type WantedPersonDetails = MissingPersonDetails & { wanted_for: string };

const NO_IMAGE = "Image Not Available";

/** The file's extension as written in its name (".jpg"), or "" when it has none. */
const extensionOf = (file: File): string =>
  (/\.[A-Za-z0-9]{1,5}$/.exec(file.name)?.[0] ?? "").toLowerCase();

/**
 * Change a listed person's details, and their picture when a new one is
 * given. `kind` is "missings" or "wanteds": the name of both the database
 * node and the Storage folder. `changes` holds only the details this admin
 * actually changed: a page can have been open for hours, and writing back
 * every field it loaded would undo a correction another admin made since.
 * Everything else stored with the person is kept.
 *
 * The record is written in a transaction, so a person another admin has
 * archived or deleted since the page loaded is never brought back as a half
 * record: if they are gone, nothing is written and this throws.
 *
 * A new picture is uploaded under a name of its own first, and the record is
 * pointed at it only when that upload has worked. The old picture is removed
 * afterwards, unless another listed or archived record of the same kind still
 * uses it; if anything goes wrong there, it is simply left in place.
 */
async function updateListedPerson(
  kind: PeopleKind,
  id: string,
  changes: Partial<WantedPersonDetails>,
  newImage?: File
): Promise<void> {
  let newImagePath: string | null = null;
  if (newImage) {
    newImagePath = `${kind}/${id}-${Date.now()}${extensionOf(newImage)}`;
    await StorageService.uploadFile(newImagePath, newImage);
  }

  const forgetNewImage = async () => {
    if (!newImagePath) return;
    try {
      await StorageService.deleteFile(newImagePath);
    } catch (error) {
      console.warn(`Could not remove the unused picture ${newImagePath}:`, error);
    }
  };

  // The callback can run more than once (first against the local copy, then
  // against the database's); the last run is the one that was written.
  let oldImagePath: unknown = null;
  let result;
  try {
    result = await runTransaction(dbRef(database, `${kind}/${id}`), (current) => {
      oldImagePath = current?.image ?? null;
      // Nothing here (or not yet known locally): write nothing. If the
      // database does hold the record, the transaction runs again with it.
      if (current === null || typeof current !== "object") return current;
      return { ...current, ...changes, ...(newImagePath ? { image: newImagePath } : {}) };
    });
  } catch (error) {
    // A failure here does not prove nothing was written: when the connection
    // drops just after the write was sent, the SDK reports "disconnect"
    // although the database may have applied it. So the new picture is not
    // simply deleted: the database is asked whether the record points at it,
    // and it is removed only if not (and left alone if that cannot be read).
    if (newImagePath) await removePictureIfUnused(kind, newImagePath);
    throw error;
  }
  if (!result.committed || !result.snapshot.exists()) {
    await forgetNewImage();
    throw new Error("This person is no longer listed — they may already be archived or deleted.");
  }

  if (newImagePath && typeof oldImagePath === "string" && oldImagePath && oldImagePath !== NO_IMAGE && oldImagePath !== newImagePath) {
    await removePictureIfUnused(kind, oldImagePath);
  }
}

/**
 * The Storage path of a person's picture as their stored record gives it, or
 * `fallback` (what the page had loaded) when the record does not say. Null
 * when there is no picture to speak of.
 */
function currentPicturePath(record: unknown, fallback: string): string | null {
  const stored = record !== null && typeof record === "object" ? (record as { image?: unknown }).image : undefined;
  const path = typeof stored === "string" && stored ? stored : fallback;
  return path && path !== NO_IMAGE ? path : null;
}

/** Delete a picture from Storage unless a listed or archived person of this kind still points at it. */
async function removePictureIfUnused(kind: PeopleKind, path: string): Promise<void> {
  try {
    const [listed, archived] = await Promise.all([
      get(dbRef(database, kind)),
      get(dbRef(database, `archive/${kind}`)),
    ]);
    const uses = (node: unknown) =>
      node !== null && typeof node === "object" &&
      Object.values(node as Record<string, { image?: unknown } | null>).some((record) => record?.image === path);
    if (uses(listed.val()) || uses(archived.val())) return;
    await StorageService.deleteFile(path);
  } catch (error) {
    console.warn(`The old picture ${path} was left in place:`, error);
  }
}

// Missing Person specific service
export class MissingPersonService {
  private static basePath = 'missings';
  private static storagePath = 'missings';

  /** Change some of a listed missing person's details and, optionally, their picture. See updateListedPerson. */
  static async updateMissingPerson(id: string, changes: Partial<MissingPersonDetails>, newImage?: File): Promise<void> {
    await updateListedPerson("missings", id, changes, newImage);
  }

  static async createMissingPerson(personData: any, imageFile?: File): Promise<string> {
    const timestamp = Date.now();
    let imagePath = "Image Not Available";

    // Upload image if provided
    if (imageFile) {
      // Check if file already exists
      const existingUrl = await this.checkFileExists(imageFile.name);
      if (existingUrl) {
        throw new Error("Picture already exists");
      }

      imagePath = `${this.storagePath}/${imageFile.name}`;
      await StorageService.uploadFile(imagePath, imageFile);
    }

    // Create database entry
    const missingPersonData = {
      ...personData,
      image: imagePath,
      created_at: timestamp,
      country_code: "BAH",
      current_status: ""
    };

    return await DatabaseService.create(this.basePath, missingPersonData);
  }

  static async getAllMissingPersons(): Promise<any[]> {
    return DatabaseService.getAll(this.basePath);
  }

  static async deleteMissingPerson(id: string, imagePath: string): Promise<void> {
    // Make sure the record is still here before touching anything. A stale
    // page could otherwise delete the picture of a person who was archived
    // meanwhile — the archive keeps the same image path.
    const snapshot = await get(dbRef(database, `${this.basePath}/${id}`));
    if (!snapshot.exists()) {
      throw new Error("This person is no longer listed — they may already be archived or deleted.");
    }

    // The picture to remove is the one the record names NOW. The page's copy
    // can be out of date since pictures became replaceable: deleting from it
    // would leave the person's current picture behind in Storage.
    const picture = currentPicturePath(snapshot.val(), imagePath);

    // The record goes first: it is what was asked for. The picture is then
    // removed only for a person who was really deleted.
    await DatabaseService.delete(`${this.basePath}/${id}`);
    if (picture) {
      try {
        await StorageService.deleteFile(picture);
      } catch (error) {
        console.warn(`Could not delete image: ${picture}`, error);
      }
    }
  }

  private static async checkFileExists(fileName: string): Promise<boolean> {
    try {
      const path = `${this.storagePath}/${fileName}`;
      await StorageService.getDownloadURL(path);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Wanted Person specific service
export class WantedPersonService {
  private static basePath = 'wanteds';
  private static storagePath = 'wanteds';

  /** Change some of a listed wanted person's details and, optionally, their picture. See updateListedPerson. */
  static async updateWantedPerson(id: string, changes: Partial<WantedPersonDetails>, newImage?: File): Promise<void> {
    await updateListedPerson("wanteds", id, changes, newImage);
  }

  static async createWantedPerson(personData: any, imageFile?: File): Promise<string> {
    const timestamp = Date.now();
    let imagePath = "Image Not Available";

    // Upload image if provided
    if (imageFile) {
      // Check if file already exists
      const existingUrl = await this.checkFileExists(imageFile.name);
      if (existingUrl) {
        throw new Error("Picture is duplicate");
      }

      imagePath = `${this.storagePath}/${imageFile.name}`;
      await StorageService.uploadFile(imagePath, imageFile);
    }

    // Create database entry
    const wantedPersonData = {
      ...personData,
      image: imagePath,
      created_at: timestamp,
      country_code: "BAH",
      current_status: ""
    };

    return await DatabaseService.create(this.basePath, wantedPersonData);
  }

  static async getAllWantedPersons(): Promise<any[]> {
    return DatabaseService.getAll(this.basePath);
  }

  static async deleteWantedPerson(id: string, imagePath: string): Promise<void> {
    // Make sure the record is still here before touching anything. A stale
    // page could otherwise delete the picture of a person who was archived
    // meanwhile — the archive keeps the same image path.
    const snapshot = await get(dbRef(database, `${this.basePath}/${id}`));
    if (!snapshot.exists()) {
      throw new Error("This person is no longer listed — they may already be archived or deleted.");
    }

    // The picture to remove is the one the record names NOW. The page's copy
    // can be out of date since pictures became replaceable: deleting from it
    // would leave the person's current picture behind in Storage.
    const picture = currentPicturePath(snapshot.val(), imagePath);

    // The record goes first: it is what was asked for. The picture is then
    // removed only for a person who was really deleted.
    await DatabaseService.delete(`${this.basePath}/${id}`);
    if (picture) {
      try {
        await StorageService.deleteFile(picture);
      } catch (error) {
        console.warn(`Could not delete image: ${picture}`, error);
      }
    }
  }

  private static async checkFileExists(fileName: string): Promise<boolean> {
    try {
      const path = `${this.storagePath}/${fileName}`;
      await StorageService.getDownloadURL(path);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Archived wanted and missing persons.
//
// Archiving MOVES the record to the admin-only /archive node in one atomic
// update, which is what takes the person off the public site, the police
// portal and every installed app at once (the app lists people through
// /api/wanted and /api/missing, which read the public nodes only). The
// picture stays in Storage so a restore brings the person back whole.
export class PersonArchiveService {
  static path(kind: PeopleKind, id?: string): string {
    return id ? `archive/${kind}/${id}` : `archive/${kind}`;
  }

  /** Move a listed person into the archive with the admin's remarks. Whole or not at all. */
  static async archive(kind: PeopleKind, id: string, adminUid: string, remarks: string): Promise<void> {
    const clean = normaliseRemarks(remarks);
    if (!clean) throw new Error("Remarks are required to archive.");
    // Read fresh rather than trusting the page's copy: another admin may have
    // edited, archived or deleted this person since the list loaded.
    const snapshot = await get(dbRef(database, `${kind}/${id}`));
    if (!snapshot.exists()) {
      throw new Error("This person is no longer listed — they may already be archived or deleted.");
    }
    const updates: Record<string, unknown> = {};
    updates[this.path(kind, id)] = {
      ...publicRecordOf(snapshot.val()),
      archived: { at: serverTimestamp(), by: adminUid, remarks: encryptText(clean) },
    };
    updates[`${kind}/${id}`] = null;
    await update(dbRef(database), updates);
  }

  /** Put an archived person back on the public list under the same id. */
  static async restore(kind: PeopleKind, id: string): Promise<void> {
    const snapshot = await get(dbRef(database, this.path(kind, id)));
    if (!snapshot.exists()) {
      throw new Error("This person is not in the archive any more.");
    }
    const updates: Record<string, unknown> = {};
    // The rules refuse archive fields on the public node; strip them here so
    // a correct client never trips that, and remarks never go public.
    updates[`${kind}/${id}`] = publicRecordOf(snapshot.val());
    updates[this.path(kind, id)] = null;
    await update(dbRef(database), updates);
  }

  static async getAll(kind: PeopleKind): Promise<any[]> {
    return DatabaseService.getAll(this.path(kind));
  }

  /** Delete an archived person for good, picture included. */
  static async deleteArchived(kind: PeopleKind, id: string, imagePath?: string): Promise<void> {
    // As with a listed person: confirm the record is still here (it may have
    // been restored meanwhile, in which case its picture is live again), and
    // remove the record before the picture.
    const snapshot = await get(dbRef(database, this.path(kind, id)));
    if (!snapshot.exists()) {
      throw new Error("This person is not in the archive any more.");
    }
    await DatabaseService.delete(this.path(kind, id));
    if (imagePath && imagePath !== "Image Not Available") {
      try {
        await StorageService.deleteFile(imagePath);
      } catch (error) {
        console.warn(`Could not delete image: ${imagePath}`, error);
      }
    }
  }
}
