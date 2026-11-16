// Comparador · 11-comprobar-y-comprar.js
// Parte del código de la app, que se carga en orden desde index.html (ver js/LEEME.md).
  // ---------- comprobar precio y disponibilidad ----------
  // Vuelve a leer la web de la oferta y guarda el precio en el histórico.
  async function checkItem(it){
    it.checkErr='';
    if(!safeUrl(it.url))return{ok:false,msg:`${fullName(it)}: no tiene enlace.`};
    const before=calc(it).total;const wasOut=/agotad|sin stock|no disponible|out of stock/.test(norm(it.availability));
    if(!(it.history||[]).length&&num(it.price)>0)it.history=[{at:it.createdAt||new Date().toISOString(),price:calc(it).after,total:calc(it).total,avail:it.availability||''}];
    try{
      const found=await askClaude({url:it.url});const d=fromClaude(found[0],it.url);
      if(num(d.price)>0){it.price=d.price;it.discount=d.discount;it.discountType=d.discountType;it.orig=d.orig||null;it.curChecked=true;if(d.code)it.code=d.code;}
      if(d.shipping>0)it.shipping=d.shipping;if(d.freeFrom>0)it.freeFrom=d.freeFrom;webPrevails(it,d);
      it.availability=d.availability||it.availability||'';
      ['brand','sku','mpn','ean','description'].forEach(k=>{if(!clean(it[k])&&d[k])it[k]=d[k];});
      const now=new Date().toISOString();it.checkedAt=now;
      if(num(d.price)>0){(it.history=it.history||[]).push({at:now,price:calc(it).after,total:calc(it).total,avail:it.availability});if(it.history.length>500)it.history=it.history.slice(-500);}
      evalAlerts(it,wasOut);
      await put('items',it);
      const after=calc(it).total,diff=after-before;
      return{ok:true,msg:`${fullName(it)} (${shopOf(it)}): ${num(d.price)>0?eur(after)+(Math.abs(diff)>0.005?` (${diff<0?'baja':'sube'} ${eur(Math.abs(diff))})`:' (sin cambios)'):'precio no encontrado'}${it.availability?' · '+it.availability:''}.`};
    }catch(e){it.checkedAt=new Date().toISOString();it.checkErr=/bloquea/.test(e.message||'')?'blocked':'error';await put('items',it);return{ok:false,msg:`${fullName(it)} (${shopOf(it)}): ${e.message||e}.`};}
  }
  $('#checkTop').addEventListener('click',()=>{if(!selMode){if(navTab==='home'||navTab==='lists'){navTab='explore';tab='compare';}prodKey=null;revOpen=false;$('#selModeBtn').click();setStatus('Marca los productos que quieres comprobar y pulsa «Comprobar» abajo.');return;}
    $('#selCheck').click();});
  $('#checkAllBtn').addEventListener('click',async()=>{
    if(!cfg.key){setStatus('Falta la clave de API en Ajustes.','err');return;}
    const list=items.filter(i=>(tab==='done'?i.status==='bought':(i.status||'pending')==='pending')&&matches(i)&&safeUrl(i.url));
    if(!list.length){setStatus('No hay productos con enlace en esta vista.','err');return;}
    const b=$('#checkAllBtn');b.disabled=true;let ok=0,fail=0,ups=0,downs=0,out=0;
    for(let i=0;i<list.length;i++){setStatus(`Comprobando ${i+1} de ${list.length}: ${fullName(list[i])}…`,'busy');
      const before=calc(list[i]).total;const r=await checkItem(list[i]);if(r.ok){ok++;const d=calc(list[i]).total-before;if(d>0.005)ups++;if(d<-0.005)downs++;if(/agotad/.test(norm(list[i].availability)))out++;}else fail++;render();}
    b.disabled=false;render();
    setStatus(`Comprobados ${ok} de ${list.length}: ${downs} bajan, ${ups} suben, ${out} agotados.${fail?` ${fail} no se pudieron leer (tiendas que bloquean la lectura o sin conexión).`:''}`,fail&&!ok?'err':'');
  });
  // Agrupa con Claude las ofertas que son el mismo producto aunque cada tienda lo llame distinto.
  // ---------- comprar: qué hacer con lo relacionado ----------
  const famToks=it=>new Set(norm([it.brand,it.product].join(' ')).replace(/[^a-z0-9.\s-]/g,' ').split(/[\s-]+/).filter(t=>t&&!STOP.has(t)));
  function relation(it,o){
    if(key(groupName(o))===key(groupName(it)))return 'same';
    const A=famToks(it),B=famToks(o);let inter=0;A.forEach(t=>{if(B.has(t))inter++;});
    const jac=A.size&&B.size?inter/(A.size+B.size-inter):0,cover=A.size&&B.size?inter/Math.min(A.size,B.size):0;
    if(jac>=0.5||(cover>=0.8&&inter>=2))return 'version';
    if(it.brand&&norm(it.brand)===norm(o.brand)&&it.platform&&norm(it.platform)===norm(o.platform)&&catOf(it)===catOf(o))return 'similar';
    return '';
  }
  const REL_TXT={same:'mismo producto, otra tienda',version:'otra versión u opción',similar:'parecido (misma marca y modelo)'};
  let buyItem=null,buyCands=[],buySel=new Set();
  function openBuy(it){
    buyItem=it;buyCands=items.filter(o=>o!==it&&(o.status||'pending')==='pending').map(o=>({o,rel:relation(it,o)})).filter(x=>x.rel)
      .sort((a,b)=>['same','version','similar'].indexOf(a.rel)-['same','version','similar'].indexOf(b.rel));
    buySel=new Set(buyCands.filter(x=>x.rel!=='similar').map(x=>x.o.id));
    if(!buyCands.length){finishBuy([]);return;}
    $('#buyTitle').textContent=`Comprado: ${fullName(it)} en ${shopOf(it)} (${eur(calc(it).total)}). ¿Qué hago con lo relacionado?`;
    drawBuy();$('#buyDlg').hidden=false;$('#buyDlg').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function drawBuy(){
    $('#buyList').innerHTML=buyCands.map(({o,rel})=>`<label class="pick ${buySel.has(o.id)?'':'off'}"><input type="checkbox" data-bi="${o.id}" ${buySel.has(o.id)?'checked':''}>
      ${(o.images||[]).length?imgTag(o.images[0]):'<span></span>'}
      <span class="nm">${esc(fullName(o))}<div class="vr">${esc(shopOf(o))} · ${REL_TXT[rel]}</div></span><span class="pr">${isUnread(o)?'—':eur(calc(o).total)}</span></label>`).join('');
    $('#buyAlt').textContent=buySel.size?`Guardar ${buySel.size} como alternativas`:'Guardar como alternativas';$('#buyAlt').disabled=!buySel.size;
  }
  $('#buyList').addEventListener('change',e=>{const c=e.target.closest('[data-bi]');if(!c)return;if(c.checked)buySel.add(c.dataset.bi);else buySel.delete(c.dataset.bi);drawBuy();});
  async function finishBuy(altIds){
    const it=buyItem;const now=new Date().toISOString();
    for(const id of altIds){const o=items.find(x=>x.id===id);if(!o)continue;o.status='alt';o.altOf=it.id;o.altAt=now;await put('items',o);}
    it.status='bought';it.boughtAt=now;it.paid=calc(it).total;await put('items',it);
    $('#buyDlg').hidden=true;buyItem=null;render();
    setStatus(`Comprado: ${fullName(it)} en ${shopOf(it)}.${altIds.length?` ${altIds.length} ${altIds.length===1?'alternativa guardada':'alternativas guardadas'} con la compra (en «Comprados»).`:''}`);
  }
  $('#buyAlt').addEventListener('click',()=>finishBuy([...buySel]));
  $('#buyOnly').addEventListener('click',()=>finishBuy([]));
  $('#buyCancel').addEventListener('click',()=>{$('#buyDlg').hidden=true;buyItem=null;});

  $('#regroupBtn').addEventListener('click',()=>regroup(false));
  // Agrupa sola, como mucho una vez al día y solo si hay productos nuevos desde la última vez.
  // Vigilar precios: al abrir la app comprueba unos pocos productos cuya última comprobación es antigua.
  const watchCfg=()=>{const g=(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:v;}catch(e){return d;}};return{on:g('watchOn','1')==='1',days:num(g('watchDays','2'))||2,max:num(g('watchMax','6'))||6};};
  let watching=false;
  async function autoWatch(){
    const w=watchCfg();if(!w.on||!cfg.key||watching)return;
    const due=items.filter(i=>(i.status||'pending')==='pending'&&hasAlert(i)&&safeUrl(i.url)&&i.checkErr!=='blocked'&&!isUnread(i)&&(!i.checkedAt||Date.now()-new Date(i.checkedAt).getTime()>w.days*DAY))
      .sort((a,b)=>(hasAlert(b)-hasAlert(a))||(a.checkedAt||'').localeCompare(b.checkedAt||'')).slice(0,w.max);
    if(!due.length)return;watching=true;let ups=0,downs=0;
    for(let i=0;i<due.length;i++){setStatus(`Vigilando precios ${i+1} de ${due.length}…`,'busy');const b=calc(due[i]).after;const r=await checkItem(due[i]);
      if(r.ok){const d=calc(due[i]).after-b;if(d>0.005)ups++;if(d<-0.005)downs++;}}
    watching=false;render();
    const alerts=items.filter(i=>(i.status||'pending')==='pending'&&trendInfo(i).rising).length;
    setStatus(`Precios vigilados: ${due.length} comprobados · ${downs} bajan · ${ups} suben${alerts?` · ${alerts} con subida reciente (filtro «Precio subiendo»)`:''}.`);
  }
  async function autoRegroup(){
    if(!cfg.key)return;const n=items.filter(i=>(i.status||'pending')==='pending'&&!isUnread(i)).length;if(n<2)return;
    let last={};try{last=JSON.parse(localStorage.getItem('regroup')||'{}');}catch(e){}
    if(last.n===items.length||(last.t&&Date.now()-last.t<20*3600e3))return;
    await regroup(true);
  }
  async function regroup(silent){
    if(!cfg.key){setStatus('Falta la clave de API en Ajustes.','err');return;}
    const list=items.filter(i=>i.status!=='discarded'&&i.status!=='alt'&&!isUnread(i));if(list.length<2)return;
    const b=$('#regroupBtn');b.disabled=true;setStatus(silent?'Agrupando productos iguales de distintas tiendas…':'Buscando productos iguales en distintas tiendas…','busy');
    try{
      const data=list.map(i=>({id:i.id,nombre:i.product,variante:i.variant,marca:i.brand,ref_fabricante:i.mpn,ean:i.ean,tienda:shopOf(i),precio:calc(i).after}));
      const prompt=`Estas son ofertas de productos guardadas desde distintas tiendas online. Agrupa las que son EXACTAMENTE el mismo producto y la misma variante (mismo modelo, misma versión, mismo color/tamaño/capacidad si importa), aunque cada tienda lo escriba distinto. NO juntes versiones distintas (p. ej. Full vs Lite, cañón largo vs corto, pack de 2 vs 1). Si dudas, no las juntes.
Responde SOLO JSON: {"groups":[{"name": nombre corto y claro del producto con su variante, "ids":[...]}]} incluyendo TODAS las ofertas (las que no tienen pareja van solas en su grupo).
Ofertas: ${JSON.stringify(data)}`;
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':cfg.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:'claude-sonnet-5-5',max_tokens:8000,messages:[{role:'user',content:prompt}]})});
      const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error((j.error&&j.error.message)||('error '+r.status));
      const d=parseJSON((j.content||[]).filter(c=>c.type==='text').map(c=>c.text).join('\n'))||{};
      let joined=0,changed=0;
      for(const g of d.groups||[]){const ids=(g.ids||[]).filter(id=>list.some(i=>i.id===id));if(!ids.length||!clean(g.name))continue;
        if(ids.length>1)joined++;
        for(const id of ids){const it=items.find(i=>i.id===id);if(it&&it.group!==clean(g.name)){it.group=clean(g.name);await put('items',it);changed++;}}}
      try{localStorage.setItem('regroup',JSON.stringify({t:Date.now(),n:items.length}));}catch(e){}
      render();setStatus(`Agrupados: ${joined} ${joined===1?'producto aparece':'productos aparecen'} en varias tiendas. Si alguno está mal unido, usa «Desvincular» o «Vincular».`);
    }catch(e){if(!silent)setStatus('No se pudo agrupar: '+(e.message||e),'err');else setStatus('');}
    finally{b.disabled=false;}
  }

  // ---------- volver a leer productos sin datos ----------
  function applyRead(it,d){
    ['product','variant','brand','sku','mpn','ean','store','category','platform','sub','size','color'].forEach(k=>{if(d[k]&&(!clean(it[k])||(k==='product'&&/^Sin leer/.test(it.product))))it[k]=d[k];});
    ['price','discount','shipping','freeFrom'].forEach(k=>{if(num(d[k])>0)it[k]=d[k];});
    if(d.discountType)it.discountType=d.discountType;if(d.code&&!it.code)it.code=d.code;webPrevails(it,d);
    if((d.description||'').length>(it.description||'').length)it.description=d.description;
    if(d.compat&&!it.compat)it.compat=d.compat;
    if(hasSpecs(d))it.specs=mergeSpecs(it.specs,d.specs);
    if(safeUrl(d.url)&&!safeUrl(it.url))it.url=d.url;
    it.notes=clean(d.notes);it.incomplete=!!d.incomplete;
    if(!clean(it.group)||/^Sin leer/.test(it.group))it.group=autoGroup(it);
  }
  // ---------- volver a leer un producto: rellenar vacíos y revisar discrepancias ----------
  const RR_FIELDS=[['product','Producto'],['variant','Variante'],['brand','Marca'],['sku','Ref. tienda'],['mpn','Ref. fabricante'],['ean','EAN'],['store','Tienda'],
    ['price','Precio','m'],['discount','Descuento','m'],['code','Cupón'],['shipping','Envío','m'],['freeFrom','Envío gratis desde','m'],['availability','Disponibilidad'],
    ['category','Categoría'],['sub','Subcategoría'],['size','Talla'],['color','Color'],['platform','Modelo / plataforma'],['compat','Aplica a'],['description','Descripción']];
  let rrItem=null,rrRead=null,rrRows=[],rrImgs=[];
  const rrVal=(k,v,m)=>k==='specs'?esc(SPECS.filter(([x])=>v&&v[x]).map(([x,l])=>l+': '+v[x]).join(' · ')||'—'):m?(num(v)>0?eur(num(v)):'—'):(k==='description'?esc(clean(v).slice(0,220))+(clean(v).length>220?'…':''):esc(clean(v)||'—'));
  async function rereadReview(it){
    if(!cfg.key){setStatus('Falta la clave de API en Ajustes.','err');return;}
    setStatus(`Volviendo a leer ${fullName(it)}…`,'busy');
    let d=null,err=null,how='';const shots=(it.images||[]).filter(v=>isBlob(v));
    if(safeUrl(it.url)){try{d=fromClaude((await askClaude({url:it.url}))[0],it.url);how='la web';}catch(e){err=e;}}
    if(!d&&shots.length){try{const parts=[];for(const x of shots.slice(0,3))parts.push(...await slices(x));
      const found=await askClaude({images:parts.slice(0,10),url:safeUrl(it.url)});
      const k=key(it.product);const raw=found.find(f=>key(f.product)===k)||found[0];d=fromClaude(raw,it.url);how='las capturas';}catch(e){err=err||e;}}
    if(!d){setStatus(`No se pudo leer: ${(err&&err.message)||'sin enlace ni captura'}.`,'err');return;}
    rrItem=it;rrRead=d;rrRows=[];rrImgOn=true;
    const auto=[];
    for(const [k,label,m] of RR_FIELDS){
      const cur=it[k],nv=d[k];
      const has=m?num(nv)>0:!!clean(nv);if(!has)continue;
      const empty=m?!(num(cur)>0):!clean(cur);
      const same=m?Math.abs(num(cur)-num(nv))<0.005:norm(cur)===norm(nv);
      if(same)continue;
      if(empty&&!/^Sin leer/.test(it.product||'')){auto.push(label);rrRows.push({k,label,m,cur,nv,on:true,empty:true});}
      else rrRows.push({k,label,m,cur,nv,on:empty||k==='price'||k==='shipping'||k==='freeFrom'||k==='availability'||/^Sin leer/.test(it.product||''),empty});
    }
    if(hasSpecs(d)){const ms=mergeSpecs(it.specs,d.specs);const nAdd=Object.keys(ms).length-Object.keys(cleanSpecs(it.specs)).length;
      if(nAdd>0)rrRows.push({k:'specs',label:'Ficha técnica',m:false,cur:it.specs,nv:ms,on:true,empty:!hasSpecs(it)});}
    const imgs=await grabImages(d.imageUrls);rrImgs=imgs.filter(v=>!(it.images||[]).includes(v));
    setStatus('');
    if(!rrRows.length&&!rrImgs.length){setStatus(`${fullName(it)}: todo coincide con ${how}. No hay nada que cambiar.`);return;}
    $('#rrTitle').textContent=`Volver a leer: ${fullName(it)} (${shopOf(it)})`;
    $('#rrHint').textContent=`Leído de ${how}. Lo vacío viene marcado para rellenar; en lo que no coincide, marca lo que quieras cambiar.${d.orig?` Precio original: ${fmtCur(d.orig.price,d.orig.currency)}.`:''}`;
    drawRR();$('#rrDlg').hidden=false;$('#rrDlg').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function drawRR(){
    $('#rrTable').innerHTML=rrRows.map((r,i)=>`<tr><td><input type="checkbox" data-rr="${i}" ${r.on?'checked':''}></td><td><span class="k">${esc(r.label)}${r.empty?' · vacío':' · no coincide'}</span>
      ${r.empty?'':`<span class="old">${rrVal(r.k,r.cur,r.m)}</span><br>`}<span class="new">${rrVal(r.k,r.nv,r.m)}</span></td></tr>`).join('')+
      (rrImgs.length?`<tr><td><input type="checkbox" data-rr="img" checked></td><td><span class="k">Fotos nuevas de la web</span><div class="gallery">${rrImgs.map(v=>imgTag(v)).join('')}</div></td></tr>`:'');
    const n=rrRows.filter(r=>r.on).length+(rrImgs.length&&rrImgOn?1:0);$('#rrApply').textContent=n?`Aplicar ${n} ${n===1?'cambio':'cambios'}`:'Aplicar';
  }
  let rrImgOn=true;
  $('#rrTable').addEventListener('change',e=>{const c=e.target.closest('[data-rr]');if(!c)return;if(c.dataset.rr==='img')rrImgOn=c.checked;else rrRows[+c.dataset.rr].on=c.checked;drawRR();});
  $('#rrCancel').addEventListener('click',()=>{$('#rrDlg').hidden=true;rrItem=null;});
  $('#rrApply').addEventListener('click',async()=>{
    const it=rrItem,d=rrRead;if(!it)return;const before=calc(it).total;let n=0,money=false;
    for(const r of rrRows.filter(r=>r.on)){it[r.k]=r.nv;n++;if(r.m)money=true;}
    if(money){if(rrRows.some(r=>r.on&&r.k==='price')){it.discountType=d.discountType;it.orig=d.orig||null;}
      const now=new Date().toISOString();if(!(it.history||[]).length&&before>0)it.history=[{at:it.createdAt||now,price:before,total:before}];
      (it.history=it.history||[]).push({at:now,price:calc(it).after,total:calc(it).total,avail:it.availability||''});it.checkedAt=now;}
    if(rrImgs.length&&rrImgOn){it.images=[...(it.images||[]),...rrImgs];n++;}
    if(/^Sin leer/.test(it.group||'')||!clean(it.group))it.group=autoGroup(it);
    it.incomplete=!(num(it.price)>0);it.curChecked=true;
    await put('items',it);$('#rrDlg').hidden=true;rrItem=null;rrImgOn=true;render();
    setStatus(n?`${fullName(it)}: ${n} ${n===1?'cambio aplicado':'cambios aplicados'}.`:'Sin cambios.');
  });

  async function rereadItem(it){
    const shots=(it.images||[]).filter(v=>isBlob(v));
    let d=null,err=null;
    if(shots.length){
      try{const parts=[];for(const b of shots.slice(0,3))parts.push(...await slices(b));
        const found=await askClaude({images:parts.slice(0,10),url:safeUrl(it.url)});
        d=fromClaude(found[0],it.url);
        const part=parts[Math.min(Math.max(d.shot,0),parts.length-1)];const crop=await cropBox(part,d.box);
        if(crop)it.images=[crop,...(it.images||[])];
      }catch(e){err=e;}
    }
    if(!d&&safeUrl(it.url)){
      try{d=fromClaude((await askClaude({url:it.url}))[0],it.url);const imgs=await grabImages(d.imageUrls);if(imgs.length)it.images=[...imgs,...(it.images||[])];}catch(e){err=e;}
    }
    if(!d)throw err||new Error('no tiene enlace ni captura');
    delete d.imageUrls;delete d.shot;delete d.box;applyRead(it,d);await put('items',it);return it;
  }
  $('#retryBtn').addEventListener('click',async()=>{
    const list=items.filter(i=>(i.status||'pending')==='pending'&&isUnread(i));let ok=0,blocked=0,i=0;
    $('#retryBtn').disabled=true;
    for(const it of list){i++;setStatus(`Leyendo ${i} de ${list.length}…`,'busy');
      try{await rereadItem(it);ok++;}catch(e){if(/bloquea/.test(e.message||''))blocked++;}render();}
    $('#retryBtn').disabled=false;render();
    setStatus(`Leídos ${ok} de ${list.length}.${blocked?` ${blocked} son de tiendas que bloquean la lectura: abre cada uno en Editar, añade una captura con «+ Fotos» y pulsa «Leer de las capturas».`:''}`,ok===list.length?'':'err');
  });
  $('#readShots').addEventListener('click',async()=>{
    const shots=formImgs.filter(v=>isBlob(v));
    if(!shots.length){$('#readHint').textContent='Añade antes una captura con «+ Fotos».';return;}
    const b=$('#readShots');b.disabled=true;$('#readHint').textContent='Leyendo las capturas…';
    try{
      const parts=[];for(const x of shots.slice(0,3))parts.push(...await slices(x));
      const found=await askClaude({images:parts.slice(0,10),url:safeUrl(F('fUrl').value.trim())});
      const d=fromClaude(found[0],F('fUrl').value.trim());
      const part=parts[Math.min(Math.max(d.shot,0),parts.length-1)];const crop=await cropBox(part,d.box);
      delete d.imageUrls;delete d.shot;delete d.box;
      const keep={group:F('fGroup').value,compat:F('fCompat').value,tags:F('fTags').value,url:F('fUrl').value};
      fillForm(d);if(keep.group&&!/^Sin leer/.test(keep.group))F('fGroup').value=keep.group;else F('fGroup').value=fullName(d);
      if(keep.compat)F('fCompat').value=keep.compat;if(keep.tags)F('fTags').value=keep.tags;if(keep.url&&!d.url)F('fUrl').value=keep.url;
      if(crop)formImgs.unshift(crop);renderImgEdit();drawAllChips();
      $('#readHint').textContent=found.length>1?`Hay ${found.length} productos en la captura; he puesto el primero. Revisa y pulsa Guardar.`:'Listo. Revisa y pulsa Guardar.';
    }catch(err){$('#readHint').textContent='No se pudo: '+(err.message||err);}
    finally{b.disabled=false;}
  });

  // ---------- clasificar productos guardados sin categoría ----------
  $('#classifyBtn').addEventListener('click',async()=>{
    const todo=items.filter(i=>!clean(i.category));if(!todo.length)return;
    const b=$('#classifyBtn');b.disabled=true;let done=0;
    try{
      for(let i=0;i<todo.length;i+=40){
        const batch=todo.slice(i,i+40);
        setStatus(`Clasificando ${Math.min(i+40,todo.length)} de ${todo.length}…`,'busy');
        const list=batch.map(it=>({id:it.id,nombre:it.product,variante:it.variant,marca:it.brand,descripcion:clean(it.description).slice(0,300)}));
        const prompt=`Clasifica estos productos de compras. Para cada uno devuelve su categoría, su modelo/plataforma y los modelos compatibles que se deduzcan del nombre o la descripción.
Responde SOLO JSON: {"items":[{"id":..., "category":..., "sub":..., "platform":..., "compatible":[...]}]}
- "category": tipo de producto en español, corto, genérico y en plural (nunca «Otros», «Varios» ni «General»).
- "platform": modelo o plataforma al que pertenece o para el que es (p. ej. "Hi-Capa 5.1", "Glock 17", "CAM870", "M4"); "" si no aplica.
- "compatible": modelos compatibles que se indiquen; [] si no se indica. No inventes.${catHint()}
Productos: ${JSON.stringify(list)}`;
        const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':cfg.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
          body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:4000,messages:[{role:'user',content:prompt}]})});
        const j=await r.json().catch(()=>({}));
        if(!r.ok)throw new Error((j.error&&j.error.message)||('error '+r.status));
        const d=parseJSON((j.content||[]).filter(c=>c.type==='text').map(c=>c.text).join('\n'))||{};
        for(const x of d.items||[]){const it=items.find(i=>i.id===x.id);if(!it||!clean(x.category))continue;
          it.category=clean(x.category);if(!clean(it.sub)&&clean(x.sub))it.sub=clean(x.sub);if(!it.platform&&clean(x.platform))it.platform=clean(x.platform);
          if(!it.compat&&Array.isArray(x.compatible)&&x.compatible.length)it.compat=x.compatible.map(clean).filter(Boolean).join(', ');
          await put('items',it);done++;}
        render();
      }
      setStatus(`Clasificados ${done} de ${todo.length}. Puedes cambiar la categoría desde Editar o renombrarlas en Ajustes.`);
    }catch(err){setStatus('No se pudo clasificar: '+(err.message||err),'err');}
    finally{b.disabled=false;render();}
  });
  function renderCatEdit(){
    const cats=allCats().filter(c=>c[0]!==NOCAT);
    $('#catEdit').innerHTML=cats.length?cats.map(([c,n])=>`<div class="catrow"><input value="${esc(c)}" data-old="${esc(c)}" aria-label="Categoría"><span class="hint">${n}</span></div>`).join(''):'<span class="hint">Aún no hay categorías.</span>';
  }
  $('#catEdit').addEventListener('change',async e=>{
    const inp=e.target.closest('input[data-old]');if(!inp)return;
    const from=inp.dataset.old,to=clean(inp.value);if(!to||to===from){inp.value=from;return;}
    for(const it of items)if(catOf(it)===from){it.category=to;await put('items',it);}
    if(flt.cat===from){flt.cat=to;saveFlt();}
    renderCatEdit();render();setStatus(`Categoría «${from}» → «${to}».`);
  });
  $('#openSettings').addEventListener('click',renderCatEdit);

  // ---------- completar fotos de productos antiguos ----------
  // Un producto "no tiene foto" si no tiene imágenes o si todas son capturas de pantalla (más altas que anchas).
  const noPhoto=new Set();
  async function isShot(v){if(typeof v==='string')return false;try{const b=await createImageBitmap(v);return b.height>b.width*1.4;}catch(e){return false;}}
  async function scanPhotos(){
    noPhoto.clear();
    for(const it of items){const im=it.images||[];let lacks=!im.length;if(!lacks){lacks=true;for(const v of im){if(!isBad(v)&&!(await isShot(v))){lacks=false;break;}}}if(lacks&&(it.url||im.length))noPhoto.add(it.id);}
    const n=noPhoto.size;$('#photoBar').hidden=!n||!cfg.key;
    $('#photoTxt').textContent=`${n} ${n===1?'producto no tiene':'productos no tienen'} foto del producto.`;
  }
  async function fillPhotos(it){
    const before=(it.images||[]).length;let added=[];
    try{
      if(safeUrl(it.url)&&!/amazon\./i.test(it.url)){
        const w=fromClaude((await askClaude({url:it.url}))[0],it.url);
        added=(await grabImages(w.imageUrls)).filter(v=>!(it.images||[]).includes(v));
        ['brand','sku','mpn','ean'].forEach(k=>{if(!it[k]&&w[k])it[k]=w[k];});
        if(!it.description&&w.description)it.description=w.description;
      }
      if(!added.length){
        const shot=(it.images||[]).find(v=>isBlob(v));
        if(shot){
          const parts=await slices(shot);
          const found=await askClaude({images:parts.slice(0,10)});
          const k=key(it.product);
          const p=found.find(f=>key(f.product)===k&&key(f.variant)===key(it.variant))||found.find(f=>key(f.product)===k)||found[0];
          const part=parts[Math.min(Math.max(Number.isInteger(p.shot)?p.shot:0,0),parts.length-1)];
          const crop=await cropBox(part,p.box);if(crop)added=[crop];
          if(!it.description&&p.description)it.description=clean(p.description);
        }
      }
    }catch(e){}
    if(!added.length)return false;
    it.images=[...added,...(it.images||[]).filter(v=>!isBad(v))];await put('items',it);return before!==it.images.length;
  }
  $('#photoGo').addEventListener('click',async()=>{
    const list=items.filter(i=>noPhoto.has(i.id));let ok=0,i=0;
    $('#photoBar').hidden=true;
    for(const it of list){i++;setStatus(`Buscando fotos ${i} de ${list.length}: ${fullName(it)}…`,'busy');if(await fillPhotos(it))ok++;render();}
    await scanPhotos();render();
    setStatus(`Listo: fotos añadidas a ${ok} de ${list.length} productos.${ok<list.length?' A los que faltan puedes añadirles fotos desde Editar.':''}`,ok?'':'err');
  });

