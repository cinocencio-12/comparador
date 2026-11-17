// Comparador · 10-fotos-y-acciones.js
// Parte del código de la app, que se carga en orden desde index.html (ver js/LEEME.md).
  // ---------- buscar fotos ----------
  const imgQuery=()=>{const b=clean(F('fBrand').value),p=clean(F('fProduct').value),v=clean(F('fVariant').value);return [b&&!norm(p).includes(norm(b))?b:'',p,v].filter(Boolean).join(' ');};
  $('#gImgs').addEventListener('click',()=>{const q=imgQuery();if(!q){$('#readHint').textContent='Escribe antes el nombre del producto.';return;}
    const a=document.createElement('a');a.href='https://www.google.com/search?tbm=isch&q='+encodeURIComponent(q);a.target='_blank';a.rel='noopener';a.click();
    setStatus('En Google Imágenes: mantén pulsada la foto → «Copiar imagen» (o «Copiar dirección de imagen»), vuelve aquí y pulsa «Pegar imagen o enlace».');});
  $('#pasteImg').addEventListener('click',async()=>{
    try{
      if(navigator.clipboard&&navigator.clipboard.read){const its=await navigator.clipboard.read();
        for(const ci of its){const t=ci.types.find(x=>x.startsWith('image/'));if(t){formImgs.push(await shrink(await ci.getType(t)));renderImgEdit();setStatus('Imagen añadida.');return;}
          if(ci.types.includes('text/plain')){const txt=await (await ci.getType('text/plain')).text();const u=(txt.match(/https?:\/\/\S+/)||[''])[0];if(u){formImgs.push(await grabImage(u));renderImgEdit();setStatus('Imagen añadida desde el enlace.');return;}}}}
      const txt=navigator.clipboard&&navigator.clipboard.readText?await navigator.clipboard.readText():'';const u=(txt.match(/https?:\/\/\S+/)||[''])[0];
      if(u){formImgs.push(await grabImage(u));renderImgEdit();setStatus('Imagen añadida desde el enlace.');return;}
      setStatus('No hay ninguna imagen ni enlace copiado.','err');
    }catch(e){setStatus('No se pudo leer el portapapeles. Permite el acceso o mantén pulsado en la descripción y elige «Pegar».','err');}
  });
  // Pegar con el menú del sistema en cualquier campo del formulario también añade la imagen.
  $('#form').addEventListener('paste',async e=>{const fs=[...(e.clipboardData?.items||[])].filter(i=>i.kind==='file'&&i.type.startsWith('image/')).map(i=>i.getAsFile());
    if(fs.length){e.preventDefault();for(const f of fs)formImgs.push(await shrink(f));renderImgEdit();setStatus('Imagen añadida.');}});
  let foundImgs=[],pickedImgs=new Set();
  function junkImg(u){return /logo|icon|favicon|sprite|banner|footer|header|payment|paypal|visa|mastercard|card_|badge|flag|avatar|placeholder|loading|spinner|social|facebook|twitter|instagram|whatsapp|youtube|pixel|tracking|\/x(40|50|60|80|100|140)\.|_(40|50|60|80|100)x|\.svg/i.test(u);}
  $('#webImgs').addEventListener('click',async()=>{
    const q=imgQuery();if(!q){$('#readHint').textContent='Escribe antes el nombre del producto.';return;}
    if(!cfg.key){setStatus('Falta la clave de API en Ajustes.','err');return;}
    const b=$('#webImgs');b.disabled=true;$('#imgSearch').hidden=false;$('#imgGrid').innerHTML='';$('#imgSearchHint').textContent=`Buscando fotos de «${q}»… (tarda unos segundos)`;
    try{
      const prompt=`Busca en la web fotos del producto «${q}». Usa web_search para encontrar su página en la web del fabricante y en 1-2 tiendas, y ábrelas con web_fetch. Responde SOLO JSON {"images":[url absoluta de cada foto del producto]} con hasta 15 fotos del producto (galería, en buena resolución). Las fotos aparecen en el contenido como ![...](url) o como URLs que acaban en .jpg/.png/.webp. Nada de logos, iconos ni otros productos.`;
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':cfg.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true','anthropic-beta':'web-fetch-2025-09-10'},
        body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:2500,tools:[{type:'web_search_20250305',name:'web_search',max_uses:2},{type:'web_fetch_20250910',name:'web_fetch',max_uses:3}],messages:[{role:'user',content:prompt}]})});
      const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error((j.error&&j.error.message)||('error '+r.status));
      const txt=(j.content||[]).filter(c=>c.type==='text').map(c=>c.text).join('\n');const d=parseJSON(txt)||{};
      // Además de lo que diga Claude, recoge todas las fotos que aparecen en las páginas abiertas.
      const raw=JSON.stringify((j.content||[]).filter(c=>c.type==='web_fetch_tool_result'));
      const fromPages=(raw.match(/https?:(?:\\\/|\/){2}[^\s"')\\<>]+?\.(?:jpe?g|png|webp)(?:\?[^\s"')\\<>]*)?/gi)||[]).map(u=>u.replace(/\\\//g,'/').replace(/&amp;/g,'&'));
      const all=[...(Array.isArray(d.images)?d.images:[]).map(x=>typeof x==='string'?x:x&&x.url),...fromPages].filter(u=>/^https?:\/\//.test(u||'')&&!junkImg(u));
      foundImgs=[...new Set(all)].slice(0,30);pickedImgs=new Set();
      if(!foundImgs.length){$('#imgSearchHint').textContent='No he encontrado fotos. Prueba con «Google Imágenes».';return;}
      $('#imgSearchHint').textContent=`${foundImgs.length} fotos encontradas. Toca las que quieras y pulsa «Añadir seleccionadas».`;
      $('#imgGrid').innerHTML=foundImgs.map((u,i)=>`<button type="button" data-pi="${i}"><img src="${esc(u)}" alt="" referrerpolicy="no-referrer" loading="lazy" onerror="this.parentNode.remove()"></button>`).join('');
    }catch(e){$('#imgSearchHint').textContent='No se pudo buscar: '+(e.message||e);}
    finally{b.disabled=false;}
  });
  $('#imgGrid').addEventListener('click',e=>{const t=e.target.closest('[data-pi]');if(!t)return;const i=+t.dataset.pi;if(pickedImgs.has(i))pickedImgs.delete(i);else pickedImgs.add(i);t.classList.toggle('on',pickedImgs.has(i));$('#imgAdd').textContent=pickedImgs.size?`Añadir ${pickedImgs.size}`:'Añadir seleccionadas';});
  $('#imgAdd').addEventListener('click',async()=>{if(!pickedImgs.size)return;const b=$('#imgAdd');b.disabled=true;b.textContent='Guardando…';
    const got=await Promise.all([...pickedImgs].map(i=>grabImage(foundImgs[i])));formImgs=[...formImgs,...got];renderImgEdit();
    b.disabled=false;$('#imgSearch').hidden=true;setStatus(`${got.length} ${got.length===1?'foto añadida':'fotos añadidas'}. Pulsa Guardar.`);});
  $('#imgClose').addEventListener('click',()=>{$('#imgSearch').hidden=true;});

  // Muestra cuánto es en euros lo que escribes en otra moneda.
  function curPreview(){const c=F('fCur').value||'EUR',sc=F('fShipCur').value||c;const p=parseIn(F('fPrice').value),sh=parseIn(F('fShip').value);
    const parts=[];if(p&&c!=='EUR')parts.push(`precio ≈ ${eur(toEur(p,c))} (1 € = ${fmtNum(FX[c]||0,FX[c]>=100?0:3)} ${c})`);
    if(sh&&sc!=='EUR')parts.push(`envío ≈ ${eur(toEur(sh,sc))}${sc!==c?` (1 € = ${fmtNum(FX[sc]||0,FX[sc]>=100?0:3)} ${sc})`:''}`);
    $('#curPrev').textContent=parts.join(' · ');
    // Moneda distinta del euro → fuera de la UE, con costes de importación.
    if(c!=='EUR'||sc!=='EUR'){F('fOutEU').checked=true;F('fOutEU').disabled=true;F('fOutEU').title='Marcado porque la moneda no es el euro';}else F('fOutEU').disabled=false;}
  let lastCur='EUR';
  F('fCur').addEventListener('focus',()=>{lastCur=F('fCur').value;});
  // Al cambiar la moneda del precio, el envío la sigue si estaba en la misma.
  F('fCur').addEventListener('change',()=>{if(F('fShipCur').value===lastCur)F('fShipCur').value=F('fCur').value;lastCur=F('fCur').value;curPreview();});
  ['fPrice','fShip'].forEach(id=>F(id).addEventListener('input',curPreview));
  function unitsHint(){const u=Math.round(num(F('fUnits').value))||unitsOf({product:F('fProduct').value,variant:F('fVariant').value});const p=num(F('fPrice').value)-0;$('#unitsHint').textContent=u>1&&p>0?`${u>=500?(p/u*1000).toLocaleString('es-ES',{maximumFractionDigits:2})+' €/1000':(p/u).toLocaleString('es-ES',{maximumFractionDigits:3})+' €/ud'} sin portes${num(F('fUnits').value)?'':' (deducido del nombre)'}`:'';}
  ['fUnits','fPrice','fProduct','fVariant'].forEach(id=>F(id).addEventListener('input',unitsHint));F('fShipCur').addEventListener('change',curPreview);

  // Recuadro rojo en los campos vacíos importantes del formulario.
  function markMissing(){
    const empty=id=>!clean(F(id).value);
    F('fPrice').classList.toggle('missing',!(num(F('fPrice').value)>0));
    F('fShip').classList.toggle('missing',!(num(F('fShip').value)>0)&&!(num(F('fFree').value)>0));
    F('fCategory').classList.toggle('missing',empty('fCategory')||/^otros$/i.test(clean(F('fCategory').value)));
    ['fStore','fUrl','fDesc','fProduct'].forEach(id=>F(id).classList.toggle('missing',empty(id)));
    $('#imgEdit').classList.toggle('missing',!formImgs.length);
  }
  $('#form').addEventListener('input',markMissing);$('#form').addEventListener('change',markMissing);
  function openForm(it){
    setTimeout(navEnsure,0);setTimeout(()=>applyEM(true),0);
    cpInh.clear();if(it&&it.inherited)Object.entries(it.inherited).forEach(([k,v])=>cpInh.set(k,v));
    editingId=it?it.id:null;$('#formTitle').textContent=it?'Editar':'Nuevo';
    $('#form').reset();fillForm(it||{});fillCopyList();$('#copyHint').textContent='';$('#imgSearch').hidden=true;formImgs=[...((it&&it.images)||[])];renderImgEdit();drawAllChips();$('#readHint').textContent='';markMissing();
    $('#form').hidden=false;$('#form').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function closeForm(){$('#form').hidden=true;editingId=null;formImgs=[];renderImgEdit();}
  $('#openForm').addEventListener('click',()=>openForm(null));
  $('#cancelBtn').addEventListener('click',closeForm);
  F('fUrl').addEventListener('input',()=>{if(!F('fStore').value)F('fStore').value=hostOf(F('fUrl').value);});
  $('#readWeb').addEventListener('click',async()=>{
    const u=safeUrl(F('fUrl').value.trim());if(!u){$('#readHint').textContent='Pega antes el enlace.';return;}
    const b=$('#readWeb');b.disabled=true;$('#readHint').textContent='Leyendo la web…';
    try{
      const d=fromClaude((await askClaude({url:u}))[0],u);delete d.shot;delete d.box;
      $('#readHint').textContent='Guardando fotos…';
      const imgs=await grabImages(d.imageUrls);delete d.imageUrls;
      const keepGroup=F('fGroup').value;fillForm(d);if(keepGroup)F('fGroup').value=keepGroup;
      formImgs=[...imgs,...formImgs.filter(v=>!imgs.includes(v))];renderImgEdit();
      $('#readHint').textContent=`Listo: ${imgs.length} fotos. Revisa la variante y pulsa Guardar.`;
    }catch(err){$('#readHint').textContent='No se pudo: '+(err.message||err);}
    finally{b.disabled=false;}
  });
  $('#form').addEventListener('submit',async e=>{
    e.preventDefault();
    const d={};FORM.forEach(([id,k])=>{d[k]=F(id).value.trim();});if(me)d.shareWith=formShare();
    ['price','discount','shipping','freeFrom'].forEach(k=>d[k]=parseIn(d[k]));
    convertItem(d,F('fCur').value,F('fShipCur').value);d.outsideEU=F('fOutEU').checked;d.vatExcl=F('fVatExcl').checked;d.noShip=F('fNoShip').checked;
    {const o={};cpInh.forEach((v,k)=>{if(k==='shipping'?num(d.shipping)>0:k==='freeFrom'?num(d.freeFrom)>0:clean(d.code))o[k]=v;});d.inherited=Object.keys(o).length?o:null;}
    d.specs=readSpecs();
    d.url=safeUrl(d.url);d.ean=d.ean.replace(/\s/g,'');d.incomplete=false;
    if(!d.product)return;
    if(!d.group)d.group=fullName(d);
    if(editingId){const it=items.find(i=>i.id===editingId);Object.assign(it,d,{images:formImgs,curChecked:true});await put('items',it);}
    else{const it={id:uid(),...d,images:formImgs,status:'pending',createdAt:new Date().toISOString()};await put('items',it);items.push(it);}
    // «No envía» es de la tienda: al desmarcarlo se quita de todos sus artículos.
    let shipMsg='';{const sh=shopKeyName(d.store||hostOf(d.url||''));if(sh){const same=items.filter(i=>shopKey(i)===sh);
      if(!d.noShip){for(const i of same)if(i.noShip){i.noShip=false;await put('items',i);}}else shipMsg=` ${shopOf(same[0]||d)} marcada como «no envía» (${same.length} ${same.length===1?'artículo':'artículos'}): no cuenta como mejor precio.`;}}
    closeForm();try{await scanPhotos();}catch(err){}render();setStatus('Guardado.'+shipMsg);
  });

  // ---------- acciones ----------
  let armed=null,armTimer=null;
  $('#view').addEventListener('click',async e=>{
    const b=e.target.closest('button[data-act]');if(!b)return;
    const it=items.find(i=>i.id===b.dataset.id);if(!it)return;
    const act=b.dataset.act;
    if(act==='edit')return openForm(it);
    if(act==='fix'){openForm(it);const el=F(b.dataset.f)||$('#'+b.dataset.f);if(el){setTimeout(()=>{revealField(el);el.scrollIntoView({behavior:'smooth',block:'center'});if(el.focus&&el.tagName!=='DIV')el.focus();},250);}return;}
    if(act==='reread'){b.disabled=true;b.textContent='Leyendo…';await rereadReview(it);b.disabled=false;b.textContent='Volver a leer';return;}
    if(act==='share')return openShare(it);
    if(act==='dup'){openForm(null);copyFrom(it);F('fStore').focus();return;}
    if(act==='photos'){b.disabled=true;b.textContent='Buscando…';const ok=await fillPhotos(it);await scanPhotos();render();setStatus(ok?`Fotos añadidas: ${fullName(it)}`:`No he encontrado fotos para ${fullName(it)}. Añádelas desde Editar.`,ok?'':'err');return;}
    if(act==='del'){
      if(armed!==b){if(armed){armed.classList.remove('armed');armed.textContent='Borrar';}armed=b;b.classList.add('armed');b.textContent='¿Seguro? Pulsa otra vez';clearTimeout(armTimer);armTimer=setTimeout(()=>{b.classList.remove('armed');b.textContent='Borrar';armed=null;},4000);return;}
      armed=null;
      for(const a of items.filter(a=>a.status==='alt'&&a.altOf===it.id)){a.status='discarded';a.discardedAt=new Date().toISOString();a.discardReason='alternativa de una compra borrada';await put('items',a);}
      await del('items',it.id);items=items.filter(i=>i.id!==it.id);render();return;
    }
    if(act==='split'){it.group=fullName(it)+' · '+shopOf(it);await put('items',it);render();setStatus(`Desunido: ${fullName(it)} (${shopOf(it)}) ya va en su propia ficha.`);return;}
    if(act==='check'){b.disabled=true;b.classList.add('working');b.textContent='Comprobando…';setStatus(`Leyendo precio, portes y stock en ${shopOf(it)}…`,'busy');const r=await checkItem(it);render();setStatus(r.msg,r.ok?'':'err');return;}
    if(act==='rebuy'){
      const copy=JSON.parse(JSON.stringify({...it,images:[]}));copy.images=it.images||[];
      Object.assign(copy,{id:uid(),status:'pending',boughtAt:null,paid:null,createdAt:new Date().toISOString(),discardedAt:null,discardReason:'',history:(it.history||[]).slice()});
      await put('items',copy);items.push(copy);tab='compare';
      const r=safeUrl(copy.url)?await checkItem(copy):{msg:''};render();
      setStatus(`Añadido otra vez a pendientes: ${fullName(copy)}. ${r.msg||''}`,r.ok===false?'err':'');return;}
    if(act==='unbuy'){
      if(it.status==='bought'){for(const a of items.filter(a=>a.status==='alt'&&a.altOf===it.id)){a.status='pending';a.altOf=null;await put('items',a);}}
      it.status='pending';it.boughtAt=null;it.paid=null;it.discardedAt=null;it.discardReason='';it.altOf=null;}
    if(act==='discard'){it.status='discarded';it.discardedAt=new Date().toISOString();it.discardReason='';await put('items',it);render();setStatus(`Descartado: ${fullName(it)}. Está en «Descartados».`);return;}
    if(act==='bought'){openBuy(it);return;}
    await put('items',it);render();
  });
  ['compare','shops','buy','done','discarded','gifts','shared'].forEach(t=>$('#tab-'+t).addEventListener('click',()=>{tab=t;render();}));

  // ---------- visor de fotos ----------
  let lbIt=null,lbI=0;
  function lbShow(){$('#lbImg').src=src(lbIt.images[lbI]);$('#lbCount').textContent=`${lbI+1} / ${lbIt.images.length}`;$('#lbPrev').hidden=$('#lbNext').hidden=lbIt.images.length<2;const pr=lbI===0&&isCover(lbIt);$('#lbFirst').disabled=pr;$('#lbFirst').textContent=pr?'★ Es la principal':'★ Poner como principal';}
  const isCover=it=>{const g=items.filter(i=>(i.status||'pending')!=='discarded'&&key(groupName(i))===key(groupName(it))&&(i.images||[]).length);const c=g.slice().sort((a,b)=>String(b.coverAt||'').localeCompare(String(a.coverAt||'')))[0];return !c||c.id===it.id||!c.coverAt;};
  $('#lbFirst').addEventListener('click',async()=>{const [x]=lbIt.images.splice(lbI,1);lbIt.images.unshift(x);lbIt.coverAt=new Date().toISOString();await put('items',lbIt);lbI=0;lbShow();render();setStatus('Foto principal cambiada.');});
  $('#lbCat').addEventListener('click',async()=>{lbIt.catCoverAt=new Date().toISOString();lbIt.catCoverI=lbI;await put('items',lbIt);render();setStatus(`Portada de «${catOf(lbIt)}» cambiada.`);});
  $('#lbDel').addEventListener('click',async()=>{if(!confirm('¿Quitar esta foto del artículo?'))return;lbIt.images.splice(lbI,1);await put('items',lbIt);if(!lbIt.images.length){$('#lb').hidden=true;}else{lbI=Math.min(lbI,lbIt.images.length-1);lbShow();}await scanPhotos();render();setStatus('Foto quitada.');});
  // Mantener pulsada una foto: abrirla con las opciones (principal / quitar)
  document.addEventListener('contextmenu',e=>{const t=e.target.closest('.pgal [data-lb],.buyrow [data-lb],.offer [data-lb]');if(t){e.preventDefault();t.click();return;}
    const ed=e.target.closest('#imgEdit .imgthumb, #imgEdit > div');if(ed){const f=ed.querySelector('[data-first]');if(f){e.preventDefault();f.click();setStatus('Será la foto principal al guardar.');}}});
  $('#view').addEventListener('click',e=>{const t=e.target.closest('[data-lb]');if(!t)return;const it=items.find(i=>i.id===t.dataset.lb);if(!it||!(it.images||[]).length)return;lbIt=it;lbI=+t.dataset.i||0;$('#lb').hidden=false;lbShow();});
  $('#lbClose').addEventListener('click',()=>{$('#lb').hidden=true;});
  $('#lb').addEventListener('click',e=>{if(e.target.id==='lb')$('#lb').hidden=true;});
  $('#lbPrev').addEventListener('click',()=>{lbI=(lbI-1+lbIt.images.length)%lbIt.images.length;lbShow();});
  $('#lbNext').addEventListener('click',()=>{lbI=(lbI+1)%lbIt.images.length;lbShow();});
  let tx0=null;$('#lb').addEventListener('touchstart',e=>{tx0=e.touches[0].clientX},{passive:true});
  $('#lb').addEventListener('touchend',e=>{if(tx0==null)return;const dx=e.changedTouches[0].clientX-tx0;tx0=null;if(Math.abs(dx)>40)(dx>0?$('#lbPrev'):$('#lbNext')).click();});

  // ---------- copia de seguridad ----------
  function drawBackupInfo(){const el=$('#backupInfo');if(!el)return;let b=null;try{b=JSON.parse(localStorage.getItem('lastBackup')||'null');}catch(e){}
    const days=b?Math.floor((Date.now()-b.at)/864e5):null;
    el.innerHTML=b?`Última copia comprobada: ${new Date(b.at).toLocaleDateString('es-ES')} (${b.n} productos, ${b.f} fotos)${days>=14?' · <b style="color:var(--warn)">haz una nueva</b>':''}.`:`<b style="color:var(--warn)">Aún no has hecho ninguna copia de seguridad.</b> ${(()=>{try{return me}catch(e){return null}})()?'Tus productos también están en la nube con tu cuenta, pero conviene tener una copia propia.':'Sin cuenta, tus productos solo están en este móvil.'}`;}
  drawBackupInfo();
  $('#keyDel').addEventListener('click',()=>{ls.set('apiKey','');$('#apiKey').value='';setStatus('Clave borrada de este móvil.');});

  $('#exportBtn').addEventListener('click',async()=>{
    setStatus('Preparando la copia…','busy');
    const out=[];for(const it of items){const imgs=[];for(const b of (it.images||[]).filter(v=>typeof v==='string'||isBlob(v)))imgs.push(typeof b==='string'?{url:b}:{type:b.type,data:await toB64(b)});out.push({...it,images:imgs});}
    const json=JSON.stringify({v:2,at:new Date().toISOString(),items:out});
    // Comprobación: se vuelve a leer la copia y se cuentan productos y fotos antes de entregarla.
    let chk;try{chk=JSON.parse(json);}catch(e){setStatus('La copia ha salido corrupta. No se ha guardado.','err');return;}
    const nI=(chk.items||[]).length,nF=(chk.items||[]).reduce((a,i)=>a+(i.images||[]).filter(x=>x.data||x.url).length,0),expF=items.reduce((a,i)=>a+(i.images||[]).filter(v=>typeof v==='string'||isBlob(v)).length,0);
    if(nI!==items.length||nF!==expF){setStatus(`La copia no cuadra (${nI} de ${items.length} productos, ${nF} de ${expF} fotos). No se ha guardado.`,'err');return;}
    try{localStorage.setItem('lastBackup',JSON.stringify({at:Date.now(),n:nI,f:nF}));}catch(e){}drawBackupInfo();
    const blob=new Blob([json],{type:'application/json'});
    const file=new File([blob],'comparador-copia.json',{type:'application/json'});
    try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Copia Comparador'});setStatus(`Copia comprobada y compartida: ${nI} productos y ${nF} fotos.`);return;}}catch(e){}
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`comparador-copia-${new Date().toISOString().slice(0,10)}.json`;a.click();setStatus(`Copia comprobada y descargada: ${nI} productos y ${nF} fotos.`);
  });
  $('#importFile').addEventListener('change',async e=>{
    const f=e.target.files[0];e.target.value='';if(!f)return;
    try{const j=JSON.parse(await f.text());const nIn=(j.items||[]).length;const nNew=(j.items||[]).filter(x=>!items.some(i=>i.id===x.id)).length;
      if(!confirm(`La copia tiene ${nIn} productos (${nNew} que no tienes ahora). Se añaden y se actualizan; no se borra nada de lo que ya tienes. ¿Restaurar?`))return;
      for(const it of j.items||[]){it.images=(it.images||[]).map(im=>{if(im.url)return im.url;const bin=atob(im.data);const u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);return new Blob([u8],{type:im.type||'image/jpeg'});});await put('items',it);}
      items=await getAll('items');render();setStatus('Copia restaurada.');}catch(err){setStatus('No se pudo restaurar: '+err.message,'err');}
  });

  // ---------- campos de etiquetas (Aplica a / Etiquetas) ----------
  function chipSuggest(kind){
    const m=new Map();const add=v=>{v=clean(v);const k=norm(v);if(v&&!m.has(k))m.set(k,v);};
    if(kind==='applies'){APPLY_DEF.forEach(add);items.forEach(i=>{splitList(i.platform).forEach(add);compatList(i).forEach(add);});}
    else if(kind==='people'){allPeople().forEach(add);}
    else{items.forEach(i=>tagList(i).forEach(add));TAG_DEF.forEach(add);}
    return [...m.values()].sort((x,y)=>x.localeCompare(y,'es'));
  }
  // Lo escrito sirve solo para filtrar sugerencias: no se añade hasta que tocas una sugerencia, pulsas Intro o «+ Añadir».
  function drawChips(box,keepFocus){
    const inp=F(box.dataset.for);const vals=splitList(inp.value);const typed=box.querySelector('input.typ');const raw=typed?typed.value:'';const q=norm(raw);
    const sug=chipSuggest(box.dataset.kind).filter(v=>!vals.some(x=>norm(x)===norm(v))&&(!q||norm(v).includes(q))).slice(0,q?25:10);
    const exact=q&&(vals.some(x=>norm(x)===q)||sug.some(v=>norm(v)===q));
    box.innerHTML=vals.map((v,i)=>`<button type="button" class="on" data-rm="${i}">${esc(v)} ×</button>`).join('')+
      `<input class="typ" placeholder="Escribe para buscar…" value="${esc(raw)}" enterkeyhint="done">`+
      (q&&!exact?`<button type="button" class="sug" data-add="${esc(clean(raw))}" style="border-style:solid">+ Añadir «${esc(clean(raw))}»</button>`:'')+
      sug.map(v=>`<button type="button" class="sug" data-add="${esc(v)}">+ ${esc(v)}</button>`).join('')+
      (q?`<button type="button" class="sug" data-clear="1">✕ Borrar búsqueda</button>`:'');
    if(keepFocus){const t=box.querySelector('input.typ');t.focus();const n=t.value.length;t.setSelectionRange(n,n);}
  }
  function chipSet(box,vals,keepFocus){F(box.dataset.for).value=vals.join(', ');drawChips(box,keepFocus);}
  document.querySelectorAll('.chipbox').forEach(box=>{
    // Que tocar un botón no quite el foco al campo (así no se cierra el teclado).
    box.addEventListener('pointerdown',e=>{if(e.target.closest('button'))e.preventDefault();});
    box.addEventListener('mousedown',e=>{if(e.target.closest('button'))e.preventDefault();});
    box.addEventListener('click',e=>{
      const vals=splitList(F(box.dataset.for).value);const t=box.querySelector('input.typ');const typing=t&&document.activeElement===t;
      const rm=e.target.closest('[data-rm]');if(rm){vals.splice(+rm.dataset.rm,1);chipSet(box,vals,typing);return;}
      const cl=e.target.closest('[data-clear]');if(cl){t.value='';drawChips(box,true);return;}
      const ad=e.target.closest('[data-add]');if(ad){const v=ad.dataset.add;if(!vals.some(x=>norm(x)===norm(v)))vals.push(v);
        // Si lo añadido es justo lo escrito, se limpia; si era una sugerencia, se mantiene la búsqueda para añadir más.
        if(t&&norm(t.value)===norm(v))t.value='';chipSet(box,vals,typing||!!(t&&t.value));}
    });
    box.addEventListener('keydown',e=>{
      if(!e.target.matches('input.typ')||(e.key!=='Enter'&&e.key!==','))return;
      e.preventDefault();const v=clean(e.target.value);if(!v)return;
      const vals=splitList(F(box.dataset.for).value);if(!vals.some(x=>norm(x)===norm(v)))vals.push(v);e.target.value='';chipSet(box,vals,true);
    });
    box.addEventListener('input',e=>{if(!e.target.matches('input.typ'))return;drawChips(box,true);});
  });
  const drawAllChips=()=>document.querySelectorAll('.chipbox').forEach(drawChips);

  // Productos a revisar: leídos en otra moneda, con pista de otra moneda, o con precio muy alto (posible yen, NT$…).
  function curSuspects(){return items.filter(i=>i.status!=='discarded'&&(i.orig||guessCur(i)||(num(i.price)>=1500&&!i.curChecked)));}
  let curRows=[];
  function openCurReview(all){
    curRows=(all===true?items.filter(i=>i.status!=='discarded'&&!isUnread(i)):curSuspects()).map(i=>{const o=i.orig;return{it:i,cur:o?o.currency:(guessCur(i)||'EUR'),price:o?o.price:num(i.price),ship:o?o.shipping:num(i.shipping),free:o?o.freeFrom:num(i.freeFrom),dirty:!o&&!!guessCur(i)};});
    drawCur();$('#curDlg').hidden=false;$('#curDlg').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function drawCur(){
    $('#curTable').innerHTML=curRows.map((r,i)=>`<tr><td style="width:56px">${thumb(r.it)}</td><td><b>${esc(fullName(r.it))}</b><span class="k">${esc(shopOf(r.it))}${r.it.status==='bought'?' · comprado':''}</span>
      <div class="disc" style="margin-top:6px"><input data-cp="${i}" inputmode="decimal" value="${esc(numIn(r.price))}" style="font:400 .95rem var(--f-body);padding:7px 9px;border:1px solid var(--line);border-radius:7px;background:var(--bg);color:var(--fg);width:110px">
      <select data-cc="${i}" style="width:auto;max-width:170px;min-width:0;font:400 .9rem var(--f-body);padding:7px;border:1px solid var(--line);border-radius:7px;background:var(--bg);color:var(--fg)">${curOpts(r.cur)}</select></div>
      <span class="new" id="ce${i}">= ${eur(toEur(r.price,r.cur))}${r.ship?` + ${eur(toEur(r.ship,r.cur))} envío`:''}</span>${r.dirty?' <span class="chip warn">Sin corregir</span>':''}</td></tr>`).join('')||'<tr><td>No hay nada que revisar.</td></tr>';
  }
  $('#curTable').addEventListener('input',e=>{const t=e.target;const i=+(t.dataset.cp??t.dataset.cc);if(isNaN(i))return;const r=curRows[i];
    if(t.dataset.cp!==undefined)r.price=num(t.value);else r.cur=t.value;r.dirty=true;
    $('#ce'+i).textContent=`= ${eur(toEur(r.price,r.cur))}${r.ship?` + ${eur(toEur(r.ship,r.cur))} envío`:''}`;});
  $('#curRevBtn').addEventListener('click',()=>openCurReview(false));
  $('#curFromSettings').addEventListener('click',()=>{$('#settings').hidden=true;openCurReview(true);});
  $('#curAll').addEventListener('click',()=>openCurReview(true));
  $('#curClose').addEventListener('click',()=>{$('#curDlg').hidden=true;});
  $('#curSave').addEventListener('click',async()=>{let n=0;
    for(const r of curRows.filter(r=>r.dirty)){const it=r.it;const before=calc(it).total;
      it.price=r.price;it.shipping=r.ship;it.freeFrom=r.free;
      if(it.discountType==='eur'&&it.orig)it.discount=it.orig.discount||it.discount;
      const sc=it.orig&&it.orig.shipCurrency&&it.orig.shipCurrency!==it.orig.currency?it.orig.shipCurrency:r.cur;
      convertItem(it,r.cur,sc);it.curChecked=true;
      const f=before>0?calc(it).total/before:1;(it.history||[]).forEach(h=>{h.price=r2(h.price*f);if(h.total)h.total=r2(h.total*f);});
      if(it.status==='bought'&&it.paid)it.paid=r2(it.paid*f);
      await put('items',it);n++;}
    $('#curDlg').hidden=true;render();setStatus(n?`Moneda revisada en ${n} ${n===1?'producto':'productos'}.`:'Sin cambios.');});

  $('#fxFixBtn').addEventListener('click',async()=>{
    const list=items.filter(i=>guessCur(i));let n=0;
    for(const it of list){const cur=guessCur(it);const before=num(it.price);
      convertItem(it,cur);const f=before>0?num(it.price)/before:1;
      (it.history||[]).forEach(h=>{h.price=r2(h.price*f);if(h.total)h.total=r2(h.total*f);});
      it.curChecked=true;await put('items',it);n++;}
    render();setStatus(`Moneda corregida en ${n} ${n===1?'producto':'productos'}. Ahora ves el precio en euros y el original debajo. Si alguno no era de otra moneda, cámbialo en Editar → moneda EUR.`);
  });

