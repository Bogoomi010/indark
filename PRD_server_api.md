# InDark Server API PRD (Draft)

작성일: 2026-01-29

## 0) 배경
현재 InDark는 React + Firebase(Auth/Firestore) 기반으로 클라이언트에서 게임 상태를 직접 갱신/저장합니다. 웹 게임을 **서버 권위(server-authoritative)** 구조로 확장해, 치트/위변조를 줄이고(최소화), 콘텐츠/이벤트/밸런스를 서버에서 관리 가능하도록 **공유 API**를 정의합니다.

## 1) 목적(Goals)
- 웹 게임 운영을 위한 **백엔드 서버 1개**를 Docker로 띄울 수 있게 한다.
- 게임 진행(좌표/자원/쿨다운/이벤트)을 서버가 판정하고, 클라이언트는 UI/입력만 담당한다.
- 최소한의 API로 InDark 프론트가 서버와 통신해 플레이 가능하게 한다(MVP).

## 2) 비목적(Non-goals)
- 결제/상점/실물 화폐 기능은 범위 밖.
- 복잡한 실시간 멀티플레이(대규모 동기화)는 MVP 범위 밖(후속).
- 완전한 부정행위 방지(리버스/봇/에뮬레이터)는 목표 아님(점진적 개선).

## 3) 사용자 시나리오(MVP)
1. 유저 로그인(기존 Firebase Auth 또는 서버 세션)
2. 게임 진입 시 현재 상태 불러오기
3. 이동 입력(방향) → 서버가 검증/판정 → 새 상태 반환
4. 방 타입/이벤트/전투/보상 등은 서버가 결정
5. 필요 시 리셋/새 게임 시작

## 4) 성공 기준(Success Metrics)
- 로컬에서 `docker compose up` 한 번으로 서버가 뜬다.
- 프론트에서 최소 플레이 루프(입장→이동→자원 소모→방 이벤트)가 동작한다.
- 상태 저장의 단일 진실 공급원(Single Source of Truth)이 서버가 된다.

## 5) 기술/운영 가정
- 서버: Node.js(예: Fastify/Express) + TypeScript
- 데이터: (MVP) SQLite 또는 Postgres 중 택1
- 인증: 2안 중 택1
  - A) Firebase ID Token을 서버에서 검증(권장: 기존 auth 재사용)
  - B) 서버 자체 세션(JWT)
- 배포 전제: 로컬/개발 환경 우선

## 6) 데이터 모델(초안)
### PlayerState
- userId: string
- pos: { x: number; y: number }
- facing?: 'N'|'E'|'S'|'W'
- torch: number
- sta: number
- hp: number
- mp: number
- worldSeed: string
- cooldownUntil: number (ms epoch)
- updatedAt: number
- version: number

### RoomSnapshot
- key: "x,y"
- roomType: 'Empty'|'Trap'|'Shop'|'Monster'|'Treasure'|...
- eventState: { active: boolean; cleared: boolean; ... }

## 7) API 요구사항
- 모든 응답은 JSON
- 모든 요청은 `Authorization: Bearer <token>` (A안: Firebase ID token)
- 서버는 **요청 시각(now)** 를 기준으로 쿨다운/자원 조건을 검증한다.
- 서버는 클라이언트가 보내는 상태를 신뢰하지 않는다(입력만 신뢰).

## 8) API 설계(초안)
### 8.1 Health
- `GET /health`
  - 200 OK `{ status: "ok", time: ... }`

### 8.2 Auth (선택)
- `GET /me`
  - 현재 인증된 사용자 정보 반환 `{ userId, displayName? }`

### 8.3 Game State
- `POST /game/start`
  - 새 게임 시작 또는 기존 세이브 불러오기
  - 응답: `{ state: PlayerState, room: RoomSnapshot }`

- `GET /game/state`
  - 응답: `{ state: PlayerState, room: RoomSnapshot }`

- `POST /game/reset`
  - 초기화(새 seed/초기 자원)
  - 응답: `{ state, room }`

### 8.4 Movement (핵심)
- `POST /game/move`
  - body: `{ dir: 'N'|'E'|'S'|'W' }`
  - 서버 검증:
    - 쿨다운, torch/sta, 잠금/출구 여부
  - 서버 처리:
    - pos 이동, torch/sta 감소, cooldown 갱신
    - 새 방 진입 시 roomType 결정 및 이벤트 활성/비활성 결정
  - 응답: `{ ok: true, state, room, log?: string[] }`
  - 실패 응답: `{ ok: false, code: 'COOLDOWN'|'NO_TORCH'|'NO_STA'|'LOCKED'|'NO_EXIT', message }`

### 8.5 Room Interaction (MVP 이후/부분 적용)
- `POST /game/room/resolve`
  - 예: 보물 열기/함정 해제/상점 구매/전투 결과 반영
  - body: `{ action: string, payload?: any }`
  - 응답: `{ ok, state, room, rewards?, log? }`

### 8.6 Telemetry/Logging (개발용)
- `POST /telemetry`
  - body: `{ tag: string, payload: any }`
  - 목적: 현재 프론트의 `/__indark-log` 대체

## 9) 에러/보안 요구사항
- Rate limit(간단): userId/IP 별 초당 요청 제한
- 입력 검증: dir enum, payload size 제한
- 서버 시간 기준 판정(클라 now 무시)
- 감사 로그(개발): 이동/리셋/주요 이벤트 기록

## 10) 클라이언트 변경 범위(요약)
- FirestorePositionRepo 대신 ServerPositionRepo 추가
- `tryMove()`가 Firestore 저장 대신 `/game/move` 호출
- `init()`이 `/game/start` 호출

## 11) 오픈 이슈(결정 필요)
1. DB: SQLite로 시작할지 Postgres로 시작할지
2. 인증: Firebase 토큰 검증(A) vs 서버 JWT(B)
3. roomType/seed 생성 로직을 서버로 옮길지(권장) vs 클라와 공유 라이브러리로 둘지

---

# 추가 콘텐츠 기획(초안)

## A) 콘텐츠 확장 아이디어
- 방 타입 추가: Boss, Puzzle, Shrine(버프), Story(대사/선택지), SafeRoom(휴식)
- 아이템: 횃불 대체(램프), 열쇠/자물쇠, 소모품(치유/해독)
- 진행 시스템: 업적/도감, 영구 강화(roguelite), 난이도 티어
- 이벤트: 랜덤 조우, 함정 미니게임, 상점 가격 변동
- 메타: 일일 퀘스트, 주간 랭킹(깊이/생존턴/클리어)

## B) MVP에 넣을 최소 추가 콘텐츠
- Treasure/Monster/Trap 3종을 ‘1회성 해결’로 끝낼 수 있는 간단 인터랙션
- 보상: torch/sta 회복 또는 아이템 1개
- 로그: UI에 출력할 텍스트 로그 표준화

