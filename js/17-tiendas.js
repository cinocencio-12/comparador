// Comparador · 17-tiendas.js
// Ficha de cada tienda: portes, envío gratis, IVA, país, si envía, contacto, valoración, personas que atienden…
// Los portes, envío gratis, IVA, país y «no envía» de la tienda valen para TODOS sus artículos que no tengan su propio dato
// (el dato del artículo manda). Se guarda en el móvil (localStorage 'shops') y, con sesión, en la nube (profiles/{uid}.shops).
  let shops={};try{shops=JSON.parse(localStorage.getItem('shops')||'{}')||{};}catch(e){shops={};}
  const shopRecK=k=>{const r=shops[k];return r&&!r.deleted?r:null;};
  const shopRec=it=>shopRecK(shopKey(it));
  // Portes y envío gratis efectivos: los del artículo; si no tiene, los de su tienda.
  const shipOf=it=>{const v=num(it.shipping);if(v>0)return v;if(/gratis|free/i.test(it.notes||''))return 0;const s=shopRec(it);return s&&s.freeAlways!=='1'?num(s.shipping):0;};
  const freeOf=it=>{const v=num(it.freeFrom);if(v>0)return v;const s=shopRec(it);return s?num(s.freeFrom):0;};
  const hasShipInfo=it=>num(it.shipping)>0||num(it.freeFrom)>0||/gratis|free/i.test(it.notes||'')||(()=>{const s=shopRec(it);return !!s&&(num(s.shipping)>0||num(s.freeFrom)>0||s.freeAlways==='1');})();
  const vatExclOf=it=>!!it.vatExcl||(()=>{const s=shopRec(it);return !!s&&s.vat==='no';})();

  const SHOP_COUNTRIES=[['ES','España'],['PT','Portugal'],['FR','Francia'],['DE','Alemania'],['IT','Italia'],['NL','Países Bajos'],['BE','Bélgica'],['AT','Austria'],['PL','Polonia'],['CZ','Chequia'],['IE','Irlanda'],
    ['GB','Reino Unido'],['CH','Suiza'],['US','Estados Unidos'],['CA','Canadá'],['TW','Taiwán'],['HK','Hong Kong'],['CN','China'],['JP','Japón'],['KR','Corea del Sur'],['SG','Singapur'],['AU','Australia']];
  const PAYS=['Tarjeta','PayPal','Bizum','Transferencia','Contra reembolso','Financiación','Google Pay / Apple Pay'];
  const SHOP_FIELDS=['name','url','country','ships','vat','shipping','freeFrom','freeAlways','minOrder','code','days','pickup','payment','rating','address','phone','email','whatsapp','support','people','notes'];

  function shopsSaveLocal(){try{localStorage.setItem('shops',JSON.stringify(shops));}catch(e){}}
  async function shopSave(k,patch){if(!k)return;const rec={...(shops[k]||{}),...patch,updatedAt:Date.now()};delete rec.deleted;shops[k]=rec;shopsSaveLocal();
    // «Sí envía» quita la marca antigua de «no envía» de sus artículos
    if(patch.ships==='si'||patch.ships===''){for(const i of items)if(i.noShip&&shopKey(i)===k){i.noShip=false;await put('items',i);}}
    try{window.__cloud&&window.__cloud.saveShop&&window.__cloud.saveShop(k,rec);}catch(e){}}
  async function shopDelete(k){shops[k]={deleted:true,updatedAt:Date.now()};shopsSaveLocal();try{window.__cloud&&window.__cloud.saveShop&&window.__cloud.saveShop(k,shops[k]);}catch(e){}}
  // Mezcla lo que llega de la nube: gana lo más reciente de cada tienda.
  function shopsMerge(remote){let ch=false;for(const [k,r] of Object.entries(remote||{})){if(!r)continue;if(!shops[k]||(r.updatedAt||0)>(shops[k].updatedAt||0)){shops[k]=r;ch=true;}}if(ch)shopsSaveLocal();return ch;}

  // Sugerencias sacadas de sus artículos (para no empezar de cero).
  function shopGuess(k){const list=items.filter(i=>shopKey(i)===k);const g={};if(!list.length)return g;
    const recent=[...list].sort((a,b)=>(b.checkedAt||b.updatedAt||'')>(a.checkedAt||a.updatedAt||'')?1:-1);
    const first=(f)=>{for(const i of recent){const v=f(i);if(v)return v;}return '';};
    g.name=first(i=>clean(i.store))||shopOf(list[0]);
    g.url=first(i=>{const u=safeUrl(i.url);try{return u?new URL(u).origin:'';}catch(e){return '';}});
    g.shipping=first(i=>num(i.shipping)>0&&!inh(i,'shipping')?numIn(num(i.shipping)):'')||first(i=>num(i.shipping)>0?numIn(num(i.shipping)):'');
    g.freeFrom=first(i=>num(i.freeFrom)>0?numIn(num(i.freeFrom)):'');g.code=first(i=>clean(i.code));
    g.country=first(i=>clean(i.country).toUpperCase());if(!g.country&&list.some(outsideEU))g.country='';
    if(list.some(i=>i.vatExcl))g.vat='no';if(list.some(i=>i.noShip))g.ships='no';
    return g;}

  // ---------- hoja «Ficha de la tienda» ----------
  let tdKey=null;
  const tdSel=(id,opts,v)=>`<select id="${id}">${opts.map(([val,l])=>`<option value="${esc(val)}"${String(v||'')===val?' selected':''}>${esc(l)}</option>`).join('')}</select>`;
  function openShop(k,isNew){tdKey=k;const r=shopRecK(k)||{};const g=isNew?{}:shopGuess(k);const v=f=>r[f]!=null&&r[f]!==''?r[f]:(g[f]||'');
    const guessed=!shopRecK(k)&&Object.keys(g).some(f=>g[f]&&f!=='name');
    const pays=String(v('payment')||'').split(/\s*,\s*/).filter(Boolean);
    const n=k?items.filter(i=>shopKey(i)===k).length:0;
    $('#tdTitle').textContent=isNew?'Nueva tienda':(v('name')||'Tienda');
    $('#tdBody').innerHTML=`${guessed?'<p class="hint">Rellenado con lo que ya sabía de sus artículos: revísalo y guarda.</p>':''}${n?`<p class="hint">${n} ${n===1?'artículo':'artículos'} de esta tienda. Lo que pongas aquí vale para todos los que no tengan su propio dato.</p>`:''}
      <div class="fg">
      <div class="f c3"><label for="td_name">Nombre</label><input id="td_name" value="${esc(v('name'))}"></div>
      <div class="f c3"><label for="td_url">Web</label><input id="td_url" inputmode="url" value="${esc(v('url'))}" placeholder="https://…"></div>
      <div class="f c2"><label for="td_country">País de origen</label>${tdSel('td_country',[['','—'],...SHOP_COUNTRIES,['XX','Otro']],v('country'))}</div>
      <div class="f c2"><label for="td_ships">¿Envía a España?</label>${tdSel('td_ships',[['','—'],['si','Sí'],['no','No envía']],v('ships'))}</div>
      <div class="f c2"><label for="td_vat">Precios</label>${tdSel('td_vat',[['','—'],['si','Con IVA'],['no','Sin IVA (se suma)']],v('vat'))}</div>
      <div class="f c2"><label for="td_shipping">Portes (€)</label><input id="td_shipping" inputmode="decimal" value="${esc(v('shipping'))}"></div>
      <div class="f c2"><label for="td_freeFrom">Envío gratis desde (€)</label><input id="td_freeFrom" inputmode="decimal" value="${esc(v('freeFrom'))}"></div>
      <div class="f c2"><label for="td_minOrder">Pedido mínimo (€)</label><input id="td_minOrder" inputmode="decimal" value="${esc(v('minOrder'))}"></div>
      <label class="selbox" style="grid-column:1/-1"><input type="checkbox" id="td_freeAlways" ${v('freeAlways')==='1'?'checked':''}> Envío siempre gratis</label>
      <div class="f c2"><label for="td_code">Cupón / descuento</label><input id="td_code" value="${esc(v('code'))}"></div>
      <div class="f c2"><label for="td_days">Plazo de entrega</label><input id="td_days" value="${esc(v('days'))}" placeholder="24-48 h"></div>
      <div class="f c2"><label for="td_pickup">Recogida en tienda</label>${tdSel('td_pickup',[['','—'],['si','Sí'],['no','No']],v('pickup'))}</div>
      <div class="f full spmulti" style="grid-column:1/-1"><span class="lbl">Formas de pago</span><div class="spchips" id="td_payment">${PAYS.map(p=>`<label class="spchip"><input type="checkbox" value="${esc(p)}" ${pays.includes(p)?'checked':''}><span>${esc(p)}</span></label>`).join('')}</div></div>
      <div class="f c2"><label for="td_rating">Valoración</label>${tdSel('td_rating',[['','—'],['5','★★★★★ Excelente'],['4','★★★★ Muy buena'],['3','★★★ Normal'],['2','★★ Floja'],['1','★ Mala']],v('rating'))}</div>
      <div class="f c4"><label for="td_address">Dirección</label><input id="td_address" value="${esc(v('address'))}"></div>
      <div class="f c2"><label for="td_phone">Teléfono</label><input id="td_phone" inputmode="tel" value="${esc(v('phone'))}"></div>
      <div class="f c2"><label for="td_whatsapp">WhatsApp</label><input id="td_whatsapp" inputmode="tel" value="${esc(v('whatsapp'))}"></div>
      <div class="f c2"><label for="td_email">Correo</label><input id="td_email" inputmode="email" value="${esc(v('email'))}"></div>
      <div class="f c6"><label for="td_support">Soporte y horario</label><input id="td_support" value="${esc(v('support'))}" placeholder="L-V 10-14 y 17-20, chat en la web…"></div>
      <div class="f c6"><label for="td_people">Personas que nos atienden mejor</label><textarea id="td_people" rows="2" placeholder="Nombre, qué lleva, cómo contactar…">${esc(v('people'))}</textarea></div>
      <div class="f c6"><label for="td_notes">Notas</label><textarea id="td_notes" rows="2" placeholder="Devoluciones, garantía, experiencias…">${esc(v('notes'))}</textarea></div>
      </div>`;
    $('#tdDel').hidden=!shopRecK(k);$('#tdBg').hidden=$('#tdSheet').hidden=false;}
  function closeShop(){$('#tdBg').hidden=$('#tdSheet').hidden=true;tdKey=null;}
  $('#tdCancel').addEventListener('click',closeShop);$('#tdBg').addEventListener('click',closeShop);
  $('#tdSave').addEventListener('click',async()=>{const g=id=>clean(($('#td_'+id)||{}).value||'');
    const name=g('name');if(!name){setStatus('Pon el nombre de la tienda.','err');return;}
    let k=tdKey||shopKeyName(name);const rec={};
    SHOP_FIELDS.forEach(f=>{if(f==='payment')rec.payment=[...document.querySelectorAll('#td_payment input:checked')].map(x=>x.value).join(', ');else if(f==='freeAlways')rec.freeAlways=$('#td_freeAlways').checked?'1':'';else rec[f]=g(f);});
    ['shipping','freeFrom','minOrder'].forEach(f=>{rec[f]=rec[f]?numIn(parseIn(rec[f])):'';});
    if(rec.url&&!safeUrl(rec.url))rec.url=safeUrl('https://'+rec.url.replace(/^\w+:\/*/,''))||'';
    await shopSave(k,rec);closeShop();render();
    const n=items.filter(i=>shopKey(i)===k&&(i.status||'pending')==='pending').length;
    setStatus(`Tienda guardada: ${name}.${n?` Sus datos valen para ${n} ${n===1?'artículo pendiente':'artículos pendientes'} que no tengan los suyos.`:''}`);});
  $('#tdDel').addEventListener('click',async()=>{const b=$('#tdDel');if(!b.classList.contains('armed')){b.classList.add('armed');b.textContent='¿Borrar la ficha? Pulsa otra vez';setTimeout(()=>{b.classList.remove('armed');b.textContent='Borrar ficha';},4000);return;}
    b.classList.remove('armed');b.textContent='Borrar ficha';const k=tdKey;await shopDelete(k);closeShop();render();setStatus('Ficha de la tienda borrada (sus artículos siguen).');});
  document.addEventListener('click',e=>{const b=e.target.closest('[data-shopcard]');if(!b)return;e.preventDefault();openShop(b.dataset.shopcard,false);});
  document.addEventListener('click',e=>{if(!e.target.closest('#shopNew'))return;openShop('',true);});

  // Resumen de la ficha para la cabecera de cada tienda en «Tiendas».
  function shopChips(k){const r=shopRecK(k);if(!r)return '<span class="hint">Sin ficha: pulsa «Ficha de la tienda» para poner portes, contacto…</span>';const c=[];
    if(num(r.rating))c.push(`<span class="chip">${'★'.repeat(num(r.rating))}</span>`);
    if(r.ships==='no')c.push('<span class="chip err">No envía</span>');
    if(r.country){const n=(SHOP_COUNTRIES.find(x=>x[0]===r.country)||[0,r.country==='XX'?'Otro país':r.country])[1];c.push(`<span class="chip">${esc(n)}${r.country!=='XX'&&!EU.has(r.country)?' · fuera de la UE':''}</span>`);}
    if(r.vat==='no')c.push('<span class="chip">Sin IVA</span>');
    if(r.freeAlways==='1')c.push('<span class="chip">Envío gratis</span>');else{if(num(r.shipping))c.push(`<span class="chip">Portes ${eur(num(r.shipping))}</span>`);if(num(r.freeFrom))c.push(`<span class="chip">Gratis desde ${eur(num(r.freeFrom))}</span>`);}
    if(num(r.minOrder))c.push(`<span class="chip">Mínimo ${eur(num(r.minOrder))}</span>`);
    if(r.code)c.push(`<span class="chip">Cupón ${esc(r.code)}</span>`);if(r.days)c.push(`<span class="chip">${esc(r.days)}</span>`);
    const con=[];if(r.phone)con.push(`<a href="tel:${esc(r.phone.replace(/[^\d+]/g,''))}">📞 ${esc(r.phone)}</a>`);if(r.whatsapp)con.push(`<a href="https://wa.me/${esc(r.whatsapp.replace(/[^\d]/g,''))}" target="_blank" rel="noopener">WhatsApp</a>`);
    if(r.email&&/^[^\s@<>"]+@[^\s@<>"]+$/.test(r.email))con.push(`<a href="mailto:${esc(r.email)}">✉ ${esc(r.email)}</a>`);
    return `<div class="chips" style="display:flex;flex-wrap:wrap;gap:6px">${c.join('')}</div>${con.length?`<div class="hint" style="display:flex;gap:12px;flex-wrap:wrap;margin-top:4px">${con.join('')}</div>`:''}${r.people?`<div class="hint" style="margin-top:4px">👤 ${esc(r.people)}</div>`:''}`;}
  // Tiendas con ficha pero sin nada pendiente.
  function shopsOthers(usedKeys){const rest=Object.keys(shops).filter(k=>shopRecK(k)&&!usedKeys.has(k)).sort((a,b)=>(shops[a].name||a).localeCompare(shops[b].name||b,'es'));
    return `<div class="actions" style="margin:14px 0 8px"><button class="btn small primary" type="button" id="shopNew">+ Nueva tienda</button></div>${rest.length?`<h3 style="margin:10px 0 6px">Otras tiendas guardadas</h3><div class="list">${rest.map(k=>{const r=shops[k];const u=safeUrl(r.url);
      return `<article class="product"><header><h3>${esc(r.name||k)}</h3><button class="btn small" type="button" data-shopcard="${esc(k)}">Ficha de la tienda</button></header><div style="padding:0 14px 12px">${shopChips(k)}${u?`<a class="btn small" style="margin-top:8px" href="${esc(u)}" target="_blank" rel="noopener">Abrir tienda</a>`:''}</div></article>`;}).join('')}</div>`:''}`;}

  // ---------- Sugerencias: el valor más repetido entre los artículos de la tienda ----------
  // Para portes, envío gratis, cupón, país e IVA: cuenta los valores que tienen sus artículos (no los copiados) y propone el mayoritario
  // a los que no lo tienen (se guarda en la ficha de la tienda) o a todos (además cambia el dato de los que tienen otro).
  const SUG_F=[['shipping','Portes',i=>num(i.shipping)>0&&!inh(i,'shipping')?String(Math.round(num(i.shipping)*100)/100):'',v=>eur(+v)],
    ['freeFrom','Envío gratis desde',i=>num(i.freeFrom)>0&&!inh(i,'freeFrom')?String(Math.round(num(i.freeFrom)*100)/100):'',v=>eur(+v)],
    ['code','Cupón',i=>!inh(i,'code')?clean(i.code):'',v=>v],
    ['country','País',i=>clean(i.country).toUpperCase(),v=>(SHOP_COUNTRIES.find(x=>x[0]===v)||[0,v])[1]],
    ['vat','Precios',i=>i.vatExcl?'no':'',v=>v==='no'?'sin IVA':'con IVA']];
  function shopSuggest(k){const list=items.filter(i=>shopKey(i)===k&&i.status!=='discarded'&&!isUnread(i));if(list.length<2)return [];const r=shopRecK(k)||{};const out=[];
    for(const [f,label,get,show] of SUG_F){const cnt=new Map();list.forEach(i=>{const v=get(i);if(v)cnt.set(v,(cnt.get(v)||0)+1);});if(!cnt.size)continue;
      const [val,n]=[...cnt.entries()].sort((a,b)=>b[1]-a[1])[0];
      if(f==='vat'&&n<list.length/2)continue;
      const cur=f==='shipping'||f==='freeFrom'?(num(r[f])>0?String(Math.round(num(r[f])*100)/100):''):clean(r[f]||'');
      // si la ficha ya tiene ese valor, los que no lo tienen ya están cubiertos
      const missing=cur===val?0:list.filter(i=>!get(i)&&!(f==='code'&&clean(i.code))).length,other=list.filter(i=>get(i)&&get(i)!==val).length;
      if(cur===val&&!other)continue;if(!missing&&!other&&cur)continue;
      out.push({f,label,val,txt:show(val),n,total:list.length,missing,other,cur:cur?show(cur):'',alts:[...cnt.entries()].filter(e=>e[0]!==val).map(e=>`${show(e[0])} (${e[1]})`)});}
    return out;}
  function sugHtml(k){const s=shopSuggest(k);if(!s.length)return '';
    return `<div class="notes" style="margin:0 14px 10px;display:block"><b>Datos comunes de sus artículos</b>${s.map(x=>`<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px">
      <span style="flex:1;min-width:180px">${esc(x.label)}: <b>${esc(x.txt)}</b> en ${x.n} de ${x.total}${x.cur===x.txt?' (ya en la ficha: vale para los que no lo tienen)':''}${x.alts.length?` · otros: ${esc(x.alts.join(', '))}`:''}${x.cur&&x.cur!==x.txt?` · la ficha dice ${esc(x.cur)}`:''}</span>
      ${x.missing||!x.cur?`<button class="btn small primary" type="button" data-sugfill="${esc(k)}|${x.f}">Aplicar a ${x.missing?`los ${x.missing} sin dato`:'la tienda'}</button>`:''}
      ${x.other?`<button class="btn small" type="button" data-sugall="${esc(k)}|${x.f}">Aplicar a todos (${x.total})</button>`:''}</div>`).join('')}</div>`;}
  async function sugApply(k,f,all){const x=shopSuggest(k).find(s=>s.f===f);if(!x)return;
    const patch={[f]:f==='shipping'||f==='freeFrom'?numIn(+x.val):x.val};if(!(shopRecK(k)||{}).name)patch.name=shopOf(items.find(i=>shopKey(i)===k)||{store:k});await shopSave(k,patch);let ch=0;
    if(all)for(const i of items.filter(i=>shopKey(i)===k&&i.status!=='discarded')){
      if(f==='vat'){if(!i.vatExcl){i.vatExcl=true;ch++;await put('items',i);}continue;}
      if(f==='country'){if(clean(i.country).toUpperCase()!==x.val){i.country=x.val;ch++;await put('items',i);}continue;}
      const nv=f==='code'?x.val:+x.val;const has=f==='code'?clean(i.code):num(i[f])>0;
      if(has&&String(f==='code'?clean(i[f]):Math.round(num(i[f])*100)/100)!==String(f==='code'?nv:Math.round(nv*100)/100)){i[f]=nv;if(i.orig&&f!=='code'){i.orig[f]=nv;if(f==='shipping'){i.orig.shipCurrency='EUR';i.orig.shipRate=1;}}if(i.inherited)delete i.inherited[f];ch++;await put('items',i);}}
    render();setStatus(`${x.label}: ${x.txt} guardado en la ficha de ${(shopRecK(k)||{}).name||shopOf(items.find(i=>shopKey(i)===k)||{store:k})}${all?` y cambiado en ${ch} ${ch===1?'artículo':'artículos'} que tenían otro valor`:`; vale para los ${x.missing} que no lo tenían`}.`);}
  document.addEventListener('click',async e=>{const b=e.target.closest('[data-sugfill],[data-sugall]');if(!b)return;const all=!!b.dataset.sugall;const [k,f]=(b.dataset.sugfill||b.dataset.sugall).split('|');
    if(all&&!b.classList.contains('armed')){b.classList.add('armed');const t=b.textContent;b.textContent='¿Cambiar también los que tienen otro? Pulsa otra vez';setTimeout(()=>{b.classList.remove('armed');b.textContent=t;},4000);return;}
    b.disabled=true;await sugApply(k,f,all);});
  // Cuántas tiendas tienen sugerencias (para el aviso de arriba de «Tiendas»).
  const sugCount=()=>[...new Set(items.filter(i=>i.status!=='discarded').map(shopKey))].filter(k=>k&&shopSuggest(k).some(x=>x.missing||!x.cur)).length;
  // Listado de cada tienda plegado: se abre al tocar «Ver N productos» y se recuerda mientras la app está abierta.
  const shopOpen=new Set();
  document.addEventListener('toggle',e=>{const d=e.target;if(!d.matches||!d.matches('[data-shopdet]'))return;d.open?shopOpen.add(d.dataset.shopdet):shopOpen.delete(d.dataset.shopdet);},true);
