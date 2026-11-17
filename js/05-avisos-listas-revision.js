// Comparador · 05-avisos-listas-revision.js
// Parte del código de la app, que se carga en orden desde index.html (ver js/LEEME.md).
  // ---------- Avisos: precio objetivo y vuelta de stock ----------
  const hasAlert=i=>(num(i.target)>0||!!i.alertStock)?1:0;
  const isOut=i=>/agotad|sin stock|no disponible|out of stock/.test(norm(i.availability));
  async function notify(title,body,tag){try{const al=JSON.parse(localStorage.getItem('alertLog')||'[]');al.unshift({t:Date.now(),title,body});localStorage.setItem('alertLog',JSON.stringify(al.slice(0,50)));}catch(e){}
    try{if('Notification' in window&&Notification.permission==='granted'){const reg=await navigator.serviceWorker.getRegistration();if(reg)await reg.showNotification(title,{body,icon:'icons/icon-192.png',badge:'icons/icon-96.png',tag:tag||String(Date.now())});else new Notification(title,{body});}}catch(e){}}
  function evalAlerts(it,wasOut){const t=num(it.target);const tot=calc(it).total;
    if(t>0&&num(it.price)>0&&tot<=t+0.005&&!(it.lastAlert&&Math.abs(num(it.lastAlert.p)-tot)<0.01)){it.lastAlert={p:tot,at:new Date().toISOString()};notify(`Precio objetivo: ${fullName(it)}`,`${eur(tot)} en ${shopOf(it)} (tu objetivo: ${eur(t)})`,'t'+it.id);setStatus(`🎯 ${fullName(it)} baja a ${eur(tot)} en ${shopOf(it)}: por debajo de tu objetivo de ${eur(t)}.`);}
    if(t>0&&tot>t+0.005)it.lastAlert=null;
    if(it.alertStock&&wasOut&&!isOut(it)&&clean(it.availability)){notify(`Vuelve a haber stock: ${fullName(it)}`,`${shopOf(it)} · ${it.availability} · ${eur(tot)}`,'s'+it.id);setStatus(`📦 ${fullName(it)} vuelve a estar disponible en ${shopOf(it)}.`);}}
  function drawNotif(){const b=$('#notifOn');if(!b)return;if(!('Notification' in window)){b.disabled=true;$('#notifTxt').textContent=' Este navegador no permite notificaciones.';return;}
    if(Notification.permission==='granted'){b.textContent='Avisos activados';b.disabled=true;}else if(Notification.permission==='denied'){b.disabled=true;$('#notifTxt').textContent=' Bloqueados: actívalos en los permisos de la app en Android.';}}
  $('#notifOn').addEventListener('click',async()=>{try{await Notification.requestPermission();}catch(e){}drawNotif();if(Notification.permission==='granted')notify('Comparador','Avisos activados. Te avisaré de bajadas a tu precio objetivo y de vuelta de stock.','test');});
  drawNotif();
  // Objetivo para todo el producto (todas sus tiendas) desde la ficha
  document.addEventListener('change',async e=>{const t=e.target;if(t.id==='pfTarget'||t.id==='pfStock'){const list=prodItems().filter(o=>(o.status||'pending')==='pending');
    for(const o of list){if(t.id==='pfTarget'){o.target=parseIn(t.value)||null;o.lastAlert=null;}else o.alertStock=t.checked?'1':'';await put('items',o);}
    setStatus(t.id==='pfTarget'?(parseIn(t.value)>0?`Te avisaré cuando el total baje de ${eur(parseIn(t.value))} en cualquier tienda. Activa «Vigilar precios» en Ajustes para que se compruebe solo al abrir la app.`:'Aviso de precio quitado.'):(t.checked?'Te avisaré si vuelve a haber stock.':'Aviso de stock quitado.'));render();}});
  // ---------- Listas: portada de listas, prioridades ----------
  const PRIO={alta:['Prioridad alta',3],media:['Prioridad media',2],baja:['Prioridad baja',1]};
  const prioN=i=>(PRIO[i.prio]||[0,0])[1];
  const prioChip=i=>PRIO[i.prio]?`<span class="chip prio-${i.prio}">${PRIO[i.prio][0]}</span>`:'';
  function bestOfGroups(list){const g=new Map();list.forEach(i=>{if(!canBuy(i))return;const k=key(groupName(i));const t=calc(i).total;if(!g.has(k)||t<g.get(k).t)g.set(k,{i,t});});return [...g.values()];}
  function renderListsHome(){const P=items.filter(i=>(i.status||'pending')==='pending');const bud=budgets();
    const mine=bestOfGroups(P.filter(i=>!peopleList(i).length));
    const cov=(l,hue,ic)=>{const ph=l.map(x=>x.i||x).find(i=>(i.images||[]).length&&src(i.images[0]));return `<span class="cov" style="${hueOf(hue)}">${ph?`<img src="${esc(src(ph.images[0]))}" alt="" loading="lazy" referrerpolicy="no-referrer">`:ic}</span>`;};
    const card=(attrs,ic,title,sub,right)=>`<button type="button" class="lcard" ${attrs}>${ic}<span class="tx"><b>${title}</b><small>${sub}</small></span>${right?`<span class="rt">${right}</span>`:''}</button>`;
    const people=allPeople();
    return `<div class="pf"><h2>Mis listas</h2><div class="psub">Deseos, regalos y lo compartido</div>
      <div class="lgroup">${card('data-list="me"',cov(mine,'deseos',svgI('me')),'Mis deseos',`${mine.length} ${mine.length===1?'producto':'productos'}${mine.some(x=>x.i.prio==='alta')?' · '+mine.filter(x=>x.i.prio==='alta').length+' con prioridad alta':''}`,eur(mine.reduce((a,b)=>a+b.t,0)))}
      ${card('data-list="buy"',cov([],'comprar',svgI('bag')),'Listo para comprar','Lo más barato de cada cosa, por tienda','')}</div>
      <h3 class="lh">Regalos</h3><div class="lgroup">${people.map(p=>{const l=bestOfGroups(P.filter(i=>peopleList(i).some(x=>norm(x)===norm(p))));const b=num(bud[norm(p)]);const t=l.reduce((a,c)=>a+c.t,0);
        return card(`data-list="p" data-p="${esc(p)}"`,cov(l,p,'🎁'),`Para ${esc(p)}`,`${l.length} ${l.length===1?'idea':'ideas'}${b?` · presupuesto ${eur(b)}`:''}`,eur(t));}).join('')||'<p class="hint">Aún no hay regalos.</p>'}
      <form class="newlist" id="newList"><input id="newListName" placeholder="Nueva lista de regalos: nombre de la persona" aria-label="Nombre de la persona"><button class="btn small primary" type="submit">+ Nueva lista</button></form></div>
      ${owners().length?`<h3 class="lh">Compartido conmigo</h3><div class="lgroup">${owners().map(([k,o])=>card(`data-space="${esc(k)}"`,cov([...o.items.values()],o.name,`<span class="av">${esc(initials(o.name))}</span>`),`De ${esc(clean(o.name).split(/\s|@/)[0])}`,`${[...o.items.values()].filter(i=>i.status!=='discarded'&&i.status!=='alt').length} compartidos`,'')).join('')}</div>`:''}
    </div>`;}
  function renderBuyCount(){return true;}
  let listHome=true;
  document.addEventListener('click',e=>{const c=e.target.closest('[data-list]');if(!c)return;const k=c.dataset.list;listHome=false;
    if(k==='me'){navTab='explore';tab='compare';flt.person=ME;allMode=true;}
    else if(k==='buy'){tab='buy';}
    else{tab='gifts';flt.person=c.dataset.p;}
    render();window.scrollTo({top:0});setTimeout(navEnsure,0);});
  document.addEventListener('submit',e=>{if(e.target.id!=='newList')return;e.preventDefault();const n=clean($('#newListName').value);if(!n)return;openForm(null);F('fPeople').value=n;drawAllChips();const d=F('fPeople').closest('details.fsec');if(d)d.open=true;setStatus(`Añade el primer regalo para ${n} y guarda: su lista aparecerá en Listas.`);});
  // ---------- Compras: precio pagado, cantidad, notas y recompra ----------
  function renderRebuy(){const done=items.filter(i=>i.status==='bought'&&i.consumable);if(!done.length)return '';
    const last=new Map();done.forEach(i=>{const k=key(groupName(i));if(!last.has(k)||(i.boughtAt||'')>(last.get(k).boughtAt||''))last.set(k,i);});
    return `<details class="acc" open><summary><span class="tx"><b>Recompra</b><small>Consumibles: último precio pagado frente al de ahora</small></span></summary><div class="in">${[...last.values()].map(i=>{const paid=num(i.paid)||calc(i).total,now=calc(i).total,d=now-paid;const days=i.boughtAt?Math.round((Date.now()-new Date(i.boughtAt))/864e5):null;
      return `<div class="paid" style="flex-wrap:wrap"><span style="flex:1;min-width:0"><b>${esc(fullName(i))}</b><br><small class="hint">${esc(shopOf(i))} · pagaste ${eur(paid)}${days!=null?` hace ${days} días`:''}${i.checkedAt>(i.boughtAt||'')&&Math.abs(d)>0.005?` · ahora <b style="color:${d<0?'var(--accent)':'var(--danger)'}">${eur(now)}</b>`:''}</small></span><span style="display:flex;gap:6px">${safeUrl(i.url)?`<button class="btn small" data-act="check" data-id="${i.id}">Precio</button>`:''}<button class="btn small primary" data-act="rebuy" data-id="${i.id}">Comprar otra vez</button></span></div>`;}).join('')}</div></details>`;}
  const boughtEdit=i=>`<details class="hist bedit"><summary>Precio pagado, cantidad y notas</summary><div class="bgrid"><label>Pagado (€)<input data-bpaid="${i.id}" inputmode="decimal" value="${esc(numIn(num(i.paid)||calc(i).total))}"></label><label>Cantidad<input data-bqty="${i.id}" inputmode="numeric" value="${esc(String(i.qty||1))}"></label><label class="w">Notas de la compra<input data-bnote="${i.id}" value="${esc(i.buyNote||'')}" placeholder="Pedido, talla, a quién…"></label><label class="ck"><input type="checkbox" data-bcons="${i.id}" ${i.consumable?'checked':''}> Consumible: avísame para la recompra</label></div></details>`;
  document.addEventListener('change',async e=>{const t=e.target;const id=t.dataset.bpaid||t.dataset.bqty||t.dataset.bnote||t.dataset.bcons;if(!id)return;const it=items.find(i=>i.id===id);if(!it)return;
    if(t.dataset.bpaid)it.paid=parseIn(t.value);if(t.dataset.bqty)it.qty=Math.max(1,Math.round(num(t.value))||1);if(t.dataset.bnote)it.buyNote=clean(t.value);if(t.dataset.bcons)it.consumable=t.checked?'1':'';
    await put('items',it);setStatus('Compra actualizada.');if(t.dataset.bcons||t.dataset.bpaid)render();});
  // ---------- Centro de revisión ----------
  let revOpen=false,revKind=null;
  const stIs=(it,k)=>{const keep=flt.state;flt.state=k;const r=stateOk(it);flt.state=keep;return r;};
  const pendAll=()=>items.filter(i=>(i.status||'pending')==='pending');
  const pairK=(a,b)=>[key(groupName(a)),key(groupName(b))].sort().join('||');
  function notSame(){try{return new Set(JSON.parse(localStorage.getItem('notSame')||'[]'));}catch(e){return new Set();}}
  function dupSide(i){const c=calc(i);const det=[clean(i.brand),clean(i.variant),clean(i.size),clean(i.color)].filter(Boolean).join(' · ');const n=items.filter(x=>(x.status||'pending')==='pending'&&key(groupName(x))===key(groupName(i))).length;
    return `<div class="dside">${thumb(i)}<div class="dt"><b>${esc(groupName(i))}</b><small>${esc(shopOf(i))}${n>1?` · ${n} tiendas ya unidas`:''}</small>${det?`<small>${esc(det)}</small>`:''}<span class="dp">${isUnread(i)?'Sin leer':eur(c.total)}${!isUnread(i)&&c.ship>0?` <small>(${eur(c.after)} + ${eur(c.ship)} portes)</small>`:''}</span><span class="da"><button class="btn small" type="button" data-open="${esc(key(groupName(i)))}">Ver ficha</button>${safeUrl(i.url)?`<a class="btn small" href="${esc(safeUrl(i.url))}" target="_blank" rel="noopener">Web</a>`:''}</span></div></div>`;}
  async function fuseItems(a,b){// conserva la oferta con lectura más reciente; la otra queda descartada con referencia
    const t=i=>i.checkedAt||i.createdAt||'';const [k,o]=t(b)>t(a)?[b,a]:[a,b];
    const h=new Map();[...(k.history||[]),...(o.history||[])].forEach(x=>{if(x&&x.at)h.set(x.at+'|'+x.price,x);});k.history=[...h.values()].sort((x,y)=>String(x.at).localeCompare(String(y.at)));
    const im=[...(k.images||[])];(o.images||[]).forEach(v=>{if(!im.includes(v))im.push(v);});k.images=im;
    ['url','brand','variant','sku','mpn','ean','platform','compat','size','color','sub','category','description','code','availability','group'].forEach(f=>{if(!clean(k[f])&&clean(o[f]))k[f]=o[f];});
    if(clean(o.notes)&&!clean(k.notes||'').includes(clean(o.notes)))k.notes=[clean(k.notes),clean(o.notes)].filter(Boolean).join('\n');
    if(o.specs){k.specs=Object.assign({},o.specs,k.specs||{});}
    k.people=[...new Set([...(peopleList(k)),...(peopleList(o))])];if(!k.people.length)delete k.people;
    if(o.tags&&o.tags.length)k.tags=[...new Set([...(k.tags||[]),...o.tags])];
    const tg=[num(k.target),num(o.target)].filter(x=>x>0);if(tg.length)k.target=Math.min(...tg);if(o.alertStock)k.alertStock='1';
    if(!k.prio&&o.prio)k.prio=o.prio;
    o.status='discarded';o.discardedAt=new Date().toISOString();o.discardReason=`fusionado con la otra oferta de ${shopOf(k)}`;o.mergedInto=k.id;
    await put('items',k);await put('items',o);return k;}
  document.addEventListener('click',async e=>{const f=e.target.closest('[data-fuse]');if(!f)return;const a=items.find(i=>i.id===f.dataset.fuse),b=items.find(i=>i.id===f.dataset.fuse2);if(!a||!b)return;
    if(!confirm(`¿Fusionar las dos ofertas de ${shopOf(a)}?\n\nQueda una sola con el historial, fotos y datos de ambas. La otra pasa a Descartados (no se borra).`))return;
    f.disabled=true;const k=await fuseItems(a,b);render();setStatus(`Fusionadas en una sola oferta de ${shopOf(k)}. La otra está en Descartados por si quieres recuperarla.`);});
  function dupPairs(){const firsts=[];const seen=new Set();pendAll().forEach(i=>{const k=key(groupName(i));if(!seen.has(k)){seen.add(k);firsts.push(i);}});
    const out=[];for(let a=0;a<firsts.length;a++)for(let b=a+1;b<firsts.length;b++){try{if(similar(firsts[a],firsts[b])&&!notSame().has(pairK(firsts[a],firsts[b])))out.push([firsts[a],firsts[b]]);}catch(e){}}return out.slice(0,60);}
  function revData(nodup){const P=pendAll();
    return [
      {k:'missing',t:'Datos incompletos',d:'Sin leer, sin precio o sin portes. Releer enlaces y completar campos.',list:P.filter(i=>stIs(i,'missing'))},
      {k:'nocat',t:'Sin clasificar',d:'Asignar categoría y subcategoría.',list:P.filter(i=>stIs(i,'nocat'))},
      {k:'catdiff',t:'Categorías distintas',d:'Un mismo artículo con categoría distinta según la tienda. Ábrelo y elige una.',list:(()=>{const G=new Map();P.forEach(i=>{const k=key(groupName(i));if(!G.has(k))G.set(k,[]);G.get(k).push(i);});return [...G.values()].filter(v=>new Set(v.map(i=>catOf(i)+'|'+clean(i.sub))).size>1).map(v=>v[0]);})()},
      {k:'nophoto',t:'Sin fotografías',d:'Buscar fotos y elegir portada.',list:P.filter(i=>stIs(i,'nophoto'))},
      {k:'cur',t:'Revisar monedas',d:'Importes en otra moneda o sospechosos.',list:(typeof curSuspects==='function'?curSuspects():[])},
      {k:'inh',t:'Portes y cupones supuestos',d:'Copiados de la tienda; se confirman al leer la web.',list:P.filter(i=>i.inherited&&Object.keys(i.inherited).length)},
      {k:'dup',t:'Posibles duplicados',d:'Mismo artículo en fichas separadas. Vincular (otra tienda), fusionar (misma tienda) o dejar.',list:nodup?[]:dupPairs()},
      {k:'err',t:'Errores de lectura',d:'Tiendas que bloquean la lectura o fallos de conexión.',list:P.filter(i=>i.checkErr)}];}
  function revCount(){return revData(true).filter(r=>r.k!=='dup').reduce((s,r)=>s+r.list.length,0);}
  // El globo de Revisión cuenta solo lo nuevo desde tu última visita (la lista completa sigue dentro)
  const revKeys=()=>revData(true).filter(r=>r.k!=='dup').flatMap(r=>r.list.map(i=>r.k+':'+i.id));
  function revSeen(){try{const v=localStorage.getItem('revSeen');return v?new Set(JSON.parse(v)):null;}catch(e){return null;}}
  function revMarkSeen(){try{localStorage.setItem('revSeen',JSON.stringify(revKeys()));}catch(e){}}
  function revNew(){const s=revSeen();if(!s){revMarkSeen();return 0;}return revKeys().filter(k=>!s.has(k)).length;}
  const huevo=n=>n>99?'+🥚':String(n);
  function openReview(k){revMarkSeen();revOpen=true;revKind=k||null;prodKey=null;render();window.scrollTo({top:0});setTimeout(navEnsure,0);}
  function closeReview(){if(revKind){revKind=null;}else{revOpen=false;if(navTab==='review')navTab='home';}render();window.scrollTo({top:0});}
  const revRow=it=>`<div class="rvrow">${selMode?`<label class="selbox rvsel"><input type="checkbox" data-sel="${it.id}" ${sel.has(it.id)?'checked':''}> Seleccionar</label>`:''}${(it.images||[])[0]?imgTag(it.images[0],''):`<span class="ph">${svgI(catIcon(catOf(it)))}</span>`}<div class="t"><b>${esc(fullName(it)||'Sin nombre')}</b><small>${esc(shopOf(it))} · ${esc(catOf(it))}${it.checkErr?` · <span style="color:var(--danger)">${it.checkErr==='blocked'?'la tienda bloquea la lectura':'error al leer'}</span>`:''}${it.inherited?' · '+Object.keys(it.inherited).map(k=>({shipping:'portes',freeFrom:'mínimo portes',code:'cupón'})[k]).join(', ')+' supuestos':''}</small>${missBox(it)}</div><div class="a">${it.checkErr&&revKind==='err'?`${safeUrl(it.url)?`<a class="btn small" href="${esc(safeUrl(it.url))}" target="_blank" rel="noopener">Abrir la tienda</a>`:''}<button class="btn small" type="button" data-act="fix" data-f="fPrice" data-id="${it.id}">Poner el precio a mano</button><button class="btn small" type="button" data-clrerr="${it.id}">Los datos están bien</button>`:`<button class="btn small" type="button" data-act="edit" data-id="${it.id}">Editar</button>`}<button class="btn small" type="button" data-open="${esc(key(groupName(it)))}">Ficha</button></div>${revKind==='catdiff'?catDiffBox(it):''}</div>`;
  // Categorías distintas: se ven todas en rojo y se resuelve aquí mismo
  function catDiffBox(it){const g=items.filter(i=>(i.status||'pending')==='pending'&&key(groupName(i))===key(groupName(it)));const m=new Map();g.forEach(o=>{const c=catOf(o)+(clean(o.sub)?' › '+clean(o.sub):'');if(!m.has(c))m.set(c,[]);m.get(c).push(o);});
    return `<div class="cdiff"><span>Según la tienda:</span>${[...m.entries()].map(([c,v])=>`<span class="cd">${esc(c)} <small>(${v.map(o=>esc(shopOf(o))).join(', ')})</small></span>`).join('')}<div class="pacts">${[...m.entries()].map(([c,v])=>`<button class="btn small" type="button" data-setcat="${v[0].id}">Todo a ${esc(c)}</button>`).join('')}</div></div>`;}
  document.addEventListener('click',async e=>{const b=e.target.closest('[data-clrerr]');if(!b)return;const it=items.find(i=>i.id===b.dataset.clrerr);if(!it)return;it.checkErr='';it.noAuto='1';await put('items',it);render();
    setStatus(`Hecho. ${shopOf(it)} no deja leer su web: no la comprobaré sola; para actualizar el precio, abre la tienda y comparte una captura con el Comparador, o ponlo a mano.`);});
  function renderReview(){const D=revData();
    const back=`<div class="pfback"><button class="iconbtn" type="button" id="rvBack" aria-label="Volver"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button><span class="crumb">${revKind?'Centro de revisión':'Inicio'}</span></div>`;
    if(!revKind){return `<div class="pf">${back}<h2>Centro de revisión</h2><div class="psub">${(()=>{const t=revCount();return t>100?'Más de 100 cosas por revisar. Un huevo. Ve por partes 👇':t+' cosas por revisar, por tipo';})()}</div><div class="rvcards">${D.map(r=>`<button type="button" class="rvcard ${r.list.length?'':'ok'}" data-rv="${r.k}"><b>${r.list.length?`<span class="n">${r.list.length}</span> · `:''}${r.t}</b><small>${r.list.length?r.d:'Todo en orden'}</small></button>`).join('')}</div></div>`;}
    const r=D.find(x=>x.k===revKind);if(!r){revKind=null;return renderReview();}
    const withUrl=r.list.filter&&r.k!=='dup'?r.list.filter(i=>safeUrl(i.url)).length:0;
    const acts={missing:`${$('#retryBtn').hidden?'':`<button class="btn primary" type="button" data-rva="retry">${esc($('#retryBtn').textContent)}</button>`}${withUrl?`<button class="btn" type="button" data-rva="check">Comprobar ${withUrl} con enlace</button>`:''}`,
      nocat:$('#classifyBtn').hidden?'<p class="hint">Para clasificar sola necesitas la clave de API en Ajustes. También puedes editar cada uno.</p>':`<button class="btn primary" type="button" data-rva="classify">${esc($('#classifyBtn').textContent||'Clasificar')}</button>`,
      nophoto:`<button class="btn primary" type="button" data-rva="photos">Buscar fotos de ${r.list.length}</button>`,
      cur:`<button class="btn primary" type="button" data-rva="cur">Revisar monedas</button>`,
      inh:withUrl?`<button class="btn primary" type="button" data-rva="check">Confirmar leyendo la web (${withUrl})</button>`:'',
      err:withUrl?`<button class="btn primary" type="button" data-rva="check">Reintentar ${withUrl}</button>`:'',dup:''}[r.k]||'';
    const body=r.k==='dup'?`<p class="hint"><b>Vincular</b>: el mismo artículo en tiendas distintas; una sola ficha que compara precio, descuentos, portes e importación de cada tienda y vigila su evolución. <b>Fusionar</b>: el mismo artículo guardado dos veces en la misma tienda; queda una sola oferta con el historial, fotos y datos de las dos (la otra pasa a Descartados, no se borra). Si no son el mismo, «Son distintos» y no se vuelve a proponer.</p>`+r.list.map(([a,b])=>`<div class="rvdup v2">${dupSide(a)}${dupSide(b)}<div class="dbtn"><button class="btn small" type="button" data-notsame="${esc(pairK(a,b))}">Son distintos</button>${shopKey(a)===shopKey(b)?`<button class="btn small primary" type="button" data-fuse="${a.id}" data-fuse2="${b.id}">Fusionar: misma tienda</button>`:`<button class="btn small primary" type="button" data-dupa="${a.id}" data-dupb="${esc(key(groupName(b)))}">Vincular: es el mismo</button>`}</div></div>`).join(''):r.list.map(revRow).join('');
    return `<div class="pf">${back}<h2>${r.t}</h2><div class="psub">${r.list.length} · ${r.d}</div><div class="pacts" style="margin-top:12px">${acts}</div><div class="rvlist">${body||'<div class="empty">Todo en orden.</div>'}</div></div>`;}
  document.addEventListener('click',async e=>{
    if(e.target.closest('#rvBack')){closeReview();return;}
    const c=e.target.closest('[data-rv]');if(c){revKind=c.dataset.rv;render();window.scrollTo({top:0});setTimeout(navEnsure,0);return;}
    const ns=e.target.closest('[data-notsame]');if(ns){const S=notSame();S.add(ns.dataset.notsame);try{localStorage.setItem('notSame',JSON.stringify([...S]));}catch(err){}setStatus('Anotado: son distintos. Se quedan separados y se siguen vigilando los dos.');render();return;}
    const d=e.target.closest('[data-dupa]');if(d){const a=items.find(i=>i.id===d.dataset.dupa);if(a){openLink(a);lkSel.add(d.dataset.dupb);drawLink();}return;}
    const b=e.target.closest('[data-rva]');if(!b)return;const r=revData().find(x=>x.k===revKind);
    if(b.dataset.rva==='retry'){$('#retryBtn').click();return;}
    if(b.dataset.rva==='classify'){$('#classifyBtn').click();return;}
    if(b.dataset.rva==='photos'){$('#photoGo').click();return;}
    if(b.dataset.rva==='cur'){openCurReview(false);window.scrollTo({top:0});return;}
    if(b.dataset.rva==='check'){if(!cfg.key){setStatus('Falta la clave de API en Ajustes.','err');return;}const list=r.list.filter(i=>safeUrl(i.url));b.disabled=true;let ok=0;
      for(let i=0;i<list.length;i++){setStatus(`Comprobando ${i+1} de ${list.length}: ${fullName(list[i])}…`,'busy');const x=await checkItem(list[i]);if(x.ok)ok++;}
      render();setStatus(`Comprobados ${ok} de ${list.length}.`);}});
