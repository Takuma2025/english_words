/**
 * Service Worker - モデルファイルの事前キャッシュ
 */

const CACHE_NAME = 'vocab-app-v1';
const STATIC_CACHE = 'vocab-static-v1';

// キャッシュするファイル（モデルファイル含む）
const PRECACHE_FILES = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './handwriting-recognition.js',
    './handwriting-ui.js',
    './vocabulary-data.js',
    './data.js',
    './elementary_words.js',
    './sentence-data.js',
    './reorder-questions.js',
    './grammar-data.js',
    './school-data.js',
    // EMNISTモデルファイル（重要）
    './emnist_final/model.json',
    './emnist_final/group1-shard1of1.bin'
];

// インストール時にキャッシュ
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Pre-caching files');
                return cache.addAll(PRECACHE_FILES);
            })
            .then(() => {
                console.log('[SW] Pre-cache complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Pre-cache failed:', error);
            })
    );
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// フェッチ時にキャッシュ優先で返す
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // モデルファイルはキャッシュ優先
    if (url.pathname.includes('emnist_final/')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('[SW] Serving from cache:', url.pathname);
                    return cachedResponse;
                }
                // キャッシュになければネットワークから取得してキャッシュ
                return fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(STATIC_CACHE).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                });
            })
        );
        return;
    }
    
    // その他のリソースはネットワーク優先、フォールバックでキャッシュ
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // 成功したらキャッシュも更新
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // ネットワーク失敗時はキャッシュから返す
                return caches.match(event.request);
            })
    );
});

