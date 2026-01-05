import { useState, useEffect } from 'react';
import { DatabaseService, StorageService, MissingPersonService } from '@/lib/firebaseService';

// Hook for real-time database data
export function useFirebaseData<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await DatabaseService.get(path);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [path]);

  const updateData = async (newData: Partial<T>) => {
    try {
      await DatabaseService.update(path, newData);
      setData(prev => prev ? { ...prev, ...newData } : newData as T);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  return { data, loading, error, updateData };
}

// Hook for file upload with progress
export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (path: string, file: File): Promise<string | null> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const url = await StorageService.uploadFileWithProgress(
        path,
        file,
        (progress) => setProgress(progress)
      );
      return url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return { uploadFile, uploading, progress, error };
}

// Hook for managing list data
export function useFirebaseList<T>(path: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, [path]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const result = await DatabaseService.getAll(path);
      setItems(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (item: Omit<T, 'id'>): Promise<string | null> => {
    try {
      const id = await DatabaseService.create(path, item);
      await fetchItems(); // Refresh list
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
      return null;
    }
  };

  const updateItem = async (id: string, updates: Partial<T>) => {
    try {
      await DatabaseService.update(`${path}/${id}`, updates);
      await fetchItems(); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await DatabaseService.delete(`${path}/${id}`);
      await fetchItems(); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  return { 
    items, 
    loading, 
    error, 
    addItem, 
    updateItem, 
    deleteItem, 
    refreshItems: fetchItems 
  };
}

// Hook specifically for missing persons
export function useMissingPersons() {
  const [persons, setPersons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPersons = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await MissingPersonService.getAllMissingPersons();
      setPersons(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch missing persons');
      setPersons([]);
    } finally {
      setLoading(false);
    }
  };

  const deletePerson = async (id: string, imagePath: string) => {
    try {
      await MissingPersonService.deleteMissingPerson(id, imagePath);
      await fetchPersons(); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete person');
      throw err;
    }
  };

  const createPerson = async (personData: any, imageFile?: File) => {
    try {
      const id = await MissingPersonService.createMissingPerson(personData, imageFile);
      await fetchPersons(); // Refresh list
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create person');
      throw err;
    }
  };

  useEffect(() => {
    fetchPersons();
  }, []);

  return {
    persons,
    loading,
    error,
    fetchPersons,
    deletePerson,
    createPerson,
    refreshPersons: fetchPersons
  };
}
