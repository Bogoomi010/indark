import type { UserCredential } from 'firebase/auth';
import type { IAuthProvider } from './IAuthProvider';

export class KakaoProvider implements IAuthProvider {
  async signIn(): Promise<UserCredential> {
    throw new Error('Kakao provider not implemented');
  }
}
