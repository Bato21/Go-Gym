"""
Convierte el dataset público de RepDB (exercises.json) al catálogo en español
que consume Go Gym.

Uso:
    curl -sLO https://raw.githubusercontent.com/RepDB/exercise-dataset/main/exercises.json
    python3 preparar-ejercicios.py exercises.json src/assets/data/ejercicios.json

Fuente: https://github.com/RepDB/exercise-dataset  (licencia free tier, requiere atribución)

Queda en un JSON que va en src/assets/data/ejercicios.json, ordenado por nombre
y sin espacios en blanco, con la siguiente estructura:
[
    {
        "id": "jackknife-sit-up",
        "nombre": "Abdominal navaja",
        "descripcion": "Un crunch de cuerpo completo realizado desde el suelo, levantando las piernas y el torso simultáneamente para tocar las manos con los pies.",
        "grupo": "Core",
        "categoria": "Fuerza",
        "nivel": "Intermedio",
        "equipo": "Sin equipo",
        "pesoCorporal": true,
        "musculos": ["Recto abdominal"],
        "musculosSecundarios": ["Flexores de cadera", "Oblicuos"],
        "met": 5.0,
        "imagen": "jackknife-sit-up-start.webp",
        "imagenFinal": "jackknife-sit-up-peak.webp",
        "instrucciones": [
            "Acuéstate boca arriba en el suelo con los brazos extendidos por encima de la cabeza.",
            "Levanta las piernas y el torso a la vez hasta tocarte los pies con las manos.",
            "Baja de forma controlada hasta la posición inicial."
        ],
        "consejos": [
            "Mantén las piernas rectas durante todo el movimiento.",
            "Controla la bajada en vez de dejarte caer."
        ]
    },
    ...
]

Descripción de los campos:
- id: slug del ejercicio en el dataset de origen (ej. "jackknife-sit-up"). Es
  string, no número: es la clave estable que la app guarda en las rutinas.
- nombre: nombre del ejercicio en español
- descripcion: descripción del ejercicio en español
- grupo: grupo muscular principal del ejercicio, para filtrar en la app (Pecho, Espalda, Hombro, Bíceps, Tríceps, Pierna, Core, Antebrazo, Cuerpo completo)
- categoria: categoría del ejercicio (Fuerza, Cardio, Estiramiento, Pliometría, Halterofilia)
- nivel: nivel de dificultad del ejercicio (Principiante, Intermedio, Avanzado)
- equipo: equipo necesario para realizar el ejercicio
- pesoCorporal: si el ejercicio es con peso corporal (true) o con equipo (false)
- musculos: lista de músculos primarios trabajados por el ejercicio
- musculosSecundarios: lista de músculos secundarios trabajados por el ejercicio
- met: valor MET del ejercicio (para calcular calorías quemadas)
- imagen: nombre del archivo .webp de la posición inicial (sufijo -start, o
  -main si el ejercicio tiene una sola imagen). La URL se arma en el servicio
  de Angular. null si el ejercicio no trae imagen; el script lo avisa por stderr.
- imagenFinal: nombre del archivo .webp de la posición final (sufijo -peak), o
  null si el ejercicio tiene una sola imagen.
- instrucciones: lista de pasos para realizar el ejercicio, en español
- consejos: lista de consejos para realizar el ejercicio, en español

Ojo: BASE_IMAGENES en catalogo-ejercicios.service.ts apunta a un commit fijo del
repo de origen. Si regeneras este JSON desde un exercises.json más nuevo, actualiza
también ese commit o las imágenes nuevas darán 404.
"""

import json
import sys

MUSCULOS = {
    "abductors": "Abductores",
    "adductors": "Aductores",
    "anterior_deltoid": "Deltoides anterior",
    "biceps_brachii": "Bíceps braquial",
    "brachialis": "Braquial anterior",
    "brachioradialis": "Braquiorradial",
    "erector_spinae": "Erectores espinales",
    "forearm_extensors": "Extensores del antebrazo",
    "forearm_flexors": "Flexores del antebrazo",
    "forearms": "Antebrazos",
    "gastrocnemius": "Gemelos",
    "gluteus_maximus": "Glúteo mayor",
    "gluteus_medius": "Glúteo medio",
    "hamstrings": "Isquiotibiales",
    "hip_flexors": "Flexores de cadera",
    "lateral_deltoid": "Deltoides lateral",
    "latissimus_dorsi": "Dorsal ancho",
    "obliques": "Oblicuos",
    "pectoralis_major": "Pectoral mayor",
    "posterior_deltoid": "Deltoides posterior",
    "quadratus_lumborum": "Cuadrado lumbar",
    "quadriceps": "Cuádriceps",
    "rectus_abdominis": "Recto abdominal",
    "rhomboids": "Romboides",
    "serratus_anterior": "Serrato anterior",
    "soleus": "Sóleo",
    "supraspinatus": "Supraespinoso",
    "transverse_abdominis": "Transverso abdominal",
    "trapezius": "Trapecio",
    "triceps_brachii": "Tríceps braquial",
}

EQUIPO = {
    "ab_crunch_machine": "Máquina de abdominales",
    "ab_wheel": "Rueda abdominal",
    "air_bike": "Bicicleta de aire",
    "assisted_pullup_machine": "Máquina de dominadas asistidas",
    "back_extension_machine": "Banco de hiperextensiones",
    "barbell": "Barra",
    "battle_rope": "Cuerda de batalla",
    "bicep_curl_machine": "Máquina de curl de bíceps",
    "cable": "Polea",
    "chest_fly_machine": "Máquina de aperturas",
    "chest_press_machine": "Máquina de press de pecho",
    "climbing_rope": "Cuerda de escalada",
    "dip_machine": "Máquina de fondos",
    "dip_station": "Paralelas",
    "donkey_calf_raise_machine": "Máquina de gemelo tipo burro",
    "dumbbell": "Mancuernas",
    "elliptical": "Elíptica",
    "ez_bar": "Barra Z",
    "flat_bench": "Banco plano",
    "glute_ham_developer": "Banco GHD",
    "hack_squat": "Máquina hack squat",
    "hip_abduction_machine": "Máquina de abductores",
    "hip_adduction_machine": "Máquina de aductores",
    "hip_thrust_machine": "Máquina de hip thrust",
    "jump_rope": "Cuerda de saltar",
    "kettlebell": "Kettlebell",
    "lat_pulldown_machine": "Máquina de jalón al pecho",
    "leg_curl": "Máquina de curl femoral",
    "leg_extension": "Máquina de extensión de cuádriceps",
    "leg_press": "Prensa de piernas",
    "loop_band": "Banda circular",
    "none": "Sin equipo",
    "pec_deck": "Pec deck",
    "plate_loaded_lateral_raise_machine": "Máquina de elevaciones laterales",
    "plates": "Discos",
    "plyo_box": "Cajón pliométrico",
    "preacher_curl_machine": "Máquina de predicador",
    "pull_up_bar": "Barra de dominadas",
    "resistance_band": "Banda elástica",
    "rings": "Anillas",
    "rower": "Remoergómetro",
    "seated_calf_raise_machine": "Máquina de gemelo sentado",
    "shoulder_press_machine": "Máquina de press de hombro",
    "shrug_machine": "Máquina de encogimientos",
    "slam_ball": "Slam ball",
    "sled": "Trineo",
    "smith_machine": "Máquina Smith",
    "stability_ball": "Pelota de estabilidad",
    "stair_climber": "Escaladora",
    "standing_calf_raise_machine": "Máquina de gemelo de pie",
    "stationary_bike": "Bicicleta estática",
    "suspension_trainer": "Entrenador de suspensión (TRX)",
    "trap_bar": "Barra hexagonal",
    "treadmill": "Cinta de correr",
    "tricep_extension_machine": "Máquina de extensión de tríceps",
    "wrist_roller": "Rodillo de muñeca",
}

# Grupo muscular de la app, derivado del músculo primario (más preciso que body_part)
GRUPO_POR_MUSCULO = {
    "pectoralis_major": "Pecho",
    "latissimus_dorsi": "Espalda",
    "rhomboids": "Espalda",
    "trapezius": "Espalda",
    "erector_spinae": "Espalda",
    "quadratus_lumborum": "Espalda",
    "anterior_deltoid": "Hombro",
    "lateral_deltoid": "Hombro",
    "posterior_deltoid": "Hombro",
    "supraspinatus": "Hombro",
    "biceps_brachii": "Bíceps",
    "brachialis": "Bíceps",
    "triceps_brachii": "Tríceps",
    "quadriceps": "Pierna",
    "hamstrings": "Pierna",
    "gluteus_maximus": "Pierna",
    "gluteus_medius": "Pierna",
    "adductors": "Pierna",
    "abductors": "Pierna",
    "gastrocnemius": "Pierna",
    "soleus": "Pierna",
    "hip_flexors": "Pierna",
    "rectus_abdominis": "Core",
    "transverse_abdominis": "Core",
    "obliques": "Core",
    "serratus_anterior": "Core",
    "brachioradialis": "Antebrazo",
    "forearms": "Antebrazo",
    "forearm_flexors": "Antebrazo",
    "forearm_extensors": "Antebrazo",
}

GRUPO_POR_ZONA = {
    "chest": "Pecho",
    "back": "Espalda",
    "shoulders": "Hombro",
    "upper_arms": "Bíceps",
    "lower_arms": "Antebrazo",
    "upper_legs": "Pierna",
    "lower_legs": "Pierna",
    "core": "Core",
    "full_body": "Cuerpo completo",
}

NIVEL = {
    "beginner": "Principiante",
    "intermediate": "Intermedio",
    "advanced": "Avanzado",
}

CATEGORIA = {
    "strength": "Fuerza",
    "cardio": "Cardio",
    "stretching": "Estiramiento",
    "plyometrics": "Pliometría",
    "olympic": "Halterofilia",
}


def grupo_de(ejercicio):
    if ejercicio.get("body_part") == "full_body":
        return "Cuerpo completo"
    for musculo in ejercicio.get("primary_muscles", []):
        if musculo in GRUPO_POR_MUSCULO:
            return GRUPO_POR_MUSCULO[musculo]
    return GRUPO_POR_ZONA.get(ejercicio.get("body_part"), "Cuerpo completo")


def imagenes_de(ejercicio):
    """Devuelve (imagen principal, imagen final). Solo el nombre del archivo:
    la URL base se arma en el servicio de Angular."""
    flat = ejercicio.get("images", {}).get("flat", {})
    inicio = flat.get("start") or flat.get("main") or flat.get("peak")
    fin = flat.get("peak") if flat.get("start") else None
    corta = lambda ruta: ruta.rsplit("/", 1)[-1] if ruta else None
    return corta(inicio), corta(fin)


def convertir(origen, destino):
    datos = json.load(open(origen, encoding="utf-8"))
    catalogo = []

    sin_imagen = []

    for e in datos["exercises"]:
        imagen, imagen_final = imagenes_de(e)
        if imagen is None:
            sin_imagen.append(e["id"])
        catalogo.append(
            {
                "id": e["id"],
                "nombre": e["name_es"],
                "descripcion": e["description_es"],
                "grupo": grupo_de(e),
                "categoria": CATEGORIA.get(e.get("category"), "Fuerza"),
                "nivel": NIVEL.get(e.get("difficulty"), "Intermedio"),
                "equipo": EQUIPO.get(e.get("equipment", "none"), "Sin equipo"),
                "pesoCorporal": e.get("is_bodyweight", False),
                "musculos": [MUSCULOS.get(m, m) for m in e.get("primary_muscles", [])],
                "musculosSecundarios": [
                    MUSCULOS.get(m, m) for m in e.get("secondary_muscles", [])
                ],
                "met": e["met"],
                "imagen": imagen,
                "imagenFinal": imagen_final,
                "instrucciones": e.get("instructions_es", []),
                "consejos": e.get("tips_es", []),
            }
        )

    if sin_imagen:
        # El modelo de Angular declara imagen como string | null, asi que no
        # rompe nada, pero en la app se veran sin miniatura.
        print(
            f"AVISO: {len(sin_imagen)} ejercicios sin imagen: "
            + ", ".join(sin_imagen),
            file=sys.stderr,
        )

    catalogo.sort(key=lambda x: x["nombre"])
    with open(destino, "w", encoding="utf-8") as f:
        json.dump(catalogo, f, ensure_ascii=False, separators=(",", ":"))

    return catalogo


if __name__ == "__main__":
    origen = sys.argv[1] if len(sys.argv) > 1 else "exercises.json"
    destino = sys.argv[2] if len(sys.argv) > 2 else "ejercicios.json"
    catalogo = convertir(origen, destino)
    print(f"{len(catalogo)} ejercicios escritos en {destino}")
