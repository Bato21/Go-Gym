# Mejoras pendientes

Ideas detectadas mientras se acercaban **Inicio** y **Rutina** al mockup
(`Go Gym Mobile App Design.pdf`, pantallas 01 y 03). Ninguna se implementó en ese paso:
o quedan fuera de esas dos vistas, o son lo bastante grandes como para merecer su propio commit.

Orden sugerido: 1 → 2 → 3, el resto cuando haya tiempo.

## 1. Extraer `servicios/rutinas.service.ts`

Hoy las interfaces `Rutina` y `Ejercicio`, la semilla de 3 rutinas y toda la lógica de
edición viven dentro de `GG/src/app/rutina/rutina.page.ts`. Inicio no puede leer nada de eso,
así que su tarjeta "Toca hoy" y sus "Últimas sesiones" son datos escritos a mano que no
corresponden a las rutinas reales.

Es el paso que ya exige `entrenamiento-especificacion.md` §2 antes de construir la vista
Entrenamiento, y de paso arregla la inconsistencia: el mockup dice que Push A tiene
6 ejercicios y la semilla tiene 5.

## 2. Persistencia

Cualquier rutina creada o editada se pierde al recargar. Opciones: `localStorage` (rápido) o
`@capacitor/preferences` (funciona igual en app nativa). Conviene hacerlo **después** del
servicio, para guardar en un solo lugar y no en cada página.

## 3. Racha y métricas calculadas

En `inicio.page.ts` la fecha, el saludo y el día "hoy" de la racha ya se calculan con la fecha
real del dispositivo, pero el resto sigue siendo semilla:

- `racha.completados` es un arreglo fijo de lunes a domingo; debería salir de las sesiones registradas.
- `racha.actual` / `racha.record` están escritos a mano.
- `metricas` (sesiones, volumen, tiempo) y `sesionesSemana` también.
- `ultimasSesiones` es un arreglo hardcodeado (lo menciona `entrenamiento-especificacion.md` §7.4).

Todo esto depende de que Entrenamiento empiece a escribir sesiones.

## 4. Foto real de portada y demos de ejercicio

La portada de Rutina es un degradado con un icono; cada rutina recibe uno distinto según su id.
Falta permitir subir una foto (Capacitor Camera / Filesystem) y mostrar los GIFs de ejercicio de
ExerciseDB, ambos ya previstos en la propuesta del proyecto.

## 5. Tab bar del mockup

El mockup tiene un botón central "+" elevado sobre la barra de pestañas, que la app no tiene
(`tabs.page.html` son 6 pestañas planas). Implica tocar `tabs`, que quedó fuera del alcance
de este cambio.

## 6. Detalles de calidad

- **Accesibilidad**: los botones de solo icono (`add`, `close`, borrar) no tienen `aria-label`.
  Revisar también el contraste de los chips en tema claro.
- **Estados de carga**: cuando haya datos asíncronos, usar `ion-skeleton-text` en vez de tarjetas vacías.
- **Presupuesto de estilos**: `angular.json` limita cada `.scss` de componente a 2 kB de aviso y
  4 kB de error. `inicio.page.scss` quedó justo debajo del límite; si crece hay que mover lo común
  a `theme/variables.scss` o subir el presupuesto de forma consciente.
- **`index.html`** todavía dice `<title>Ionic App</title>` y usa el favicon por defecto de Ionic.
- **Lint**: `logros` y `perfil` fallan con `prefer-control-flow` (usan `*ngIf` / `*ngFor` en vez de
  `@if` / `@for`) y `logros` además con `no-empty-lifecycle-method`. `calorias` ya pasa.
