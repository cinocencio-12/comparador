---
name: revision-seguridad
description: Revisión de seguridad a fondo de una app (25 pautas: autenticación, claves, base de datos, XSS, CORS, cabeceras, cookies, CSRF, archivos, pagos, dependencias, secretos en Git). Úsala cuando pidan revisar la seguridad, «que no me hackeen la app» o antes de publicar.
---

# Revisión de seguridad

Objetivo: encontrar y arreglar fallos de seguridad **sin quitar ni simplificar funciones**, probar las protecciones y entregar un informe.

## Paso 1: entender y auditar (sin cambiar nada)
Lee el proyecto y su CLAUDE.md. Di qué tipo de app es: estática, con servidor o serverless, y con qué base de datos, autenticación y hosting. Marca cada punto como **OK**, **FALLA** (archivo:línea) o **NO APLICA** (motivo):

**A. Básico**
1. Autenticación sólida (proveedor fiable, sesiones que caducan, sin credenciales en el código).
2. Claves de API secretas fuera del navegador (solo en servidor o funciones). Las públicas por diseño, como la apiKey de Firebase, son aceptables.
3. Base de datos protegida: reglas por usuario, nunca `if true`.
4. HTTPS forzado (redirección y HSTS).
5. Contraseñas con hash (bcrypt o argon2) si se guardan contraseñas propias.

**B. Entradas y accesos**
6. Validación repetida en el servidor o en las reglas de la base de datos.
7. XSS: escapar todo texto externo, nada de `innerHTML` sin escapar, enlaces solo http(s).
8. Registro y alerta de actividad sospechosa.
9. Rutas y acciones de administración comprobadas en el servidor.
10. Consultas parametrizadas, sin concatenar texto del usuario.

**C. Configuración**
11. Variables de entorno: `.env` fuera de Git y ningún secreto con prefijo `PUBLIC_`, `NEXT_PUBLIC_` o `VITE_`.
12. Límite de peticiones (inicio de sesión, formularios, API).
13. CORS restringido a los dominios propios.
14. Cabeceras: CSP, `nosniff`, `Referrer-Policy`, `frame-ancestors`.
15. Cookies de sesión `HttpOnly`, `Secure` y `SameSite`.

**D. Flujos sensibles**
16. CSRF (token o SameSite) en formularios que cambian datos.
17. Enlaces de recuperación o invitación de un solo uso y que caducan.
18. Subida de archivos: tipos permitidos, comprobación del contenido real y tamaño máximo.
19. Precios, totales y pagos calculados y verificados en el servidor (webhook de la pasarela).
20. Sin modo depuración, trazas visibles ni sourcemaps en producción.

**E. Limpieza**
21. Dependencias vulnerables (`npm audit`, `pip-audit`…).
22. Paquetes que no se usan.
23. Archivos expuestos en el despliegue (`.env`, `.git/`, `*.map`, copias de seguridad, volcados).
24. Secretos en **todo** el historial de Git (`git log -p`, gitleaks o trufflehog si están disponibles).
25. Claves que haya que revocar: toda clave expuesta se da por comprometida.

## Paso 2: arreglar
- De más grave a menos grave.
- No quitar ni simplificar funciones. Si un arreglo lo exige, preguntar antes.
- Cada arreglo con su prueba automática, siguiendo el sistema de pruebas del proyecto. Batería en verde.
- Nunca escribir claves reales en el código, la documentación, las capturas ni los commits.
- Respetar las normas de publicación del CLAUDE.md del proyecto.

## Paso 3: probar
Intentar cada ataque corregido (XSS con datos maliciosos, acceso a datos de otro usuario, subir un archivo prohibido, cambiar un precio desde el navegador…) y demostrar que ya no funciona.

## Paso 4: informe
1. Encontrado y arreglado, con la prueba que lo demuestra.
2. Encontrado y no arreglado: motivo y riesgo (alto, medio o bajo).
3. Tareas manuales para el usuario (revocar claves en cada panel, ajustes del hosting o de la consola de Firebase/Supabase) con los pasos exactos.
