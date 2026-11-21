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
