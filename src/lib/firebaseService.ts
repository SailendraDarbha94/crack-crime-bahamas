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
      console.log(`🔍 Attempting to fetch data from path: ${path}`);
      const snapshot = await get(dbRef(database, path));
      const results: any[] = [];
      
      if (snapshot.exists()) {
        console.log(`✅ Data found at path: ${path}`);
        snapshot.forEach((child) => {
          results.push({ id: child.key, ...child.val() });
        });
        console.log(`📊 Retrieved ${results.length} records from ${path}`);
      } else {
        console.log(`ℹ️ No data found at path: ${path}`);
      }
      
      return results;
    } catch (error) {
      console.error(`❌ Error fetching data from path: ${path}`, error);
      throw error;
    }
  }
}

// Storage service functions
export class StorageService {
  // Upload file
  static async uploadFile(path: string, file: File): Promise<string> {
    const fileRef = storageRef(storage, path);
    const snapshot = await uploadBytes(fileRef, file);
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
export class AdvertisementService {
  private static basePath = 'adverts';

  static async uploadAdvertisement(group: string, file: File): Promise<{path: string, url: string}> {
    const extension = file.name.split('.').pop();
    const storagePath = `${this.basePath}/${group}/advertisement.${extension}`;
    
    // Upload to storage
    const downloadURL = await StorageService.uploadFile(storagePath, file);
    
    // Update database
    await DatabaseService.update(`${this.basePath}/${group}`, {
      path: storagePath,
      url: downloadURL,
      uploadedAt: new Date().toISOString()
    });

    return { path: storagePath, url: downloadURL };
  }

  static async getAdvertisement(group: string): Promise<string | null> {
    try {
      const data = await DatabaseService.get(`${this.basePath}/${group}`);
      if (data?.path) {
        // Check if file exists before trying to create blob URL
        try {
          return await StorageService.createBlobURL(data.path);
        } catch (storageError) {
          console.warn(`File not found in storage for ${group}:`, data.path);
          // Clean up database entry for non-existent file
          await DatabaseService.delete(`${this.basePath}/${group}`);
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching advertisement:', error);
      return null;
    }
  }

  static async deleteAdvertisement(group: string): Promise<void> {
    const data = await DatabaseService.get(`${this.basePath}/${group}`);
    if (data?.path) {
      await StorageService.deleteFile(data.path);
      await DatabaseService.delete(`${this.basePath}/${group}`);
    }
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
    try {
      console.log(`🔍 MissingPersonService: Fetching all missing persons from path: ${this.basePath}`);
      const result = await DatabaseService.getAll(this.basePath);
      console.log(`✅ MissingPersonService: Successfully retrieved ${result.length} missing persons`);
      return result;
    } catch (error) {
      console.error(`❌ MissingPersonService: Error fetching missing persons:`, error);
      throw error;
    }
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
    try {
      console.log(`🔍 WantedPersonService: Fetching all wanted persons from path: ${this.basePath}`);
      const result = await DatabaseService.getAll(this.basePath);
      console.log(`✅ WantedPersonService: Successfully retrieved ${result.length} wanted persons`);
      return result;
    } catch (error) {
      console.error(`❌ WantedPersonService: Error fetching wanted persons:`, error);
      throw error;
    }
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
