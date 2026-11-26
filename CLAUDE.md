
## Publicar
- El código está por partes en `css/` y `js/` (mapa en `js/LEEME.md`); nada de volver a un archivo único (Carlos no quiere código monolítico).
- Antes de publicar: `python3 tests/run.py` en verde y `python3 tools/bump.py` (sube `APP_V`, `version.json` y los `?v=` a la vez, para que el móvil se recargue con lo nuevo).
- Cada arreglo o función nueva lleva su prueba en `tests/run.py`, con datos de prueba (`tests/datos.json`), nunca datos reales.

## Comparador 2.0
- El brief aprobado por Carlos está en `docs/Comparador_2_0_Brief_Integral.pdf`: leerlo antes de tocar la interfaz.

## Inspiración visual siguiente
- `docs/inspiracion/propuesta-oscura.png` y `propuesta-clara.png`: categorías con foto, cabecera tipo banner, listas con portada e iconos, ficha con pestañas Comparativa/Histórico/Detalles.

## Pendiente de revisar (pedido por Carlos, aún no hecho)
1. Conservación de datos: la lista y las fotos viven en IndexedDB del móvil (y en Firestore si hay sesión). Antes de cualquier cambio de modelo de datos o rediseño grande: copia de seguridad comprobada y migración sin pérdida.
2. Clave de API de Anthropic: se guarda solo en localStorage del dispositivo y se envía directamente a api.anthropic.com. Revisar riesgos antes de ampliar el uso compartido. Nunca poner claves reales en documentación, capturas ni en el repositorio.

## Decisiones (16 nov 2026)
- No se monta servidor para comprobar precios con la app cerrada: vale el funcionamiento actual (comprobación al abrir).
- Reglas de Firestore publicadas el 16 nov 2026 (acceso a productos y listas compartidas comprobado por Carlos).
- Pruebas funcionales pendientes: reservas con dos cuentas, notificaciones en el móvil, editar precio realmente pagado y «Comprar otra vez».
- Siguiente fase: transformación visual con los recursos gráficos que facilite Carlos. Prioridad: diseño y experiencia, claro y oscuro. Nunca quitar ni simplificar funciones para adaptar la estética.

## Vincular y fusionar (16 nov 2026)
- Vincular (antes «Unir») = mismo artículo en tiendas distintas: una ficha, se comparan precio, descuentos, portes e importación y se vigila cada tienda.
- Fusionar = mismo artículo dos veces en la misma tienda: se juntan historial, fotos y datos; la otra oferta pasa a Descartados con `mergedInto` (no se borra).
- «Son distintos» guarda la pareja en localStorage `notSame` y no se vuelve a proponer.
- Fotos: si la tienda no deja copiar una foto, se pide a wsrv.nl (servicio público de imágenes) y se guarda la copia en el móvil; al abrir, se copian poco a poco (40 por sesión) las que aún eran enlaces. Solo viajan direcciones de fotos de producto.
- Atrás de Android: una entrada de historial por nivel, creada en cada toque (Android salta las creadas sin toque).
- Categorías distintas en un artículo vinculado: se avisa en la ficha y en Revisión y Carlos elige; no se cambia sola.
- Munición: subcategoría = calibre; bio, trazadora, color y peso son atributos combinables (chips de filtro), sacados de specs o del nombre.
- Precio por unidad: campo «Unidades por pack» (units) o deducido del nombre; €/ud o €/1000 si ≥500 uds. Filtros combinables en todas las categorías: color, material, talla, específicos (golf: tees material/altura, bolas capas/nuevas-recuperadas; munición) y las etiquetas del usuario (#etiqueta).
- Consejos: «¿buen momento?» con historial de 90 días (mínimo / por debajo de la media / caro ahora); cesta óptima por tienda para llegar al envío gratis (módulo de Inicio y ficha).
- Compatibilidades («Aplica a»): una entrada sirve si todas sus palabras están en el artículo y el calibre coincide (Rhino 6 mm ≠ 4,5 mm). Ficha: «Sirve para» y «Accesorios compatibles».
- Compartir algo que ya tenías: abre su ficha para vincular o fusionar.
- Revisión: el globo cuenta solo lo nuevo desde la última visita (+🥚 si pasa de 99). Gasto de Claude y espacio de fotos en Ajustes (aproximado).

## IVA y datos de tienda (17 nov 2026)
- «IVA no incluido» (`vatExcl`): en tienda de la UE se suma el IVA de destino (el de Ajustes, 21 % España), porque desde 2021 (ventanilla única OSS) la tienda de la UE cobra el IVA del país del comprador. Fuera de la UE no se suma (ya va en la importación). Claude lo detecta al leer («sin IVA», «+IVA», «excl. VAT», «HT»…).
- Ficha: botones separados «Comprobar precio» y «Comprobar stock» (este solo toca la disponibilidad).
- Editor: «Rellenar con lo de esta tienda» copia portes, envío gratis, cupón, moneda, UE e IVA del artículo más reciente de la misma tienda que lo tenga; solo lo vacío y quedan como supuestos.
- Ficha técnica con listas fijas (SPECS: 4.º elemento = opciones, 5.º = varias a la vez): sistema, gas compatible (varias), batería (tipo, voltaje, mAh, C, conector, formato, incluida), pilas (tipo y número), cargador incluido, culata, raíles y tipo de raíl (varias), calibre, hop-up, modo de disparo, cargador. Un valor antiguo fuera de la lista se conserva como opción más. FPS, m/s y julios admiten rangos («120–250 fps»).
- «Esta tienda no me lo envía» (`noShip`, en Editar): es de la tienda (basta un artículo marcado; desmarcar lo quita de todos). Sus ofertas salen al final con chip «No envía» y no cuentan para mejor precio, totales, consejos ni avisos.
- Editar a la vez: en modo seleccionar (también en Revisión) botón «Editar N a la vez»: categoría, subcategoría, marca, modelo, añadir etiquetas y «Aplica a», y hasta dos datos de ficha técnica. Solo cambia lo rellenado.
- Misma tienda con nombre distinto: todo compara con `shopKey` (minúsculas, sin espacios, sin www ni dominio): «iGUN Airsoft» = «Igunairsoft» = igunairsoft.com. «Editar a la vez» permite unificar el nombre de la tienda y rellenar portes/envío gratis/cupón con los de su tienda.
- Seleccionar: mantener pulsado 0,5 s un artículo (tarjeta, fila de Revisión) entra en modo seleccionar con él marcado (tarjeta de producto = todas sus ofertas pendientes). Barra: «Borrar N» con doble toque. Revisión: botón Borrar en cada fila.
- Editar a la vez, portes: casillas para escribir portes, envío gratis y cupón a todos; o «copiar de otro artículo de su tienda» con un desplegable por tienda (si hay varios valores distintos, hay que elegir; si no hay ninguno, se avisa). Mantener pulsado conserva la posición de la lista.

## Seguridad (17 nov 2026)
- Prueba `seguridad_xss`: datos maliciosos en todos los campos (web leída, lista compartida) no ejecutan código; enlaces solo http(s) (`safeUrl`), texto siempre con `esc`. Mantenerla en verde: un XSS permitiría robar la clave de Anthropic del dispositivo.
- La clave de Anthropic solo va a api.anthropic.com; no se sube a Firestore ni entra en la copia de seguridad. Firebase en plan Spark (sin facturación).
- No poner correos reales en el repositorio (es público).

## Tiendas (21 nov 2026)
- `js/17-tiendas.js`: ficha de cada tienda (clave `shopKey`): país, envía sí/no, precios con/sin IVA, portes, envío gratis desde, siempre gratis, pedido mínimo, cupón, plazo, recogida, formas de pago, valoración, dirección, teléfono, WhatsApp, correo, soporte, personas que atienden, notas.
- Portes, envío gratis, IVA, país y «no envía» de la tienda valen para todos sus artículos que no tengan su propio dato (`shipOf`, `freeOf`, `hasShipInfo`, `vatExclOf`; el del artículo manda). Así deja de faltar «envío» en Revisión.
- Se guarda en localStorage `shops` y, con sesión, en `profiles/{uid}.shops` (merge por tienda, gana `updatedAt`); sin cambiar reglas de Firestore. Ojo: el perfil lo leen las personas con las que se comparte.
- Pestaña «Tiendas» (antes «Por tienda») en Explorar: chips con la ficha, botón «Ficha de la tienda», «+ Nueva tienda» y «Otras tiendas guardadas».
- Sugerencias en «Tiendas» (`shopSuggest`): para portes, envío gratis, cupón, país e IVA cuenta los valores de sus artículos (no los copiados) y propone el mayoritario («6,90 € en 2 de 5 · otros: 4,50 € (1)»). «Aplicar a los N sin dato» lo guarda en la ficha de la tienda; «Aplicar a todos» (doble toque) además cambia los artículos que tenían otro valor. Si la ficha ya tiene el valor, ya no se propone «a los sin dato». Listado de cada tienda plegado (`<details>`, se recuerda en `shopOpen`).
- Comprobar marcados: el botón muestra «Comprobando i/N…», nunca se queda colgado (try/finally) y siempre da mensaje final con los que no se pudieron leer. Segundo toque del icono ↻ sin nada marcado: avisa.
