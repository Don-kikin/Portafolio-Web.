# Luis Enrique Jiménez Bernal — Data & Digital Lab

Portafolio profesional estático construido con HTML5 semántico, CSS moderno y JavaScript vanilla.

## Incluye
- Diseño adaptable con estética oscura tecnológica.
- Navegación fija y accesible.
- Filtros de proyectos por categoría.
- Simulador educativo de costos de impresión 3D.
- Laboratorio y mapa visual de habilidades.
- Artículos y trayectoria profesional.
- Terminal opcional con comandos limitados.
- Metadatos SEO básicos y Open Graph.
- Preferencia de movimiento reducido.

## Ejecutar localmente
1. Descarga o clona el repositorio.
2. Abre `index.html` en el navegador. Para una experiencia más consistente, usa una extensión de servidor estático local, por ejemplo Live Server.
3. No necesita npm, compilación ni dependencias de JavaScript externas.

## Publicar con GitHub Pages
1. Sube `index.html`, `styles.css` y `app.js` a la raíz del repositorio.
2. En GitHub, abre Settings → Pages.
3. Selecciona la rama principal y la carpeta raíz.
4. Guarda y espera a que se publique el sitio.

## Personalización antes de publicar
- Sustituye el enlace genérico de GitHub por tu perfil real.
- Añade enlaces reales a repositorios, demos y CV en PDF.
- Revisa fechas, títulos, acreditaciones y niveles de competencia.
- Elimina afirmaciones no verificables y actualiza estados de proyectos.
- Añade una imagen `og:image` alojada en una URL pública absoluta para las vistas previas sociales.

## Simulador 3D
El simulador usa datos ilustrativos y solo ejecuta cálculos en el navegador. No guarda datos, no llama a una API y no modifica inventario. El costo de material aplica el porcentaje de desperdicio configurado al peso ingresado. Si el peso del laminador ya incluye soportes y brim, no deben añadirse nuevamente.

El costo total mostrado incluye material, electricidad, depreciación estimada y otros costos introducidos. No representa utilidad neta fiscal.

## Privacidad
No publiques información confidencial bancaria, datos personales de clientes, credenciales ni cifras privadas del negocio. Usa datos sintéticos en demostraciones públicas.

## Estructura
- `index.html`: contenido y estructura.
- `styles.css`: diseño adaptable, componentes y accesibilidad.
- `app.js`: filtros, simulador, navegación y terminal.
