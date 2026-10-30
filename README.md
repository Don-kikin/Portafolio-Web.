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


## Simulador 3D
El simulador usa datos ilustrativos y solo ejecuta cálculos en el navegador. No guarda datos, no llama a una API y no modifica inventario. El costo de material aplica el porcentaje de desperdicio configurado al peso ingresado. Si el peso del laminador ya incluye soportes y brim, no deben añadirse nuevamente.

El costo total mostrado incluye material, electricidad, depreciación estimada y otros costos introducidos. No representa utilidad neta fiscal.

## Estructura
- `index.html`: contenido y estructura.
- `styles.css`: diseño adaptable, componentes y accesibilidad.
- `app.js`: filtros, simulador, navegación y terminal.
