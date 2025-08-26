import { GoogleProvider } from './GoogleProvider';
import { GithubProvider } from './GithubProvider';
import { AppleProvider } from './AppleProvider';
import { KakaoProvider } from './KakaoProvider';
import { PasswordProvider } from './PasswordProvider';
import type { IAuthProvider } from './IAuthProvider';

export const authProviders: Record<string, IAuthProvider> = {
  google: new GoogleProvider(),
  github: new GithubProvider(),
  apple: new AppleProvider(),
  kakao: new KakaoProvider(),
  password: new PasswordProvider(),
};

export type AuthProviderKey = keyof typeof authProviders;
