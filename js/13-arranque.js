// Comparador · 13-arranque.js
// Parte del código de la app, que se carga en orden desde index.html (ver js/LEEME.md).
  // ---------- arranque ----------
  (async()=>{
    // Versión nueva: al arrancar se actualiza sola; si estás usando la app, aviso con botón «Actualizar».
    const APP_V='2026-11-17g';
    async function hardUpdate(v){try{const rs=await navigator.serviceWorker.getRegistrations();for(const r of rs)await r.update().catch(()=>{});}catch(e){}
      try{if(window.caches){for(const k of await caches.keys())await caches.delete(k);}}catch(e){}
      location.replace(location.pathname+'?v='+encodeURIComponent(v||Date.now()));}
    function showUpdate(v,stuck){const b=$('#updBar');$('#updTxt').textContent=stuck?'No se ha podido cargar la versión nueva sola.':'Hay una versión nueva de la app.';b.hidden=false;
      $('#updBtn').onclick=()=>{$('#updBtn').disabled=true;$('#updBtn').textContent='Actualizando…';hardUpdate(v);};$('#updLater').onclick=()=>{b.hidden=true;sessionStorage.setItem('updLater',v);};}
    async function checkVersion(boot){try{const r=await fetch('version.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)return;const v=(await r.json()).v;if(!v||v===APP_V)return;
      const tried=sessionStorage.getItem('reloadedFor')===v;const busy=!$('#form').hidden||!$('#shareSheet').hidden||!$('#linkSheet').hidden;
      if(boot&&!tried&&!busy){sessionStorage.setItem('reloadedFor',v);hardUpdate(v);return;}
      if(sessionStorage.getItem('updLater')===v&&!boot)return;
      showUpdate(v,tried);
      try{if(document.visibilityState!=='visible'&&Notification.permission==='granted'){const reg=await navigator.serviceWorker.getRegistration();reg&&reg.showNotification('Comparador',{body:'Hay una versión nueva. Toca para actualizar.',icon:'icons/icon-192.png',badge:'icons/icon-96.png',tag:'upd'});}}catch(e){}
    }catch(e){}}
    checkVersion(true);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkVersion(false);});setInterval(()=>checkVersion(false),5*60*1000);
    items=await getAll('items').catch(()=>[]);
    initCloud();
    try{await Promise.race([loadFx(),new Promise(r=>setTimeout(r,4000))]);}catch(e){}
    render();
    if(!cfg.key){$('#settings').hidden=false;setStatus('Pega tu clave de API en Ajustes para que todo se lea solo.');}
    if('serviceWorker' in navigator){try{await navigator.serviceWorker.register('sw.js');}catch(e){}}

    await drainInbox();
    await importFromHash();
    await scanPhotos();render();
    autoRegroup().finally(()=>autoWatch());
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)drainInbox();});
  })();
