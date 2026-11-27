// Comparador · 14-compatibles.js
// «Aplica a / Compatible con»: qué accesorios sirven para qué artículo, respetando modelo y calibre
// (unas vainas para Chiappa Rhino 6 mm no salen en un Rhino de 4,5 mm).

  // Normaliza calibres y medidas: «6 mm», «6mm» → 6mm · «4,5 mm», «4.5mm» → 4.5mm
  const calNorm=s=>norm(s).replace(/(\d)[,.](\d)/g,'$1.$2').replace(/(\d)\s+(mm|cal|g)\b/g,'$1$2');
  const COMPAT_STOP=new Set(['de','del','la','el','los','las','para','con','y','en','a','modelo','modelos','serie','compatible','compatibles','todos','todas','revolver','revólver','pistola','rifle','airsoft','replica','réplica','co2','gas','muelle']);
  const ctoks=s=>new Set(calNorm(s).replace(/[^a-z0-9.\s-]/g,' ').split(/[\s-]+/).filter(t=>t&&!COMPAT_STOP.has(t)));
  // Rasgos del artículo destino: nombre, variante, marca, plataforma y calibre de su ficha técnica
  const targetToks=it=>ctoks([it.brand,it.product,it.variant,it.platform,(it.specs||{}).caliber].join(' '));
  const isCal=t=>/^\d+(\.\d+)?mm$/.test(t);
  // ¿La entrada «Aplica a» describe este artículo? Todas sus palabras deben estar; si dice calibre, debe coincidir.
  function fits(entry,it){const E=ctoks(entry);if(E.size<1)return false;const T=targetToks(it);
    for(const t of E){if(!T.has(t)){if(isCal(t)&&![...T].some(isCal))continue; // el destino no dice calibre: no lo descartamos por eso
        return false;}}
    // si el destino dice calibre y la entrada dice otro calibre distinto, no vale
    const ce=[...E].filter(isCal),ct=[...T].filter(isCal);if(ce.length&&ct.length&&!ce.some(c=>ct.includes(c)))return false;
    return [...E].some(t=>!isCal(t));}
  const compatOf=it=>splitList(it.compat);
  // Para un accesorio: artículos tuyos (pendientes o comprados) a los que sirve
  function servesFor(acc){const es=compatOf(acc);if(!es.length)return [];const me=key(groupName(acc));const seen=new Set();
    return items.filter(i=>i.status!=='discarded'&&key(groupName(i))!==me&&isBase(i)&&es.some(e=>fits(e,i))).filter(i=>{const k=key(groupName(i));if(seen.has(k))return false;seen.add(k);return true;});}
  // Para un artículo: accesorios tuyos que dicen servirle
  function accessoriesFor(it){const me=key(groupName(it));const seen=new Set();
    return items.filter(a=>a.status!=='discarded'&&key(groupName(a))!==me&&!isBase(a)&&compatOf(a).some(e=>fits(e,it))).filter(a=>{const k=key(groupName(a));if(seen.has(k))return false;seen.add(k);return true;});}
  function compatHtml(offers){const f=offers[0];const sv=isBase(f)?[]:servesFor(f),ac=isBase(f)?accessoriesFor(f):[];if(!sv.length&&!ac.length)return '';
    const row=i=>`<button type="button" class="cpt" data-open="${esc(key(groupName(i)))}">${thumb(i)||`<span class="ph">${svgI(catIcon(catOf(i)))}</span>`}<span><b>${esc(groupName(i))}</b><small>${esc(catOf(i))}${i.status==='bought'?' · ya lo tienes':''}</small></span></button>`;
    return `${sv.length?`<h3 class="lh">Sirve para ${accChip(f)}</h3><div class="cpts">${sv.map(row).join('')}</div>`:''}${ac.length?`<h3 class="lh">Sus accesorios en tu lista</h3><div class="cpts">${ac.map(row).join('')}</div>`:''}`;}

  // ---------- base o accesorio, exclusivo o general ----------
  // Base = réplica/arma (por categoría). Accesorio = lo demás. Sin anidar: el accesorio dice en «Aplica a» a qué sirve.
  const isBase=it=>WEAPON_RE.test(catOf(it)||'');
  const GENERAL_RE=/\b(tod[oa]s|universal|cualquier|gen[eé]ric)/i;
  // exclusive: sirve para una sola base tuya · shared: para varias · general: «todas / universal» · none: sin «Aplica a»
  function accKind(acc){const es=compatOf(acc);if(!es.length)return {k:'none'};if(es.some(e=>GENERAL_RE.test(e)))return {k:'general'};
    const seen=new Set();const bs=servesFor(acc).filter(b=>{const k=norm(b.product);if(seen.has(k))return false;seen.add(k);return true;});return bs.length===1?{k:'exclusive',base:bs[0]}:bs.length>1?{k:'shared',n:bs.length}:{k:'unmatched'};}
  function accChip(acc){const r=accKind(acc);return r.k==='exclusive'?`<span class="chip">Exclusivo de ${esc(groupName(r.base))}</span>`:r.k==='shared'?`<span class="chip">Sirve para ${r.n} de tus réplicas</span>`:r.k==='general'?'<span class="chip">Accesorio general</span>':'';}
  // Modelos que identifican una base: su plataforma y las palabras con letras y números del nombre (M401, KAR98K, G17…)
  function baseModels(b){const out=new Set();splitList(b.platform).forEach(p=>{const n=norm(p);if(n.length>=3)out.add(n);});
    [...ctoks([b.product,b.variant].join(' '))].forEach(t=>{if(/[a-z]/.test(t)&&/\d/.test(t)&&t.length>=3&&!isCal(t))out.add(t);});return [...out];}
  // Propuestas: accesorio sin «Aplica a» cuyo nombre contiene el modelo de una base
  function inferCompat(){const bases=items.filter(i=>i.status!=='discarded'&&isBase(i));const res=[];
    for(const a of items.filter(i=>i.status!=='discarded'&&!isBase(i)&&!compatOf(i).length&&!isUnread(i))){
      const T=ctoks([a.product,a.variant].join(' '));const hits=new Map();
      for(const b of bases)for(const m of baseModels(b)){const mt=[...ctoks(m)];if(mt.length&&mt.every(t=>T.has(t))){if(!hits.has(m))hits.set(m,[]);hits.get(m).push(b);}}
      if(hits.size)res.push({a,models:[...hits.keys()],bases:[...new Set([...hits.values()].flat().map(groupName))]});}
    return res;}
  let cmProps=[];
  function openCompat(){cmProps=inferCompat();
    $('#cmList').innerHTML=cmProps.length?cmProps.map((p,i)=>`<label class="pick"><input type="checkbox" data-cm="${i}" checked>${(p.a.images||[]).length?imgTag(p.a.images[0]):'<span></span>'}
      <span class="nm">${esc(fullName(p.a))}<div class="vr">Aplica a: <b>${esc(p.models.join(', '))}</b> · ${esc(p.bases.slice(0,3).join(' · '))}</div></span></label>`).join(''):'<div class="empty">No hay accesorios sin «Aplica a» que citen un modelo de tu lista.</div>';
    $('#cmApply').disabled=!cmProps.length;$('#cmBg').hidden=$('#cmSheet').hidden=false;}
  function closeCompat(){$('#cmBg').hidden=$('#cmSheet').hidden=true;}
  $('#compatBtn').addEventListener('click',openCompat);$('#cmCancel').addEventListener('click',closeCompat);$('#cmBg').addEventListener('click',closeCompat);
  $('#cmApply').addEventListener('click',async()=>{let n=0;for(const x of document.querySelectorAll('#cmList [data-cm]:checked')){const p=cmProps[+x.dataset.cm];if(!p)continue;p.a.compat=p.models.join(', ');await put('items',p.a);n++;}
    closeCompat();render();setStatus(n?`«Aplica a» rellenado en ${n} ${n===1?'accesorio':'accesorios'}. En la ficha de cada base verás sus accesorios.`:'No se ha cambiado nada.');});
