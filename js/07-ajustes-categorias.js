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
  // [clave, etiqueta, ejemplo, opciones fijas (opcional), varias a la vez (opcional)]. Con opciones se elige de una lista;
  // si un dato guardado no está en la lista, se conserva como opción más.
  const SN=['Sí','No'];
  const SPECS=[['system','Sistema','',['Eléctrica (AEG)','Eléctrica (AEP)','Gas con blowback (GBB)','Gas sin blowback (NBB)','CO₂','HPA (aire a presión)','Muelle','Gas o CO₂ (dual)']],
    ['gas','Gas compatible','',['Green gas','Top gas / Red gas','Black gas','Propano (con adaptador)','CO₂ 12 g','CO₂ 88/90 g','HPA'],1],
    ['shotsPerFill','Disparos por carga/cápsula','≈40'],
    ['battery','Batería: tipo','',['LiPo','Li-ion','LiFe','NiMH','Pilas']],
    ['batVolt','Batería: voltaje','',['7,4 V (LiPo 2S)','11,1 V (LiPo 3S)','6,6 V (LiFe 2S)','9,9 V (LiFe 3S)','8,4 V (NiMH 7 celdas)','9,6 V (NiMH 8 celdas)','1,5 V','3,7 V']],
    ['batCap','Batería: capacidad','1200 mAh'],
    ['batC','Batería: descarga (C)','',['15C','20C','25C','30C','35C','40C','50C','60C']],
    ['batPlug','Batería: conector','',['Mini Tamiya','Deans (T-plug)','XT30','XT60']],
    ['batForm','Batería: formato','',['Stick','Nunchuck (2 cuerpos)','Butterfly','Buffer tube','Brick / PEQ']],
    ['cellType','Pilas: tipo','',['AAA','AA','CR123A','CR2032','9 V','18650']],
    ['cellCount','Pilas: número','2'],
    ['batIncl','Batería incluida','',['Sí','No','Opcional (pack)']],
    ['chargerIncl','Cargador incluido','',SN],
    ['fps','Velocidad (FPS)','350 o 120-250'],['ms','Velocidad de salida (m/s)','135 o 90-110'],['joules','Potencia máxima (J)','1,14 o 0,5-1,5'],
    ['stock','Culata','',['Fija','Plegable / abatible','Retráctil / telescópica','Plegable y retráctil','Ajustable (carrillera / cantonera)','Bullpup','Sin culata']],
    ['rails','Raíles','',SN],
    ['railType','Tipo de raíl','',['Picatinny / RIS 20 mm','Weaver','Cola de milano 11 mm','KeyMod','M-LOK','Raíl inferior (linterna)'],1],
    ['blowback','Blowback','',SN],['caliber','Calibre','',['6 mm BB','8 mm BB','4,5 mm (balín)','4,5 mm acero (BB)','5,5 mm','40 mm (granada)']],['hopup','Hop-up','',['Ajustable','Fijo','No']],['fireMode','Modo de disparo','',['Semi','Semi y Full','Semi, ráfaga y Full','Cerrojo (bolt)','Tiro a tiro','Doble acción','Simple y doble acción'],1],
    ['material','Material','Metal'],['body','Material cuerpo/receiver','Metal'],['length','Longitud','216 mm'],['weight','Peso','818 g'],['barrel','Cañón interior','100 mm'],
    ['magCap','Capacidad del cargador','15 rds'],['magType','Tipo de cargador','',['Low-cap','Mid-cap','Hi-cap','Cápsula / cartuchos','Tambor (drum)']],['magMaterial','Material del cargador','Metal'],
    ['bbWeight','BBs recomendadas','0,20 g'],['bbBio','BBs biodegradables','',SN],['bbTracer','BBs trazadoras','',SN],['bbGrams','Peso de cada BB','0,25 g'],['bbCount','Unidades en la bolsa','4000'],['safety','Seguro','Palanca'],['holster','Tipo de funda','A, D'],['color','Color','Negro'],['included','Incluye','1 cargador, llave…']];
  // Rangos: «120 - 250», «120 a 250», «de 120 hasta 250 fps» → «120–250 fps».
  function normRange(v,unit){const m=String(v).replace(',','.').match(/(\d+(?:\.\d+)?)\s*(?:-|–|—|a|hasta|to|~)\s*(\d+(?:\.\d+)?)/i);
    const f=x=>fmtNum(+x,/\./.test(x)?2:0).replace(/,00$/,'');
    if(m)return `${f(m[1])}–${f(m[2])} ${unit}`;const n=String(v).replace(',','.').match(/\d+(?:\.\d+)?/);return n&&!/[a-z]{3,}/i.test(String(v).replace(/fps|m\/s|j(ulios)?/ig,''))?`${f(n[0])} ${unit}`:v;}
  const WEAPON_RE=/pistol|rev[oó]lver|escopet|rifle|fusil|carabin|francotirad|sniper|r[eé]plica|\barmas?\b|aeg|aep|gbb|smg|ametrallad|lanzagranad|airgun|aire comprimido|co2/i;
  function cleanSpecs(o){const r={};if(!o||typeof o!=='object')return r;SPECS.forEach(([k])=>{let v=o[k];if(Array.isArray(v))v=v.map(x=>clean(String(x))).filter(Boolean).join(', ');if(typeof v==='boolean')v=v?'Sí':'No';v=clean(v==null?'':String(v));if(v&&!/^(n\/?a|-|—|null|undefined)$/i.test(v))r[k]=v;});if(r.fps)r.fps=normRange(r.fps,'fps');if(r.ms)r.ms=normRange(r.ms,'m/s');if(r.joules)r.joules=normRange(r.joules,'J');return r;}
  const hasSpecs=it=>!!(it&&it.specs&&Object.keys(it.specs).length);
  function specsHtml(it){if(!hasSpecs(it))return '';return `<details class="desc"><summary>Ficha técnica</summary><table class="specs">${SPECS.filter(([k])=>it.specs[k]).map(([k,l])=>`<tr><th>${esc(l)}</th><td>${esc(it.specs[k])}</td></tr>`).join('')}</table></details>`;}
  function mergeSpecs(dst,src){const a=cleanSpecs(dst),b=cleanSpecs(src);Object.keys(b).forEach(k=>{if(!a[k])a[k]=b[k];});return a;}

