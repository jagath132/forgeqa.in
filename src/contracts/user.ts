import type { AiProvider } from './aiProvider';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  createdAt: string;
  activeProvider?: AiProvider | null;
  has_seen_welcome?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface TeamMember {
  id: string;
  email: string;
  role: 'Admin' | 'Member' | 'Viewer';
  joinedAt: string;
}

export interface Suite {
  id: string;
  name: string;
  description: string;
  color: string;
  caseIds: string[];
}
