
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
