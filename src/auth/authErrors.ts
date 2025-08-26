export const authErrorMessages: Record<string, string> = {
  'auth/account-exists-with-different-credential': '이미 다른 로그인 방법으로 가입된 계정입니다.',
  'auth/popup-closed-by-user': '인증 창이 닫혔습니다.',
};

export function getErrorMessage(code?: string) {
  if (!code) return '인증에 실패했습니다.';
  return authErrorMessages[code] || '인증에 실패했습니다.';
}
