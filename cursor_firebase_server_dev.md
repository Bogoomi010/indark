# 구글 로그인 구현 과정 설명
_Exported on 8/22/2025 at 17:27:58 GMT+9 from Cursor (1.4.5)_

---

**User**

구글 로그인 과정 이해해보기
구글 로그인의 전체적인 과정은 다음과 같다.

프론트에서 구글 로그인 버튼을 만든다.
사용자가 로그인 버튼을 클릭하면 구글 로그인 창을 띄워준다.
사용자가 구글 창에서 로그인을 마치면 구글에서 access token을 보내준다.
(로그인 후 이동한 주소(redirect_uri)에 code라는 부분이 생긴다.)
code에 있는 부분을 추출해 백엔드로 보낸다.
백엔드에서 유효한 토큰인지 검증한 후, response로 access token과 가입 여부를 보내준다.
access token을 localstorage에 저장하고 가입 여부에 따라 회원가입 페이지 혹은 메인 페이지로 redirect 시켜준다.
처음 access token을 localstorage에 저장하는 경우에는 setItem이 잘 작동되지 않는 문제가 있어 window.location.reload()로 새로고침을 해준다.




구글 로그인 구현
구글 로그인 버튼을 만든다.

버튼 클릭시 아래 url로 이동시킨다. (구글 로그인 화면으로 이동됨)

https://accounts.google.com/o/oauth2/v2/auth?
client_id=${process.env.REACT_APP_GOOGLE_AUTH_CLIENT_ID}
&redirect_uri=https://bageasy.vercel.app/loading
&response_type=code
&scope=email+profile
clitent_id : 구글 클라우드에서 설정한 클라이언트 id를 넣어준다.
구글 클라우드 설정은 옆의 포스팅 참고 -> 구글 클라우드 설정
🔐 보안을 위해 env 파일에 넣어서 불러온다.
redirect_uri : 구글 로그인 후 이동할 주소를 넣어준다.
⚠️ 주의할 점 : 리다이렉트 주소를 서버가 아닌 클라이언트로 설정해야 한다.
-> 로그인 후 클라이언트에서 access token을 받은 뒤 서버로 넘겨주어야 하는데, 리다이렉트 주소가 서버로 되어 있으면 클라이언트에서 access token를 받을 수가 없기 때문.
-> 나는 백엔드에서 access token을 검증할 동안 로딩 페이지를 보여 주도록 설정했다.
scope : 받을 정보의 범위를 적어준다. 나는 이메일과 프로필을 받도록 설정했다.
GoogleLoginPage.js

const GoogleLogin = () => {
  const navigate = useNavigate();

  const handleNavigateBack = () => {
    navigate(-1);
  };

  const handleLogin = () => {
    // 구글 로그인 화면으로 이동시키기
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?
		client_id=${process.env.REACT_APP_GOOGLE_AUTH_CLIENT_ID}
		&redirect_uri=${process.env.REACT_APP_GOOGLE_AUTH_REDIRECT_URI}
		&response_type=code
		&scope=email profile`;
  };

  return (
    <SignUpContainer>
      <ArrowIcon src={Arrow} onClick={handleNavigateBack} />
      <Copy>안녕하세요</Copy>
      <Copy>구글 계정이 있나요?</Copy>
      <Character src={Duck} />
      <GBtn src={GoogleBtn} onClick={handleLogin} />
    </SignUpContainer>
  );
};

구글 로그인을 마치면 기존에 설정했던 redirect_uri(내가 설정해둔 로딩 페이지)로 이동된다.
현재 접속 url에 오른쪽과 같이 code가 받아진다. -> code=eydg123sadsad,,,
code 뒷 부분에 나오는 부분을 백엔드로 보내준다.
백엔드에서 code가 유효한 토큰인지 검증을 마치고 access token을 보내주면 localStorage에 저장한다.
이때 백엔드에서 response로 신규/기존 회원 여부를 함께 받아 신규 회원이면 닉네임 설정 페이지로, 기존 회원이면 메인 페이지로 redirect 시킨다.
📌 여기서 중간에 발생한 문제점
처음 가입시 localstorage에 토큰이 바로 저장되지 않는 문제가 생겼다.
(이미 가입한 경우에는 문제 x)
원인을 찾아보니 localStorage의 setItem 이벤트는 localstorage가 변경될 때마다 갱신되는게 아니라 window가 변경될 때만 트리거가 된다고 한다.
이를 해결하기 위해 window.location.reload()를 이용해 새로고침을 해주니 해결됐다.
관련 포스팅 : REACT) localstorage가 바로 저장되지 않는다면?

LoadingPage.js

const Loading = () => {
  const navigate = useNavigate();

  // 이미 가입한 유저일 시 : 메인 페이지로 이동
  const handleHome = () => {
    navigate("/home");
    window.location.reload();
  };

  // 처음 가입한 유저일 시 : 닉네임 설정 페이지로 이동
  const handleNickName = () => {
    navigate("/nickname");
    window.location.reload();
  };

  // 현재 url에서 code 부분 추출
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  const handleLoginPost = async code => {
    const data = {
      code: code,
    };
    try {
      const res = await axios.post(
        "https://server.bageasy.net/auth/login",
        data,
      );
       // 토큰 localstorage에 저장
       const accessToken = res.data.accessToken;
       localStorage.setItem("bagtoken", accessToken);
       // 신규/기존 회원 여부에 따라 페이지 이동
       res.data.isExistingMember ? handleHome() : handleNickName();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (code) {
      handleLoginPost(code);
    } else {
      console.log("로그인 재시도하세요.");
    }
  }, [code, navigate]);

  return (
    <LoadingConatiner>
      <LoadingIcon src={loading} />
      <H2>로그인중입니다...</H2>
    </LoadingConatiner>
  );
};



+ 추가 정보
@react-oauth/google을 활용하면 아주 간단하게 access token을 받아올 수 있다.(유저 정보도 프론트에서 바로 받아올 수 있음.)

@react-oauth/google 설치
npm install @react-oauth/google@latest
디코더 설치
npm install jwt-decode
구현 코드
import { GoogleLogin } from "@react-oauth/google";
import { GoogleOAuthProvider } from "@react-oauth/google";
import jwt_decode from "jwt-decode";

const GoogleLoginButton = () => {
  const clientId ="";

  return (
    <>
      <GoogleOAuthProvider clientId={clientId}>
        <GoogleLogin
          onSuccess={credentialResponse => {
            console.log(jwt_decode(credentialResponse.credential));
          }}
          onError={() => {
            console.log("Login Failed");
          }}
        />
      </GoogleOAuthProvider>
    </>
  );
};

export default GoogleLoginButton;
아래 링크를 참고하면 사용 방법을 자세히 알 수 있다. https://www.npmjs.com/package/@react-oauth/google?activeTab=code

해당 블로그 글 참고해서 구글 로그인 기능 만들려면 내가 뭘 도와줘야할까?

---

**Cursor**

지금 코드베이스에서 기존 로그인 흐름과 라우팅 구조를 빠르게 파악해, 어디에 구글 로그인 버튼과 리다이렉트 처리를 넣을지 확인해볼게요. 이어서 로그인 페이지와 AuthContext, 라우터 구성을 동시에 살펴보겠습니다.

방금 `src/pages/Login.tsx`, `src/auth/AuthContext.tsx`, `src/router/AppRouter.tsx`를 확인했어요. 현재 구글 로그인 버튼은 있지만 `startGoogleOAuth`가 시뮬레이션만 하고 있어요. 실제 구글 로그인(리다이렉트/토큰 교환)으로 연결하려면 아래 정보만 주시면 바로 이어서 구현할게요.

### 무엇을 주시면 될까요?
- **구현 방식 선택**
  - **A. 리다이렉트 코드 플로우(블로그 방식)**: 구글 로그인 → `code` 수신 → 백엔드에 `code` 보내 토큰 교환
  - **B. @react-oauth/google 사용**: 프론트에서 `credential` 수신 →(권장) 백엔드 검증 후 자체 토큰 발급
- **구글 클라우드 OAuth 설정 값**
  - **client_id**: 웹 애플리케이션용
  - **승인된 리디렉션 URI**: 개발/프로덕션 각각
    - 예) 개발: `http://localhost:5173/oauth/google/callback` (또는 원하시면 `/loading`)
  - **승인된 자바스크립트 출처**: 예) `http://localhost:5173`, 프로덕션 도메인
- **백엔드 API 스펙(코드 플로우 또는 credential 검증용)**
  - **엔드포인트 URL/메서드**: 예) `POST /auth/google/login`
  - **요청 바디**: `code`, `redirect_uri` (또는 `credential`)
  - **응답 JSON**: `accessToken`, `isExistingMember`, `email?`, `profile?` 등 필드명
  - **토큰 전달 방식**: 로컬스토리지 저장용 토큰인지, HTTPOnly 쿠키인지
  - **CORS 허용 출처**: 개발/프로덕션 클라이언트 도메인
- **프론트 .env 값(Vite 규칙)**
  - `VITE_GOOGLE_CLIENT_ID=...`
  - `VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/oauth/google/callback`
  - `VITE_API_BASE_URL=https://api.yourserver.com`
- **라우팅/화면 결정**
  - **콜백 경로**: `/oauth/google/callback` 또는 `/loading` 중 택1
  - **가입 닉네임 처리**: 현재처럼 `Login.tsx`의 `oauthNickname` 모드로 진행할지, 별도 `/nickname` 페이지로 뺄지
- **UX 세부**
  - 구글 버튼 디자인(이미지/문구) 제공 여부
  - 실패 시 표시할 문구/동작
- **기타**
  - 기존 로컬 세션 키를 유지할지(지금은 `auth_user`), 새 토큰 저장 키 이름
  - 프로덕션 도메인(배포 URL)

원하시는 방식을 알려주시고 위 값들만 주시면,
- `startGoogleOAuth`를 실제 리다이렉트로 교체,
- 콜백 페이지/라우트 추가,
- 백엔드로 `code`(또는 `credential`) 교환 요청, `accessToken` 저장 및 가입 여부 분기,
까지 바로 구현해 드릴게요. Vite라서 env 접근은 `process.env`가 아닌 `import.meta.env`를 쓰도록 반영하겠습니다.  

간단 확인 질문:
- A(리다이렉트 코드 플로우) vs B(@react-oauth/google) 중 어떤 방식으로 할까요?
- 콜백 경로는 `/oauth/google/callback`으로 진행해도 될까요?

- 방금 로그인/라우터 구조를 확인했고, 다음으로는 선택하신 방식과 제공해주신 값들로 `AuthContext`와 라우팅을 실제 구글 로그인 플로우로 연결할게요.

---

**User**

내가 서버를 구현해야하는건가?

---

**Cursor**

### 결론
- 블로그의 “코드 → 백엔드 교환 → 토큰 응답” 흐름을 그대로 쓰려면 **서버가 필요**합니다.
- 서버 없이도 프론트만으로 데모는 가능하지만, 보안·회원관리·세션 유지가 약해 **프로덕션에는 비권장**입니다.
- 서버 대신 **Auth0/Clerk/Supabase/Firebase** 같은 서비스로도 대체 가능합니다.

### 선택지
- 서버 없음(프로토타입)
  - `@react-oauth/google`로 `credential(ID 토큰)` 받기 → 프론트 로컬 상태/스토리지 저장 → 화면 전환
- 서버 있음(권장)
  - 리다이렉트 코드 플로우: 클라이언트가 `code`를 백엔드로 전달 → 백엔드가 구글 토큰 엔드포인트와 교환 → ID 토큰 검증/유저 생성 → 앱용 세션 발급(HTTPOnly 쿠키 또는 액세스 토큰) → 프론트로 가입 여부/세션 전달
  - 또는 `@react-oauth/google`의 `credential`을 백엔드에 보내서 ID 토큰 검증 후 동일 처리

### 바로 진행 가능하도록 필요한 결정
- A: 서버 없이 `@react-oauth/google` 데모로 진행
- B: 백엔드(또는 Auth 서비스)로 제대로 구현
  - 백엔드 사용 시: `client_id`, `redirect_uri`, 서버 엔드포인트 스펙(요청/응답), 토큰 저장 방식(localStorage vs HTTPOnly 쿠키)만 알려주세요

어느 방식으로 갈지만 정해주시면, 지금 코드(`AuthContext`, `Login.tsx`, 라우터)에 맞춰 바로 구현 진행할게요.

---

**User**

Firebase로 구현 하는 방안 고도화 해서 설명해줘.

---

**Cursor**

```javascript
export const app = initializeApp(config);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);
export const db = getFirestore(app);
provider: new GoogleAuthProvider();
```

### 방향
Firebase Authentication + Firestore로 구글 로그인/회원정보를 처리하면, 별도 백엔드 없이도 안전하고 확장 가능한 구조로 갈 수 있습니다. 팝업 기반 로그인으로 리다이렉트 페이지가 필요 없고, 세션/토큰 관리도 Firebase가 담당합니다.

### 준비
- Firebase 콘솔
  - 프로젝트 생성 → Authentication → Sign-in method에서 Google 활성화
  - Authentication → Settings → Authorized domains에 `localhost:5173`(개발)와 프로덕션 도메인 추가
  - Firestore 활성화(유저 프로필 `users/{uid}` 저장)
- 패키지 설치
```bash
yarn add firebase
```
- Vite 환경변수 설정(`.env.local`)
```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 새 파일 추가: Firebase 초기화
`src/lib/firebase.ts`를 새로 만듭니다.
```ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
```

### `AuthContext`를 Firebase로 교체
- 이메일/비번 로그인·회원가입은 Firebase Auth 사용
- 구글 로그인은 `signInWithPopup`
- 유저별 닉네임은 Firestore `users/{uid}` 문서에서 관리
- 닉네임이 없는 구글 최초 로그인 시, 지금 화면의 `oauthNickname` 플로우로 자연스럽게 이어지게 URL 파라미터 세팅

아래는 교체용 구현 예시입니다.

```ts
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { auth, db, googleProvider } from "../lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as signOutFirebase,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export type AuthenticatedUser = {
  id: string;
  email: string;
  nickname: string;
};

type AuthContextValue = {
  user: AuthenticatedUser | null;
  initializing: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, nickname: string, password: string) => Promise<void>;
  startGoogleOAuth: () => Promise<void>;
  completeOauthNickname: (nickname: string, emailHint?: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function userDocRef(uid: string) {
  return doc(db, "users", uid);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fUser) => {
      try {
        if (!fUser) {
          setUser(null);
          return;
        }
        const uref = userDocRef(fUser.uid);
        const snap = await getDoc(uref);
        const nickname =
          (snap.exists() && (snap.data() as any).nickname) ||
          fUser.displayName ||
          (fUser.email ? fUser.email.split("@")[0] : "");
        setUser({ id: fUser.uid, email: fUser.email || "", nickname });
      } finally {
        setInitializing(false);
      }
    });
    return () => unsub();
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUpWithPassword = useCallback(async (email: string, nickname: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(userDocRef(cred.user.uid), {
      email,
      nickname,
      provider: "password",
      createdAt: Date.now(),
    });
    await updateProfile(cred.user, { displayName: nickname });
  }, []);

  const startGoogleOAuth = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const fUser = result.user;

    const uref = userDocRef(fUser.uid);
    const snap = await getDoc(uref);

    if (!snap.exists()) {
      await setDoc(uref, {
        email: fUser.email || "",
        nickname: "",
        provider: "google",
        createdAt: Date.now(),
      });
    }

    const nickname =
      (snap.exists() && (snap.data() as any).nickname) || fUser.displayName || "";

    if (!nickname) {
      const url = new URL(window.location.href);
      url.pathname = "/login";
      url.searchParams.set("oauth", "google");
      url.searchParams.set("ok", "1");
      if (fUser.email) url.searchParams.set("email", fUser.email);
      window.location.replace(url.toString());
    } else {
      window.location.replace("/");
    }
  }, []);

  const completeOauthNickname = useCallback(async (nickname: string) => {
    const current = auth.currentUser;
    if (!current) throw new Error("로그인이 필요합니다.");

    await updateDoc(userDocRef(current.uid), { nickname });
    await updateProfile(current, { displayName: nickname });

    setUser({ id: current.uid, email: current.email || "", nickname });
  }, []);

  const signOut = useCallback(() => {
    signOutFirebase(auth);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    initializing,
    signInWithPassword,
    signUpWithPassword,
    startGoogleOAuth,
    completeOauthNickname,
    signOut,
  }), [user, initializing, signInWithPassword, signUpWithPassword, startGoogleOAuth, completeOauthNickname, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthContext가 초기화되지 않았습니다");
  return ctx;
}
```

### 현재 `Login.tsx`와의 연동
- 지금 구조 그대로 작동합니다.
  - 구글 버튼 클릭 → `startGoogleOAuth()` → 팝업 로그인
  - 닉네임이 비어 있으면 URL에 `?oauth=google&ok=1&email=...` 세팅 → `Login.tsx`가 읽고 `oauthNickname` 모드로 전환
  - 닉네임 제출 시 `completeOauthNickname()` → 프로필 저장 → `/`로 이동
- 이메일/비번 로그인/회원가입도 Firebase로 동작

### 보안/운영 팁
- 토큰 직접 저장 불필요: Firebase가 세션을 안전하게 관리합니다.
- Firestore 규칙 설정(필수):
  - 자신 문서만 읽기/쓰기 허용
```
// 예시(콘솔에서 규칙 편집)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, update, delete: if request.auth != null && request.auth.uid == uid;
      allow create: if true;
    }
  }
}
```
- 프로필 구조 확장: `avatar`, `role`, `createdAt`, `lastLoginAt` 등 추가 가능
- 프로덕션 도메인 반드시 Authorized domains에 등록

### 다음 액션
- 위 패키지 설치와 `.env.local` 값만 전달해주시면, 제가 `src/lib/firebase.ts` 생성과 `AuthContext.tsx` 교체 작업을 진행할 수 있어요.
- 원하시면 리다이렉트 방식(`signInWithRedirect`)도 가능하지만, 현재 페이지 흐름엔 팝업이 가장 자연스럽습니다.

```shellscript
yarn add firebase
```

```shellscript
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

```typescript
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
```

```typescript
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { auth, db, googleProvider } from "../lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as signOutFirebase,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export type AuthenticatedUser = {
  id: string;
  email: string;
  nickname: string;
};

type AuthContextValue = {
  user: AuthenticatedUser | null;
  initializing: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, nickname: string, password: string) => Promise<void>;
  startGoogleOAuth: () => Promise<void>;
  completeOauthNickname: (nickname: string, emailHint?: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function userDocRef(uid: string) {
  return doc(db, "users", uid);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fUser) => {
      try {
        if (!fUser) {
          setUser(null);
          return;
        }
        const uref = userDocRef(fUser.uid);
        const snap = await getDoc(uref);
        const nickname =
          (snap.exists() && (snap.data() as any).nickname) ||
          fUser.displayName ||
          (fUser.email ? fUser.email.split("@")[0] : "");
        setUser({ id: fUser.uid, email: fUser.email || "", nickname });
      } finally {
        setInitializing(false);
      }
    });
    return () => unsub();
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUpWithPassword = useCallback(async (email: string, nickname: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(userDocRef(cred.user.uid), {
      email,
      nickname,
      provider: "password",
      createdAt: Date.now(),
    });
    await updateProfile(cred.user, { displayName: nickname });
  }, []);

  const startGoogleOAuth = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const fUser = result.user;

    const uref = userDocRef(fUser.uid);
    const snap = await getDoc(uref);

    if (!snap.exists()) {
      await setDoc(uref, {
        email: fUser.email || "",
        nickname: "",
        provider: "google",
        createdAt: Date.now(),
      });
    }

    const nickname =
      (snap.exists() && (snap.data() as any).nickname) || fUser.displayName || "";

    if (!nickname) {
      const url = new URL(window.location.href);
      url.pathname = "/login";
      url.searchParams.set("oauth", "google");
      url.searchParams.set("ok", "1");
      if (fUser.email) url.searchParams.set("email", fUser.email);
      window.location.replace(url.toString());
    } else {
      window.location.replace("/");
    }
  }, []);

  const completeOauthNickname = useCallback(async (nickname: string) => {
    const current = auth.currentUser;
    if (!current) throw new Error("로그인이 필요합니다.");

    await updateDoc(userDocRef(current.uid), { nickname });
    await updateProfile(current, { displayName: nickname });

    setUser({ id: current.uid, email: current.email || "", nickname });
  }, []);

  const signOut = useCallback(() => {
    signOutFirebase(auth);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    initializing,
    signInWithPassword,
    signUpWithPassword,
    startGoogleOAuth,
    completeOauthNickname,
    signOut,
  }), [user, initializing, signInWithPassword, signUpWithPassword, startGoogleOAuth, completeOauthNickname, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthContext가 초기화되지 않았습니다");
  return ctx;
}
```

```plaintext
// 예시(콘솔에서 규칙 편집)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, update, delete: if request.auth != null && request.auth.uid == uid;
      allow create: if true;
    }
  }
}
```

