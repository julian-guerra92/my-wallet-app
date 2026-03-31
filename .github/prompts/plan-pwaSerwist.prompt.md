Para implementar la funcionalidad de PWA usando `@serwist/next` y permitir que la aplicación se instale en dispositivos móviles simulando una app nativa, necesitamos realizar algunos ajustes en la configuración actual y añadir unos componentes base de Service Worker. 

Basado en tu código actual y la estructura del proyecto en Next.js App Router (versión 15/16), he elaborado el siguiente plan de trabajo.

## Plan: Configuración de PWA con Serwist

Vamos a integrar completamente `@serwist/next`, configurar el Service Worker para el manejo del caché y almacenamiento offline, y ajustar los metadatos necesarios.

**Pasos**
1. Instalar las dependencias necesarias de Serwist (`@serwist/next` y `serwist`).
2. Actualizar el manifiesto actual (`public/manifest.json`) agregando las dimensiones de los iconos y confirmando los valores correctos de `start_url` y `orientation`.
3. Crear el archivo del Service Worker base (`src/app/sw.ts`) con la configuración inicial de Serwist y precaching.
4. Actualizar la configuración de Next.js (`next.config.ts`) envolviendo el objeto con el plugin `withSerwist` (*depende del paso 3*).
5. Actualizar el archivo raíz `src/app/layout.tsx` para declarar correctamente el objeto `viewport` (etiquetas como `themeColor`, `minimumScale`, `userScalable` útiles para PWA nativas) así como el metadata `appleWebApp` (*paralelo al paso 4*).
6. Agregar o generar los iconos requeridos en la carpeta `public` (por lo general de 192x192 y 512x512).

**Relevant files**
- `package.json` — para las nuevas dependencias de npm.
- `public/manifest.json` — para agregar los arrays de "icons", "start_url": "/", y configuraciones de experiencia standalone.
- `src/app/sw.ts` — **(NUEVO)** donde inicializaremos y configuraremos el objeto y rutas de `serwist` para cacheo offline.
- `next.config.ts` — para importar e inicializar el plugin de Serwist.
- `src/app/layout.tsx` — para extraer las opciones de viewport y tema específicas para el "safe-area" e instalación.

**Verification**
1. Ejecutar el build `npm run build` y observar que se genere el archivo destino `public/sw.js` correctamente de la mano de Workbox/Serwist.
2. Ejecutar `npm run start` (ambiente de build local) y abrir Chrome DevTools > Application > Manifest / Service Workers para verificar que sea una PWA instalable sin errores o flags amarillas.
3. Probar el acceso a la app simulando modo "Offline" en la pestaña red de DevTools para asegurar su carga mínima desde la memoria caché.

**Decisions**
- Elegimos `@serwist/next` ya que es el reemplazo moderno de `next-pwa` (el cual está discontinuado) para manejar las opciones de Workbox en Next.js.
- Dejaremos la lógica de caché predeterminada (Network First para HTML, Cache First para estáticos/CSS/JS) a menos de plantear necesidades específicas más adelante.

**Further Considerations**
1. Actualmente el arreglo de íconos en tu manifest (`public/manifest.json`) se encuentra vacío. ¿Quieres que te indique una herramienta o método para que subas luego tus propios iconos, o generamos iconos provisionales base con colores sólidos en SVG/PNG para probar de inmediato la instalación?
2. ¿Aceptar este plan para proceder con los cambios por ti, o hay algún ajuste adicional en el comportamiento offline que desees mapear?
