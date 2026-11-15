// v2026-11-16b
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
function db(){return new Promise((ok,ko)=>{const r=indexedDB.open('comparador',1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('items'))d.createObjectStore('items',{keyPath:'id'});if(!d.objectStoreNames.contains('inbox'))d.createObjectStore('inbox',{keyPath:'id'});};r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error);});}
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  // La página siempre se pide nueva a la red (sin caché), para que las actualizaciones lleguen al momento.
  if(e.request.method==='GET'&&e.request.mode==='navigate'&&u.origin===location.origin){e.respondWith(fetch(e.request,{cache:'no-store'}).catch(()=>fetch(e.request)));return;}
  if(e.request.method!=='POST'||!u.pathname.endsWith('/share'))return;
  e.respondWith((async()=>{
    try{
      const f=await e.request.formData();
      const it={id:Date.now()+'-'+Math.random().toString(36).slice(2,7),title:String(f.get('title')||''),text:String(f.get('text')||''),url:String(f.get('url')||''),files:f.getAll('shots').filter(x=>x&&x.size>0),at:new Date().toISOString()};
      const d=await db();
      await new Promise((ok,ko)=>{const t=d.transaction('inbox','readwrite');t.objectStore('inbox').put(it);t.oncomplete=ok;t.onerror=()=>ko(t.error);});
    }catch(err){}
    return Response.redirect(new URL('./?shared=1',u).href,303);
  })());
});
