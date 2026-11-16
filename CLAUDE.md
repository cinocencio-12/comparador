
## Publicar
- En cada cambio de index.html, sube la versión a la vez en `APP_V` (index.html) y en `version.json`: así la app del móvil se recarga sola con lo nuevo.

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
