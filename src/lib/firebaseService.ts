import { database, storage } from './firebase';
import { 
  ref as dbRef, 
  push, 
  set, 
  get, 
  update, 
  remove, 
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

// Advertisement specific service
//
// The mobile app fetches each banner from a FIXED object path
// `adverts/<group>/advertisement.png` (by path, rendered by content type),
// so every upload must overwrite that exact object regardless of the source
// file's type. See banner-management-handoff for the storage contract.
export class AdvertisementService {
  private static basePath = 'adverts';

  private static objectPath(group: string): string {
    return `${this.basePath}/${group}/advertisement.png`;
  }

  static async uploadAdvertisement(group: string, file: File): Promise<{ path: string; url: string }> {
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

    // 4. Record for the admin UI's own bookkeeping
    await DatabaseService.update(`${this.basePath}/${group}`, {
      path: objectPath,
      url,
      contentType,
      uploadedAt: new Date().toISOString(),
    });

    return { path: objectPath, url };
  }

  // Reads the fixed object the app actually shows (independent of the DB
  // bookkeeping), so the admin preview always matches what mobile displays.
  static async getAdvertisement(group: string): Promise<string | null> {
    try {
      return await StorageService.getDownloadURL(this.objectPath(group));
    } catch {
      return null;
    }
  }

  static async deleteAdvertisement(group: string): Promise<void> {
    await StorageService.deleteFile(this.objectPath(group));
    await DatabaseService.delete(`${this.basePath}/${group}`);
  }
}

// Missing Person specific service
export class MissingPersonService {
  private static basePath = 'missings';
  private static storagePath = 'missings';

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
    // Delete image from storage if it exists and is not the default message
    if (imagePath !== "Image Not Available") {
      try {
        await StorageService.deleteFile(imagePath);
      } catch (error) {
        console.warn(`Could not delete image: ${imagePath}`, error);
      }
    }

    // Delete database entry
    await DatabaseService.delete(`${this.basePath}/${id}`);
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
    // Delete image from storage if it exists and is not the default message
    if (imagePath !== "Image Not Available") {
      try {
        await StorageService.deleteFile(imagePath);
      } catch (error) {
        console.warn(`Could not delete image: ${imagePath}`, error);
      }
    }

    // Delete database entry
    await DatabaseService.delete(`${this.basePath}/${id}`);
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
