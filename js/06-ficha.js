// Comparador · 06-ficha.js
// Parte del código de la app, que se carga en orden desde index.html (ver js/LEEME.md).
  // ---------- Ficha de producto (cabecera + secciones) ----------
  let prodKey=null;const prodPrev={y:0};
  let pTab='cmp';
  document.addEventListener('click',e=>{const b=e.target.closest('[data-ptab]');if(!b)return;pTab=b.dataset.ptab;document.querySelectorAll('[data-ptab]').forEach(x=>x.setAttribute('aria-selected',String(x===b)));document.querySelectorAll('.ptab').forEach(p=>p.hidden=p.dataset.pt!==pTab);});
  function openProd(k){pTab='cmp';prodPrev.y=window.scrollY;prodKey=k;render();window.scrollTo({top:0});setTimeout(navEnsure,0);}
  function closeProd(){prodKey=null;render();setTimeout(()=>window.scrollTo({top:prodPrev.y}),0);}
  function prodItems(){if(!prodKey)return [];let src=items;try{if(space!=='mine'&&sharedOwners.get(space))src=[...sharedOwners.get(space).items.values()];}catch(e){}
    return src.filter(i=>key(groupName(i))===prodKey);}
  function costLbl(o){if(isUnread(o)||!(num(o.price)>0))return ['incompleto','est'];const noShip=!(num(o.shipping)>0)&&!(num(o.freeFrom)>0)&&!/gratis|free/i.test(o.notes||'');
    if(noShip)return ['sin portes','est'];if(inh(o,'shipping')||inh(o,'freeFrom'))return ['portes supuestos','est'];if(outsideEU(o))return ['total estimado','est'];return ['coste total conocido',''];}
  function renderProd(){
    const all=prodItems();if(!all.length){prodKey=null;return renderCompare(groups('pending'));}
    const pend=all.filter(i=>(i.status||'pending')==='pending'),bought=all.filter(i=>i.status==='bought');
    const offers=(pend.length?pend:all).slice().sort(byBuyable);
    const valid=offers.filter(canBuy);const lt=valid[0]||offers[0];
    const lp=valid.length?valid.reduce((a,b)=>calc(b).after<calc(a).after?b:a):null;
    const f=offers[0];const name=groupName(f);const sub=[f.brand,f.variant].map(clean).filter(Boolean).join(' · ');
    const imgs=[];offers.slice().sort((a,b)=>String(b.coverAt||'').localeCompare(String(a.coverAt||''))).forEach(o=>(o.images||[]).forEach((v,i)=>{if(!imgs.some(x=>x[0]===v))imgs.push([v,o.id,i]);}));
    const [lbl,lcls]=costLbl(lt);const shops=new Set(offers.map(shopOf)).size;
    const back=`<div class="pfback"><button class="iconbtn" type="button" id="pfBack" aria-label="Volver"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button><span class="crumb">${esc(catOf(f))}${clean(f.sub)?' · '+esc(f.sub):''}</span></div>`;
    const badN=imgs.filter(([v])=>isBad(v)).length;const goodImgs=imgs.filter(([v])=>!isBad(v));
    const badBox=badN?`<div class="badbox"><b>${badN===imgs.length?'La foto no carga':`${badN} ${badN===1?'foto no carga':'fotos no cargan'}`}</b><small>La tienda la ha cambiado o borrado. Busca otra o súbela tú.</small><div class="pacts"><button class="btn small primary" type="button" data-fixph="${lt.id}">Buscar foto en internet</button><button class="btn small" type="button" data-fixph="${lt.id}" data-g="1">Google Imágenes</button><button class="btn small" type="button" data-fixph="${lt.id}" data-up="1">Subir o pegar foto</button><button class="btn small" type="button" data-rmbad="1">Quitar ${badN===1?'la rota':'las rotas'}</button></div></div>`:'';
    const gal=`<div class="pgal">${goodImgs.length?goodImgs.map(([v,id,i])=>imgTag(v,`data-lb="${id}" data-i="${i}"`)).join(''):`<div class="noimg">${svgI(catIcon(catOf(f)))}</div>`}</div>`+badBox;
    const head=`<div class="phead"><div><span class="k">Mejor coste total</span><b class="big">${valid.length?eur(calc(lt).total):'—'}</b><span class="lbl ${lcls}">${lbl}</span></div><div class="side"><span class="chip">${shops} ${shops===1?'tienda':'tiendas'}</span>${availChip(lt)}${momentChip(moment(pend.length?pend:offers))}</div></div>
      <div class="pmeta">${unitPrice(lt)?`<b class="upr">${upTxt(unitPrice(lt))}</b> · pack de ${fmtNum(unitsOf(lt),0)} uds · `:''}${lp?`Mejor precio sin portes: <b>${eur(calc(lp).after)}</b> en ${esc(shopOf(lp))}`:''}${valid.length&&lt?` · total más barato en <b>${esc(shopOf(lt))}</b>`:''}</div>`;
    const withUrl=offers.filter(o=>safeUrl(o.url)).length;
    const cc=new Map();offers.forEach(o=>{const c=catOf(o)+(clean(o.sub)?' › '+clean(o.sub):'');if(!cc.has(c))cc.set(c,{n:0,o});cc.get(c).n++;});
    const catBox=cc.size>1?`<div class="badbox" style="margin:0 0 10px"><b>Categorías distintas en sus tiendas</b><small>${[...cc.entries()].map(([c,v])=>`${esc(c)} (${v.n})`).join(' · ')}. Elige una para todas:</small><div class="pacts">${[...cc.entries()].map(([c,v])=>`<button class="btn small${GENERIC.test(catOf(v.o))||catOf(v.o)===NOCAT?'':' primary'}" type="button" data-setcat="${v.o.id}">${esc(c)}</button>`).join('')}</div></div>`:'';
    const myK=key(name);const NS=notSame();const seenG=new Set();
    const sugg=items.filter(i=>(i.status||'pending')==='pending'&&key(groupName(i))!==myK&&!isUnread(i)).filter(i=>{const k=key(groupName(i));if(seenG.has(k))return false;if(NS.has(pairK(f,i)))return false;if(offers.some(o=>likely(o,i))){seenG.add(k);return true;}return false;}).slice(0,3);
    const suggBox=sugg.map(i=>`<div class="sugbox"><span class="sv">${thumb(i)||svgI(catIcon(catOf(i)))}</span><div class="st2"><b>¿Es el mismo que «${esc(groupName(i))}»?</b><small>${esc(shopOf(i))} · ${eur(calc(i).total)}${catOf(i)!==catOf(f)?` · está en ${esc(catOf(i))}`:''}</small><div class="pacts"><button class="btn small primary" type="button" data-dupa="${(t=>t.id)(([lt,i].sort((x,y)=>String(x.createdAt||'').localeCompare(String(y.createdAt||''))))[0])}" data-dupb="${esc(key(String(lt.createdAt||'')<=String(i.createdAt||'')?groupName(i):name))}">${shopKey(i)===shopKey(lt)?'Es el mismo (vincular)':'Vincular'}</button><button class="btn small" type="button" data-open="${esc(key(groupName(i)))}">Ver</button><button class="btn small" type="button" data-notsame="${esc(pairK(f,i))}">No es el mismo</button></div></div></div>`).join('');
    const bySh=new Map();(pend.length?pend:[]).forEach(o=>{const k=shopKey(o);if(!bySh.has(k))bySh.set(k,[]);bySh.get(k).push(o);});
    const reps=[...bySh.values()].filter(v=>v.length>1);
    const fuseBox=reps.map(v=>`<div class="alertbox" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 10px;padding:10px 14px;border-radius:14px"><span style="flex:1;min-width:0">Hay ${v.length} ofertas de <b>${esc(shopOf(v[0]))}</b>: ${v.map(o=>isUnread(o)?'sin leer':eur(calc(o).total)).join(' y ')}. Si es el mismo artículo, fusiónalas.</span><button class="btn small primary" type="button" data-fuse="${v[0].id}" data-fuse2="${v[1].id}">Fusionar</button></div>`).join('');
    const lu=safeUrl(lt.url)||(offers.find(o=>safeUrl(o.url))||{}).url;const lsh=safeUrl(lt.url)?shopOf(lt):shopOf(offers.find(o=>safeUrl(o.url))||lt);
    const goBig=lu?`<a class="gobig" href="${esc(safeUrl(lu))}" target="_blank" rel="noopener"><span>Ver el artículo en <b>${esc(lsh)}</b><small>Abre la página de la tienda</small></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg></a>`:`<div class="gobig none">Este artículo no tiene enlace a la tienda. Edítalo y pega la dirección.</div>`;
    const acts=goBig+`<div class="pacts">${withUrl?`<button class="btn small primary" type="button" id="pfCheck" data-mode="price">Comprobar precio${withUrl>1?' ('+withUrl+')':''}</button><button class="btn small primary" type="button" id="pfStockChk" data-mode="stock">Comprobar stock${withUrl>1?' ('+withUrl+')':''}</button>`:''}<button class="btn small" type="button" data-act="share" data-id="${lt.id}">Compartir</button><button class="btn small" type="button" data-act="edit" data-id="${lt.id}">Editar</button><button class="btn small" type="button" data-link="${lt.id}">Vincular</button><button class="btn small" type="button" data-act="dup" data-id="${lt.id}">+ Otra tienda</button></div>`;
    // Comparación
    const single=valid.length<2;
    const cmp=`<div class="ptab" data-pt="cmp" ${pTab==='cmp'?'':'hidden'}><p class="ptsub">${offers.length} ${offers.length===1?'oferta':'ofertas'} · precio, portes, importación y total</p><div class="in">${offers.map(o=>{const c=calc(o);const [l,lc]=costLbl(o);const isBest=!single&&o===lt;
      const imp=c.total-c.after-(c.ship||0);
      return `<details class="orow"><summary><span class="st" style="${hueOf(shopOf(o))}"><span class="sav">${esc((shopOf(o)||'?').replace(/^www\./,'').charAt(0).toUpperCase())}</span>${esc(shopOf(o))}</span><span class="tt ${isBest?'best':''}">${isUnread(o)?'—':eur(c.total)}${safeUrl(o.url)?`<a class="gostore" href="${esc(safeUrl(o.url))}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Ir a la tienda ↗</a>`:''}</span><span class="bk">${isUnread(o)?'Sin leer':`${eur(c.after)}${num(o.discount)>0?' con dto.':''} · ${c.ship>0?'+'+eur(c.ship)+' portes':l==='sin portes'?'portes: sin dato':'portes gratis'}${imp>0.005?' · +'+eur(imp)+' importación':''}${c.vatAdd?' · +'+eur(c.vatAdd)+' IVA':''}${unitPrice(o)?` · <b class="upr">${upTxt(unitPrice(o))}</b> (${fmtNum(unitsOf(o),0)} uds)`:''}`} ${isBest?'<span class="chip lowtot">Mejor total</span>':''}${lc?`<span class="chip low">${l}</span>`:''}${availChip(o)}</span></summary><div class="od">${offerRow(o,false,calc(lt).total,true,{single,lowTotal:isBest})}</div></div>`;}).join('')}</div></details>`;
    // Histórico
    let yb=null;offers.forEach(o=>{const m=minIn(histPts(o),365);if(m&&(!yb||m.p<yb.p))yb={...m,o};});
    const hist=`<div class="ptab" data-pt="hist" ${pTab==='hist'?'':'hidden'}><p class="ptsub">${yb?`Lo más barato del año: ${eur(yb.p)} el ${fd(yb.t)} en ${esc(shopOf(yb.o))}`:'Mínimos, máximos y tendencia'}</p><div class="in">${offers.map(o=>`<div class="hsec"><b>${esc(shopOf(o))}</b>${trendHtml(o)}${histBox(o)}</div>`).join('')}</div></div>`;
    // Ficha técnica
    const pick=k=>{for(const o of offers){const v=clean(o[k]);if(v)return v;}return '';};
    const specs={};offers.forEach(o=>Object.assign(specs,mergeSpecs(specs,o.specs)));
    const rows=[['Marca',pick('brand')],['Variante',pick('variant')],['Categoría',[catOf(f),pick('sub')].filter(Boolean).join(' · ')],['Modelo / plataforma',pick('platform')],['Compatible con',pick('compat')],['Talla',pick('size')],['Color',pick('color')],['Ref. tienda (SKU)',pick('sku')],['Ref. fabricante',pick('mpn')],['EAN',pick('ean')],['Etiquetas',[...new Set(offers.flatMap(tagList))].join(', ')]]
      .concat(SPECS.filter(([k])=>specs[k]).map(([k,l])=>[l,specs[k]])).filter(r=>r[1]);
    const desc=pick('description');
    const tech=`<div class="ptab" data-pt="tech" ${pTab==='tech'?'':'hidden'}><p class="ptsub">Marca, referencias, compatibilidades${Object.keys(specs).length?' y características':''}</p><div class="in">${rows.length?`<table class="tech">${rows.map(([l,v])=>`<tr><th>${esc(l)}</th><td>${esc(v)}</td></tr>`).join('')}</table>`:'<p class="hint">Sin datos técnicos todavía. Pulsa «Volver a leer» en una oferta.</p>'}${desc?`<p class="pdesc">${esc(desc)}</p>`:''}</div></div>`;
    // Compras y acciones
    const buys=`<div class="ptab" data-pt="buys" ${pTab==='buys'?'':'hidden'}><p class="ptsub">${bought.length?`Comprado ${bought.length} ${bought.length===1?'vez':'veces'}`:'Comprado, descartar, desvincular y más'}</p><div class="in">${bought.map(i=>`<div class="paid"><span>${esc(shopOf(i))}${i.boughtAt?' · '+new Date(i.boughtAt).toLocaleDateString('es-ES'):''}</span><b>${eur(num(i.paid)||calc(i).total)}</b></div>`).join('')}
      ${bought.length&&valid.length?`<p class="hint">Ahora el mejor total es ${eur(calc(lt).total)}${num(bought[0].paid)?` (pagaste ${eur(num(bought[0].paid))})`:''}.</p>`:''}
      <div class="pacts"><button class="btn small primary" type="button" data-act="bought" data-id="${lt.id}">Comprado en ${esc(shopOf(lt))}</button><button class="btn small" type="button" data-act="edit" data-id="${lt.id}">Editar</button><button class="btn small" type="button" data-act="discard" data-id="${lt.id}">Descartar</button></div><p class="hint">Cada oferta tiene sus propias acciones dentro de «Comparativa».</p></div></div>`;
    const tg=offers.map(o=>num(o.target)).find(x=>x>0)||'';const anyOut=offers.some(isOut);const st=offers.some(o=>o.alertStock);
    const alertBox=`<div class="alertset"><b>Avísame</b><label>cuando el total baje de <input id="pfTarget" inputmode="decimal" value="${tg?esc(numIn(tg)):''}" placeholder="€"></label><label class="ck"><input type="checkbox" id="pfStock" ${st?'checked':''}> si vuelve a haber stock${anyOut?'':' (ahora hay)'}</label>${tg&&valid.length&&calc(lt).total<=tg?`<span class="chip lowtot">Objetivo alcanzado</span>`:''}</div>`;
    return `<div class="pf">${back}<h2>${esc(name)}</h2>${sub?`<div class="psub">${esc(sub)}</div>`:''}${gal}${head}${acts}${catBox}${fuseBox}${alertBox}<div class="ptabs" role="tablist">${[['cmp','Comparativa'],['hist','Histórico'],['tech','Detalles'],['buys','Compras']].map(([k,l])=>`<button type="button" role="tab" data-ptab="${k}" aria-selected="${pTab===k}">${l}</button>`).join('')}</div>${cmp}${hist}${tech}${buys}${compatHtml(offers)}${(()=>{const t=basketTips().filter(x=>norm(x.shop)===shopKey(lt));return t.length?`<h3 class="lh">Envío gratis en ${esc(shopOf(lt))}</h3>${basketHtml(t,1)}`:'';})()}${suggBox?`<h3 class="lh">¿Es el mismo artículo?</h3><p class="hint" style="margin:-4px 2px 10px">Parecidos a «${esc(name)}»${sub?' ('+esc(sub)+')':''}. Si son el mismo en otra tienda, vincúlalos para comparar.</p>${suggBox}`:''}</div>`;
  }
  document.addEventListener('click',async e=>{const sc=e.target.closest('[data-setcat]');if(!sc)return;const ref=items.find(i=>i.id===sc.dataset.setcat);if(!ref)return;
    for(const o of items.filter(i=>(i.status||'pending')==='pending'&&key(groupName(i))===key(groupName(ref)))){if(o.category!==ref.category||clean(o.sub)!==clean(ref.sub)){o.category=ref.category;o.sub=ref.sub||'';await put('items',o);}}render();setStatus(`Todas sus tiendas en ${catOf(ref)}${clean(ref.sub)?' › '+ref.sub:''}.`);});
  document.addEventListener('click',async e=>{const fx=e.target.closest('[data-fixph]');if(fx){const it=items.find(i=>i.id===fx.dataset.fixph);if(!it)return;
      openForm(it);formImgs=formImgs.filter(v=>!isBad(v));renderImgEdit();const w=$('#webImgs');
      setTimeout(()=>{revealField(w);const d=$('#fs-imgs');if(d)d.open=true;w.scrollIntoView({behavior:'smooth',block:'center'});
        if(fx.dataset.g)$('#gImgs').click();else if(fx.dataset.up)$('#fImgs').click();else if(cfg.key)w.click();else setStatus('Para buscar fotos en internet hace falta la clave de API en Ajustes. Mientras, usa «Google Imágenes».','err');},300);
      setStatus('He quitado la foto rota del formulario. Elige otra y pulsa Guardar.');return;}
    if(e.target.closest('[data-rmbad]')){let n=0;for(const o of prodItems()){const im=(o.images||[]).filter(v=>!isBad(v));if(im.length!==(o.images||[]).length){n+=(o.images||[]).length-im.length;o.images=im;await put('items',o);}}await scanPhotos();render();setStatus(`${n} ${n===1?'foto rota quitada':'fotos rotas quitadas'}. Puedes buscar otra en Revisión → Sin fotografías.`);return;}
    if(e.target.closest('#pfBack')){closeProd();return;}
    const b=e.target.closest('#pfCheck,#pfStockChk');if(!b)return;const mode=b.dataset.mode;if(!cfg.key){setStatus('Falta la clave de API en Ajustes.','err');return;}
    const list=prodItems().filter(o=>(o.status||'pending')==='pending'&&safeUrl(o.url));document.querySelectorAll('#pfCheck,#pfStockChk').forEach(x=>x.disabled=true);b.classList.add('working');
    const msgs=[];let fail=0;
    for(let i=0;i<list.length;i++){const sh=shopOf(list[i]),t0=Date.now(),n=list.length>1?` (${i+1} de ${list.length})`:'';
      const tick=()=>{const s=Math.round((Date.now()-t0)/1000);const paso=s<4?'Abriendo la web de':s<20?(mode==='stock'?'Mirando el stock en':'Leyendo precio y portes en'):'Sigue leyendo (algunas webs tardan)';
        const t=`${paso} ${s<20?sh:''}${n}… ${s} s`.replace('  ',' ');b.textContent=`${s} s · ${sh}`;setStatus(t,'busy');};
      tick();const iv=setInterval(tick,1000);
      try{const r=await checkItem(list[i],mode);if(!r.ok)fail++;msgs.push(r.msg);}finally{clearInterval(iv);}}
    render();setStatus(msgs.length===1?msgs[0]:`${mode==='stock'?'Stock comprobado en':'Precio comprobado en'} ${list.length} ofertas${fail?` (${fail} no se pudieron leer)`:''}: `+msgs.join(' · '),fail&&fail===list.length?'err':'');});
  function render(){
    renderSpaces();
    setTimeout(navEnsure,0);
    $('#selTop').setAttribute('aria-pressed',String(!!selMode));
    const pend=groups('pending');
    $('#sProducts').textContent=pend.length;
    $('#sOffers').textContent=items.filter(i=>(i.status||'pending')==='pending').length;
    $('#sTotal').textContent=eur(pend.reduce((s,g)=>{const v=g.offers.filter(canBuy);return s+(v.length?Math.min(...v.map(o=>calc(o).total)):0);},0));
    renderFilters();
    $('#groupList').innerHTML=[...new Set(items.map(groupName))].map(p=>`<option value="${esc(p)}">`).join('');
    ['compare','shops','buy','done','discarded','gifts','shared'].forEach(t=>$('#tab-'+t).setAttribute('aria-selected',t===tab));
    document.body.classList.toggle('nav-home',navTab==='home');
    {const q=$('#qn-rev'),rc=revCount();if(q)q.textContent=rc;const nb=$('#navRevN');const nn=revNew();if(nb){nb.hidden=!nn;nb.textContent=huevo(nn);nb.title=`${nn} nuevas desde tu última visita · ${rc} en total`;}}
    document.querySelectorAll('#bnav [data-nav]').forEach(b=>{if(b.dataset.nav===navTab)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    if(navTab!=='home'){const vis=NAVTABS[navTab]||NAVTABS.explore;['compare','shops','buy','done','discarded','gifts','shared'].forEach(t=>{const b=$('#tab-'+t);b.hidden=!vis.includes(t)||(t==='shared'&&!owners().length);});}
    const v=$('#view');
    drawSelBar();
    document.body.classList.toggle('nav-prod',!!prodKey||revOpen||(navTab==='lists'&&listHome&&space==='mine'));
    if(prodKey){v.innerHTML=renderProd();return;}
    if(revOpen){v.innerHTML=renderReview();return;}
    if(navTab==='lists'&&listHome&&space==='mine'){v.innerHTML=renderListsHome();return;}
    if(navTab==='home'){let nm='';try{nm=me&&(me.displayName||me.email)||'';}catch(e){}nm=clean(nm).split(/\s|@/)[0];$('#hello h2').textContent=nm?`Hola, ${nm}`:'Hola';v.innerHTML=renderHome();return;}
    v.innerHTML=(cmpOpen&&sel.size>1?`<div class="actions" style="margin-bottom:8px"><b>Comparando ${sel.size}</b><button class="btn small" type="button" id="cmpClose">Cerrar comparación</button></div>${compareTable()}<div style="height:14px"></div>`:'')+(tab==='compare'?renderCompare(pend):tab==='shops'?renderShops():tab==='buy'?renderBuy(pend):tab==='done'?renderDone():tab==='gifts'?renderGifts():tab==='shared'?renderShared():renderDiscarded());
    const cc=$('#cmpClose');if(cc)cc.onclick=()=>{cmpOpen=false;render();};
  }
  const thumb=it=>(it.images||[]).length?imgTag(it.images[0],`class="pic" data-lb="${it.id}" data-i="0"`):'';
  function refsLine(it){const r=[];if(it.brand)r.push(esc(it.brand));if(it.sku)r.push('Ref. '+esc(it.sku));if(it.mpn)r.push('Fab. '+esc(it.mpn));if(it.ean)r.push('EAN '+esc(it.ean));return r.length?`<div class="refs">${r.map(x=>`<span>${x}</span>`).join('')}</div>`:'';}
  // Datos que le faltan a un producto. Cada uno lleva el campo del formulario donde se rellena.
  function missingList(it){const m=[];
    if(!(num(it.price)>0))m.push(['precio','fPrice']);
    if(!(num(it.shipping)>0)&&!(num(it.freeFrom)>0)&&!/gratis|free/i.test(it.notes||''))m.push(['envío','fShip']);
    if(!clean(it.category)||/^otros$/i.test(clean(it.category)))m.push(['categoría','fCategory']);
    if(!(it.images||[]).length||(typeof noPhoto!=='undefined'&&noPhoto.has(it.id)))m.push(['fotos','imgEdit']);
    if(!clean(it.store))m.push(['tienda','fStore']);
    if(!safeUrl(it.url))m.push(['enlace','fUrl']);
    if(!clean(it.description))m.push(['descripción','fDesc']);
    return m;}
  const missBox=it=>{const m=missingList(it);return m.length?`<div class="miss">Falta: ${m.map(([t,f])=>`<button type="button" data-act="fix" data-f="${f}" data-id="${it.id}">${t}</button>`).join('')}</div>`:'';};
  function availChip(it){return (shipBlocked(it)?'<span class="chip err">No envía</span>':'')+availChip0(it);}
  function availChip0(it){const a=norm(it.availability);if(!a)return '';
    if(/agotad|sin stock|no disponible|out of stock/.test(a))return '<span class="chip err">Agotado</span>';
    if(/pocas|ultimas|últimas|low/.test(a))return `<span class="chip low">${esc(it.availability)}</span>`;
    if(/pedido|reserva|preorder/.test(a))return `<span class="chip low">${esc(it.availability)}</span>`;
    return `<span class="chip ok">${esc(it.availability)}</span>`;}
  // ---------- tendencia de precio ----------
  // Avisa de subidas antes de campañas (Black Friday, Navidad) y de "descuentos" que no bajan del mínimo de los últimos 30 días.
  const DAY=864e5;
  function trendInfo(it){
    const h=(it.history||[]).filter(x=>x.price>0).map(x=>({t:new Date(x.at).getTime(),p:x.price})).filter(x=>x.t).sort((a,b)=>a.t-b.t);
    const now=num(it.price)>0?calc(it).after:(h.length?h[h.length-1].p:0);
    const r={h,now,rising:false,lowest:false,fake:false,min30:0,max:0,min:0,pct:0,from:null};
    if(h.length<2||!now)return r;
    r.min=Math.min(...h.map(x=>x.p));r.max=Math.max(...h.map(x=>x.p));
    const last=h[h.length-1].t;
    const w30=h.filter(x=>x.t>=last-30*DAY&&x.t<last);r.min30=w30.length?Math.min(...w30.map(x=>x.p)):0;
    const w45=h.filter(x=>x.t>=last-45*DAY);const lo45=w45.reduce((a,b)=>b.p<a.p?b:a,w45[0]);
    r.pct=lo45&&lo45.p>0?(now-lo45.p)/lo45.p*100:0;r.from=lo45;
    r.rising=r.pct>=8;
    r.lowest=now<=r.min+0.005&&r.max-r.min>0.005;
    // bajó respecto al máximo reciente, pero sigue por encima del mínimo de 30 días → descuento engañoso
    const prev=h[h.length-2];r.fake=prev&&now<prev.p-0.005&&r.min30>0&&now>r.min30+0.005;
    return r;
  }
  function spark(h){
    if(h.length<2)return '';const W=110,H=26,P=3;const ps=h.map(x=>x.p),lo=Math.min(...ps),hi=Math.max(...ps),t0=h[0].t,t1=h[h.length-1].t||t0+1;
    const X=t=>P+(t1===t0?0:(t-t0)/(t1-t0))*(W-2*P),Y=p=>hi===lo?H/2:P+(1-(p-lo)/(hi-lo))*(H-2*P);
    const d=h.map((x,i)=>(i?'L':'M')+X(x.t).toFixed(1)+' '+Y(x.p).toFixed(1)).join(' ');const e=h[h.length-1];
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><path d="${d}" fill="none" stroke="var(--accent)" stroke-width="1.8"/><circle cx="${X(e.t)}" cy="${Y(e.p)}" r="2.6" fill="var(--accent)"/></svg>`;
  }
  function trendHtml(it){
    const r=trendInfo(it);if(r.h.length<2)return '';
    const d=t=>new Date(t).toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit'});
    const first=r.h[0].p,ch=(r.now-first)/first*100;
    let html=`<div class="trend"><span class="${ch>0.5?'up':ch<-0.5?'down':''}">${ch>0.5?'▲':ch<-0.5?'▼':'='} ${fmtNum(Math.abs(ch),0)} % desde ${d(r.h[0].t)}</span></div>`;
    if(r.rising)html+=`<div class="alertbox">⚠ Ha subido un ${fmtNum(r.pct,0)} % desde ${eur(r.from.p)} (${d(r.from.t)}). Ojo: si ahora le ponen «descuento» puede ser falso.</div>`;
    else if(r.fake)html+=`<div class="alertbox">⚠ Ha bajado, pero sigue por encima del mínimo de los últimos 30 días (${eur(r.min30)}). Descuento poco real.</div>`;
    else if(r.lowest)html+=`<div class="okbox">✓ Precio más bajo registrado.</div>`;
    return html;
  }
  function histHtml(it){
    const h=(it.history||[]).filter(x=>x.price>0);if(h.length<1)return it.checkedAt?`<div class="hist">Comprobado ${new Date(it.checkedAt).toLocaleDateString('es-ES')}</div>`:'';
    const lo=h.reduce((a,b)=>b.price<a.price?b:a),hi=h.reduce((a,b)=>b.price>a.price?b:a),d=x=>new Date(x.at).toLocaleDateString('es-ES');
    return `<details class="hist"><summary>Histórico: mín <b>${eur(lo.price)}</b> (${d(lo)}) · máx ${eur(hi.price)} (${d(hi)}) · ${h.length} ${h.length===1?'registro':'registros'}${it.checkedAt?' · comprobado '+new Date(it.checkedAt).toLocaleDateString('es-ES'):''}</summary>
      <table>${h.slice().reverse().map(x=>`<tr><td>${d(x)}</td><td>${eur(x.price)}</td><td>${x.total?eur(x.total)+' con portes':''}</td><td>${esc(x.avail||'')}</td></tr>`).join('')}</table></details>`;
  }
  function offerRow(it,best,bestTotal,showName,flags){
    flags=flags||{};
    const c=calc(it);const url=safeUrl(it.url);const store=esc(it.store||hostOf(it.url)||'Tienda');
    const discTxt=c.disc>0?`−${eur(c.disc)}${it.discountType==='pct'?` (${num(it.discount)}%)`:''}`:'sin dto.';
    const shipTxt=(c.shipWaived?'envío gratis':(c.ship>0?`+${eur(c.ship)} envío`:'envío 0'))+((inh(it,'shipping')||inh(it,'freeFrom'))?' (copiado de la tienda, sin confirmar)':'')+(inh(it,'code')?' · cupón copiado':'');
    const gal=(it.images||[]).length?`<div class="gallery">${it.images.map((b,i)=>imgTag(b,`data-lb="${it.id}" data-i="${i}"`)).join('')}</div>`:'';
    return `<div class="offer ${best?'best':''} ${sel.has(it.id)?'sel':''}">
      ${selMode?`<label class="selbox"><input type="checkbox" data-sel="${it.id}" ${sel.has(it.id)?'checked':''}> Seleccionar</label>`:''}
      <div class="store">${url?`<a href="${esc(url)}" target="_blank" rel="noopener">${store}</a>`:`<span class="n">${store}</span>`}
        ${flags.single?'<span class="chip plat">Solo esta tienda</span>':''}${flags.lowPrice?'<span class="chip">Más barato sin portes</span>':''}${flags.lowTotal?'<span class="chip lowtot">Mejor total</span>':''}${availChip(it)}${it.variant?`<span class="chip var">${esc(it.variant)}</span>`:''}${it.code?`<span class="chip code">${esc(it.code)}</span>`:''}${isUnread(it)?'<span class="chip err">Sin datos · pulsa Editar</span>':it.incomplete?'<span class="chip warn">Revisar</span>':''}</div>
      <div><div class="total">${eur(c.total)}</div><div class="diff">${c.ship>0?'con portes':c.shipWaived||num(it.shipping)===0&&num(it.freeFrom)>0?'portes gratis':'portes: sin dato'}</div>${!flags.single&&!flags.lowTotal?`<div class="diff">+${eur(c.total-bestTotal)}</div>`:''}</div>
      ${showName?`<div class="pname">${esc(it.product)}</div>`:''}
      ${missBox(it)}
      ${refsLine(it)}
      ${(it.size||it.color)?`<div class="store">${it.size?`<span class="chip size">Talla ${esc(it.size)}</span>`:''}${it.color?`<span class="chip color"><i style="background:${esc(swatch(it.color))}"></i>${esc(it.color)}</span>`:''}</div>`:''}
      ${(it.category||it.platform)?`<div class="store">${it.category?`<span class="chip cat">${esc(it.category)}${it.sub?' · '+esc(it.sub):''}</span>`:''}${it.platform?`<span class="chip plat">${esc(it.platform)}</span>`:''}</div>`:''}
      ${it.compat?`<div class="compat">Aplica a: ${compatList(it).map(esc).join(', ')}</div>`:''}
      ${tagList(it).length?`<div class="store">${tagList(it).map(t=>`<span class="chip tag">${esc(t)}</span>`).join('')}</div>`:''}
      ${peopleList(it).length?`<div class="store">${peopleList(it).map(p=>`<span class="chip gift">🎁 ${esc(p)}</span>`).join('')}</div>`:''}
      ${trendHtml(it)}
      <div class="break"><span>${eur(c.price)}</span><span>${discTxt}</span><span>${shipTxt}</span>${c.imp?`<span>+${eur(c.imp)} importación</span>`:''}${c.vatAdd?`<span>+${eur(c.vatAdd)} IVA</span>`:''}</div>
      ${impLine(c)}
      ${it.orig?`<div class="compat">Precio original: <b>${fmtCur(it.orig.price,it.orig.currency)}</b>${it.orig.shipping?` + ${fmtCur(it.orig.shipping,it.orig.shipCurrency||it.orig.currency)} envío`:''} · cambio 1 € = ${fmtNum(it.orig.rate,it.orig.rate>=100?0:3)} ${it.orig.currency}${it.orig.shipCurrency&&it.orig.shipCurrency!==it.orig.currency?` · 1 € = ${fmtNum(it.orig.shipRate,it.orig.shipRate>=100?0:3)} ${it.orig.shipCurrency}`:''}</div>`:''}
      ${gal}
      ${it.description?`<details class="desc"><summary>Descripción</summary><p>${esc(it.description)}</p></details>`:''}
      ${specsHtml(it)}
      ${it.notes?`<div class="notes">${esc(it.notes)}</div>`:''}
      ${histBox(it)}
      <div class="row-actions"><button class="btn small primary" data-act="bought" data-id="${it.id}">Comprado aquí</button><button class="btn small" data-act="edit" data-id="${it.id}">Editar</button><button class="btn small" data-act="share" data-id="${it.id}" aria-label="Compartir">${(it.shareWith||[]).length?'Compartido ('+(it.shareWith||[]).length+')':'Compartir'}</button>${safeUrl(it.url)?`<button class="btn small" data-act="check" data-id="${it.id}">Comprobar precio</button>`:''}${noPhoto.has(it.id)?`<button class="btn small" data-act="photos" data-id="${it.id}">Buscar fotos</button>`:''}<button class="btn small" data-link="${it.id}">Vincular</button>${flags.single?'':`<button class="btn small" data-act="split" data-id="${it.id}">Desvincular</button>`}<details class="more-a"><summary>Más</summary><div class="menu"><button class="btn small" data-act="dup" data-id="${it.id}">+ Otra tienda</button><button class="btn small" data-act="discard" data-id="${it.id}">Descartar</button>${safeUrl(it.url)||(it.images||[]).some(v=>isBlob(v))?`<button class="btn small" data-act="reread" data-id="${it.id}">Volver a leer</button>`:''}<button class="btn small danger" data-act="del" data-id="${it.id}">Borrar</button></div></details></div></div>`;
  }
  let upSort=false;
  document.addEventListener('click',e=>{if(e.target.closest('[data-upsort]')){upSort=!upSort;render();}});
  function renderCompare(gs){
    if(gs.length&&showGrid()&&!allMode){const bestOf=new Map();gs.forEach(g=>{const v=g.offers.filter(canBuy);bestOf.set(g.offers[0].id,v.length?Math.min(...v.map(o=>calc(o).total)):0);});
      return catGrid(gs.map(g=>g.offers[0]),i=>bestOf.get(i.id)||0);}
    const back=flt.cat?catBack(gs.length):(allMode&&showGrid()?`<div class="catback" style="${hueOf('Todo')}"><button class="iconbtn" type="button" data-cat="" aria-label="Volver a categorías"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button><span class="ic">${svgI('all')}</span><h2>Todo<small>${gs.length} productos</small></h2></div>`:'');
    const inCat=flt.cat?items.filter(i=>(i.status||'pending')==='pending'&&catOf(i)===flt.cat):[];
    const gUp=g=>{const v=g.offers.map(unitPrice).filter(Boolean).map(x=>x.v/x.per);return v.length?Math.min(...v):null;};
    const nUp=gs.filter(g=>gUp(g)!=null).length;
    if(upSort&&nUp)gs=gs.slice().sort((a,b)=>{const x=gUp(a),y=gUp(b);return x==null?1:y==null?-1:x-y;});
    const upBtn=nUp>=2?`<button type="button" class="upsort" data-upsort aria-pressed="${upSort}">${upSort?'✓ ':''}Más barato por unidad</button>`:'';
    return back+subChips(inCat)+(gs.length?`<div class="vrow">${viewSeg()}${upBtn}</div>`:'')+renderCompare0(gs);
  }
  function renderCompare0(gs){
    if(!gs.length)return (flt.q||flt.cat||flt.plat||flt.shop||flt.tag)?`<div class="empty">Nada coincide con la búsqueda o los filtros.</div>`:`<div class="empty">Nada guardado aún. Desde la tienda en Chrome: <b>Compartir → Comparador</b>. Se guardan fotos, descripción, referencias y precio.</div>`;
    let last=null;const counts={};gs.forEach(g=>counts[g.cat]=(counts[g.cat]||0)+1);
    return `<div class="list">${gs.map(g=>{const bt=calc(g.offers[0]).total;const names=new Set(g.offers.map(o=>key(o.product)));
      const head=g.cat!==last&&!flt.cat?`<div class="cathead">${esc(g.cat)}<span>${counts[g.cat]}</span></div>`:'';last=g.cat;
      const valid=g.offers.filter(canBuy);const single=valid.length<2;
      const lp=valid.length?valid.reduce((a,b)=>calc(b).after<calc(a).after?b:a):null,lt=valid.length?valid.reduce((a,b)=>calc(b).total<calc(a).total?b:a):null;
      const line=lp?`<div class="bestline"><span>Mejor precio: <b>${eur(calc(lp).after)}</b> en ${esc(shopOf(lp))}</span><span>Mejor total (portes e importación): <b>${eur(calc(lt).total)}</b> en ${esc(shopOf(lt))}</span>${(()=>{let b=null;g.offers.forEach(o=>{const m=minIn(histPts(o),365);if(m&&(!b||m.p<b.p))b={...m,o};});return b&&g.offers.some(o=>histPts(o).length>1)?`<span>Lo más barato del año: <b>${eur(b.p)}</b> el ${fd(b.t)} en ${esc(shopOf(b.o))}</span>`:'';})()}</div>`:'';
      if(pref('view')==='compact'&&!selMode&&!cmpOpen&&!openG.has(key(g.name)))return head+compactCard(g);
      return `${head}<article class="product" data-gk="${esc(key(g.name))}"><header><h3>${esc(g.name)}</h3><button type="button" class="openpf" data-open="${esc(key(g.name))}">Ficha</button><span class="hint">${g.offers.length} ${g.offers.length===1?'tienda':'tiendas'}</span></header>${line}${g.offers.map(o=>offerRow(o,false,calc(lt||o).total,names.size>1,{single,lowPrice:!single&&o===lp,lowTotal:!single&&o===lt})).join('')}</article>`;}).join('')}</div>`;
  }
  // Pendientes agrupados por tienda: lo que pedirías en cada web, con un solo envío por pedido.
  function renderShops(){
    const pend=items.filter(i=>(i.status||'pending')==='pending'&&matches(i));
    if(!pend.length)return `<div class="empty">${(flt.q||flt.cat||flt.plat||flt.shop||flt.tag)?'Nada coincide con la búsqueda o los filtros.':'No tienes nada pendiente.'}</div>`;
    // ¿Es esta la oferta más barata de su producto?
    const best=new Map(),cnt=new Map();items.filter(i=>(i.status||'pending')==='pending'&&canBuy(i)).forEach(i=>{const k=key(groupName(i)),t=calc(i).after;cnt.set(k,(cnt.get(k)||0)+1);if(!best.has(k)||t<best.get(k))best.set(k,t);});
    const map=new Map();pend.forEach(i=>{const k=shopKey(i);if(!map.has(k))map.set(k,{name:shopOf(i),list:[]});map.get(k).list.push(i);});
    const shops=[...map.values()].map(sh=>{
      const sub=sh.list.reduce((a,i)=>a+calc(i).after,0);
      const ship=Math.max(0,...sh.list.map(i=>num(i.shipping)));const free=Math.max(0,...sh.list.map(i=>num(i.freeFrom)));
      const shipNow=free>0&&sub>=free?0:ship;
      const out=sh.list.some(outsideEU);let imp=0,impTxt='';
      if(out){const c=impCfg();const base=sub+shipNow;const fx=sh.list.some(foreignCur);
        const v=base*c.vat/100,b=fx?base*c.bank/100:0;imp=v+c.fee+b;impTxt=`⚠ Fuera de la UE · importación estimada: ${eur(v)} IVA + ${eur(c.fee)} aduana${b?` + ${eur(b)} banco`:''} = ${eur(imp)}`;}
      return{...sh,sub,ship,free,shipNow,imp,impTxt,total:sub+shipNow+imp};
    }).sort((a,b)=>b.list.length-a.list.length||a.name.localeCompare(b.name,'es'));
    return `<div class="list">${shops.map(sh=>{
      const url=sh.list.map(i=>safeUrl(i.url)).find(Boolean);
      let shipTxt=sh.shipNow===0?(sh.ship>0||sh.free>0?'Envío gratis':'Envío: sin dato'):`Envío ${eur(sh.shipNow)}`;
      const left=sh.free>0&&sh.sub<sh.free?`<div class="notes">Te faltan <b>${eur(sh.free-sh.sub)}</b> para el envío gratis (desde ${eur(sh.free)}).</div>`:'';
      const srcS=shopSource(sh.list);const missN=srcS?sh.list.filter(i=>i!==srcS&&INH_KEYS.some(k=>lacks(i,k))).length:0;
      const fillBtn=missN?`<div class="notes" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${missN} sin portes o cupón.<button class="btn small" type="button" data-shopfill="${srcS.id}">Copiar de ${esc(fullName(srcS)).slice(0,30)}</button></div>`:'';
      return `<article class="product"><header><h3>${esc(sh.name)}</h3><span class="hint">${sh.list.length} ${sh.list.length===1?'producto':'productos'}</span></header>${fillBtn}
        ${sh.list.sort((a,b)=>catOf(a).localeCompare(catOf(b),'es')).map(i=>{const isBest=calc(i).after<=best.get(key(groupName(i)))+0.001;const u=safeUrl(i.url);
          return `<div class="buyrow" style="border:0;border-top:1px solid var(--line);border-radius:0"><div class="who">${thumb(i)}<div style="min-width:0"><div class="name">${u?`<a href="${esc(u)}" target="_blank" rel="noopener" style="color:inherit">${esc(fullName(i))}</a>`:esc(fullName(i))}</div>
            ${missingList(i).length?`<div class="meta" style="color:var(--danger);font-weight:700">Falta: ${missingList(i).map(x=>x[0]).join(', ')}</div>`:''}
            <div class="meta">${isUnread(i)?'<b style="color:var(--danger)">Sin datos</b>':`${esc(catOf(i))}${(cnt.get(key(groupName(i)))||0)<2?' · solo guardado en esta tienda':isBest?' · <b style="color:var(--accent)">aquí es lo más barato</b>':' · más barato en otra tienda ('+eur(best.get(key(groupName(i))))+')'}${/agotad/.test(norm(i.availability))?' · <b style="color:var(--danger)">agotado</b>':''}`}</div></div></div><div class="total">${eur(calc(i).after)}</div>
            <div class="row-actions"><button class="btn small" data-act="edit" data-id="${i.id}">Editar</button><button class="btn small" data-act="bought" data-id="${i.id}">Comprado</button><button class="btn small" data-act="discard" data-id="${i.id}">Descartar</button><button class="btn small danger" data-act="del" data-id="${i.id}">Borrar</button></div></div>`;}).join('')}
        <div class="grand" style="border-width:0;border-top:2px solid var(--accent);border-radius:0"><span>Subtotal ${eur(sh.sub)} · ${shipTxt}${sh.imp?` · importación ${eur(sh.imp)}`:''}${url?`<br><a class="btn small primary" style="margin-top:6px" href="${esc(url)}" target="_blank" rel="noopener">Abrir tienda</a>`:''}</span><b>${eur(sh.total)}</b></div>
        ${sh.impTxt?`<div style="padding:0 14px 12px"><div class="notes" style="color:var(--fg)"><b>${esc(sh.impTxt)}</b> · incluido en el total.</div></div>`:''}
        ${left?`<div style="padding:0 14px 12px">${left}</div>`:''}</article>`;}).join('')}</div>`;
  }
  function renderBuy(gs){
    if(!gs.length)return (flt.q||flt.cat||flt.plat||flt.shop||flt.tag)?`<div class="empty">Nada coincide con la búsqueda o los filtros.</div>`:`<div class="empty">Aquí verás la opción más barata de cada producto, lista para pagar.</div>`;
    let total=0,worst=0;
    const rows=gs.map(g=>{const o=g.offers[0],c=calc(o);total+=c.total;worst+=calc(g.offers[g.offers.length-1]).total;const url=safeUrl(o.url);
      return `<div class="buyrow"><div class="who">${thumb(o)}<div style="min-width:0"><div class="name">${esc(g.name)}</div><div class="meta">${esc(o.store||hostOf(o.url)||'Tienda')}${o.code?` · cupón <span class="num">${esc(o.code)}</span>`:''}${g.offers.length>1?` · mejor de ${g.offers.length}`:''}</div></div></div><div class="total">${eur(c.total)}</div>
        <div class="row-actions">${url?`<a class="btn small primary" href="${esc(url)}" target="_blank" rel="noopener">Abrir tienda</a>`:''}<button class="btn small" data-act="bought" data-id="${o.id}">Marcar comprado</button></div></div>`;}).join('');
    const save=worst-total;
    return `<div class="list">${rows}<div class="grand"><span>Total con envíos${save>0.005?`<br><span class="hint">Ahorras ${eur(save)} frente a lo más caro</span>`:''}</span><b>${eur(total)}</b></div></div>`;
  }
  // ---------- regalos por persona ----------
  const budgets=()=>{try{return JSON.parse(localStorage.getItem('budgets')||'{}');}catch(e){return {};}};
  function renderGifts(){
    const pp=allPeople().filter(p=>!flt.person||flt.person===ME||norm(p)===norm(flt.person));
    if(!pp.length)return `<div class="empty">Aún no hay regalos. En <b>Editar</b> de un producto, en «Para quién», añade a la persona (por ejemplo Davinia o Younes) y aparecerá aquí.</div>`;
    const bud=budgets();
    return `<div class="list">${pp.map(p=>{
      const mine=items.filter(i=>i.status!=='discarded'&&i.status!=='alt'&&peopleList(i).some(x=>norm(x)===norm(p)));
      const pend=mine.filter(i=>(i.status||'pending')==='pending'),bought=mine.filter(i=>i.status==='bought');
      // de lo pendiente, cuenta una vez cada producto (la oferta más barata del grupo)
      const g=new Map();pend.forEach(i=>{if(isUnread(i))return;const k=key(groupName(i));const t=calc(i).total;if(!g.has(k)||t<g.get(k).t)g.set(k,{i,t});});
      const pendTot=[...g.values()].reduce((a,b)=>a+b.t,0),spent=bought.reduce((a,i)=>a+(num(i.paid)||calc(i).total),0);
      const b=num(bud[norm(p)]);const over=b>0&&spent+pendTot>b;
      const row=(i,st)=>`<div class="buyrow" style="border:0;border-top:1px solid var(--line);border-radius:0"><div class="who">${thumb(i)}<div style="min-width:0"><div class="name">${esc(fullName(i))}</div>
        <div class="meta">${st==='bought'?'<b style="color:var(--accent)">✓ Comprado</b>':'Pendiente '+prioChip(i)+myResvChip(i)} · ${esc(shopOf(i))}${st!=='bought'&&trendInfo(i).rising?' · <b style="color:var(--danger)">precio subiendo</b>':''}</div></div></div>
        <div class="total">${eur(st==='bought'?(num(i.paid)||calc(i).total):calc(i).total)}</div>
        <div class="row-actions">${st==='bought'?'':`<button class="btn small" data-act="bought" data-id="${i.id}">Comprado</button>`}<button class="btn small" data-act="edit" data-id="${i.id}">Editar</button></div></div>`;
      return `<article class="person"><header><h3>🎁 ${esc(p)}</h3><label class="bud">Presupuesto <input data-bud="${esc(norm(p))}" inputmode="decimal" value="${esc(numIn(b))}" placeholder="€"></label></header>
        <div class="sum"><span>Comprado: <b>${eur(spent)}</b> (${bought.length})</span><span>Pendiente: <b>${eur(pendTot)}</b> (${g.size})</span><span class="${over?'over':''}">Total: <b>${eur(spent+pendTot)}</b>${b>0?` de ${eur(b)}${over?' · te pasas '+eur(spent+pendTot-b):' · quedan '+eur(b-spent-pendTot)}`:''}</span></div>
        ${(()=>{const T=g.size+bought.length;return T?`<div class="prog"><span style="width:${Math.round(bought.length*100/T)}%"></span></div><span class="progtx">${bought.length} de ${T} comprados (${Math.round(bought.length*100/T)} %)</span>`:'';})()}
        ${[...g.values()].sort((a,b)=>prioN(b.i)-prioN(a.i)).map(x=>row(x.i,'pending')).join('')}${bought.map(i=>row(i,'bought')).join('')}
        <div style="padding:10px 14px"><button class="btn small primary" type="button" data-addfor="${esc(p)}">+ Añadir regalo para ${esc(p)}</button></div></article>`;}).join('')}</div>`;
  }
  $('#view').addEventListener('change',e=>{const t=e.target.closest('[data-bud]');if(!t)return;const b=budgets();b[t.dataset.bud]=parseIn(t.value);try{localStorage.setItem('budgets',JSON.stringify(b));}catch(err){}setTimeout(render,0);});
  $('#view').addEventListener('click',e=>{const t=e.target.closest('[data-addfor]');if(!t)return;openForm(null);F('fPeople').value=t.dataset.addfor;drawAllChips();});

  function renderDiscarded(){
    const list=items.filter(i=>i.status==='discarded'&&matches(i)).sort((a,b)=>(b.discardedAt||'').localeCompare(a.discardedAt||''));
    if(!list.length)return `<div class="empty">Lo que descartes aparecerá aquí. Puedes recuperarlo cuando quieras.</div>`;
    return `<div class="list">${list.map(i=>`<div class="buyrow"><div class="who">${thumb(i)}<div style="min-width:0"><div class="name">${esc(fullName(i))}</div><div class="meta">${esc(shopOf(i))} · ${esc(catOf(i))}${i.discardedAt?' · '+new Date(i.discardedAt).toLocaleDateString('es-ES'):''}${i.discardReason?' · '+esc(i.discardReason):''}</div></div></div><div class="total">${eur(calc(i).total)}</div>
      <div class="row-actions"><button class="btn small primary" data-act="unbuy" data-id="${i.id}">Recuperar</button><button class="btn small" data-act="edit" data-id="${i.id}">Editar</button><button class="btn small danger" data-act="del" data-id="${i.id}">Borrar</button></div></div>`).join('')}</div>`;
  }
  function renderDone(){
    const done=items.filter(i=>i.status==='bought'&&matches(i)).sort((a,b)=>(b.boughtAt||'').localeCompare(a.boughtAt||''));
    if(!done.length)return `<div class="empty">Lo que marques como comprado aparecerá aquí.</div>`;
    const sum=done.reduce((s,i)=>s+(num(i.paid)||calc(i).total),0);
    return renderRebuy()+`<div class="list">${done.map(i=>{const paid=num(i.paid)||calc(i).total;const now=calc(i).total;const ch=i.checkedAt&&i.checkedAt>(i.boughtAt||'')&&Math.abs(now-paid)>0.005;
      return `<div class="buyrow"><div class="who">${thumb(i)}<div style="min-width:0"><div class="name">${esc(fullName(i))}</div><div class="meta">${esc(shopOf(i))} · ${esc(catOf(i))}${i.boughtAt?' · '+new Date(i.boughtAt).toLocaleDateString('es-ES'):''}${ch?` · <b style="color:${now<paid?'var(--accent)':'var(--danger)'}">ahora ${eur(now)}</b>`:''} ${availChip(i)}</div></div></div><div class="total">${eur(paid)}</div>
      ${boughtEdit(i)}
      ${histHtml(i)}
      ${(()=>{const alts=items.filter(a=>a.status==='alt'&&a.altOf===i.id);if(!alts.length)return '';
        return `<details class="hist"><summary>Alternativas que miraste (${alts.length})</summary><div class="list" style="margin-top:6px">${alts.map(a=>{const d=calc(a).total-paid;
          return `<div class="who" style="justify-content:space-between;gap:8px"><div class="who">${thumb(a)}<div style="min-width:0"><div class="name" style="font-size:.86rem">${safeUrl(a.url)?`<a href="${esc(a.url)}" target="_blank" rel="noopener" style="color:inherit">${esc(fullName(a))}</a>`:esc(fullName(a))}</div><div class="meta">${esc(shopOf(a))} · ${eur(calc(a).total)}${isUnread(a)?'':` (${d>=0?'+':'−'}${eur(Math.abs(d))})`}</div></div></div><button class="btn small" data-act="unbuy" data-id="${a.id}">A pendientes</button></div>`;}).join('')}</div></details>`;})()}
      <div class="row-actions"><button class="btn small primary" data-act="rebuy" data-id="${i.id}">Volver a comprar</button>${safeUrl(i.url)||(i.images||[]).some(v=>isBlob(v))?`<button class="btn small" data-act="reread" data-id="${i.id}">Volver a leer</button>`:''}${safeUrl(i.url)?`<button class="btn small" data-act="check" data-id="${i.id}">Comprobar precio</button>`:''}<button class="btn small" data-act="unbuy" data-id="${i.id}">Volver a pendiente</button><button class="btn small" data-act="edit" data-id="${i.id}">Editar</button><button class="btn small danger" data-act="del" data-id="${i.id}">Borrar</button></div></div>`;}).join('')}<div class="grand"><span>Gastado</span><b>${eur(sum)}</b></div></div>`;
  }

