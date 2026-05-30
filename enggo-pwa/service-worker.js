// EngGo Service Worker v1.0
// 역할: 앱 파일을 캐시해서 오프라인에서도 열리게 함

const CACHE_NAME = 'enggo-v1';

// 캐시할 파일 목록 (앱 실행에 필요한 모든 파일)
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// ── install: 앱 처음 설치될 때 파일을 캐시에 저장 ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] 캐시 저장 중...');
      return cache.addAll(ASSETS);
    })
  );
  // 새 SW가 즉시 활성화되도록
  self.skipWaiting();
});

// ── activate: 이전 버전 캐시 정리 ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] 구버전 캐시 삭제:', key);
            return caches.delete(key);
          })
      )
    )
  );
  // 즉시 모든 탭에 적용
  self.clients.claim();
});

// ── fetch: 네트워크 요청 가로채기 ──
// 전략: Cache First (캐시 있으면 캐시, 없으면 네트워크)
// API 요청(anthropic.com)은 캐시 없이 항상 네트워크로
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API 요청은 캐시 안 함
  if (url.hostname.includes('anthropic.com')) {
    return; // 기본 네트워크 동작
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        return cached; // 캐시 히트
      }
      // 캐시 미스 → 네트워크 요청 후 캐시에 저장
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, toCache);
        });
        return response;
      });
    }).catch(() => {
      // 오프라인 + 캐시 없음 → index.html fallback
      return caches.match('/index.html');
    })
  );
});
