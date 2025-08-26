import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import type { UserCredential } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import { getErrorMessage } from '../authErrors';
import type { IAuthProvider } from './IAuthProvider';

export class GoogleProvider implements IAuthProvider {
  async signIn(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    try {
      return await signInWithPopup(auth, provider);
    } catch (e) {
      const err = e as { code?: string };
      throw new Error(getErrorMessage(err.code));
    }
  }
}
