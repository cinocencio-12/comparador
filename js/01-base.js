// Comparador · 01-base.js
// Parte del código de la app, que se carga en orden desde index.html (ver js/LEEME.md).
  const $=s=>document.querySelector(s);
  // Formato español siempre: punto para miles y coma para decimales (1.299,50).
  function fmtNum(n,dec){n=Number(n)||0;const neg=n<0;n=Math.abs(n);const f=n.toFixed(dec);let [i,d]=f.split('.');
    i=i.replace(/\B(?=(\d{3})+(?!\d))/g,'.');return (neg?'-':'')+i+(d?','+d:'');}
  // Importe escrito a mano: la coma siempre es decimal (6,250 → 6,25); el punto con 3 cifras detrás, miles (1.299)
  function parseIn(v){const s=String(v??'').trim();if(/^-?\d+,\d+$/.test(s))return parseFloat(s.replace(',','.'));return num(s);}
  const fmtIn=n=>n?fmtNum(n,Math.round(n*100)%100?2:0):'';
  const MONEY_IDS=['fPrice','fDisc','fShip','fFree','fTarget','fPaid'];
  document.addEventListener('focusout',e=>{const t=e.target;if(!t||!MONEY_IDS.includes(t.id)||!t.value.trim())return;const n=parseIn(t.value);t.value=n?fmtIn(n):t.value;t.dispatchEvent(new Event('input',{bubbles:true}));});
  const eur=n=>fmtNum(Math.round((Number(n)||0)*100)/100,2)+' €';
  // Lee importes escritos de cualquier forma: 1.299,50 · 1,299.50 · 9,800 (miles) · 15,6 · 15.60
  function num(v){
    if(typeof v==='number')return isFinite(v)?v:0;
    let s=String(v??'').replace(/[^\d.,-]/g,'');if(!s)return 0;
    const c=s.lastIndexOf(','),d=s.lastIndexOf('.');
    if(c>-1&&d>-1){s=c>d?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');}
    else{const sep=c>-1?',':d>-1?'.':'';
      if(sep){const parts=s.split(sep);const last=parts[parts.length-1];
        // varios separadores iguales, o uno solo seguido de exactamente 3 cifras → separador de miles
        if(parts.length>2||(last.length===3&&parts[0].length>=1&&parts[0]!=='0'))s=parts.join('');
        else s=parts.join('.');}}
    const n=parseFloat(s);return isFinite(n)?n:0;
  }
  // Para mostrar un importe dentro de un campo de texto, en formato español.
  const numIn=v=>{const n=num(v);return n?fmtIn(n):'';}; // importe guardado → como se escribe: 1.299 · 6,50
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl=u=>/^https?:\/\//i.test(u||'')?u:'';
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const clean=v=>String(v??'').trim();
  function hostOf(u){try{const h=new URL(u).hostname.replace(/^www\./,'');const p=h.split('.');const n=p.length>2&&p[p.length-2].length<=3?p[p.length-3]:p[p.length-2];return n?n.charAt(0).toUpperCase()+n.slice(1):h;}catch(e){return '';}}

  // ---------- IndexedDB ----------
  function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open('comparador',1);
    r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('items'))db.createObjectStore('items',{keyPath:'id'});if(!db.objectStoreNames.contains('inbox'))db.createObjectStore('inbox',{keyPath:'id'});};
    r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
  async function tx(store,mode,fn){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction(store,mode);const req=fn(t.objectStore(store));t.oncomplete=()=>res(req&&req.result);t.onerror=()=>rej(t.error);});}
  const getAll=s=>tx(s,'readonly',o=>o.getAll());
  const putLocal=(s,v)=>tx(s,'readwrite',o=>o.put(v));
  const delLocal=(s,k)=>tx(s,'readwrite',o=>o.delete(k));
  // Cada cambio en un producto se guarda en el móvil y, si has iniciado sesión, también en la nube.
  const put=(s,v)=>{if(s==='items'){v.updatedAt=Date.now();if(window.__cloud)window.__cloud.put(v);}return putLocal(s,v);};
  const del=(s,k)=>{if(s==='items'&&window.__cloud)window.__cloud.del(k);return delLocal(s,k);};
  const isBlob=v=>typeof Blob!=='undefined'&&v instanceof Blob;

  let items=[],tab='compare',editingId=null;

  // ---------- imágenes (Blob guardado o URL de la tienda) ----------
  const blobUrls=new WeakMap();
  // Una imagen puede ser: URL (texto), Blob guardado, o {ref} si aún se está descargando de la nube.
  function src(v){if(typeof v==='string')return v;if(!isBlob(v))return '';if(!blobUrls.has(v))blobUrls.set(v,URL.createObjectURL(v));return blobUrls.get(v);}
  // Fotos de la web que ya no cargan: se recuerdan para pedir otra
  const BAD=(()=>{try{return new Set(JSON.parse(localStorage.getItem('badImg')||'[]'));}catch(e){return new Set();}})();
  const isBad=v=>typeof v==='string'&&BAD.has(v);
  let badT=null;
  window.__bad=function(img){const u=img.getAttribute('src')||'';img.onerror=null;img.setAttribute('data-bad','1');img.removeAttribute('srcset');img.src='icons/icon-192.png';
    if(!/^https?:/.test(u)||BAD.has(u))return;BAD.add(u);try{localStorage.setItem('badImg',JSON.stringify([...BAD].slice(-500)));}catch(e){}
    clearTimeout(badT);badT=setTimeout(async()=>{try{await scanPhotos();}catch(e){}if(prodKey)render();},600);};
  // Al abrir la app, comprueba en segundo plano las fotos de la web de lo pendiente
  function probeImgs(){const urls=new Set();items.filter(i=>(i.status||'pending')==='pending').forEach(i=>(i.images||[]).forEach(v=>{if(typeof v==='string'&&/^https?:/.test(v)&&!BAD.has(v))urls.add(v);}));
    let n=0;const fail=async u=>{if(BAD.has(u))return;const c=await viaCopy(u);if(c){for(const it of items){const k=(it.images||[]).indexOf(u);if(k>=0){it.images[k]=c;await put('items',it);}}clearTimeout(badT);badT=setTimeout(()=>render(),1500);return;}BAD.add(u);n++;try{localStorage.setItem('badImg',JSON.stringify([...BAD].slice(-500)));}catch(e){}clearTimeout(badT);badT=setTimeout(async()=>{try{await scanPhotos();}catch(e){}render();if(n)setStatus(`${n} ${n===1?'foto ya no carga':'fotos ya no cargan'} (la tienda la cambió). Las tienes en Revisión → Sin fotografías.`);},1500);};
    [...urls].forEach((u,k)=>setTimeout(()=>{const im=new Image();im.referrerPolicy='no-referrer';im.onerror=()=>fail(u);im.src=u;},k*60));}
  setTimeout(()=>{try{if(navigator.onLine!==false)probeImgs();}catch(e){}},4000);
  setTimeout(()=>{copyWebImgs(40).then(n=>{if(n)setStatus(`${n} ${n===1?'foto guardada':'fotos guardadas'} en el móvil: ya no dependen de la web de la tienda.`);}).catch(()=>{});},15000);
  const imgTag=(v,attrs)=>{const u=src(v);if(isBad(v))return `<img src="icons/icon-192.png" alt="Foto no disponible" data-bad="1" ${attrs||''}>`;return u?`<img src="${esc(u)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="__bad(this)" ${attrs||''}>`:`<span class="th" style="display:inline-block;width:56px;height:56px;border-radius:8px;background:var(--line)" ${attrs||''}></span>`;};
  async function grabImage(u){
    try{const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),8000);
      const r=await fetch(u,{mode:'cors',signal:ctl.signal,referrerPolicy:'no-referrer'});clearTimeout(t);
      if(r.ok){const b=await r.blob();if(/^image\//.test(b.type)&&b.size>1500)return b;}}catch(e){}
    const c=await viaCopy(u);if(c)return c;
    return u; // ni directo ni con copia: se muestra desde su web
  }
  // «Truco de la copia sin conexión»: si la tienda no deja copiar la foto, se pide a un servicio
  // público de imágenes (wsrv.nl) que la descargue y nos la devuelva; se guarda la copia en el móvil.
  async function viaCopy(u){try{const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),12000);
      const r=await fetch('https://wsrv.nl/?url='+encodeURIComponent(u.replace(/^https?:\/\//,''))+'&w=1200&we&output=jpg&q=85',{signal:ctl.signal,referrerPolicy:'no-referrer'});clearTimeout(t);
      if(!r.ok)return null;const b=await r.blob();if(!/^image\//.test(b.type)||b.size<1500)return null;try{return await shrink(b);}catch(e){return b;}}catch(e){return null;}}
  // Guarda en el móvil una copia de las fotos que aún dependen de la web de la tienda (poco a poco, sin perder nada)
  let copying=false;
  async function copyWebImgs(max){if(copying||!navigator.onLine)return 0;copying=true;let n=0;
    try{for(const it of items.filter(i=>i.status!=='discarded')){if(n>=max)break;const im=it.images||[];if(!im.some(v=>typeof v==='string'&&/^https?:/.test(v)))continue;
        const out=[];let ch=false;for(const v of im){if(typeof v==='string'&&/^https?:/.test(v)&&n<max){const b=await viaCopy(v)||await (async()=>{try{const r=await fetch(v,{mode:'cors',referrerPolicy:'no-referrer'});if(r.ok){const x=await r.blob();if(/^image\//.test(x.type)&&x.size>1500)return x;}}catch(e){}return null;})();
            if(b){out.push(b);ch=true;n++;if(BAD.has(v)){BAD.delete(v);try{localStorage.setItem('badImg',JSON.stringify([...BAD]));}catch(e){}}continue;}}out.push(v);}
        if(ch){it.images=out;await put('items',it);}}}
    finally{copying=false;}
    if(n){try{await scanPhotos();}catch(e){}render();}return n;}
  async function grabImages(urls){
    const list=[...new Set((urls||[]).map(u=>clean(u).replace(/&amp;/g,'&')).filter(u=>/^https?:\/\//i.test(u)))].slice(0,8);
    return Promise.all(list.map(grabImage));
  }

