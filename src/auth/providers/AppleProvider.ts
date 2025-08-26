import type { UserCredential } from 'firebase/auth';
import type { IAuthProvider } from './IAuthProvider';

export class AppleProvider implements IAuthProvider {
  async signIn(): Promise<UserCredential> {
    throw new Error('Apple provider not implemented');
  }
}
