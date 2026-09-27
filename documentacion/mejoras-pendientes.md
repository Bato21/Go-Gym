# Mejoras pendientes

Ideas detectadas mientras se acercaban **Inicio** y **Rutina** al mockup
(`Go Gym Mobile App Design.pdf`, pantallas 01 y 03).

## Hecho: datos centralizados

Los puntos 1 a 3 de la versión anterior de este documento ya están resueltos. Ninguna vista
guarda datos por su cuenta: todas leen de los servicios en `GG/src/app/services/`, que
usan signals para que cada pestaña se repinte sola (la app no usa zone.js).

| Servicio | Qué guarda | Quién lo usa |
|---|---|---|
| `PerfilService` | Nombre, objetivo, peso, días y hora de entrenamiento, meta de calorías y macros, rutina favorita | Inicio, Perfil, Calorías, Rutina, Logros |
| `RutinasService` | Rutinas y sus ejercicios, y la rotación ("qué toca") | Rutina, Inicio, Entrenamiento, Perfil |
| `SesionesService` | Entrenamiento en curso, historial, racha, totales por semana | Entrenamiento, Inicio, Calorías, Perfil, Logros |
| `CaloriasService` | Comidas y actividades de cada día | Calorías |

## Hecho: cuentas con Supabase

Cada usuario entra con correo y contraseña (pantalla `login`, Supabase Auth) y sus datos se
guardan en su cuenta, no en el dispositivo:

- Tablas `perfiles`, `rutinas`, `sesiones` y `registros_calorias`, con RLS: cada cuenta solo
  lee y escribe sus filas. El esquema está en `supabase/migrations/`.
- `DatosUsuarioService` carga todo al entrar; el guard de las pestañas espera a que termine.
- Los servicios cambian su signal al instante y suben el cambio en segundo plano, en orden
  (`SupabaseService.guardar`). Si falla, se muestra un aviso.
- El entrenamiento en curso se queda en `localStorage` (una clave por cuenta) hasta terminarlo.
- La primera vez que una cuenta entra, se suben los datos que ese dispositivo tenía guardados
  de antes; si no había, recibe las rutinas de ejemplo.

Consecuencias visibles:

- El nombre, el peso y la meta semanal son los mismos en todas las pestañas. La meta semanal es
  la cantidad de días de entrenamiento elegidos en Perfil.
- La racha, las métricas de la semana, "Últimas sesiones" y los logros se calculan con el historial real.
- "Toca hoy" (Inicio) y "Próximos entrenamientos" (Perfil) salen de la rotación de rutinas y de los días del perfil.
- "Empezar" en Rutina o Inicio abre Entrenamiento con esa rutina cargada (`?rutinaId=`).
- Rutina añade ejercicios desde el mismo selector del catálogo, así que traen foto y MET para calcular calorías.
- Los datos guardados por versiones anteriores (`perfilUsuario`, la meta y el peso de `caloriasUsuario`) se migran solos.

## 1. Foto real de portada y demos de ejercicio

La portada de Rutina es un degradado con un icono; cada rutina recibe uno distinto según su id.
Falta permitir subir una foto (Capacitor Camera / Filesystem). Las miniaturas del catálogo ya se
muestran en Rutina y Entrenamiento; faltan los GIFs animados.

## 2. Tab bar del mockup

El mockup tiene un botón central "+" elevado sobre la barra de pestañas, que la app no tiene
(`tabs.page.html` son 6 pestañas planas).

## 3. Detalles de calidad

- **Estados de carga**: si algún dato pasa a ser asíncrono, usar `ion-skeleton-text` en vez de tarjetas vacías.
- **Presupuesto de estilos**: `angular.json` limita cada `.scss` de componente a 2 kB de aviso y
  4 kB de error. Los colores compartidos viven en `theme/variables.scss` (`--gg-superficie`,
  `--gg-acento-suave`…); usarlos en vez de repetir colores en cada página.
- **Favicon**: sigue siendo el de Ionic.
- **Historial**: no se puede borrar ni editar un entrenamiento terminado.
