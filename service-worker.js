const CACHE="un-museum-v10-4-multilingual";
const PRECACHE=['./index.html', './style.css','./style.css?v=10.4', './script.js','./script.js?v=10.4', './countries.json', './assets/maps/world_robinson.svg', './manifest.webmanifest', './assets/qr/un.png', './assets/qr/ga.png', './assets/qr/sc.png', './assets/qr/ecosoc.png', './assets/qr/icj.png', './assets/qr/secretariat.png', './assets/qr/trusteeship.png', './assets/qr/who.png', './assets/qr/unicef.png', './assets/qr/unesco.png', './assets/qr/fao.png', './assets/qr/undp.png', './assets/qr/unep.png', './assets/qr/unhcr.png', './assets/qr/wfp.png', './assets/qr/unwomen.png', './assets/qr/unhabitat.png', './assets/qr/worldbank.png', './assets/qr/imf.png', './assets/photos/un_headquarters.jpg', './assets/photos/general_assembly.jpg', './assets/photos/security_council.jpg', './assets/photos/icj.jpg', './assets/photos/unicef_aid.jpg', './assets/photos/who_hq.jpg', './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/music/one-world-overture.mp3', './assets/music/peacekeepers-promise.mp3', './assets/music/future-2030-horizon.mp3', './assets/music/assembly-of-nations.mp3', './assets/music/humanitarian-dawn.mp3', './assets/music/planet-in-balance.mp3'];
self.addEventListener("install",event=>event.waitUntil(
  caches.open(CACHE).then(cache=>cache.addAll(PRECACHE)).then(()=>self.skipWaiting())
));
self.addEventListener("activate",event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
    .then(()=>self.clients.claim())
));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const request=event.request;
  if(request.mode==="navigate"){
    event.respondWith(
      fetch(request).then(response=>{
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put("./index.html",copy));
        return response;
      }).catch(()=>caches.match("./index.html"))
    );
    return;
  }
  event.respondWith(
    caches.match(request).then(cached=>cached||fetch(request).then(response=>{
      const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response;
    }))
  );
});