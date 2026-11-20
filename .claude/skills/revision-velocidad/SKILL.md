---
name: revision-velocidad
description: Revisión de velocidad a fondo de una app (25 pautas: esqueletos de carga, imágenes WebP/AVIF, llamadas duplicadas, debounce, paginación, CDN, N+1, Brotli, índices, code splitting, listas virtualizadas, caché, fuentes, Web Vitals, móviles y redes lentas). Úsala cuando pidan que la app vaya más rápida, «que no vaya lenta» o antes de publicar.
---

# Revisión de velocidad

Objetivo: que la app cargue y responda más rápido **sin quitar ni simplificar funciones ni cambiar el diseño**, midiendo antes y después.

## Paso 1: medir y auditar (sin cambiar nada)
Lee el proyecto y su CLAUDE.md. Di qué tipo de app es. **Mide** el peso de la descarga inicial, el tiempo de carga, LCP, INP y CLS, con Lighthouse o Playwright, móvil emulado y red Slow 4G. Marca cada punto como **OK**, **MEJORABLE** (archivo:línea y ganancia estimada) o **NO APLICA** (motivo):

**A. Lo que nota el usuario**
1. Esqueletos de carga en lugar de pantalla en blanco o spinner.
2. Imágenes en WebP o AVIF, con tamaño ajustado (`srcset`), `loading="lazy"` y `width`/`height`.
3. Sin llamadas duplicadas a la API (petición compartida o caché en memoria).
4. Debounce de 250 a 400 ms en búsquedas y autocompletado, cancelando la petición anterior.
5. Resultados de la API paginados.

**B. Servidor y red**
6. Estáticos servidos desde CDN.
7. Tareas lentas (correo, PDF, imágenes) en una cola o en segundo plano.
8. Sin consultas N+1.
9. Compresión Brotli (o gzip).
10. Peticiones independientes en paralelo (`Promise.all`).

**C. Base de datos y renderizado**
11. Índices para las consultas más comunes (en Firestore, índices compuestos).
12. Rastreo de peticiones lentas (OpenTelemetry, Sentry, registros del hosting).
13. Servidor y base de datos en la misma región.
14. Render en el servidor o en la compilación (SSR o SSG) cuando aplique.
15. Scripts de terceros con `defer`/`async` o cargados después de la página.

**D. Código del navegador**
16. JavaScript dividido por página (`import()` dinámico).
17. Listas largas virtualizadas (o `content-visibility: auto`).
18. Pedir solo los campos o columnas necesarios.
19. Pool de conexiones a la base de datos.
20. Sin renderizados innecesarios.

**E. Entrega y medición**
21. Caché del navegador para estáticos con versión y service worker si es PWA.
22. Tráfico repartido entre varias instancias (balanceo o autoescalado).
23. Fuentes alojadas en el propio dominio, en WOFF2, pocos grosores y `font-display: swap`.
24. Medición con usuarios reales (Core Web Vitals, librería `web-vitals`).
25. Pruebas en móvil de gama media y red lenta.

## Paso 2: mejorar
- De más impacto a menos.
- No quitar ni simplificar funciones ni cambiar el diseño. Si una mejora lo exige, preguntar antes.
- No aflojar la seguridad: CSP, cabeceras, escape de texto. Si existe la skill `revision-seguridad`, respetar lo que dejó.
- Cada mejora con su prueba, siguiendo el sistema de pruebas del proyecto. Batería en verde.
- No cambiar el modelo de datos (por ejemplo, convertir fotos ya guardadas) sin copia de seguridad comprobada y migración sin pérdida.
- Respetar las normas de publicación del CLAUDE.md del proyecto.

## Paso 3: volver a medir
Mismas condiciones que en el paso 1.

## Paso 4: informe
1. Tabla antes/después: peso, tiempo de carga, LCP, INP y CLS.
2. Mejorado, con la prueba que lo cubre.
3. No hecho: motivo y ganancia que se pierde.
4. Tareas manuales para el usuario (hosting, CDN, región del servidor, analítica) con los pasos exactos.
