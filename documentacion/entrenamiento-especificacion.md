# Vista Entrenamiento — Especificación de implementación

**Estado:** pendiente (la pestaña sigue con el `explore-container` por defecto)
**Archivos a tocar:** `GG/src/app/entrenamiento/entrenamiento.page.{ts,html,scss}`
**Referencia visual:** mockup `Go Gym Mobile App Design.pdf`, vista **02 · Registrar entrenamiento**

---

## 1. Decisión de arquitectura

Se reasignaron responsabilidades respecto del mockup original:

| Pestaña | Rol | Estado |
|---|---|---|
| **Rutina** | Biblioteca y edición: elegir rutina, crear, duplicar, borrar, añadir/editar/eliminar/reordenar ejercicios | Implementada |
| **Entrenamiento** | Ejecución de la sesión: ir ejercicio por ejercicio registrando series, kg, reps y descansos | **Por implementar (este documento)** |

Regla que separa ambas: **Rutina es el plan (qué voy a hacer), Entrenamiento es el registro (qué hice de verdad).**
Entrenamiento nunca modifica la rutina guardada; escribe una *sesión*, que es una copia con los valores reales.

---

## 2. Precondición: mover los datos a un servicio compartido

Hoy las rutinas viven como propiedades dentro de `RutinaPage`. Entrenamiento no puede leerlas desde ahí.
**Primer paso obligatorio antes de escribir la vista:**

1. Crear `GG/src/app/servicios/rutinas.service.ts` con `@Injectable({ providedIn: 'root' })`.
2. Mover a ese servicio las interfaces `Ejercicio` / `Rutina` y el arreglo `rutinas`.
3. Exponer: `obtenerRutinas()`, `obtenerRutina(id: number)`, y los métodos de escritura que hoy tiene `RutinaPage`.
4. Reemplazar en `rutina.page.ts` las propiedades locales por llamadas al servicio (única modificación permitida a esa vista).

Sin este paso, las dos pestañas trabajan sobre copias distintas y los datos no coinciden.

### Contrato de datos ya existente (respetarlo tal cual)

```ts
interface Ejercicio {
  id: number;
  nombre: string;
  grupo: string;          // 'Pecho' | 'Espalda' | 'Hombro' | 'Bíceps' | 'Tríceps' | 'Pierna' | 'Core'
  series: number;         // series planificadas
  repeticiones: number;   // reps objetivo por serie
  carga: string;          // '45 kg' | 'Peso corporal' | '60 s'
  descansoSeg: number;    // descanso entre series, en segundos
}

interface Rutina {
  id: number;
  nombre: string;
  categoria: string;      // 'Fuerza', 'Hipertrofia', ...
  nivel: string;          // 'Principiante' | 'Intermedio' | 'Avanzado'
  minutos: number;
  ejercicios: Ejercicio[];
}
```

### Nuevos modelos que introduce Entrenamiento

```ts
interface SerieRegistrada {
  numero: number;         // 1, 2, 3...
  kg: number;             // valor editable, precargado desde Ejercicio.carga
  reps: number;           // valor editable, precargado desde Ejercicio.repeticiones
  completada: boolean;    // el checkbox de la derecha en el mockup
}

interface EjercicioEnSesion {
  ejercicioId: number;
  nombre: string;
  grupo: string;
  descansoSeg: number;
  series: SerieRegistrada[];
  notas: string;
}

interface Sesion {
  rutinaId: number;
  rutinaNombre: string;
  inicio: Date;
  fin?: Date;
  ejercicios: EjercicioEnSesion[];
}
```

---

## 3. Cómo llega la rutina a esta pestaña

El botón **"Empezar rutina"** de la vista Rutina ya navega así:

```html
routerLink="/tabs/entrenamiento" [queryParams]="{ rutinaId: rutinaSeleccionadaId }"
```

En `EntrenamientoPage` hay que leerlo:

```ts
private ruta = inject(ActivatedRoute);
private rutinas = inject(RutinasService);

ngOnInit() {
  const id = Number(this.ruta.snapshot.queryParamMap.get('rutinaId'));
  // sin id válido → mostrar el estado vacío (ver §6)
}
```

Al recibir un `rutinaId` válido se construye la `Sesion`: por cada `Ejercicio` de la rutina se generan
`ejercicio.series` objetos `SerieRegistrada` con `kg` extraído de `carga` (parsear el número; si no hay
número, `kg = 0`), `reps = ejercicio.repeticiones` y `completada = false`.

---

## 4. Estructura de la pantalla (de arriba a abajo, según el mockup)

1. **Toolbar**
   - Botón atrás → `/tabs/rutina`.
   - Título: nombre de la rutina. Subtítulo: `Ejercicio {{ indice + 1 }} de {{ total }}`.
   - A la derecha, cronómetro total de la sesión en formato `mm:ss` (`ion-chip` con icono `stopwatch-outline`).

2. **Barra de progreso** — `ion-progress-bar` con `[value]="seriesCompletadas / seriesTotales"`.

3. **Demo del ejercicio** — placeholder con icono `image` y el texto "demo del ejercicio".
   Es el hueco donde después entra el GIF de ExerciseDB.

4. **Cabecera del ejercicio** — nombre en grande y, debajo,
   `{{ grupo }} · {{ series.length }} series · Descanso {{ descansoSeg }} s`.

5. **Tabla de series** — cabecera `SERIE | KG | REPS | ✓` y una fila por `SerieRegistrada`:
   - Serie ya completada: valores en texto plano y checkbox marcado.
   - Serie actual (primera no completada): `ion-input type="number"` editables en KG y REPS, fila resaltada.
   - Series futuras: valores en texto plano atenuados y checkbox vacío.
   - Al marcar el checkbox: `completada = true` y **arranca el temporizador de descanso**.

6. **Botones secundarios** — `+ Añadir serie` (agrega una `SerieRegistrada` copiando los valores de la
   última) y `Notas` (abre un `ion-modal` con un `ion-textarea` ligado a `ejercicio.notas`).

7. **Temporizador de descanso** — visible solo mientras corre. Cuenta atrás desde `descansoSeg`,
   formato `mm:ss`, con botón para saltarlo.

8. **Footer** — botón principal:
   - Si quedan ejercicios: **"Siguiente ejercicio"** → `indice++`.
   - En el último ejercicio: **"Terminar entrenamiento"** → cierra la sesión (§7).
   - Añadir un botón secundario "Anterior" cuando `indice > 0`.

---

## 5. Lógica y métodos requeridos

```ts
sesion?: Sesion;
indice = 0;                       // ejercicio actual
segundosSesion = 0;               // cronómetro total
segundosDescanso = 0;             // cuenta atrás; 0 = sin descanso activo

get ejercicioActual(): EjercicioEnSesion | undefined
get serieActual(): SerieRegistrada | undefined   // primera con completada === false
get seriesTotales(): number
get seriesCompletadas(): number
get progreso(): number                            // 0..1, para ion-progress-bar
get esUltimoEjercicio(): boolean

completarSerie(serie: SerieRegistrada): void      // marca + inicia descanso
anadirSerie(): void
siguienteEjercicio(): void
anteriorEjercicio(): void
saltarDescanso(): void
terminarSesion(): void
formatearTiempo(segundos: number): string         // 'mm:ss'
```

**Temporizadores:** usar `setInterval` de 1 s para el cronómetro de sesión y otro para el descanso.
Ambos deben limpiarse en `ngOnDestroy` y también con `ionViewWillLeave`, o siguen corriendo al
cambiar de pestaña y quedan intervalos huérfanos.

---

## 6. Estados que hay que cubrir

| Estado | Qué mostrar |
|---|---|
| Sin `rutinaId` y sin sesión activa | Estado vacío: "No tienes un entrenamiento en curso" + botón "Elegir rutina" → `/tabs/rutina` |
| `rutinaId` que no existe en el servicio | Mismo estado vacío |
| Rutina sin ejercicios | Mensaje + botón para volver a Rutina a añadirlos |
| Sesión en curso y se vuelve a entrar a la pestaña | **No** reiniciar la sesión; retomarla donde estaba |
| Se pulsa "Empezar rutina" con una sesión ya en curso | Preguntar con `ion-alert` si se descarta la sesión actual |

---

## 7. Al terminar la sesión

1. `sesion.fin = new Date()`.
2. Guardar la sesión en el servicio (`RutinasService.guardarSesion()` o un `SesionesService` aparte).
3. Mostrar un resumen: duración total, series completadas, volumen total en kg
   (`Σ kg × reps` de las series completadas).
4. Navegar a `/tabs/inicio`, donde la sesión debe aparecer en "Últimas sesiones"
   (hoy ese arreglo está hardcodeado en `inicio.page.ts` y habrá que conectarlo al servicio).

---

## 8. Componentes Ionic a importar

`IonHeader`, `IonToolbar`, `IonTitle`, `IonButtons`, `IonBackButton`, `IonContent`, `IonFooter`,
`IonProgressBar`, `IonCard`, `IonCardContent`, `IonGrid`, `IonRow`, `IonCol`, `IonItem`, `IonLabel`,
`IonInput`, `IonCheckbox`, `IonButton`, `IonIcon`, `IonChip`, `IonNote`, `IonModal`, `IonTextarea`,
`IonAlert`, más `FormsModule` para los `[(ngModel)]` de kg y reps.

Iconos (`addIcons` desde `ionicons/icons`): `stopwatchOutline`, `hourglassOutline`, `image`, `add`,
`documentTextOutline`, `checkmarkCircle`, `chevronBack`, `chevronForward`.

---

## 9. Fuera de alcance por ahora

- Persistencia real (por ahora todo vive en memoria; luego Capacitor Preferences o SQLite).
- GIFs de ExerciseDB en el bloque de demo.
- Cálculo calórico de la sesión: se calcula en la pestaña Calorías a partir de las sesiones guardadas.
- Sugerencias de progresión de carga (segunda iteración, según la propuesta).
