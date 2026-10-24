// Mismos colores que el Excel de logística, para reconocer los grupos en ambos lados
export const COLORES_GRUPO = ['#C6EFCE', '#BDD7EE', '#FFEB9C', '#F8CBAD', '#D9D2E9', '#B4E5E6', '#FCE4D6', '#E2EFDA', '#DDEBF7', '#EAD1DC']

export const colorGrupo = (numero) => COLORES_GRUPO[(numero - 1) % COLORES_GRUPO.length]

// Vista previa del saldo antes de guardar. El valor definitivo lo calcula el servidor.
export const calcularMontos = (turista, precios, tamanoGrupo) => {
  const descuento = tamanoGrupo >= precios.minimo_grupo ? Number(precios.descuento_grupo) : 0
  let saldo = Number(precios.precio_paquete) - descuento - Number(turista.reserva || 0)
  if (turista.hace_rappel) saldo += Number(precios.precio_rappel)
  if (turista.hace_tirolesa) saldo += Number(precios.precio_tirolesa)
  return { descuento, saldo }
}

export const bs = (valor) => `${Number(valor || 0).toLocaleString('es-BO', { maximumFractionDigits: 2 })} Bs`
