
## Publicar
- En cada cambio de index.html, sube la versión a la vez en `APP_V` (index.html) y en `version.json`: así la app del móvil se recarga sola con lo nuevo.

## Comparador 2.0
- El brief aprobado por Carlos está en `docs/Comparador_2_0_Brief_Integral.pdf`: leerlo antes de tocar la interfaz.

## Inspiración visual siguiente
- `docs/inspiracion/propuesta-oscura.png` y `propuesta-clara.png`: categorías con foto, cabecera tipo banner, listas con portada e iconos, ficha con pestañas Comparativa/Histórico/Detalles.

## Pendiente de revisar (pedido por Carlos, aún no hecho)
1. Conservación de datos: la lista y las fotos viven en IndexedDB del móvil (y en Firestore si hay sesión). Antes de cualquier cambio de modelo de datos o rediseño grande: copia de seguridad comprobada y migración sin pérdida.
2. Clave de API de Anthropic: se guarda solo en localStorage del dispositivo y se envía directamente a api.anthropic.com. Revisar riesgos antes de ampliar el uso compartido. Nunca poner claves reales en documentación, capturas ni en el repositorio.
