// Comparador · 09-editor.js
// Parte del código de la app, que se carga en orden desde index.html (ver js/LEEME.md).
  // ---------- formulario (crear y editar) ----------
  const F=id=>$('#'+id);
  const FORM=[['fUrl','url'],['fProduct','product'],['fVariant','variant'],['fBrand','brand'],['fGroup','group'],['fPrio','prio'],['fCons','consumable'],['fTarget','target'],['fStockAl','alertStock'],['fCategory','category'],['fSub','sub'],['fSize','size'],['fColor','color'],['fPlatform','platform'],['fCompat','compat'],['fTags','tags'],['fPeople','people'],['fSku','sku'],['fMpn','mpn'],['fEan','ean'],['fStore','store'],['fPrice','price'],['fDisc','discount'],['fDiscType','discountType'],['fCode','code'],['fShip','shipping'],['fFree','freeFrom'],['fUnits','units'],['fDesc','description'],['fNotes','notes']];
  let formImgs=[];
  function renderImgEdit(){
    const box=$('#imgEdit');box.querySelectorAll('.th').forEach(n=>n.remove());const add=box.querySelector('.addimg');
    formImgs.forEach((v,i)=>{const d=document.createElement('div');d.className='th';
      d.innerHTML=`${imgTag(v)}${i===0?'<span class="first">Principal</span>':`<button type="button" data-first="${i}" aria-label="Hacer principal" title="Hacer principal" style="right:auto;left:3px;bottom:3px;top:auto;font-size:11px;width:auto;padding:0 8px;border-radius:999px">★ Principal</button>`}<button type="button" data-rm="${i}" aria-label="Quitar">×</button>`;
      box.insertBefore(d,add);});
    if(typeof markMissing==='function'&&!$('#form').hidden)markMissing();
  }
  $('#imgEdit').addEventListener('click',e=>{
    const rm=e.target.closest('[data-rm]');if(rm){formImgs.splice(+rm.dataset.rm,1);renderImgEdit();return;}
    const fi=e.target.closest('[data-first]');if(fi){const [x]=formImgs.splice(+fi.dataset.first,1);formImgs.unshift(x);renderImgEdit();}
  });
  F('fImgs').addEventListener('change',async e=>{const fs=[...e.target.files];e.target.value='';for(const f of fs)formImgs.push(await shrink(f));renderImgEdit();});
  function fillForm(it){
    FORM.forEach(([id,k])=>{const v=it[k];F(id).value=(k==='discountType')?(v||'eur'):(v===0&&['discount','shipping','freeFrom'].includes(k)?'':(MONEY_IDS.includes(id)&&v!==''&&v!=null&&num(v)?fmtIn(num(v)):(v??'')));});
    // Si se leyó en otra moneda, el formulario muestra los importes originales.
    F('fOutEU').checked=it.product?outsideEU(it):false;F('fVatExcl').checked=!!it.vatExcl;F('fNoShip').checked=it.product?shipBlocked(it):false;
    const o=it.orig;F('fCur').innerHTML=curOpts(o?o.currency:'EUR');F('fShipCur').innerHTML=curOpts(o?(o.shipCurrency||o.currency):'EUR');
    const src=o||it;F('fPrice').value=numIn(src.price);F('fShip').value=numIn(src.shipping);F('fFree').value=numIn(src.freeFrom);
    F('fDisc').value=it.discountType==='eur'?numIn(o?o.discount:it.discount):numIn(it.discount);curPreview();
    if(!it.group)F('fGroup').value=it.product?groupName(it):'';
    F('fCompat').value=compatList(it).join(', ');F('fTags').value=tagList(it).join(', ');F('fPeople').value=peopleList(it).join(', ');drawShareBox(it);
    if(/^Sin leer/.test(F('fGroup').value))F('fGroup').value='';
    fillSpecs(it.specs);
  }
  // Campo libre, lista (una opción) o casillas (varias). Todos guardan texto, así filtros y comparativas siguen igual.
  const specOpt=k=>SPECS.find(s=>s[0]===k)||[];
  function drawSpecGrid(){$('#specGrid').innerHTML=SPECS.map(([k,l,ph,op,multi])=>!op?`<div class="f"><label for="sp_${k}">${esc(l)}</label><input id="sp_${k}" placeholder="${esc(ph)}"></div>`
    :multi?`<div class="f full spmulti"><span class="lbl">${esc(l)}</span><div class="spchips" id="sp_${k}">${op.map(o=>`<label class="spchip"><input type="checkbox" value="${esc(o)}"><span>${esc(o)}</span></label>`).join('')}</div></div>`
    :`<div class="f"><label for="sp_${k}">${esc(l)}</label><select id="sp_${k}"><option value="">—</option>${op.map(o=>`<option>${esc(o)}</option>`).join('')}</select></div>`).join('');}
  function setSpec(k,v){const [,,,op,multi]=specOpt(k);const el=F('sp_'+k);v=clean(v||'');
    if(!op){el.value=v;return;}
    if(multi){// primero las opciones conocidas (algunas llevan coma, «y» o «/»), luego lo que sobre separado por comas
      let rest=norm(v);const parts=[];[...op].sort((a,b)=>b.length-a.length).forEach(o=>{const n=norm(o);if(n&&rest.includes(n)){parts.push(o);rest=rest.split(n).join(' , ');}});
      if(v)rest.split(/\s*[,;]\s*/).map(x=>x.trim()).filter(x=>x.length>1).forEach(x=>{const orig=v.split(/\s*[,;]\s*/).find(y=>norm(y)===x);parts.push(orig||x);});const box=el;
      parts.forEach(p=>{if(![...box.querySelectorAll('input')].some(x=>norm(x.value)===norm(p)))box.insertAdjacentHTML('beforeend',`<label class="spchip"><input type="checkbox" value="${esc(p)}"><span>${esc(p)}</span></label>`);});
      box.querySelectorAll('input').forEach(x=>x.checked=parts.some(p=>norm(p)===norm(x.value)));return;}
    if(v&&![...el.options].some(o=>norm(o.value)===norm(v)))el.insertAdjacentHTML('beforeend',`<option>${esc(v)}</option>`);
    el.value=v?[...el.options].find(o=>norm(o.value)===norm(v)).value:'';}
  function getSpec(k){const [,,,op,multi]=specOpt(k);const el=F('sp_'+k);return op&&multi?[...el.querySelectorAll('input:checked')].map(x=>x.value).join(', '):el.value;}
  drawSpecGrid();
  function fillSpecs(sp){sp=sp||{};SPECS.forEach(([k])=>setSpec(k,sp[k]));specVis();}
  function readSpecs(){const o={};SPECS.forEach(([k])=>{o[k]=getSpec(k);});return cleanSpecs(o);}
  function specVis(){const filled=SPECS.some(([k])=>clean(getSpec(k)));const box=$('#specBox');box.hidden=!(filled||WEAPON_RE.test(F('fCategory').value+' '+F('fPlatform').value));if(filled)box.open=true;}
  function subList(){const c=F('fCategory').value;$('#subList').innerHTML=[...new Set([...subsFor(c),...subsUsed(c)])].map(x=>`<option value="${esc(x)}">`).join('');}
  F('fCategory').addEventListener('input',subList);F('fSub').addEventListener('focus',subList);
  F('fCategory').addEventListener('input',specVis);F('fPlatform').addEventListener('input',specVis);
  // ---------- copiar datos de otro producto ----------
  const COPY_KEYS=['product','variant','brand','mpn','ean','category','sub','platform','compat','tags','description'];
  const copyLabel=i=>`${fullName(i)} · ${shopOf(i)}`;
  function fillCopyList(){$('#copyList').innerHTML=items.filter(i=>i.id!==editingId&&!isUnread(i)).map(i=>`<option value="${esc(copyLabel(i))}">`).join('');}
  function copyFrom(src){
    COPY_KEYS.forEach(k=>{const id={product:'fProduct',variant:'fVariant',brand:'fBrand',mpn:'fMpn',ean:'fEan',category:'fCategory',sub:'fSub',platform:'fPlatform',compat:'fCompat',tags:'fTags',description:'fDesc'}[k];F(id).value=Array.isArray(src[k])?src[k].join(', '):(src[k]||'');});
    F('fGroup').value=groupName(src);
    if(hasSpecs(src))fillSpecs(mergeSpecs(readSpecs(),src.specs));
    const add=(src.images||[]).filter(v=>!formImgs.includes(v));formImgs=[...formImgs,...add];renderImgEdit();drawAllChips();
    $('#copyHint').textContent=`Copiado de ${copyLabel(src)}. Rellena tienda, enlace, precio, portes y código.`;
  }
  F('fCopyImg').addEventListener('change',e=>{const src=items.find(i=>copyLabel(i)===e.target.value);if(!src)return;e.target.value='';
    const add=(src.images||[]).filter(v=>!formImgs.includes(v));formImgs=[...formImgs,...add];renderImgEdit();
    setStatus(add.length?`${add.length} ${add.length===1?'foto copiada':'fotos copiadas'} de ${copyLabel(src)}. Pulsa Guardar.`:`${copyLabel(src)} no tiene fotos nuevas que copiar.`,add.length?'':'err');});
  F('fCopy').addEventListener('change',e=>{const v=e.target.value;const src=items.find(i=>copyLabel(i)===v);if(src){copyFrom(src);e.target.value='';}});


  // ---------- Editor: secciones / pasos / completo ----------
  PREF.editor='sections';
  const fsecs=()=>[...document.querySelectorAll('#form details.fsec')];let stepI=0;
  function applyEM(reset){const m=pref('editor');const fm=$('#form');fm.dataset.em=m;
    document.querySelectorAll('#form [data-em]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.em===m)));
    const ss=fsecs();
    if(m==='full')ss.forEach(d=>d.open=true);
    if(m==='sections'&&reset)ss.forEach(d=>d.open=['fs-basic','fs-price'].includes(d.id));
    if(m==='steps'){if(reset)stepI=0;stepI=Math.max(0,Math.min(stepI,ss.length-1));ss.forEach((d,i)=>{d.classList.toggle('cur',i===stepI);d.open=true;});
      $('#stepTxt').textContent=`Paso ${stepI+1} de ${ss.length}`;$('#stepPrev').disabled=stepI===0;$('#stepNext').hidden=stepI===ss.length-1;}
    else ss.forEach(d=>d.classList.remove('cur'));
    $('#stepNav').hidden=m!=='steps';}
  document.querySelectorAll('#form [data-em]').forEach(b=>b.addEventListener('click',()=>{setPref('editor',b.dataset.em);applyEM(true);}));
  $('#stepPrev').addEventListener('click',()=>{stepI--;applyEM();$('#form').scrollIntoView({block:'start'});});
  $('#stepNext').addEventListener('click',()=>{stepI++;applyEM();$('#form').scrollIntoView({block:'start'});});
  function revealField(el){const d=el&&el.closest('details.fsec');if(!d)return;d.open=true;if(pref('editor')==='steps'){stepI=fsecs().indexOf(d);applyEM();}}
  $('#form').addEventListener('invalid',e=>revealField(e.target),true);

  // ---------- Datos copiados de la tienda: se marcan como supuestos y lo leído de la web siempre prevalece ----------
  const INH_KEYS=['shipping','freeFrom','code'];
  const inh=(it,k)=>!!(it&&it.inherited&&it.inherited[k]);
  document.addEventListener('click',async e=>{const b=e.target.closest('[data-shopfill]');if(!b)return;const src=items.find(i=>i.id===b.dataset.shopfill);if(!src)return;b.disabled=true;
    const n=await storeFill(src,INH_KEYS);render();setStatus(n?`Portes${clean(src.code)?' y cupón':''} de ${shopOf(src)} copiados a ${n} ${n===1?'artículo':'artículos'}. Quedan como supuestos hasta que se lean de la web, que siempre manda.`:'No había nada que copiar.');});
  function webPrevails(it,d){it.inherited=it.inherited||{};
    if(num(d.shipping)>0||(d.shipping===0&&/gratis|free/i.test(d.notes||''))){it.shipping=num(d.shipping);delete it.inherited.shipping;}
    if(num(d.freeFrom)>0){it.freeFrom=d.freeFrom;delete it.inherited.freeFrom;}
    if(clean(d.code)){it.code=clean(d.code);delete it.inherited.code;}
    if(!Object.keys(it.inherited).length)delete it.inherited;}
  const lacks=(it,k)=>k==='shipping'?!(num(it.shipping)>0)&&!(num(it.freeFrom)>0)&&!/gratis|free/i.test(it.notes||''):k==='freeFrom'?!(num(it.freeFrom)>0):!clean(it.code);
  // Copia portes / mínimo de portes gratis / cupón a los artículos de la misma tienda a los que les falte. Nunca pisa datos leídos de la web.
  async function storeFill(src,keys,exceptId){const shop=norm(shopOf(src));let n=0;const vals={shipping:num(src.shipping),freeFrom:num(src.freeFrom),code:clean(src.code)};
    for(const it of items){if(it.id===src.id||it.id===exceptId||(it.status||'pending')!=='pending'||norm(shopOf(it))!==shop)continue;let ch=false;
      for(const k of keys){if(!INH_KEYS.includes(k))continue;if(k==='shipping'&&!(vals.shipping>0))continue;if(k==='freeFrom'&&!(vals.freeFrom>0))continue;if(k==='code'&&!vals.code)continue;
        if(lacks(it,k)||inh(it,k)){it[k]=vals[k];it.inherited={...(it.inherited||{}),[k]:src.id};ch=true;}}
      if(ch){await put('items',it);n++;}}
    return n;}
  // Fuente para una tienda: el artículo con portes leídos de la web (no supuestos) más reciente.
  function shopSource(list){return list.filter(i=>!inh(i,'shipping')&&(num(i.shipping)>0||num(i.freeFrom)>0)).sort((a,b)=>(b.checkedAt||b.updatedAt||'')>(a.checkedAt||a.updatedAt||'')?1:-1)[0];}
  // ---------- Rellenar con lo de esta tienda (un toque) ----------
  // Para cada dato toma el artículo más reciente de la misma tienda que lo tenga (mejor si se leyó de la web). Solo rellena lo vacío.
  function shopFillForm(){const shop=norm(fv('fStore'));if(!shop)return{msg:'Escribe primero la tienda.',err:1};
    const peers=items.filter(i=>i.id!==editingId&&norm(shopOf(i))===shop&&!isUnread(i))
      .sort((a,b)=>(b.checkedAt||b.updatedAt||b.createdAt||'')>(a.checkedAt||a.updatedAt||a.createdAt||'')?1:-1);
    if(!peers.length)return{msg:`No hay otros artículos de ${fv('fStore')}.`,err:1};
    const pick=(has,k)=>peers.find(i=>has(i)&&!inh(i,k))||peers.find(has);const done=[];
    if(!fv('fShip')){const s=pick(i=>num(i.shipping)>0,'shipping');if(s){const o=s.orig||s;F('fShip').value=numIn(o.shipping);F('fShipCur').value=(s.orig&&(s.orig.shipCurrency||s.orig.currency))||'EUR';cpInh.set('shipping',s.id);done.push('portes');}}
    if(!fv('fFree')){const s=pick(i=>num(i.freeFrom)>0,'freeFrom');if(s){F('fFree').value=numIn((s.orig||s).freeFrom);cpInh.set('freeFrom',s.id);done.push('envío gratis desde');}}
    if(!fv('fCode')){const s=pick(i=>clean(i.code),'code');if(s){F('fCode').value=clean(s.code);cpInh.set('code',s.id);done.push('cupón');}}
    if((F('fCur').value||'EUR')==='EUR'){const s=peers.find(i=>i.orig&&i.orig.currency&&i.orig.currency!=='EUR');if(s){F('fCur').value=s.orig.currency;F('fCur').dispatchEvent(new Event('change'));done.push('moneda '+s.orig.currency);}}
    if(!F('fOutEU').checked&&!F('fOutEU').disabled&&peers.some(outsideEU)){F('fOutEU').checked=true;done.push('fuera de la UE');}
    if(!F('fVatExcl').checked&&peers.some(i=>i.vatExcl)){F('fVatExcl').checked=true;done.push('IVA no incluido');}
    curPreview();
    return done.length?{msg:`Copiado de ${fv('fStore')}: ${done.join(', ')}. Quedan como supuestos; lo que se lea de la web manda.`}:{msg:`Nada que rellenar: ${fv('fStore')} no tiene más datos o ya están puestos.`};}
  F('shopCopy').addEventListener('click',()=>{const r=shopFillForm();F('shopCopyHint').textContent=r.msg;setStatus(r.msg,r.err?'err':'');});
  // ---------- Copiar datos de otro artículo (selectiva, con vista previa) ----------
  let cpSrc=null,cpMode='fill';const cpInh=new Map();
  [['fShip','shipping'],['fFree','freeFrom'],['fCode','code']].forEach(([id,k])=>F(id).addEventListener('input',()=>cpInh.delete(k)));
  const vOf=x=>x==null?'':String(x);
  const fv=id=>F(id).value.trim();
  const CF=[
    ['g','Tienda y costes'],
    ['store','Tienda',1,s=>clean(s.store),()=>fv('fStore'),v=>{F('fStore').value=v;}],
    ['cur','Moneda',1,s=>(s.orig&&s.orig.currency)||'EUR',()=>F('fCur').value,v=>{F('fCur').value=v;F('fCur').dispatchEvent(new Event('change'));}],
    ['ship','Gastos de envío',1,s=>{const o=s.orig||s;const n=numIn(o.shipping);return n&&n!=='0'?n+' '+((s.orig&&(s.orig.shipCurrency||s.orig.currency))||'EUR'):'';},()=>fv('fShip')?fv('fShip')+' '+F('fShipCur').value:'',(v,s)=>{const o=s.orig||s;F('fShip').value=numIn(o.shipping);F('fShipCur').value=(s.orig&&(s.orig.shipCurrency||s.orig.currency))||'EUR';}],
    ['free','Envío gratis desde',1,s=>{const n=numIn((s.orig||s).freeFrom);return n&&n!=='0'?n:'';},()=>fv('fFree'),v=>{F('fFree').value=v;}],
    ['eu','Fuera de la UE (IVA, aduana y banco)',1,s=>outsideEU(s)?'Sí':'',()=>F('fOutEU').checked?'Sí':'',v=>{if(!F('fOutEU').disabled)F('fOutEU').checked=v==='Sí';}],
    ['vat','IVA no incluido',1,s=>s.vatExcl?'Sí':'',()=>F('fVatExcl').checked?'Sí':'',v=>{F('fVatExcl').checked=v==='Sí';}],
    ['code','Cupón',1,s=>clean(s.code),()=>fv('fCode'),v=>{F('fCode').value=v;}],
    ['disc','Descuento',0,s=>num(s.discount)>0?numIn(s.discount)+(s.discountType==='pct'?' %':' €'):'',()=>fv('fDisc')?fv('fDisc')+(F('fDiscType').value==='pct'?' %':' €'):'',(v,s)=>{F('fDisc').value=numIn(s.discount);F('fDiscType').value=s.discountType||'eur';}],
    ['g','Datos del producto'],
    ['brand','Marca',0,s=>clean(s.brand),()=>fv('fBrand'),v=>{F('fBrand').value=v;}],
    ['variant','Variante',0,s=>clean(s.variant),()=>fv('fVariant'),v=>{F('fVariant').value=v;}],
    ['category','Categoría',0,s=>clean(s.category),()=>fv('fCategory'),v=>{F('fCategory').value=v;}],
    ['sub','Subcategoría',0,s=>clean(s.sub),()=>fv('fSub'),v=>{F('fSub').value=v;}],
    ['platform','Modelo / plataforma',0,s=>clean(s.platform),()=>fv('fPlatform'),v=>{F('fPlatform').value=v;}],
    ['compat','Compatibilidades',0,s=>compatList(s).join(', '),()=>fv('fCompat'),v=>{F('fCompat').value=v;}],
    ['tags','Etiquetas',0,s=>tagList(s).join(', '),()=>fv('fTags'),v=>{F('fTags').value=v;}],
    ['g','Referencias'],
    ['sku','Ref. tienda (SKU)',0,s=>clean(s.sku),()=>fv('fSku'),v=>{F('fSku').value=v;}],
    ['mpn','Ref. fabricante',0,s=>clean(s.mpn),()=>fv('fMpn'),v=>{F('fMpn').value=v;}],
    ['ean','EAN',0,s=>clean(s.ean),()=>fv('fEan'),v=>{F('fEan').value=v;}],
    ['g','Fotos y descripción'],
    ['imgs','Fotografías',0,s=>(s.images||[]).length?(s.images.length+' '+(s.images.length===1?'foto':'fotos')):'',()=>formImgs.length?formImgs.length+' fotos':'',(v,s)=>{const add=(s.images||[]).filter(x=>!formImgs.includes(x));formImgs=cpMode==='over'?(s.images||[]).slice():[...formImgs,...add];renderImgEdit();}],
    ['desc','Descripción',0,s=>clean(s.description),()=>fv('fDesc'),v=>{F('fDesc').value=v;}],
    ['specs','Ficha técnica',0,s=>hasSpecs(s)?Object.keys(s.specs).length+' datos':'',()=>{const n=Object.keys(readSpecs()).length;return n?n+' datos':'';},(v,s)=>{fillSpecs(cpMode==='over'?cleanSpecs(s.specs):mergeSpecs(readSpecs(),s.specs));}]];
  const short=t=>{t=vOf(t);return t.length>60?t.slice(0,58)+'…':t;};
  function cpListDraw(){const q=norm($('#cpQ').value).split(' ').filter(Boolean);const st=norm(fv('fStore'));
    const list=items.filter(i=>i.id!==editingId&&!isUnread(i)).filter(i=>!q.length||q.every(t=>norm([fullName(i),i.brand,shopOf(i),catOf(i),i.sku].join(' ')).includes(t)))
      .sort((a,b)=>((st&&norm(shopOf(b))===st)-(st&&norm(shopOf(a))===st))||(b.updatedAt||0)-(a.updatedAt||0)).slice(0,60);
    $('#cpList').innerHTML=list.map(i=>`<button type="button" data-cp="${i.id}" class="cpitem">${(i.images||[])[0]?imgTag(i.images[0],''):'<span class="ph"></span>'}<span class="t"><b>${esc(fullName(i))}</b><small>${esc(shopOf(i))} · ${eur(calc(i).total)}</small></span>${st&&norm(shopOf(i))===st?'<span class="sg">Misma tienda</span>':''}</button>`).join('')||'<span class="hint">Nada con esas palabras.</span>';}
  function cpRowsDraw(){const s=cpSrc;let html='';
    let gh='';for(const r of CF){if(r[0]==='g'){gh=`<div class="cpg">${r[1]}</div>`;continue;}
      const [k,l,def,get,cur]=r;const nv=vOf(get(s)),cv=vOf(cur());if(!nv)continue;
      const same=norm(nv)===norm(cv);const blocked=cpMode==='fill'&&cv&&!same;
      html+=gh;gh='';html+=`<label class="cpr ${same||blocked?'dis':''}"><input type="checkbox" data-cf="${k}" ${def&&!same&&!blocked?'checked':''} ${same||blocked?'disabled':''}><b>${esc(l)}</b><small>${same?'<span class="same">Igual que ahora</span>':`${cv?esc(short(cv)):'<i>vacío</i>'} → <span class="nv">${esc(short(nv))}</span>${blocked?' · ya tiene valor (elige «Sobrescribir»)':''}`}</small></label>`;}
    $('#cpRows').innerHTML=html||'<p class="hint">Este artículo no tiene datos que copiar.</p>';
    document.querySelectorAll('#cpMode [data-cm]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cm===cpMode)));}
  function openCopy(){cpSrc=null;$('#cpPick').hidden=false;$('#cpFields').hidden=true;$('#cpQ').value='';cpListDraw();$('#cpBg').hidden=$('#cpSheet').hidden=false;}
  function closeCopy(){$('#cpBg').hidden=$('#cpSheet').hidden=true;}
  $('#copyOpen').addEventListener('click',openCopy);$('#cpBg').addEventListener('click',closeCopy);
  $('#cpQ').addEventListener('input',cpListDraw);
  $('#cpList').addEventListener('click',e=>{const b=e.target.closest('[data-cp]');if(!b)return;cpSrc=items.find(i=>i.id===b.dataset.cp);if(!cpSrc)return;
    $('#cpFrom').textContent=`Desde: ${fullName(cpSrc)} · ${shopOf(cpSrc)}. Marca lo que quieres copiar.`;
    {const shop=norm(shopOf(cpSrc));const n=items.filter(i=>i.id!==cpSrc.id&&i.id!==editingId&&(i.status||'pending')==='pending'&&norm(shopOf(i))===shop&&INH_KEYS.some(k=>lacks(i,k))).length;
     $('#cpShopBox').hidden=!n;$('#cpShopTxt').textContent=`Copiar también portes, mínimo y cupón a ${n} ${n===1?'artículo':'artículos'} de ${shopOf(cpSrc)} que no los tienen (quedan como supuestos; lo que se lea de la web siempre manda)`;}$('#cpPick').hidden=true;$('#cpFields').hidden=false;cpRowsDraw();});
  $('#cpMode').addEventListener('click',e=>{const b=e.target.closest('[data-cm]');if(!b)return;cpMode=b.dataset.cm;cpRowsDraw();});
  $('#cpBack').addEventListener('click',()=>{$('#cpPick').hidden=false;$('#cpFields').hidden=true;});
  $('#cpApply').addEventListener('click',()=>{if(!cpSrc)return;const ks=[...document.querySelectorAll('#cpRows [data-cf]:checked')].map(x=>x.dataset.cf);if(!ks.length){setStatus('Marca al menos un dato.','err');return;}
    const done=[];for(const r of CF){if(r[0]==='g'||!ks.includes(r[0]))continue;r[5](vOf(r[3](cpSrc)),cpSrc);done.push(r[1]);}
    const map={ship:'shipping',free:'freeFrom',code:'code'};ks.forEach(k=>{if(map[k])cpInh.set(map[k],cpSrc.id);});
    const sk=ks.map(k=>map[k]).filter(Boolean);let nShop=0;
    if(sk.length&&$('#cpShop').checked&&!$('#cpShopBox').hidden){storeFill(cpSrc,sk,editingId).then(n=>{nShop=n;if(n){render();setStatus(`Copiado de ${shopOf(cpSrc)}: ${done.join(', ')}. También a ${n} ${n===1?'artículo':'artículos'} de la tienda que no lo tenían. Quedan marcados como supuestos hasta que se lean de la web.`);}});}
    drawAllChips();curPreview();
    ['fStore','fCur','fShip','fFree','fCode','fBrand','fCategory','fSku','fDesc','imgEdit'].forEach(id=>{const el=F(id)||$('#'+id);const d=el&&el.closest('details.fsec');if(d)d.open=true;});
    closeCopy();setStatus(`Copiado de ${shopOf(cpSrc)}: ${done.join(', ')}. Revisa portes y cupón antes de guardar.`);});

  // ---------- Editar a la vez (los seleccionados) ----------
  function bkValField(n){const k=$('#bkSpec'+n).value;const [,,ph,op,multi]=specOpt(k);const box=$('#bkValBox'+n);
    box.innerHTML=op?`<select id="bkVal${n}"><option value="">—</option>${op.map(o=>`<option>${esc(o)}</option>`).join('')}</select>`:`<input id="bkVal${n}" placeholder="${esc(ph||'')}">`;}
  function openBulk(){const n=sel.size;if(!n)return;
    const opts='<option value="">— ninguno —</option>'+SPECS.map(([k,l])=>`<option value="${k}">${esc(l)}</option>`).join('');
    [1,2].forEach(n=>{$('#bkSpec'+n).innerHTML=opts;bkValField(n);});
    ['bkCat','bkSub','bkBrand','bkPlat','bkTags','bkCompat'].forEach(id=>$('#'+id).value='');
    $('#bkTitle').textContent=`Editar ${n} ${n===1?'artículo':'artículos'} a la vez`;$('#bkBg').hidden=$('#bkSheet').hidden=false;}
  function closeBulk(){$('#bkBg').hidden=$('#bkSheet').hidden=true;}
  [1,2].forEach(n=>$('#bkSpec'+n).addEventListener('change',()=>bkValField(n)));
  $('#selBulk').addEventListener('click',openBulk);$('#bkCancel').addEventListener('click',closeBulk);$('#bkBg').addEventListener('click',closeBulk);
  async function bulkApply(ids,ch){let n=0;
    for(const id of ids){const it=items.find(i=>i.id===id);if(!it)continue;
      if(ch.category)it.category=ch.category;if(ch.sub)it.sub=ch.sub;if(ch.brand)it.brand=ch.brand;if(ch.platform)it.platform=ch.platform;
      if(ch.tags)it.tags=[...new Set([...tagList(it),...splitList(ch.tags)])].join(', ');
      if(ch.compat)it.compat=[...new Set([...compatList(it),...splitList(ch.compat)])].join(', ');
      if(ch.specs&&Object.keys(ch.specs).length)it.specs=cleanSpecs({...(it.specs||{}),...ch.specs});
      await put('items',it);n++;}
    return n;}
  $('#bkApply').addEventListener('click',async()=>{const v=id=>clean($('#'+id).value);
    const ch={category:v('bkCat'),sub:v('bkSub'),brand:v('bkBrand'),platform:v('bkPlat'),tags:v('bkTags'),compat:v('bkCompat'),specs:{}};
    [1,2].forEach(n=>{const k=$('#bkSpec'+n).value,val=v('bkVal'+n);if(k&&val)ch.specs[k]=val;});
    const what=[ch.category&&'categoría',ch.sub&&'subcategoría',ch.brand&&'marca',ch.platform&&'modelo',ch.tags&&'etiquetas',ch.compat&&'«Aplica a»',Object.keys(ch.specs).length&&'ficha técnica'].filter(Boolean);
    if(!what.length){setStatus('Rellena al menos un dato.','err');return;}
    const n=await bulkApply([...sel],ch);closeBulk();selMode=false;sel.clear();render();setStatus(`Cambiado en ${n} ${n===1?'artículo':'artículos'}: ${what.join(', ')}.`);});
