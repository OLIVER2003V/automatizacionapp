import api from './api'

const descargarBlob = (blob, nombreArchivo) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// El Excel se pide con el token (ya no sirve abrir la URL en otra pestaña)
export const descargarExcel = async (viaje, tipo) => {
  const response = await api.get(`/exportar-excel/${viaje.id}/${tipo}/`, { responseType: 'blob' })
  descargarBlob(response.data, `Lista_${tipo}_${viaje.fecha_salida}.xlsx`)
}

// --- GENERADOR DE ARCHIVO DE CONTACTOS (VCF) ---
// Devuelve cuántos contactos se exportaron
export const descargarContactosVCF = (turistas, viaje) => {
  let prefijoTour = 'Tour';

  // Convertimos la fecha YYYY-MM-DD a DD/MM/YYYY
  if (viaje && viaje.fecha_salida) {
    const [anio, mes, dia] = viaje.fecha_salida.split('-');
    prefijoTour = `${dia}/${mes}/${anio}`;
  }

  let contenidoVCF = "";
  let contador = 0;

  turistas.forEach(t => {
    if (t.celular && t.celular.trim() !== '') {
      const numeroLimpio = `+591${t.celular.replace(/\s+/g, '')}`;
      // Formato final: "DD/MM/YYYY - Nombre Completo"
      contenidoVCF += `BEGIN:VCARD\nVERSION:3.0\nFN:${prefijoTour} - ${t.nombre_completo}\nTEL;TYPE=CELL:${numeroLimpio}\nEND:VCARD\n`;
      contador++;
    }
  });

  if (contador > 0) {
    // El archivo se descargará con la fecha en el nombre, cambiando las barras por guiones para que sea válido en Windows
    const nombreArchivo = prefijoTour.replace(/\//g, '-');
    descargarBlob(new Blob([contenidoVCF], { type: 'text/vcard' }), `Contactos_${nombreArchivo}.vcf`);
  }
  return contador;
}
