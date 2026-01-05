// Firebase data types
export interface Advertisement {
  id?: string;
  path: string;
  url?: string;
  uploadedAt: string;
  group: string;
}

export interface Missing {
  id?: string;
  name: string;
  age: number;
  description: string;
  last_known_address: string;
  gender: string;
  alias: string;
  image: string;
  created_at: number;
  current_status: string;
  country_code: string;
}

export interface Wanted {
  id?: string;
  name: string;
  description: string;
  charges: string;
  imageUrl?: string;
  lastKnownLocation?: string;
  reportedAt: string;
  status: 'wanted' | 'caught' | 'cleared';
}

export interface Member {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'member' | 'volunteer';
  joinedAt: string;
  isActive: boolean;
}

export interface Message {
  id?: string;
  from: string;
  to: string;
  subject: string;
  content: string;
  sentAt: string;
  isRead: boolean;
  type: 'general' | 'report' | 'emergency';
}

export interface Notification {
  id?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'emergency' | 'success';
  targetAudience: 'all' | 'members' | 'admins';
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface Registration {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  reason: string;
  registeredAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

// Upload progress callback type
export type ProgressCallback = (progress: number) => void;

// Firebase service response types
export interface FirebaseResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// File upload types
export interface FileUploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  path: string;
  onProgress?: ProgressCallback;
}

export interface UploadResult {
  url: string;
  path: string;
  metadata: any;
}
