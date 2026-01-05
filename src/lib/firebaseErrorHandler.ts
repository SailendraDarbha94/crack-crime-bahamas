import { FirebaseError } from 'firebase/app';

export class FirebaseErrorHandler {
  static handleError(error: unknown): string {
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'permission-denied':
          return 'You do not have permission to perform this action.';
        case 'network-request-failed':
          return 'Network error. Please check your internet connection.';
        case 'storage/unauthorized':
          return 'Unauthorized to access storage. Please log in.';
        case 'storage/canceled':
          return 'Upload was canceled.';
        case 'storage/quota-exceeded':
          return 'Storage quota exceeded. Please contact administrator.';
        case 'storage/invalid-format':
          return 'Invalid file format. Please upload a valid image file.';
        case 'storage/object-not-found':
          return 'File not found.';
        case 'database/permission-denied':
          return 'Database access denied. Please log in.';
        case 'database/network-error':
          return 'Database network error. Please try again.';
        default:
          return `Firebase error: ${error.message}`;
      }
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return 'An unknown error occurred.';
  }

  static isNetworkError(error: unknown): boolean {
    if (error instanceof FirebaseError) {
      return error.code === 'network-request-failed' || 
             error.code === 'database/network-error';
    }
    return false;
  }

  static isPermissionError(error: unknown): boolean {
    if (error instanceof FirebaseError) {
      return error.code === 'permission-denied' || 
             error.code === 'storage/unauthorized' ||
             error.code === 'database/permission-denied';
    }
    return false;
  }
}

// Retry utility for network errors
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (!FirebaseErrorHandler.isNetworkError(error) || i === maxRetries - 1) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  
  throw lastError;
}
