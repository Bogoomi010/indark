import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import type { UserCredential } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import { getErrorMessage } from '../authErrors';
import type { IAuthProvider } from './IAuthProvider';

interface PasswordOptions {
  email: string;
  password: string;
  nickname?: string;
  create?: boolean;
}

export class PasswordProvider implements IAuthProvider {
  async signIn(options?: PasswordOptions): Promise<UserCredential> {
    if (!options) throw new Error('Missing credentials');
    try {
      if (options.create) {
        const cred = await createUserWithEmailAndPassword(auth, options.email, options.password);
        if (options.nickname) await updateProfile(cred.user, { displayName: options.nickname });
        return cred;
      }
      return await signInWithEmailAndPassword(auth, options.email, options.password);
    } catch (e) {
      const err = e as { code?: string };
      throw new Error(getErrorMessage(err.code));
    }
  }
}
