// Comparador · 12-nube.js
// Parte del código de la app, que se carga en orden desde index.html (ver js/LEEME.md).
  // =====================================================================
  // ---------- nube: cuentas, sincronización entre dispositivos y compartir ----------
  // Firebase (Auth + Firestore). Cada usuario: users/{uid}/items/{id} y sus fotos en .../items/{id}/images/{img}.
  // profiles/{uid}: contactos con los que comparte. Un producto compartido lleva visibleTo=[correos] (sin los destinatarios del regalo).
  const FIREBASE_CONFIG={apiKey:"AIzaSyCp21tWKey_zpHe3eCOMyVAuFge6YMlUMY",authDomain:"comparador12.firebaseapp.com",projectId:"comparador12",storageBucket:"comparador12.firebasestorage.app",messagingSenderId:"894121894602",appId:"1:894121894602:web:7e945ab07a4c4e7b428a33"};
  const FB_VER='10.12.2';
  let fb=null,fs=null,me=null,profile={contacts:[],defShare:[]},unsubs=[],sharedOwners=new Map();
  const imgDB=()=>new Promise((res,rej)=>{const r=indexedDB.open('comparador-img',1);r.onupgradeneeded=()=>r.result.createObjectStore('imgs');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});
  async function imgGet(k){const db=await imgDB();return new Promise(res=>{const q=db.transaction('imgs').objectStore('imgs').get(k);q.onsuccess=()=>res(q.result||null);q.onerror=()=>res(null);});}
  async function imgSet(k,v){const db=await imgDB();return new Promise(res=>{const t=db.transaction('imgs','readwrite');t.objectStore('imgs').put(v,k);t.oncomplete=res;t.onerror=res;});}
  const blobRefs=new WeakMap(); // Blob → Map(itemId → imgId) para no volver a subir la misma foto
  function loadScript(u){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=u;s.onload=res;s.onerror=rej;document.head.appendChild(s);});}
  const lc=e=>clean(e).toLowerCase();
  const contactsByName=()=>{const m=new Map();(profile.contacts||[]).forEach(c=>{if(c.name&&c.email)m.set(norm(c.name),lc(c.email));});return m;};
  // Correos que pueden ver este producto: los marcados, menos los destinatarios del regalo.
  function visibleTo(it){const cm=contactsByName();const gift=new Set(peopleList(it).map(norm));
    return [...new Set((it.shareWith||[]).filter(n=>!gift.has(norm(n))).map(n=>cm.get(norm(n))).filter(Boolean))];}
  // Comprime una foto para que quepa en un documento (máx. ~700 KB en base64).
  async function packImage(b){
    let blob=b;for(let max=1600;max>=400;max-=300){if(blob.size<520000)break;
      try{const bmp=await createImageBitmap(b);const s=Math.min(1,max/Math.max(bmp.width,bmp.height));const cv=document.createElement('canvas');cv.width=Math.round(bmp.width*s);cv.height=Math.round(bmp.height*s);cv.getContext('2d').drawImage(bmp,0,0,cv.width,cv.height);
        blob=await new Promise(r=>cv.toBlob(r,'image/jpeg',0.8))||blob;}catch(e){break;}}
    return {d:await toB64(blob),t:blob.type||'image/jpeg'};
  }
  const itemRef=(uid,id)=>fs.collection('users').doc(uid).collection('items').doc(id);
  const pending=new Map();let pendTimer=null;
  function setSync(t){const el=$('#syncTxt');if(el)el.textContent=t;
    const b=$('#cloudTop');if(b){const st=/error/i.test(t)?'err':/guardando|pendiente|sincronizando/i.test(t)?'busy':'ok';b.dataset.st=st;b.title=t.replace('☁ ','');b.setAttribute('aria-label','Nube: '+b.title);}}
  window.addEventListener('offline',()=>{const b=$('#cloudTop');if(b&&me){b.dataset.st='err';b.title='Sin conexión: se subirá al volver';}});
  window.addEventListener('online',()=>{const b=$('#cloudTop');if(b&&me&&b.dataset.st==='err'&&/conexión/.test(b.title)){b.dataset.st='ok';b.title='Sincronizado';}});
  document.addEventListener('click',e=>{if(!e.target.closest('#cloudTop'))return;const s=$('#settings');if(s.hidden)$('#openSettings').click();setTimeout(()=>$('#authBar').scrollIntoView({behavior:'smooth',block:'start'}),60);});
  // Sube un producto (con sus fotos nuevas) a la nube.
  async function cloudSave(it){
    const ref=itemRef(me.uid,it.id);const imgs=[];
    for(const v of it.images||[]){
      if(typeof v==='string'){imgs.push({u:v});continue;}
      if(v&&v.ref){imgs.push({id:v.ref.id,it:v.ref.it});continue;}
      if(!isBlob(v))continue;
      let m=blobRefs.get(v);if(!m){m=new Map();blobRefs.set(v,m);}
      let id=m.get(it.id);
      if(!id){id=uid();const p=await packImage(v);await ref.collection('images').doc(id).set(p);m.set(it.id,id);imgSet(me.uid+'/'+it.id+'/'+id,v);}
      imgs.push({id,it:it.id});
    }
    const data=JSON.parse(JSON.stringify({...it,images:[]}));Object.keys(data).forEach(k=>{if(k.startsWith('_'))delete data[k];});data.images=imgs;data.visibleTo=visibleTo(it);data.updatedAt=it.updatedAt||Date.now();
    await ref.set(data);
    // borra de la nube las fotos que ya no usa
    const sig=imgs.map(x=>x.id||'').join(',');if(it._sig!==undefined&&it._sig!==sig){const snap=await ref.collection('images').get();const keep=new Set(imgs.map(x=>x.id).filter(Boolean));snap.forEach(d=>{if(!keep.has(d.id))d.ref.delete();});}
    it._sig=sig;
  }
  let flushing=false;
  async function flush(){
    if(flushing){clearTimeout(pendTimer);pendTimer=setTimeout(flush,600);return;}
    flushing=true;try{await flush0();}finally{flushing=false;}
  }
  async function flush0(){
    const list=[...pending.entries()];pending.clear();
    for(const [id,op] of list){try{if(op==='del'){const ref=itemRef(me.uid,id);const sn=await ref.collection('images').get();sn.forEach(d=>d.ref.delete());await ref.delete();}else{const it=items.find(i=>i.id===id);if(it)await cloudSave(it);}}catch(e){console.warn(e);pending.set(id,op);}}
    setSync(pending.size?`☁ ${pending.size} pendientes de subir`:'☁ Sincronizado');
    if(pending.size){clearTimeout(pendTimer);pendTimer=setTimeout(flush,15000);}
  }
  window.__cloud=null;
  const cloudApi={saveShop(k,rec){if(!me)return;fs.collection('profiles').doc(me.uid).set({shops:{[k]:rec}},{merge:true}).catch(e=>console.warn('tienda',e));},
    put(v){if(!me)return;pending.set(v.id,'put');setSync('☁ Guardando…');clearTimeout(pendTimer);pendTimer=setTimeout(flush,700);},
    del(id){if(!me)return;pending.set(id,'del');clearTimeout(pendTimer);pendTimer=setTimeout(flush,700);}};

  // Convierte un documento de la nube en producto, con las fotos que ya estén en el móvil.
  async function fromCloud(d,owner){
    const it={...d};it._viewers=d.visibleTo||[];delete it.visibleTo;
    it.images=await Promise.all((d.images||[]).map(async r=>{if(r.u)return r.u;const k=owner+'/'+(r.it||d.id)+'/'+r.id;const b=await imgGet(k);
      if(b){let m=blobRefs.get(b);if(!m){m=new Map();blobRefs.set(b,m);}m.set(d.id,r.id);return b;}return {ref:{id:r.id,it:r.it||d.id,owner}};}));
    it._sig=(d.images||[]).map(x=>x.id||'').join(',');
    return it;
  }
  // Descarga en segundo plano las fotos que faltan.
  let reTimer=null;const reRender=()=>{clearTimeout(reTimer);reTimer=setTimeout(render,250);};
  async function fetchImages(it,owner,local){
    let changed=false;
    for(let i=0;i<(it.images||[]).length;i++){const v=it.images[i];if(!v||!v.ref)continue;
      try{const sn=await itemRef(v.ref.owner,v.ref.it).collection('images').doc(v.ref.id).get();if(!sn.exists)continue;const p=sn.data();
        const bin=atob(p.d);const u8=new Uint8Array(bin.length);for(let j=0;j<bin.length;j++)u8[j]=bin.charCodeAt(j);const b=new Blob([u8],{type:p.t||'image/jpeg'});
        imgSet(v.ref.owner+'/'+v.ref.it+'/'+v.ref.id,b);let m=blobRefs.get(b);if(!m){m=new Map();blobRefs.set(b,m);}m.set(it.id,v.ref.id);it.images[i]=b;changed=true;}catch(e){}}
    if(changed){if(local)await putLocal('items',it);reRender();}
  }
  function listenMine(){
    unsubs.push(fs.collection('users').doc(me.uid).collection('items').onSnapshot(async snap=>{
      for(const ch of snap.docChanges()){
        if(ch.doc.metadata.hasPendingWrites)continue;
        const d=ch.doc.data();d.id=ch.doc.id;
        if(ch.type==='removed'){items=items.filter(i=>i.id!==d.id);await delLocal('items',d.id);continue;}
        const loc=items.find(i=>i.id===d.id);
        if(loc&&(loc.updatedAt||0)>(d.updatedAt||0)){cloudApi.put(loc);continue;}
        if(loc&&(loc.updatedAt||0)===(d.updatedAt||0))continue;
        const it=await fromCloud(d,me.uid);
        if(loc)Object.assign(loc,it);else items.push(it);
        await putLocal('items',loc||it);fetchImages(loc||it,me.uid,true);
      }
      reRender();
    },e=>setSync('☁ Error de sincronización: '+e.message)));
  }
  // Lo que otros comparten conmigo (solo lectura).
  function listenShared(){
    if(!me.email)return;
    unsubs.push(fs.collection('profiles').where('sharedWith','array-contains',lc(me.email)).onSnapshot(snap=>{
      const owners=new Set();
      snap.forEach(p=>{const uidO=p.id;owners.add(uidO);if(sharedOwners.has(uidO)){sharedOwners.get(uidO).name=p.data().name||p.data().email;return;}
        const o={name:p.data().name||p.data().email,items:new Map(),unsub:null,resv:new Map(),runsub:null};sharedOwners.set(uidO,o);
        o.runsub=fs.collection('reservations').doc(uidO).collection('items').where('viewers','array-contains',lc(me.email)).onSnapshot(r=>{o.resv.clear();r.forEach(d=>o.resv.set(d.id,d.data()));reRender();},()=>{});
        o.unsub=fs.collection('users').doc(uidO).collection('items').where('visibleTo','array-contains',lc(me.email)).onSnapshot(async s2=>{
          for(const ch of s2.docChanges()){const d=ch.doc.data();d.id=ch.doc.id;if(ch.type==='removed'){o.items.delete(d.id);continue;}
            const it=await fromCloud(d,uidO);o.items.set(d.id,it);fetchImages(it,uidO,false);}
          $('#tab-shared').hidden=![...sharedOwners.values()].some(x=>x.items.size);reRender();},()=>{});});
      for(const [k,o] of sharedOwners)if(!owners.has(k)){o.unsub&&o.unsub();o.runsub&&o.runsub();sharedOwners.delete(k);}
      $('#tab-shared').hidden=![...sharedOwners.values()].some(x=>x.items.size);reRender();
    },()=>{}));
  }

  // ---- Reservas de regalos: «lo compro yo» sin que se entere quien lo pide ----
  const myResv=new Map();
  function listenMyResv(){if(!me)return;unsubs.push(fs.collection('reservations').doc(me.uid).collection('items').where('hideOwner','==',false).onSnapshot(r=>{myResv.clear();r.forEach(d=>myResv.set(d.id,d.data()));reRender();},()=>{}));}
  function resvBtn(ownerUid,o,i){const r=o.resv&&o.resv.get(i.id);const mine=r&&lc(r.by)===lc(me&&me.email);
    if(r&&!mine)return `<span class="chip resv">Reservado por ${esc(r.byName||r.by)}</span>`;
    return `<button class="btn small ${mine?'primary':''}" type="button" data-resv="${esc(ownerUid)}" data-rid="${esc(i.id)}">${mine?'✓ Lo compro yo · quitar':'Lo compro yo'}</button>`;}
  document.addEventListener('click',async e=>{const b=e.target.closest('[data-resv]');if(!b||!me)return;const o=sharedOwners.get(b.dataset.resv);if(!o)return;const it=o.items.get(b.dataset.rid);if(!it)return;
    const ref=fs.collection('reservations').doc(b.dataset.resv).collection('items').doc(it.id);const r=o.resv.get(it.id);b.disabled=true;
    try{if(r&&lc(r.by)===lc(me.email)){await ref.delete();setStatus('Reserva quitada.');}
      else{if(r){setStatus('Ya lo ha reservado otra persona.','err');b.disabled=false;return;}await ref.set({by:lc(me.email),byName:(me.displayName||me.email).split(' ')[0],at:new Date().toISOString(),hideOwner:!peopleList(it).length,viewers:it._viewers||[]});
        setStatus(peopleList(it).length?`Reservado: ${o.name} y los demás verán que lo compras tú.`:`Reservado en secreto: ${o.name} no lo verá; los demás con quien lo comparte, sí.`);}}
    catch(err){setStatus('No se pudo reservar: faltan las reglas nuevas de Firestore (firestore.rules).','err');}b.disabled=false;});
  const myResvChip=i=>{const r=myResv.get(i.id);return r?`<span class="chip resv">Lo compra ${esc(r.byName||r.by)}</span>`:'';};
  function renderShared(){
    const oents=[...sharedOwners.entries()].filter(([k,o])=>o.items.size&&(space==='mine'||k===space));const owners=oents.map(([,o])=>o);
    if(!owners.length)return `<div class="empty">Nadie ha compartido nada contigo todavía.</div>`;
    if(space!=='mine'&&showGrid()&&!allMode){const all=[...owners[0].items.values()].filter(i=>i.status!=='discarded'&&i.status!=='alt');if(all.length)return catGrid(all,i=>calc(i).total);}
    const backS=flt.cat?catBack([...owners[0].items.values()].filter(i=>i.status!=='discarded'&&i.status!=='alt'&&matches(i)).length):'';
    const inCatS=flt.cat?[...owners[0].items.values()].filter(i=>i.status!=='discarded'&&i.status!=='alt'&&catOf(i)===flt.cat):[];
    return backS+subChips(inCatS)+`<div class="list">${oents.map(([ouid,o])=>{const list=[...o.items.values()].filter(i=>i.status!=='discarded'&&i.status!=='alt'&&matches(i));
      return `<article class="person"><header><h3>👥 ${esc(o.name)}</h3><span class="hint">${list.length} productos</span></header>
        ${list.map(i=>{const u=safeUrl(i.url);return `<div class="buyrow" style="border:0;border-top:1px solid var(--line);border-radius:0"><div class="who">${(i.images||[]).length?imgTag(i.images[0],'class="pic"'):''}<div style="min-width:0"><div class="name">${u?`<a href="${esc(u)}" target="_blank" rel="noopener" style="color:inherit">${esc(fullName(i))}</a>`:esc(fullName(i))}</div>
          <div class="meta">${i.status==='bought'?'<b style="color:#1F8A5B">✓ Comprado</b> · ':''}${esc(shopOf(i))} · ${esc(catOf(i))}</div></div></div><div class="total">${eur(calc(i).total)}</div>${i.status==='bought'?'':`<div class="row-actions">${resvBtn(ouid,o,i)}</div>`}</div>`;}).join('')}</article>`;}).join('')}</div>`;
  }
  // ---- perfil y contactos ----
  async function saveProfile(){
    if(!me)return;profile.contacts=(profile.contacts||[]).filter(c=>c.name||c.email);
    await fs.collection('profiles').doc(me.uid).set({email:lc(me.email),name:me.displayName||me.email,contacts:profile.contacts,
      sharedWith:[...new Set(profile.contacts.map(c=>lc(c.email)).filter(Boolean))],defShare:profile.defShare||[]},{merge:true});
    for(const it of items)if((it.shareWith||[]).length)cloudApi.put(it); // recalcula a quién se ve
  }
  function drawContacts(){
    $('#shareSettings').hidden=!me;if(!me)return;
    $('#contactsList').innerHTML=(profile.contacts||[]).map((c,i)=>`<div class="contact"><input data-cn="${i}" value="${esc(c.name||'')}" placeholder="Nombre (Davinia)"><input data-ce="${i}" type="email" value="${esc(c.email||'')}" placeholder="correo@gmail.com">
      <button class="btn small danger" type="button" data-cdel="${i}">Quitar</button>
      <label class="selbox" style="grid-column:1/-1;font-weight:400"><input type="checkbox" data-cdef="${i}" ${(profile.defShare||[]).some(n=>norm(n)===norm(c.name))?'checked':''}> Compartir con ${esc(c.name||'esta persona')} todo lo nuevo que guarde</label></div>`).join('')||'<span class="hint">Aún no compartes con nadie.</span>';
  }
  $('#addContact').addEventListener('click',()=>{profile.contacts=[...(profile.contacts||[]),{name:'',email:''}];drawContacts();});
  $('#contactsList').addEventListener('change',async e=>{const t=e.target;
    if(t.dataset.cn!==undefined)profile.contacts[+t.dataset.cn].name=clean(t.value);
    if(t.dataset.ce!==undefined)profile.contacts[+t.dataset.ce].email=lc(t.value);
    if(t.dataset.cdef!==undefined){const n=profile.contacts[+t.dataset.cdef].name;profile.defShare=(profile.defShare||[]).filter(x=>norm(x)!==norm(n));if(t.checked&&n)profile.defShare.push(n);}
    await saveProfile();setStatus('Compartir actualizado.');});
  $('#contactsList').addEventListener('click',async e=>{const b=e.target.closest('[data-cdel]');if(!b)return;const c=profile.contacts[+b.dataset.cdel];
    profile.contacts.splice(+b.dataset.cdel,1);profile.defShare=(profile.defShare||[]).filter(x=>norm(x)!==norm(c.name));drawContacts();await saveProfile();setStatus('Ya no compartes con '+(c.name||c.email)+'.');});
  // casillas «Compartir con» del formulario
  function drawShareBox(it){
    const cs=(profile.contacts||[]).filter(c=>c.name&&c.email);$('#shareField').hidden=!me||!cs.length;
    const on=it&&it.id?(it.shareWith||[]):(profile.defShare||[]);
    $('#fShareBox').innerHTML=cs.map(c=>`<label class="selbox" style="font-weight:400"><input type="checkbox" data-sw="${esc(c.name)}" ${on.some(n=>norm(n)===norm(c.name))?'checked':''}> ${esc(c.name)}</label>`).join('');
  }
  const formShare=()=>[...document.querySelectorAll('#fShareBox [data-sw]')].filter(x=>x.checked).map(x=>x.dataset.sw);



  // ---- «Vincular»: juntar el mismo artículo de varias tiendas (selección múltiple) ----
  let lkIt=null,lkForm=false;const lkSel=new Set();
  const lkToks=t=>new Set(norm(t).replace(/[^a-z0-9.\s]/g,' ').split(/\s+/).filter(w=>w.length>1&&!['de','la','el','y','con','para','en','the','and','for','a','x'].includes(w)));
  function lkScore(a,b){const A=lkToks([groupName(a),a.product,a.brand,a.sku,a.mpn,a.ean].join(' ')),B=lkToks([groupName(b),b.product,b.brand,b.sku,b.mpn,b.ean].join(' '));
    let n=0;A.forEach(t=>{if(B.has(t))n+=/\d/.test(t)?2:1;});let sc=n/Math.max(1,Math.min(A.size,B.size));
    if(a.ean&&a.ean===b.ean)sc+=3;if(a.mpn&&norm(a.mpn)===norm(b.mpn))sc+=2;if(catOf(a)===catOf(b))sc+=.25;return sc;}
  function lkGroups(){const m=new Map();items.filter(i=>(i.status||'pending')==='pending').forEach(i=>{const k=key(groupName(i));if(!m.has(k))m.set(k,[]);m.get(k).push(i);});return m;}
  function drawLink(){const qs=norm($('#lkQ').value).split(' ').filter(Boolean);const baseK=lkIt?key(groupName(lkIt)):'';
    const rows=[...lkGroups().entries()].filter(([k])=>k!==baseK).map(([k,v])=>({k,v,f:v[0],sc:lkIt?lkScore(lkIt,v[0]):0}));
    const hay=r=>norm([groupName(r.f),...r.v.map(o=>[o.product,o.variant,o.brand,o.sku,o.mpn,o.ean,shopOf(o),catOf(o),o.platform].join(' '))].join(' '));
    const vis=rows.filter(r=>lkSel.has(r.k)||!qs.length||qs.every(t=>hay(r).includes(t)));
    vis.sort((a,b)=>(lkSel.has(b.k)-lkSel.has(a.k))||b.sc-a.sc||groupName(a.f).localeCompare(groupName(b.f),'es'));
    const row=(r,base)=>{const img=(r.v.find(i=>(i.images||[])[0])||{}).images;return `<label class="${base?'base':lkSel.has(r.k)?'on':''}">${base?'':`<input type="checkbox" data-lk="${esc(r.k)}" ${lkSel.has(r.k)?'checked':''}>`}${img&&img[0]?`<img src="${esc(img[0])}" alt="">`:'<span class="ph"></span>'}<span class="t"><b>${esc(groupName(r.f))}</b><small>${esc([...new Set(r.v.map(shopOf))].join(', '))} · ${eur(Math.min(...r.v.map(o=>calc(o).total)))}</small></span>${base?'<span class="sg">Este</span>':r.sc>=.6&&lkIt?'<span class="sg">Parecido</span>':''}</label>`;};
    let html='';
    if(lkIt){const bv=items.filter(i=>key(groupName(i))===baseK);html+=row({k:baseK,v:bv.length?bv:[lkIt],f:lkIt},true);}
    html+=vis.map(r=>row(r)).join('')||'<span class="hint">Nada con esas palabras.</span>';
    $('#lkList').innerHTML=html;
    const n=lkSel.size+(lkIt?1:0);$('#lkGo').disabled=n<2;$('#lkGo').textContent=n<2?(lkIt?'Marca uno o más':'Marca al menos dos'):`Vincular ${n} como el mismo`;}
  function openLink(it,fromForm){lkIt=it||null;setTimeout(navEnsure,0);lkForm=!!fromForm;lkSel.clear();
    $('#lkTitle').textContent=it?'Es el mismo que…':'Vincular productos iguales';
    $('#lkWhat').textContent=it?'Marca uno o varios que sean el mismo artículo en otras tiendas. Quedarán en una sola ficha.':'Marca los que sean el mismo artículo en tiendas distintas. Filtra por palabra para encontrarlos.';
    $('#lkQ').value='';drawLink();$('#linkBg').hidden=$('#linkSheet').hidden=false;}
  function closeLink(){$('#linkBg').hidden=$('#linkSheet').hidden=true;lkIt=null;lkSel.clear();}
  $('#linkBg').addEventListener('click',closeLink);$('#lkCancel').addEventListener('click',closeLink);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#linkSheet').hidden)closeLink();});
  $('#lkQ').addEventListener('input',drawLink);
  $('#lkList').addEventListener('change',e=>{const c=e.target.closest('[data-lk]');if(!c)return;if(c.checked)lkSel.add(c.dataset.lk);else lkSel.delete(c.dataset.lk);drawLink();});
  $('#lkGo').addEventListener('click',async()=>{const G=lkGroups();const keys=[...lkSel];if(!keys.length)return;
    // Nombre final: el del producto desde el que se abre; si no, el que tenga más tiendas.
    let name=lkIt?groupName(lkIt):groupName(keys.map(k=>G.get(k)).filter(Boolean).sort((a,b)=>b.length-a.length)[0][0]);
    if(lkForm&&!clean(F('fGroup').value)&&!editingId)name=groupName(G.get(keys[0])[0]);
    let n=0;const ks=new Set(keys);const ref=(lkIt&&clean(lkIt.category)?lkIt:null)||items.find(i=>key(groupName(i))===key(name)&&clean(i.category));
    for(const it of items)if(ks.has(key(groupName(it)))&&(it.status||'pending')!=='discarded'){it.group=name;if(ref&&clean(ref.category)){it.category=ref.category;if(clean(ref.sub))it.sub=ref.sub;}await put('items',it);n++;}
    if(lkIt&&ref&&lkIt!==ref&&clean(ref.category)){lkIt.category=ref.category;if(clean(ref.sub))lkIt.sub=ref.sub;}
    if(lkForm)F('fGroup').value=name;
    closeLink();render();setStatus(`Vinculados en «${name}» (${n} ${n===1?'oferta':'ofertas'} de otras tiendas).${lkForm?' Guarda para terminar.':''} Si te equivocas, pulsa «Desvincular» en la oferta.`);});
  $('#view').addEventListener('click',e=>{const b=e.target.closest('[data-link]');if(!b)return;const it=items.find(i=>i.id===b.dataset.link);if(it)openLink(it);});
  $('#qJoin').addEventListener('click',()=>openLink(null));
  $('#qRev').addEventListener('click',()=>openReview());
  $('#selTop').addEventListener('click',()=>{if(space!=='mine'){space='mine';tab='compare';}$('#selModeBtn').click();});
  $('#fLinkBtn').addEventListener('click',()=>{const src=editingId&&items.find(i=>i.id===editingId);
    const it={...(src||{}),id:editingId||'__new',product:F('fProduct').value,variant:F('fVariant').value,brand:F('fBrand').value,sku:F('fSku').value,mpn:F('fMpn').value,ean:F('fEan').value,category:F('fCategory').value,store:F('fStore').value,group:F('fGroup').value};
    openLink(it,true);});
  // ---- hoja «Compartir» de cada producto ----
  let shIt=null;
  const nameFromMail=m=>{const l=lc(m).split('@')[0].split(/[._-]/)[0]||m;return l.charAt(0).toUpperCase()+l.slice(1);};
  function drawSharePeople(on){const cs=(profile.contacts||[]).filter(c=>c.name&&c.email);
    $('#shPeople').innerHTML=cs.length?cs.map(c=>`<label><span class="av">${esc(initials(c.name))}</span><span class="t">${esc(c.name)}<small>${esc(c.email)}</small></span><input type="checkbox" data-shn="${esc(c.name)}" ${on.some(n=>norm(n)===norm(c.name))?'checked':''}></label>`).join(''):'<span class="hint">Escribe abajo el correo de la persona.</span>';}
  function openShare(it){shIt=it;setTimeout(navEnsure,0);
    $('#shWhat').textContent=fullName(it)+(it.store?' · '+shopOf(it):'');
    $('#shLogin').hidden=!!me;$('#shBody').hidden=!me;$('#shSave').hidden=!me;
    if(me)drawSharePeople(it.shareWith||[]);
    $('#shNative').hidden=!(navigator.share&&safeUrl(it.url));
    $('#shareBg').hidden=$('#shareSheet').hidden=false;}
  function closeShare(){$('#shareBg').hidden=$('#shareSheet').hidden=true;shIt=null;}
  $('#shareBg').addEventListener('click',closeShare);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#shareSheet').hidden)closeShare();});
  $('#shLoginBtn').addEventListener('click',()=>{closeShare();$('#loginGoogle').click();});
  $('#shAdd').addEventListener('submit',async e=>{e.preventDefault();const m=lc($('#shMail').value);
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)){setStatus('Ese correo no es válido.','err');return;}
    if(me&&lc(me.email)===m){setStatus('Ese es tu propio correo.','err');return;}
    const cur=[...document.querySelectorAll('#shPeople [data-shn]')].filter(x=>x.checked).map(x=>x.dataset.shn);
    let c=(profile.contacts||[]).find(x=>lc(x.email)===m);
    if(!c){c={name:nameFromMail(m),email:m};let n=c.name,k=2;while((profile.contacts||[]).some(x=>norm(x.name)===norm(n)))n=c.name+' '+(k++);c.name=n;profile.contacts=[...(profile.contacts||[]),c];await saveProfile();drawContacts();}
    $('#shMail').value='';drawSharePeople([...cur,c.name]);});
  $('#shSave').addEventListener('click',async()=>{if(!shIt)return;
    const on=[...document.querySelectorAll('#shPeople [data-shn]')].filter(x=>x.checked).map(x=>x.dataset.shn);
    const list=$('#shGroup').checked?items.filter(i=>key(groupName(i))===key(groupName(shIt))&&(i.status||'pending')===(shIt.status||'pending')):[shIt];
    for(const i of list){i.shareWith=on;await put('items',i);}
    closeShare();render();setStatus(on.length?`Compartido con ${on.join(', ')}${list.length>1?` (${list.length} tiendas)`:''}.`:'Ya no lo compartes con nadie.');});
  $('#shNative').addEventListener('click',async()=>{if(!shIt)return;const it=shIt;try{await navigator.share({title:fullName(it),text:`${fullName(it)} — ${eur(calc(it).total)} en ${shopOf(it)}`,url:safeUrl(it.url)});}catch(e){}});
  // ---- inicio de sesión ----
  function drawAuth(){
    const cb=$('#cloudTop');if(cb){cb.hidden=!FIREBASE_CONFIG;cb.dataset.st=me?'ok':'off';cb.title=me?'Sincronizado':'Sin cuenta: toca para entrar';}
    if(!FIREBASE_CONFIG){$('#authBar').hidden=true;return;}
    $('#authBar').hidden=false;
    $('#loginGoogle').hidden=$('#loginMailBtn').hidden=!!me;$('#logoutBtn').hidden=!me;if(me)$('#mailForm').hidden=true;
    $('#authTxt').innerHTML=me?`${esc(me.email||'')}<br><span class="sync" id="syncTxt">☁ Sincronizado</span>`:'Inicia sesión para tener tus datos en todos tus dispositivos y compartir';
    drawContacts();
  }
  async function onLogin(user){
    me=user;window.__cloud=cloudApi;drawAuth();
    const owner=ls.get('cloudOwner','');
    if(owner&&owner!==me.uid){items=[];for(const i of await getAll('items'))await delLocal('items',i.id);shops={};shopsSaveLocal();}
    else if(!owner){for(const it of items){if(!it.updatedAt)it.updatedAt=Date.now();cloudApi.put(it);}} // primera vez: sube lo que había en este dispositivo
    ls.set('cloudOwner',me.uid);
    try{const p=await fs.collection('profiles').doc(me.uid).get();profile=p.exists?{contacts:[],defShare:[],...p.data()}:{contacts:[],defShare:[]};
      if(!p.exists)await saveProfile();
      // Fichas de tiendas: se mezclan (gana lo más reciente) y se sube lo que solo estaba en este dispositivo.
      shopsMerge(profile.shops);const up={};for(const [k,r] of Object.entries(shops)){const c=(profile.shops||{})[k];if(!c||(r.updatedAt||0)>(c.updatedAt||0))up[k]=r;}
      if(Object.keys(up).length)await fs.collection('profiles').doc(me.uid).set({shops:up},{merge:true});
      unsubs.push(fs.collection('profiles').doc(me.uid).onSnapshot(d=>{if(d.exists&&shopsMerge((d.data()||{}).shops))render();}));}catch(e){}
    drawContacts();listenMine();listenShared();listenMyResv();render();
  }
  async function onLogout(){
    unsubs.forEach(u=>{try{u();}catch(e){}});unsubs=[];for(const o of sharedOwners.values())o.unsub&&o.unsub();sharedOwners.clear();
    me=null;window.__cloud=null;$('#tab-shared').hidden=true;shops={};shopsSaveLocal();
    // Al salir se borra la copia de este dispositivo (sigue en la nube).
    for(const i of await getAll('items'))await delLocal('items',i.id);items=[];ls.set('cloudOwner','');
    try{indexedDB.deleteDatabase('comparador-img');}catch(e){}
    drawAuth();render();
  }
  async function initCloud(){
    if(!FIREBASE_CONFIG)return;drawAuth();
    try{
      await loadScript(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-app-compat.js`);
      await loadScript(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-auth-compat.js`);
      await loadScript(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-firestore-compat.js`);
      fb=firebase.initializeApp(FIREBASE_CONFIG);fs=firebase.firestore();
      if(window.__FS_EMULATOR){fs.useEmulator('127.0.0.1',window.__FS_EMULATOR);firebase.auth().useEmulator('http://127.0.0.1:'+window.__AUTH_EMULATOR);}
      try{await fs.enablePersistence({synchronizeTabs:true});}catch(e){}
      firebase.auth().getRedirectResult().catch(e=>setStatus('No se pudo iniciar sesión: '+e.message,'err'));
      firebase.auth().onAuthStateChanged(u=>{if(u&&(!me||me.uid!==u.uid))onLogin(u);else if(!u&&me)onLogout();else drawAuth();});
    }catch(e){$('#authTxt').textContent='No se pudo conectar con la nube (sin conexión). Tus datos siguen en este dispositivo.';}
  }
  const authErr=e=>({'auth/invalid-credential':'correo o contraseña incorrectos','auth/wrong-password':'contraseña incorrecta','auth/user-not-found':'no existe esa cuenta','auth/email-already-in-use':'ya existe una cuenta con ese correo','auth/weak-password':'la contraseña debe tener al menos 6 caracteres','auth/invalid-email':'correo no válido'}[e.code]||e.message);
  $('#loginGoogle').addEventListener('click',async()=>{const p=new firebase.auth.GoogleAuthProvider();
    try{await firebase.auth().signInWithPopup(p);}catch(e){if(/popup|environment|cancelled/.test(e.code||''))firebase.auth().signInWithRedirect(p);else setStatus('No se pudo iniciar sesión: '+authErr(e),'err');}});
  $('#loginMailBtn').addEventListener('click',()=>{$('#mailForm').hidden=!$('#mailForm').hidden;});
  $('#mailLogin').addEventListener('click',async()=>{try{await firebase.auth().signInWithEmailAndPassword(clean($('#mailEmail').value),$('#mailPass').value);}catch(e){setStatus('No se pudo entrar: '+authErr(e),'err');}});
  $('#mailSignup').addEventListener('click',async()=>{try{const c=await firebase.auth().createUserWithEmailAndPassword(clean($('#mailEmail').value),$('#mailPass').value);await c.user.sendEmailVerification();setStatus('Cuenta creada. Te he enviado un correo para verificarla (hace falta para ver lo que te compartan).');}catch(e){setStatus('No se pudo crear la cuenta: '+authErr(e),'err');}});
  $('#mailReset').addEventListener('click',async()=>{try{await firebase.auth().sendPasswordResetEmail(clean($('#mailEmail').value));setStatus('Te he enviado un correo para cambiar la contraseña.');}catch(e){setStatus('No se pudo: '+authErr(e),'err');}});
  $('#logoutBtn').addEventListener('click',()=>firebase.auth().signOut());

