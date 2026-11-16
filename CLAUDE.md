
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
