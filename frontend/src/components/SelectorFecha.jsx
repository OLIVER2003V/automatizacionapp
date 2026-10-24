import { useState } from 'react'
import { bs } from '../precios'

// Paso 1: elegir la fecha de salida (o crear una nueva) y ver sus precios
function SelectorFecha({ viajes, viajeSeleccionado, viajeActual, onSeleccionar, onCrear }) {
  const [nuevaFecha, setNuevaFecha] = useState('')

  const crear = async () => {
    if (!nuevaFecha) return;
    if (await onCrear(nuevaFecha)) setNuevaFecha('')
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="font-bold text-gray-800 mb-4 flex items-center">🗓️ 1. Selecciona tu Fecha</h2>
      <select
        className="w-full border-gray-300 border p-3 rounded-xl bg-gray-50 mb-4 focus:ring-2 focus:ring-green-500 outline-none transition"
        value={viajeSeleccionado} onChange={(e) => onSeleccionar(e.target.value)}
      >
        <option value="">-- Selecciona un viaje --</option>
        {viajes.map(v => <option key={v.id} value={v.id}>{v.fecha_salida}</option>)}
      </select>

      {viajeActual && (
        <div className="mb-4 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-xl p-3 leading-relaxed">
          <span className="font-bold text-gray-500 uppercase">Precios de esta fecha: </span>
          Paquete {bs(viajeActual.precio_paquete)} · Rappel {bs(viajeActual.precio_rappel)} · Tirolesa {bs(viajeActual.precio_tirolesa)}
          {Number(viajeActual.descuento_grupo) > 0 && <> · <span className="text-green-700 font-semibold">−{bs(viajeActual.descuento_grupo)} c/u en grupos de {viajeActual.minimo_grupo}+</span></>}
        </div>
      )}

      <div className="pt-4 border-t border-gray-100">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Crear Nueva Fecha</label>
        <div className="flex space-x-2">
          <input type="date" className="flex-1 border border-gray-300 p-2 rounded-lg text-sm outline-none focus:border-green-500" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} />
          <button onClick={crear} className="bg-gray-800 text-white px-4 rounded-lg hover:bg-gray-700 font-semibold text-sm transition">Crear</button>
        </div>
      </div>
    </div>
  )
}

export default SelectorFecha
