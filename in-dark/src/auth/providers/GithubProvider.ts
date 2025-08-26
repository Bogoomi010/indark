import type { UserCredential } from 'firebase/auth';
import type { IAuthProvider } from './IAuthProvider';

export class GithubProvider implements IAuthProvider {
  async signIn(): Promise<UserCredential> {
    throw new Error('Github provider not implemented');
  }
}
