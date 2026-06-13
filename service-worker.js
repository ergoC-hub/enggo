// EngGo Service Worker v2.0
// 역할: 앱 파일을 캐시해서 오프라인에서도 열리게 함

const CACHE_NAME = 'enggo-v2';

// 캐시할 파일 목록 (상대 경로 — GitHub Pages 하위 경로 배포에서도 동작)
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// ── install: 앱 처음 설치될 때 파일을 캐시에 저장 ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ── activate: 이전 버전 캐시 정리 ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── fetch ──
// HTML(앱 본체): Network First → 배포하면 바로 새 버전 반영, 오프라인이면 캐시
// API 요청(Supabase/Gemini): 캐시하지 않음
// 그 외 정적 파일: Cache First
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API/외부 동적 요청은 캐시하지 않음
  if (url.hostname.includes('supabase.co') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('anthropic.com')) {
    return; // 기본 네트워크 동작
  }

  // 페이지 이동(HTML)은 네트워크 우선 — 업데이트가 즉시 반영됨
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const toCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
          return response;
        })
        .catch(() => caches.match(event.request).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  // 정적 파일은 캐시 우선
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
        return response;
      });
    })
  );
});
