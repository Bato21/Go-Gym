/**
 * Lectura y escritura en localStorage para los servicios.
 * Si el dato guardado está corrupto o el navegador bloquea el almacenamiento,
 * la app sigue funcionando con el valor por defecto en vez de romperse.
 */

export function leer<T>(clave: string, porDefecto: T): T {
  try {
    const guardado = localStorage.getItem(clave);
    return guardado ? (JSON.parse(guardado) as T) : porDefecto;
  } catch {
    return porDefecto;
  }
}

/** null o undefined borran la clave. */
export function escribir(clave: string, valor: unknown): void {
  try {
    if (valor === null || valor === undefined) {
      localStorage.removeItem(clave);
    } else {
      localStorage.setItem(clave, JSON.stringify(valor));
    }
  } catch {
    // Sin almacenamiento (modo privado, cuota llena): los datos viven en memoria.
  }
}
