// Comparador · 02-datos.js
// Parte del código de la app, que se carga en orden desde index.html (ver js/LEEME.md).
  // ---------- cálculo y agrupación ----------
  // ---------- importación desde fuera de la UE ----------
  const EU=new Set(['ES','PT','FR','DE','IT','NL','BE','LU','IE','AT','PL','CZ','SK','HU','SI','HR','RO','BG','GR','CY','MT','DK','SE','FI','EE','LV','LT']);
  const EU_CUR=new Set(['EUR','SEK','DKK','PLN','CZK','HUF','RON','BGN']);
  function impCfg(){const g=(k,d)=>{try{const v=localStorage.getItem(k);return v===null||v===''?d:num(v);}catch(e){return d;}};
    return{vat:g('impVat',21),fee:g('impFee',10),bank:g('impBank',2)};}
  // ¿Se envía desde fuera de la UE? Lo marcado a mano manda; si no, se deduce de país, moneda o dominio.
  function outsideEU(it){
    // Regla: si el precio o el envío están en una moneda que no es el euro, se considera fuera de la UE.
    if(it.orig&&((it.orig.currency&&it.orig.currency!=='EUR')||(it.orig.shipCurrency&&it.orig.shipCurrency!=='EUR')))return true;
    if(typeof it.outsideEU==='boolean')return it.outsideEU;
    const c=clean(it.country).toUpperCase();if(c)return !EU.has(c);
    let h='';try{h=new URL(it.url).hostname;}catch(e){}
    return /\.(tw|jp|hk|cn|us|uk|ch|no|au|ca|kr|sg|com\.tw|co\.jp|co\.uk|com\.hk|com\.cn|com\.au)$/.test(h);
  }
  function calc(it){const price=num(it.price),d=num(it.discount);const disc=it.discountType==='pct'?price*Math.min(d,100)/100:Math.min(d,price);const after=price-disc;const free=num(it.freeFrom);const ship=(free>0&&after>=free)?0:num(it.shipping);
    const base=after+ship;let imp=0,impVat=0,impFee=0,impBank=0;const out=outsideEU(it);
    if(out&&after>0){const c=impCfg();impVat=base*c.vat/100;impFee=c.fee;impBank=foreignCur(it)?base*c.bank/100:0;imp=impVat+impFee+impBank;}
    // Precio sin IVA en tienda de la UE: se paga el IVA de destino (España, el de Ajustes). Fuera de la UE ya lo suma la importación.
    const vatAdd=it.vatExcl&&!out&&after>0?base*impCfg().vat/100:0;
    return{price,disc,after,ship,shipWaived:free>0&&after>=free&&num(it.shipping)>0,base,imp,impVat,impFee,impBank,out,vatAdd,total:base+imp+vatAdd};}
  const impLine=(c)=>(c.vatAdd?`<div class="miss" style="border-color:var(--tag);color:var(--fg)">Precio sin IVA · se suma el IVA (${fmtNum(impCfg().vat,0)} %): +${eur(c.vatAdd)} · ya incluido en el total</div>`:'')+(c.out&&c.imp?`<div class="miss" style="border-color:var(--tag);color:var(--fg)">⚠ Fuera de la UE · posible importación (estimado): +${eur(c.impVat)} IVA${c.impFee?` + ${eur(c.impFee)} aduana`:''}${c.impBank?` + ${eur(c.impBank)} banco`:''} = <b>${eur(c.imp)}</b> · ya incluido en el total</div>`:'');
  const fullName=it=>[clean(it.product),clean(it.variant)].filter(Boolean).join(' · ');
  const groupName=it=>clean(it.group)||fullName(it)||'Sin nombre';
  const key=s=>clean(s).toLowerCase().replace(/\s+/g,' ');
  // ---------- búsqueda y clasificación ----------
  const NOCAT='Sin categoría';
  const norm=s=>clean(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
  const catOf=it=>clean(it.category)||NOCAT;
  // Unidades por pack: dato del artículo, o deducido del nombre («5000 BBs», «pack de 12», «x24»)
  function unitsOf(it){const u=num(it.units)||num((it.specs||{}).bbCount);if(u>1)return Math.round(u);
    const t=' '+[it.product,it.variant].map(clean).join(' ')+' ';const N=x=>num(String(x).replace(/[.\s](?=\d{3}\b)/g,''));
    let m=t.match(/(\d{1,3}(?:[.\s]\d{3})+|\d+)\s*(?:bbs?|bolas?|balls?|tees?|uds?\.?|unidades|unid\.?|pcs|piezas|sobres|semillas|cartuchos|balines|pellets|cápsulas|capsulas)\b/i);if(m&&N(m[1])>1)return N(m[1]);
    m=t.match(/\b(?:pack|caja|bolsa|lote|set)\s*(?:de\s*)?(\d{1,5})\b/i);if(m&&N(m[1])>1)return N(m[1]);
    m=t.match(/\s[x×]\s?(\d{1,4})\s/i)||t.match(/\s(\d{1,4})\s?[x×]\s/i);if(m&&N(m[1])>1)return N(m[1]);return 0;}
  function unitPrice(it){const u=unitsOf(it);if(!u||isUnread(it))return null;const t=calc(it).total;if(!(t>0))return null;const per=u>=500?1000:1;return {v:t/u*per,per,u,lbl:per===1000?'€/1000':'€/ud'};}
  const upTxt=x=>x?`${fmtNum(x.v,x.v<1?3:2).replace(/(,\d\d\d*?)0+$/,"$1")} ${x.lbl}`:'';
  // Un artículo vinculado en varias tiendas va en una sola categoría: gana la concreta frente a «Otros»/vacía
  const GENERIC=/^(otros?|otras?|varios|varias|miscel[aá]nea|general|sin clasificar|sin categor[ií]a)$/i;
  let harmT=null;
  function harmonizeCats(){clearTimeout(harmT);harmT=setTimeout(async()=>{const G=new Map();items.filter(i=>i.status!=='discarded').forEach(i=>{const k=key(groupName(i));if(!G.has(k))G.set(k,[]);G.get(k).push(i);});
    let n=0;for(const v of G.values()){if(v.length<2)continue;const good=v.filter(i=>clean(i.category)&&!GENERIC.test(clean(i.category)));if(!good.length)continue;
      const cnt=new Map();good.forEach(i=>cnt.set(i.category,(cnt.get(i.category)||0)+1));const best=[...cnt.entries()].sort((a,b)=>b[1]-a[1])[0][0];const ref=good.find(i=>i.category===best);
      for(const i of v){if(!clean(i.category)||GENERIC.test(clean(i.category))){i.category=best;if(!clean(i.sub)&&clean(ref.sub))i.sub=ref.sub;await put('items',i);n++;}}}
    if(n)render();},800);}
  const AUTOHARM=false;
  const splitList=v=>(Array.isArray(v)?v:String(v||'').split(/[,;]/)).map(clean).filter(Boolean);
  const compatList=it=>splitList(it.compat);
  const tagList=it=>splitList(it.tags);
  const ME='Yo';
  const peopleList=it=>splitList(it.people).filter(p=>norm(p)!==norm(ME));
  const allPeople=()=>{const m=new Map();items.forEach(i=>peopleList(i).forEach(p=>{const k=norm(p);if(!m.has(k))m.set(k,p);}));return [...m.values()].sort((a,b)=>a.localeCompare(b,'es'));};
  const isUnread=it=>/^Sin leer/.test(it.product||'')||!(num(it.price)>0);
  const APPLY_DEF=['Todos','Pistola','Revólver','Escopeta','Rifle','Sniper','Subfusil','M4','AK','M870','Glock','USP','Hi-Capa','1911','Striker'];
  const TAG_DEF=['Cañón','Hop-up','Goma hop-up','Muelle','Pistón','Gatillo','Válvula','Juntas','Cargador','Óptica','Silenciador','Empuñadura','Funda','Correa','Batería','Gas'];
  const flt={q:'',cat:'',sub:'',plat:'',shop:'',tag:'',state:'',person:''}; // cada vez que abres la app empieza sin filtros
  const shopOf=it=>clean(it.store)||hostOf(it.url)||'Sin tienda';
  function ls0(k,d){try{return localStorage.getItem(k)||d}catch(e){return d}}
  function saveFlt(){try{localStorage.setItem('fq',flt.q);localStorage.setItem('fcat',flt.cat);localStorage.setItem('fplat',flt.plat);localStorage.setItem('fshop',flt.shop);localStorage.setItem('ftag',flt.tag);}catch(e){}}
  function stateOk(it){
    if(!flt.state)return true;
    if(flt.state==='nophoto')return !(it.images||[]).length||noPhoto.has(it.id);
    if(flt.state==='missing')return isUnread(it)||!!it.incomplete||!(num(it.shipping)>0||num(it.freeFrom)>0);
    if(flt.state==='nocat')return !clean(it.category)||/^otros$/i.test(clean(it.category));
    if(flt.state==='out')return /agotad|sin stock|no disponible/.test(norm(it.availability));
    if(flt.state==='rising')return trendInfo(it).rising;
    if(flt.state==='lowest')return trendInfo(it).lowest;
    if(flt.state==='single'){const k=key(groupName(it));return items.filter(o=>(o.status||'pending')==='pending'&&key(groupName(o))===k).length<2;}
    return true;
  }
  function personOk(it){if(!flt.person)return true;const ps=peopleList(it);
    if(flt.person===ME)return !ps.length;return ps.some(p=>norm(p)===norm(flt.person));}
  function matches(it){
    if(!personOk(it))return false;
    if(!stateOk(it))return false;
    if(flt.cat&&catOf(it)!==flt.cat)return false;
    if(flt.sub&&norm(it.sub)!==norm(flt.sub))return false;
    if(flt.fac){const a=new Set(attrsOf(it));if(!splitList(flt.fac).every(x=>a.has(x)))return false;}
    if(flt.shop&&norm(shopOf(it))!==norm(flt.shop))return false;
    if(flt.plat){const p=norm(flt.plat);if(norm(it.platform)!==p&&!compatList(it).some(c=>norm(c)===p||norm(c)==='todos'))return false;}
    if(flt.tag&&!tagList(it).some(t=>norm(t)===norm(flt.tag)))return false;
    if(flt.q){const hay=norm([it.product,it.variant,it.brand,it.sku,it.mpn,it.ean,it.store,it.category,it.sub,it.size,it.color,it.platform,it.compat,tagList(it).join(' '),it.description,it.notes,it.group].join(' '));
      if(!norm(flt.q).split(' ').every(t=>hay.includes(t)))return false;}
    return true;
  }
  function allCats(){const m=new Map();items.forEach(i=>{const c=catOf(i);m.set(c,(m.get(c)||0)+1);});return [...m.entries()].sort((a,b)=>a[0]===NOCAT?1:b[0]===NOCAT?-1:a[0].localeCompare(b[0],'es'));}
  function allPlats(){const m=new Map();items.forEach(i=>{[clean(i.platform),...compatList(i)].filter(p=>p&&norm(p)!=='todos').forEach(p=>{const k=norm(p);if(!m.has(k))m.set(k,{name:p,n:0});m.get(k).n++;});});return [...m.values()].sort((a,b)=>a.name.localeCompare(b.name,'es'));}
  function renderFilters(){
    const cats=allCats(),plats=allPlats();
    $('#fCat').innerHTML=`<option value="">Todas las categorías</option>`+cats.map(([c,n])=>`<option value="${esc(c)}" ${c===flt.cat?'selected':''}>${esc(c)} (${n})</option>`).join('');
    $('#fPlat').innerHTML=`<option value="">Todos los modelos</option>`+plats.map(p=>`<option value="${esc(p.name)}" ${norm(p.name)===norm(flt.plat)?'selected':''}>${esc(p.name)} (${p.n})</option>`).join('');
    if(document.activeElement!==$('#q'))$('#q').value=flt.q;
    const shops=new Map();items.filter(i=>(i.status||'pending')==='pending').forEach(i=>{const k=norm(shopOf(i));if(!shops.has(k))shops.set(k,{name:shopOf(i),n:0});shops.get(k).n++;});
    $('#fShop').innerHTML=`<option value="">Todas las tiendas</option>`+[...shops.values()].sort((a,b)=>a.name.localeCompare(b.name,'es')).map(x=>`<option value="${esc(x.name)}" ${norm(x.name)===norm(flt.shop)?'selected':''}>${esc(x.name)} (${x.n} pendientes)</option>`).join('');
    const tags=new Map();items.forEach(i=>tagList(i).forEach(t=>{const k=norm(t);if(!tags.has(k))tags.set(k,{name:t,n:0});tags.get(k).n++;}));
    $('#fTag').innerHTML=`<option value="">Todas las etiquetas</option>`+[...tags.values()].sort((a,b)=>a.name.localeCompare(b.name,'es')).map(x=>`<option value="${esc(x.name)}" ${norm(x.name)===norm(flt.tag)?'selected':''}>${esc(x.name)} (${x.n})</option>`).join('');
    const crs=curSuspects();$('#curRevBtn').hidden=!crs.length;$('#curRevBtn').textContent=`Revisar monedas (${crs.length})`;
    const fxs=items.filter(i=>guessCur(i));$('#fxFixBtn').hidden=!fxs.length;
    $('#fxFixBtn').textContent=`Corregir moneda en ${fxs.length} ${fxs.length===1?'producto':'productos'} (${[...new Set(fxs.map(guessCur))].join(', ')} guardado como €)`;
    const nu=items.filter(i=>(i.status||'pending')==='pending'&&isUnread(i)).length;
    $('#retryBtn').hidden=!nu||!cfg.key;$('#retryBtn').textContent=`Volver a leer ${nu} sin datos`;
    $('#fState').value=flt.state;
    {const pp=allPeople();const cnt=p=>items.filter(i=>(i.status||'pending')!=='discarded'&&peopleList(i).some(x=>norm(x)===norm(p))).length;
      $('#fPerson').innerHTML=`<option value="">🎁 Para todos</option><option value="${ME}" ${flt.person===ME?'selected':''}>Para mí</option>`+pp.map(p=>`<option value="${esc(p)}" ${norm(p)===norm(flt.person)?'selected':''}>Para ${esc(p)} (${cnt(p)})</option>`).join('');}
    {const pend=items.filter(i=>(i.status||'pending')==='pending');const keep=flt.state;
      for(const k of ['missing','nocat','nophoto']){flt.state=k;const n=pend.filter(stateOk).length;$('#qn-'+k).textContent=n;}
      flt.state=keep;document.querySelectorAll('#quick [data-qs]').forEach(b=>b.classList.toggle('on',b.dataset.qs===flt.state));}
    const on=[flt.q&&`«${flt.q}»`,(tab==='compare'||tab==='shared')?'':flt.cat,flt.plat,flt.tag&&('#'+flt.tag),flt.shop,flt.state&&$('#fState').selectedOptions[0].textContent,flt.person&&(flt.person===ME?'Para mí':'Para '+flt.person)].filter(Boolean);
    $('#activeFlt').hidden=!on.length;
    $('#activeFltTxt').textContent=on.length?'Filtrando: '+on.join(' · '):'';
    $('#catList').innerHTML=[...new Set([...cats.filter(c=>c[0]!==NOCAT).map(c=>c[0]),...Object.keys(TAXONOMY)])].map(c=>`<option value="${esc(c)}">`).join('');
    $('#platList').innerHTML=plats.map(p=>`<option value="${esc(p.name)}">`).join('');
    const nc=items.filter(i=>!clean(i.category)).length;
    $('#classifyBtn').hidden=!nc||!cfg.key;$('#classifyBtn').textContent=`Clasificar ${nc} sin categoría`;
  }
  let qTimer=null;
  $('#q').addEventListener('input',e=>{clearTimeout(qTimer);qTimer=setTimeout(()=>{flt.q=e.target.value.trim();saveFlt();render();},200);});
  $('#fCat').addEventListener('change',e=>{flt.cat=e.target.value;saveFlt();render();});
  $('#fPlat').addEventListener('change',e=>{flt.plat=e.target.value;saveFlt();render();});
  $('#fShop').addEventListener('change',e=>{flt.shop=e.target.value;saveFlt();render();});
  $('#fTag').addEventListener('change',e=>{flt.tag=e.target.value;saveFlt();render();});
  $('#fState').addEventListener('change',e=>{flt.state=e.target.value;render();});
  $('#fPerson').addEventListener('change',e=>{flt.person=e.target.value;render();});
  $('#quick').addEventListener('click',e=>{const b=e.target.closest('[data-qs]');if(!b)return;flt.state=flt.state===b.dataset.qs?'':b.dataset.qs;tab='compare';render();$('#view').scrollIntoView({behavior:'smooth',block:'start'});});
  function goHome(){prodKey=null;navTab='home';allMode=false;space='mine';flt.sub='';flt.q=flt.cat=flt.plat=flt.shop=flt.tag=flt.state=flt.person='';selMode=false;sel.clear();cmpOpen=false;$('#q').value='';tab='compare';saveFlt();render();window.scrollTo({top:0,behavior:'smooth'});}
  $('#showAll').addEventListener('click',goHome);
  $('#homeBtn').addEventListener('click',goHome);
  document.querySelector('h1').addEventListener('click',goHome);document.querySelector('h1').style.cursor='pointer';
  $('#q').addEventListener('search',e=>{flt.q=e.target.value.trim();saveFlt();render();});

  function groups(status){const map=new Map();items.filter(i=>(i.status||'pending')===status&&matches(i)).forEach(i=>{const k=key(groupName(i));if(!map.has(k))map.set(k,{name:groupName(i),offers:[]});map.get(k).offers.push(i);});const arr=[...map.values()];arr.forEach(g=>{g.offers.sort((a,b)=>calc(a).total-calc(b).total);g.cat=catOf(g.offers[0]);});arr.sort((a,b)=>(a.cat===NOCAT)-(b.cat===NOCAT)||a.cat.localeCompare(b.cat,'es')||a.name.localeCompare(b.name,'es'));return arr;}
  // Busca con qué producto ya guardado comparar: mismo EAN o ref. de fabricante, o nombre muy parecido (mismas palabras clave).
  const STOP=new Set(['de','del','la','el','los','las','para','con','y','en','a','the','for','with','and','of','airsoft','replica','réplica','version','versión','gbb','co2']);
  const toks=it=>new Set(norm([it.brand,it.product,it.variant].join(' ')).replace(/[^a-z0-9.\s-]/g,' ').split(/[\s-]+/).filter(t=>t&&!STOP.has(t)));
  function similar(a,b){
    if(clean(a.ean)&&clean(a.ean)===clean(b.ean))return true;
    if(clean(a.mpn)&&key(a.mpn)===key(b.mpn)&&key(a.variant)===key(b.variant))return true;
    if(norm(a.variant)!==norm(b.variant)&&a.variant&&b.variant)return false;
    const A=toks(a),B=toks(b);if(!A.size||!B.size)return false;
    let inter=0;A.forEach(t=>{if(B.has(t))inter++;});
    const jac=inter/(A.size+B.size-inter),cover=inter/Math.min(A.size,B.size);
    return jac>=0.6||(cover>=0.85&&inter>=3);
  }
  function likely(a,b){if(similar(a,b))return true;if(clean(a.brand)&&clean(b.brand)&&key(a.brand)!==key(b.brand))return false;
    const A=toks(a),B=toks(b);if(!A.size||!B.size)return false;
    const nA=[...A].filter(t=>/\d/.test(t)).sort().join(),nB=[...B].filter(t=>/\d/.test(t)).sort().join();if(nA&&nB&&nA!==nB)return false;
    const COL=/^(negro|negra|black|blanco|blanca|white|rojo|roja|red|azul|blue|verde|green|amarillo|yellow|rosa|pink|gris|grey|gray|marron|brown|tan|oliva|olive|od|naranja|orange|morado|purple|plata|silver|oro|gold|beige|coyote|multicam)$/;
    const cA=[...A].filter(t=>COL.test(t)).sort().join(),cB=[...B].filter(t=>COL.test(t)).sort().join();if(cA&&cB&&cA!==cB)return false;
    let inter=0;A.forEach(t=>{if(B.has(t))inter++;});return inter>=2&&inter/Math.min(A.size,B.size)>=0.6;}
  function autoGroup(doc){
    const m=items.find(i=>i!==doc&&i.status!=='discarded'&&!isUnread(i)&&similar(doc,i));
    return m?groupName(m):fullName(doc);
  }

  // ---------- seleccionar para comparar o vincular ----------
  let selMode=false,cmpOpen=false;const sel=new Set();
  function drawSelBar(){
    $('#selBar').hidden=!selMode;$('#homeBtn').hidden=selMode;
    $('#selCount').textContent=`${sel.size} ${sel.size===1?'seleccionado':'seleccionados'}`;
    $('#selCompare').disabled=sel.size<2;$('#selJoin').disabled=sel.size<2;$('#selCheck').disabled=!sel.size;$('#selCheck').textContent=sel.size?`Comprobar ${sel.size}`:'Comprobar precio';
    $('#selModeBtn').textContent=selMode?'Salir de seleccionar':'Seleccionar para comparar o vincular';
  }
  function compareTable(){
    const list=[...sel].map(id=>items.find(i=>i.id===id)).filter(Boolean);if(list.length<2)return '';
    const minP=Math.min(...list.map(i=>calc(i).after)),minT=Math.min(...list.map(i=>calc(i).total));
    const row=(h,f)=>`<tr><th>${h}</th>${list.map(i=>`<td>${f(i)}</td>`).join('')}</tr>`;
    return `<div class="cmpwrap"><table class="cmp">
      ${row('',i=>(i.images||[]).length?imgTag(i.images[0],`data-lb="${i.id}" data-i="0"`):'')}
      ${row('Producto',i=>`<b>${esc(i.product)}</b>${i.variant?`<br><span class="chip var">${esc(i.variant)}</span>`:''}`)}
      ${row('Tienda',i=>safeUrl(i.url)?`<a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(shopOf(i))}</a>`:esc(shopOf(i)))}
      ${row('Precio',i=>`<span class="${calc(i).after<=minP+0.001?'win':''}">${eur(calc(i).after)}</span>`)}
      ${row('Portes',i=>{const c=calc(i);return c.ship>0?eur(c.ship):(c.shipWaived||num(i.freeFrom)>0?'gratis':'sin dato');})}
      ${row('Total',i=>`<span class="${calc(i).total<=minT+0.001?'win':''}">${eur(calc(i).total)}</span>`)}
      ${row('Stock',i=>availChip(i)||'—')}
      ${row('Marca',i=>esc(i.brand||'—'))}
      ${row('Refs',i=>[i.sku&&'Ref. '+esc(i.sku),i.mpn&&'Fab. '+esc(i.mpn),i.ean&&'EAN '+esc(i.ean)].filter(Boolean).join('<br>')||'—')}
      ${row('Categoría',i=>esc(catOf(i))+(i.platform?'<br>'+esc(i.platform):''))}
      ${row('Comparado como',i=>esc(groupName(i)))}
      ${SPECS.filter(([k])=>list.some(i=>i.specs&&i.specs[k])).map(([k,l])=>row(esc(l),i=>esc((i.specs||{})[k]||'—'))).join('')}
      ${row('Descripción',i=>`<div style="max-height:160px;overflow:auto;white-space:pre-line">${esc(i.description||'—')}</div>`)}
    </table></div>`;
  }
  $('#selModeBtn').addEventListener('click',()=>{selMode=!selMode;if(!selMode){sel.clear();cmpOpen=false;}render();});
  $('#selCancel').addEventListener('click',()=>{selMode=false;sel.clear();cmpOpen=false;render();});
  $('#selCompare').addEventListener('click',()=>{cmpOpen=true;render();window.scrollTo({top:$('#view').offsetTop-80,behavior:'smooth'});});

  $('#selCheck').addEventListener('click',async()=>{if(!cfg.key){setStatus('Falta la clave de API en Ajustes.','err');return;}
    const list=[...sel].map(id=>items.find(i=>i.id===id)).filter(i=>i&&safeUrl(i.url));if(!list.length){setStatus('Los seleccionados no tienen enlace.','err');return;}
    const b=$('#selCheck');b.disabled=true;let ok=0,dn=0,up=0;
    for(let i=0;i<list.length;i++){setStatus(`Comprobando ${i+1} de ${list.length}: ${fullName(list[i])}…`,'busy');const t0=calc(list[i]).total;const r=await checkItem(list[i]);if(r.ok){ok++;const d=calc(list[i]).total-t0;if(d<-0.005)dn++;if(d>0.005)up++;}}
    selMode=false;sel.clear();render();setStatus(`Comprobados ${ok} de ${list.length}: ${dn} bajan, ${up} suben.`);});
  $('#selJoin').addEventListener('click',async()=>{
    const list=[...sel].map(id=>items.find(i=>i.id===id)).filter(Boolean);if(list.length<2)return;
    // Nombre del grupo: el que ya tenga más ofertas, o el del primero.
    const counts=new Map();list.forEach(i=>{const g=groupName(i);counts.set(g,(counts.get(g)||0)+1);});
    const name=[...counts.entries()].sort((a,b)=>b[1]-a[1])[0][0];
    const olds=new Set(list.map(i=>key(groupName(i))));
    for(const it of items)if(olds.has(key(groupName(it)))&&(it.status||'pending')!=='discarded'){it.group=name;await put('items',it);}
    selMode=false;sel.clear();cmpOpen=false;render();setStatus(`Vinculados como «${name}». Puedes cambiar el nombre en Editar → «Comparar junto con».`);
  });
  document.addEventListener('change',e=>{const c=e.target.closest('input[data-sel]');if(!c)return;if(c.checked)sel.add(c.dataset.sel);else sel.delete(c.dataset.sel);
    c.closest('.offer')&&c.closest('.offer').classList.toggle('sel',c.checked);drawSelBar();if(cmpOpen)render();});

