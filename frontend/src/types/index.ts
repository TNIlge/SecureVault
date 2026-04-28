export interface User {
  id: number;
  username: string;
  email: string;
  gender: string;
  role: 'admin' | 'client';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface FileMetadata {
  id: number;
  filename: string;
  mime_type: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: 'UPLOAD' | 'DOWNLOAD' | 'DELETE' | 'RENAME' | 'LOGIN';
  resource: string;
  details: string;
  created_at: string;
  username?: string; // Optionnel, pour l'admin
}
