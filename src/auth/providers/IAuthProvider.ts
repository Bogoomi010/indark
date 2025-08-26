import type { UserCredential } from 'firebase/auth';

export interface IAuthProvider {
  signIn(options?: unknown): Promise<UserCredential>;
}
