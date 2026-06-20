self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.registration.unregister()
    .then(() => {
      console.log('Service Worker self-unregistered.');
    });
});
