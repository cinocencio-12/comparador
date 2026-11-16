// Comparador · 07-ajustes-categorias.js
// Parte del código de la app, que se carga en orden desde index.html (ver js/LEEME.md).
  // ---------- estado ----------
  let stT=null;
  function setStatus(txt,kind){const s=$('#status');clearTimeout(stT);if(txt&&kind!=='busy'&&kind!=='err')stT=setTimeout(()=>{s.hidden=true;},Math.min(20000,6000+txt.length*60));s.hidden=!txt;$('#statusTxt').textContent=txt||'';s.classList.toggle('done',kind!=='busy');s.classList.toggle('err',kind==='err');$('#statusClose').hidden=kind==='busy';}
  $('#statusClose').addEventListener('click',()=>setStatus(''));

  // ---------- ajustes ----------
  const ls={get(k,d){try{return localStorage.getItem(k)||d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  const cfg={get key(){return ls.get('apiKey','')},get model(){return ls.get('model','claude-haiku-4-5-20251001')},shotModel:'claude-sonnet-5-5'};
  $('#openSettings').addEventListener('click',()=>{const s=$('#settings');s.hidden=!s.hidden;setTimeout(navEnsure,0);$('#apiKey').value=cfg.key;$('#model').value=cfg.model;{const w=watchCfg();$('#watchOn').checked=w.on;$('#watchDays').value=w.days;$('#watchMax').value=w.max;}$('#bmCode').value=bookmarklet();const c=impCfg();$('#impVat').value=numIn(c.vat)||'0';$('#impFee').value=numIn(c.fee)||'0';$('#impBank').value=numIn(c.bank)||'0';});
  $('#bmCopy').addEventListener('click',async()=>{const t=bookmarklet();$('#bmCode').value=t;
    try{await navigator.clipboard.writeText(t);setStatus('Código copiado. Ahora crea el marcador en Chrome y pega el código en la URL.');}
    catch(e){$('#bmCode').select();setStatus('Mantén pulsado el cuadro de texto → Seleccionar todo → Copiar.','err');}});
  $('#saveSettings').addEventListener('click',()=>{ls.set('apiKey',$('#apiKey').value.trim());ls.set('model',$('#model').value);ls.set('watchOn',$('#watchOn').checked?'1':'0');ls.set('watchDays',String(num($('#watchDays').value)||2));ls.set('watchMax',String(num($('#watchMax').value)||6));ls.set('impVat',String(num($('#impVat').value)));ls.set('impFee',String(num($('#impFee').value)));ls.set('impBank',String(num($('#impBank').value)));$('#settings').hidden=true;render();setStatus('Ajustes guardados.');});

  // ---------- categorías y subcategorías ----------
  const TAXONOMY={
    'Ropa':['Blusas','Camisas','Camisetas','Tops','Jerséis y sudaderas','Faldas','Vestidos','Monos','Pantalones','Vaqueros','Shorts','Leggings','Abrigos','Chaquetas','Americanas','Chalecos','Ropa interior','Sujetadores','Calcetines y medias','Pijamas','Batas','Ropa de baño','Ropa deportiva'],
    'Calzado':['Botines','Botas','Playeras','Zapatillas deportivas','Tacones','Bailarinas','Mocasines','Sandalias','Chanclas','Zapatillas de casa','Náuticos'],
    'Complementos':['Bolsos','Mochilas','Carteras y monederos','Pañuelos','Bufandas','Fulares','Gorros y sombreros','Guantes','Cinturones','Gafas de sol','Relojes','Colgantes y collares','Pendientes','Pulseras','Anillos','Diademas','Accesorios de pelo','Paraguas'],
    'Belleza':['Perfumes','Maquillaje','Cuidado facial','Cuidado corporal','Pelo','Uñas','Herramientas de belleza'],
    'Juguetes':['Construcción','Figuras y muñecos','Coches, pistas y vehículos','Radiocontrol y drones','Robots y programación','Ciencia y experimentos','Juegos de mesa','Puzles','Cartas coleccionables','Peluches','Manualidades y dibujo','Disfraces','Aire libre (patinetes, bicis, pelotas)','Lanzadores de espuma','Instrumentos musicales','Libros y cómics infantiles'],
    'Pistolas':['Gas blowback','CO2','Muelle','Eléctricas'],'Revólveres':['CO2','Gas','Muelle'],'Rifles':['AEG','Francotirador','Gas (GBBR)','Escopetas','Subfusiles'],
    'Cargadores':['Pistola','Rifle','Hi-cap','Mid-cap','Low-cap'],'Munición':['BBs 6 mm','Balines 4,5 mm','Granadas y cartuchos'],'Gas y baterías':['Green gas','CO2','Baterías LiPo','Cargadores de batería'],
    'Piezas internas':['Gearbox','Hop-up','Cañones','Motores','Muelles','Engranajes','Pistón y cilindro'],'Piezas externas':['Guardamanos','Culatas','Empuñaduras','Silenciadores','Raíles'],
    'Ópticas':['Red dot','Visores','Linternas','Láser'],'Equipamiento':['Chalecos y portaplacas','Fundas y cartucheras','Protección ocular','Máscaras','Cascos','Ropa táctica','Botas tácticas','Mochilas tácticas'],
    'Electrónica':['Móviles','Tablets','Ordenadores','Audio','Fotografía','Smart home','Accesorios'],'Hogar':['Cocina','Decoración','Muebles','Textil hogar','Limpieza','Organización'],
    'Huerto':['Semillas','Plantel y plantones','Plantas aromáticas','Frutales','Plantas de interior','Plantas de exterior','Bulbos','Sustratos y tierra','Abonos y fertilizantes','Tratamientos y fitosanitarios','Riego','Herramientas','Macetas y jardineras','Mesas de cultivo','Invernaderos y túneles','Compostaje','Mallas, tutores y entutorado'],
    'Videojuegos':['Nintendo Switch 2','Nintendo Switch','Xbox Series X|S','Xbox One','PlayStation 5','PlayStation 4','PC','Consolas','Mandos y accesorios','Suscripciones y tarjetas regalo','Ediciones coleccionista','Retro'],
    'Chorradas':['Gadgets','Frikadas y coleccionables','Figuras','Tazas y camisetas','Decoración friki','Bromas y regalos tontos','Llaveros y pines'],
    'Golf':['Drivers','Maderas de calle','Híbridos','Hierros','Wedges','Putters','Juegos completos','Bolas','Bolsas','Carros','Guantes','Zapatos de golf','Ropa de golf','Gorras y viseras','Telémetros y GPS','Tees y accesorios','Fundas','Entrenamiento','Paraguas'],
    'LEGO':['Batman y DC','Marvel','Spider-Man','Star Wars','Harry Potter','Technic','Icons y Creator Expert','Ideas','City','Creator 3 en 1','Speed Champions','Ninjago','Architecture','Botanicals','Minifiguras','Piezas sueltas','Expositores y vitrinas','Iluminación LED']};
  const ROPA_RE=/^(ropa|calzado|complementos|belleza)$/i;
  function subsFor(cat){const k=Object.keys(TAXONOMY).find(x=>norm(x)===norm(cat));return k?TAXONOMY[k]:[];}
  function subsUsed(cat){return [...new Set(items.filter(i=>catOf(i)===cat&&clean(i.sub)).map(i=>clean(i.sub)))];}
  // ---------- ficha técnica de armas / réplicas ----------
  const SPECS=[['system','Sistema','1x 12 g CO₂, Green gas, Muelle, Eléctrica…'],['fps','Velocidad (FPS)','443 fps'],['ms','Velocidad de salida (m/s)','135 m/s'],['joules','Potencia (J)','2 J'],
    ['blowback','Blowback','Sí / No'],['caliber','Calibre','6 mm BB, 4,5 mm acero…'],['hopup','Hop-up','Ajustable / Fijo / No'],['fireMode','Modo de disparo','Semi, Full…'],
    ['material','Material','Metal'],['body','Material cuerpo/receiver','Metal'],['length','Longitud','216 mm'],['weight','Peso','818 g'],['barrel','Cañón interior','100 mm'],
    ['magCap','Capacidad del cargador','15 rds'],['magType','Tipo de cargador','Mid-cap, Hi-cap…'],['magMaterial','Material del cargador','Metal'],
    ['bbWeight','BBs recomendadas','0,20 g'],['bbBio','BBs biodegradables','Sí / No'],['bbTracer','BBs trazadoras','Sí / No'],['bbGrams','Peso de cada BB','0,25 g'],['bbCount','Unidades en la bolsa','4000'],['shotsPerFill','Disparos por carga/cápsula','≈40'],['safety','Seguro','Palanca'],['holster','Tipo de funda','A, D'],['color','Color','Negro'],['included','Incluye','1 cargador, llave…']];
  const WEAPON_RE=/pistol|rev[oó]lver|escopet|rifle|fusil|carabin|francotirad|sniper|r[eé]plica|\barmas?\b|aeg|aep|gbb|smg|ametrallad|lanzagranad|airgun|aire comprimido|co2/i;
  function cleanSpecs(o){const r={};if(!o||typeof o!=='object')return r;SPECS.forEach(([k])=>{let v=o[k];if(typeof v==='boolean')v=v?'Sí':'No';v=clean(v==null?'':String(v));if(v&&!/^(n\/?a|-|—|null|undefined)$/i.test(v))r[k]=v;});return r;}
  const hasSpecs=it=>!!(it&&it.specs&&Object.keys(it.specs).length);
  function specsHtml(it){if(!hasSpecs(it))return '';return `<details class="desc"><summary>Ficha técnica</summary><table class="specs">${SPECS.filter(([k])=>it.specs[k]).map(([k,l])=>`<tr><th>${esc(l)}</th><td>${esc(it.specs[k])}</td></tr>`).join('')}</table></details>`;}
  function mergeSpecs(dst,src){const a=cleanSpecs(dst),b=cleanSpecs(src);Object.keys(b).forEach(k=>{if(!a[k])a[k]=b[k];});return a;}

