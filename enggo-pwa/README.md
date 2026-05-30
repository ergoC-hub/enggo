# EngGo 🚀 — AI 영어 학습 앱

초등 고학년~중학생을 위한 AI 기반 영어 학습 PWA 앱입니다.

## 기능
- 📖 단어 퀴즈 (초급/중급/고급 3단계)
- ✍️ 영작 교정 (AI 오류 분석 + 더 좋은 표현 추천)
- 💬 AI 회화 (주제별 대화 + 교정)
- 🎯 오늘의 미션 (XP 보상)
- 📚 스토리 이어쓰기
- 📒 오답노트 (단어/문장 자동 저장)
- 📊 학습 이력 차트
- 🔊 TTS 발음 듣기

---

## GitHub Pages 배포 방법 (단계별)

### 1단계 — GitHub 저장소 만들기

1. https://github.com 접속 → 로그인
2. 우측 상단 **[+] → New repository** 클릭
3. Repository name: `enggo` (또는 원하는 이름)
4. **Public** 선택 (GitHub Pages 무료 사용 조건)
5. **Create repository** 클릭

---

### 2단계 — API 키 설정

`index.html` 파일을 열고 아래 줄을 찾아서 실제 키로 교체합니다.

```javascript
const ANTHROPIC_API_KEY = 'YOUR_API_KEY_HERE';
```

→ Anthropic Console (https://console.anthropic.com) 에서 API 키 발급 후 입력

> ⚠️ **보안 주의**: 개인 학습용/내부용으로만 사용하세요.
> 공개 저장소에 API 키가 노출되면 악용될 수 있습니다.
> 실제 서비스 배포 시에는 C단계(Supabase)에서 서버 측으로 이동합니다.

---

### 3단계 — 파일 업로드

**방법 A: GitHub 웹에서 업로드 (쉬운 방법)**

1. 만든 저장소 페이지에서 **Add file → Upload files** 클릭
2. 아래 파일 구조 그대로 드래그 앤 드롭:

```
enggo/
├── index.html          ← 앱 전체
├── manifest.json       ← PWA 설정
├── service-worker.js   ← 오프라인 캐시
└── icons/
    ├── icon-192.png    ← 앱 아이콘 (소)
    └── icon-512.png    ← 앱 아이콘 (대)
```

3. **Commit changes** 클릭

**방법 B: Git 명령어 (터미널)**

```bash
cd enggo
git init
git add .
git commit -m "EngGo v3 초기 배포"
git branch -M main
git remote add origin https://github.com/본인아이디/enggo.git
git push -u origin main
```

---

### 4단계 — GitHub Pages 활성화

1. 저장소 페이지 → **Settings** 탭
2. 왼쪽 메뉴 → **Pages**
3. Source: **Deploy from a branch**
4. Branch: **main** / folder: **/ (root)**
5. **Save** 클릭
6. 1~2분 후 상단에 URL 표시됨:
   `https://본인아이디.github.io/enggo`

---

### 5단계 — 폰에서 앱 설치 (PWA)

**Android (Chrome)**
1. 위 URL을 Chrome으로 열기
2. 주소창 오른쪽 메뉴 → **홈 화면에 추가**
3. 앱 아이콘이 홈화면에 생성됨 ✅

**iPhone (Safari)**
1. 위 URL을 Safari로 열기
2. 하단 공유 버튼(□↑) → **홈 화면에 추가**
3. 앱 아이콘이 홈화면에 생성됨 ✅

---

## 파일별 역할 설명

| 파일 | 역할 | 수정 빈도 |
|------|------|-----------|
| `index.html` | 앱 전체 UI + 로직 | 기능 추가 시 |
| `manifest.json` | 앱 이름/아이콘/테마색 | 거의 없음 |
| `service-worker.js` | 오프라인 캐시 | 버전 업 시 |
| `icons/` | 홈화면 아이콘 | 디자인 변경 시 |

---

## 다음 단계 — C단계 (Supabase 연결)

현재는 데이터가 브라우저 `localStorage`에만 저장됩니다.
C단계에서 Supabase를 연결하면:
- 여러 기기에서 학습 데이터 동기화
- API 키를 서버 측으로 이동 (보안 강화)
- 회원가입/로그인 기능 추가 가능

`index.html`의 `DB` 객체 부분만 교체하면 됩니다.
