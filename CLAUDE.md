# CLAUDE.md - AI Assistant Guide for Vibe Web Starter

이 문서는 AI 어시스턴트가 이 프로젝트에서 작업할 때 반드시 따라야 하는 핵심 규칙과 컨벤션입니다.
모든 제안은 `DOC/ARCHITECTURE.md`를 기반으로 하며, 아래 규칙을 엄격히 준수하십시오.

---

## 프로젝트 개요

FastAPI + SQLAlchemy 2.0 + React 19 + Tailwind 4 기반의 풀스택 웹 애플리케이션.
**"유지보수성 최우선"** 및 **"모듈화"**를 핵심 가치로 합니다.

- **백엔드**: Python 3.12+, FastAPI, SQLAlchemy 2.0 (async), Pydantic v2, Alembic
- **프론트엔드**: React 19, TypeScript, Vite, Tailwind CSS 4, Zustand
- **DB**: PostgreSQL (asyncpg)

---

## 절대 금지 (NEVER DO)

1. **아키텍처**: 레이어드 구조(`Router -> Service -> Repository`) 파괴, 도메인 간 내부 구현 직접 참조
2. **백엔드**: 비즈니스 로직에 절차지향 함수 사용(클래스 기반 필수), 직접 DB 쿼리(Service/Repo 필수), 타입 힌트 누락
3. **프론트**: 직접 `axios` 호출(`apiClient` 사용), 인라인 스타일(`Tailwind` 사용), `any` 타입 사용
4. **데이터베이스**: DB 콘솔/GUI에서 직접 스키마 수정. 마이그레이션 파일(`alembic/versions/`) 수정(Append-only 필수)

---

## 계층별 책임 (Layer Responsibilities)

```
Request → Router (HTTP 입출력만)
       → Service (도메인 로직 오케스트레이션, 트랜잭션 관리, BaseService 상속)
       → Repository (DB 조회, 데이터 소스 접근)
       → Calculator (순수 함수, Side-effect Zero, 비즈니스 계산)
       → Formatter (응답 변환)
       → Response
```

- **Router (API)**: HTTP 입출력 처리만 담당. 비즈니스 로직 금지.
- **Service**: 도메인 로직 오케스트레이션 및 트랜잭션 관리. `BaseService` 상속 필수.
- **Repository**: DB 조회 및 데이터 소스 접근. `BaseRepository` 상속.
- **Calculator/Formatter**: 순수 함수(Side-effect Zero) 기반 계산 및 응답 변환.
- **Domain Separation**: 한 도메인은 다른 도메인의 `Service`나 `Repository`를 통해서만 통신.

---

## 프로젝트 구조

```
server/
├── main.py                          # FastAPI 진입점
└── app/
    ├── core/                        # 핵심 인프라 (config, database, middleware, logging)
    ├── shared/                      # 공유 컴포넌트
    │   ├── base/                    # 추상 베이스 클래스 (service, repository, calculator, formatter)
    │   ├── types/                   # 공통 타입 (ServiceResult, PaginatedResult 등)
    │   └── exceptions/              # 커스텀 예외 클래스
    ├── domain/                      # 비즈니스 도메인
    │   ├── system/                  # 시스템 도메인
    │   └── examples/sample_domain/  # 도메인 추가 참고 템플릿
    └── api/v1/                      # API 엔드포인트 (endpoints/, router.py)

client/src/
├── core/                            # 글로벌 유틸리티
│   ├── api/                         # Axios 싱글톤 클라이언트 (client.ts)
│   ├── errors/                      # ErrorBoundary, ApiErrorHandler
│   ├── layout/                      # MainLayout, Header, Sidebar
│   ├── loading/                     # LoadingManager, LoadingOverlay
│   ├── store/                       # Zustand 글로벌 스토어 (useAuthStore)
│   ├── hooks/                       # 커스텀 훅 (useApi, useDebounce)
│   ├── ui/                          # 재사용 UI 컴포넌트 (Button, Input, Card, Modal)
│   └── utils/                       # 유틸리티 (cn, toast, date, validators)
├── domains/                         # 도메인별 기능
│   └── {domain}/                    # components/, pages/, api.ts, store.ts, types.ts
├── App.tsx                          # 메인 앱 컴포넌트
└── main.tsx                         # React 진입점

alembic/                             # DB 마이그레이션
tests/
├── unit/                            # 단위 테스트
└── integration/                     # 통합 테스트
DOC/                                 # 프로젝트 문서 (ARCHITECTURE.md, DEVELOPMENT_GUIDE.md 등)
```

---

## 코드 스타일 & 표준

### Python (백엔드)
- SQLAlchemy 2.0 비동기 패턴 사용
- Pydantic v2 `BaseModel` 필수
- 모든 I/O 작업은 `async/await` 사용
- 타입 힌트 필수
- 포매터/린터: `black` (line-length=100), `isort` (profile=black), `ruff`, `mypy`

### TypeScript (프론트엔드)
- React 19 패턴 사용
- `Zustand` 기반 도메인 상태 관리
- `cn()` 유틸을 이용한 조건부 Tailwind 클래스 처리
- API 호출은 반드시 `apiClient` 싱글톤을 통해서만
- `any` 타입 절대 금지

### 로깅
- 모든 로그에 `request_id` 포함
- 민감 정보(PW, 토큰 등) 로깅 절대 금지

---

## DB 변경 워크플로우 (Alembic)

스키마/데이터 변경 시 다음 절차를 엄격히 따릅니다:

1. 변경 사항을 사용자에게 설명하고 승인 요청
2. `server/app/domain/{domain}/models/` 수정
3. `alembic revision --autogenerate -m "description"`으로 마이그레이션 파일 생성
4. 생성된 마이그레이션 파일 검토 보고 후 `alembic upgrade head` 안내

기존 마이그레이션 파일은 절대 수정하지 않습니다 (Append-only).

---

## 자주 쓰는 명령어

```bash
# 백엔드 실행
python -m server.main

# 프론트엔드 실행
cd client && npm run dev

# 백엔드 코드 품질 검사
black server/
isort server/
ruff check server/
mypy server/

# 프론트엔드 린트
cd client && npm run lint

# 테스트
pytest                          # 전체 테스트
pytest tests/unit/              # 단위 테스트만
pytest tests/integration/       # 통합 테스트만
pytest -m "not slow"            # 느린 테스트 제외

# DB 마이그레이션
alembic revision --autogenerate -m "description"
alembic upgrade head
alembic downgrade -1
```

---

## 새 도메인 추가 시

반드시 `DOC/DEVELOPMENT_GUIDE.md`와 `server/app/domain/examples/sample_domain/`을 참고합니다.

### 백엔드
1. `server/app/domain/{domain_name}/` 디렉토리 생성 (models, schemas, repositories, calculators, formatters, service.py)
2. BaseService/BaseRepository/BaseCalculator/BaseFormatter 상속하여 구현
3. `server/app/api/v1/endpoints/{domain}.py`에 라우터 생성
4. `server/app/api/v1/router.py`에 라우터 등록
5. Alembic 마이그레이션 생성

### 프론트엔드
1. `client/src/domains/{domain_name}/` 디렉토리 생성 (components, pages, api.ts, store.ts, types.ts)
2. `apiClient`를 통한 API 모듈 작성
3. Zustand 스토어 작성
4. 라우팅 등록

---

## 변경 제안 규칙

아키텍처나 스키마 변경 시 반드시 다음 형식으로 제안합니다:
- **현재 상황**: 현재 코드/스키마 상태
- **제안**: 변경 내용
- **영향 범위**: 어떤 파일/도메인이 영향 받는지
- **리스크**: 잠재적 위험 요소

기능 변경 시 관련 `DOC/` 내 가이드를 반드시 업데이트합니다.

---

## 참조 문서

| 문서 | 내용 |
|------|------|
| `DOC/ARCHITECTURE.md` | 시스템 아키텍처 및 설계 원칙 |
| `DOC/DEVELOPMENT_GUIDE.md` | 도메인 추가, 코딩 규칙, 체크리스트 |
| `DOC/BEGINNER_QUICK_START.md` | 환경 설정부터 첫 실행까지 |
| `DOC/PROJECT_HANDOVER.md` | 프로젝트 전체 개요 및 운영 가이드 |
| `server/README.md` | 백엔드 상세 가이드 |
| `client/README.md` | 프론트엔드 상세 가이드 |

*기억하세요: 당신은 단순한 코더가 아니라, 시스템의 지속 가능성을 지키는 아키텍트입니다.*
