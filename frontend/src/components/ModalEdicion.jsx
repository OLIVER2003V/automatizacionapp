import { useState } from 'react'

// --- MODAL DE EDICIÓN FLOTANTE ---
function ModalEdicion({ turista, viajes, turistasBD, onGuardar, onCerrar }) {
  const [datosEdicion, setDatosEdicion] = useState(turista)

  // Grupos de la fecha elegida, para poder mover al pasajero
  const gruposDelViaje = [...new Set(turistasBD.filter(t => t.viaje === Number(datosEdicion.viaje) && t.grupo).map(t => t.grupo))].sort((a, b) => a - b)

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl my-8 border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">✏️ Editar Pasajero</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Viaje (Cambiar de fecha)</label>
              <select className="w-full border-gray-300 border p-2.5 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={datosEdicion.viaje} onChange={e => setDatosEdicion({...datosEdicion, viaje: Number(e.target.value), grupo: null})}>
                {viajes.map(v => <option key={v.id} value={v.id}>{v.fecha_salida}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Grupo</label>
              <select className="w-full border-gray-300 border p-2.5 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={datosEdicion.grupo ?? ''} onChange={e => setDatosEdicion({...datosEdicion, grupo: e.target.value ? Number(e.target.value) : null})}>
                <option value="">Sin grupo (va solo)</option>
                {gruposDelViaje.map((g, i) => {
                  const nombres = turistasBD.filter(t => t.grupo === g).map(t => t.nombre_completo.split(' ')[0]).join(', ')
                  return <option key={g} value={g}>G{i + 1}: {nombres}</option>
                })}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">Al cambiar de grupo se recalcula el descuento de todos.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
              <input className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" value={datosEdicion.nombre_completo || ''} onChange={e => setDatosEdicion({...datosEdicion, nombre_completo: e.target.value})} />
            </div>
            <div className="flex gap-3">
              <div className="w-2/3">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">C.I.</label>
                <input className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" value={datosEdicion.ci || ''} onChange={e => setDatosEdicion({...datosEdicion, ci: e.target.value})} />
              </div>
              <div className="w-1/3">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Edad</label>
                <input type="number" className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" value={datosEdicion.edad || ''} onChange={e => setDatosEdicion({...datosEdicion, edad: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-1/2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Celular</label>
                <input className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" value={datosEdicion.celular || ''} onChange={e => setDatosEdicion({...datosEdicion, celular: e.target.value})} />
              </div>
              <div className="w-1/2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Referencia</label>
                <input className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" value={datosEdicion.contacto_referencia || ''} onChange={e => setDatosEdicion({...datosEdicion, contacto_referencia: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reserva Depositada (Bs)</label>
              <input type="number" className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" value={datosEdicion.reserva || ''} onChange={e => setDatosEdicion({...datosEdicion, reserva: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-red-500 uppercase mb-1">Condición Médica / Alergias</label>
              <input className="w-full border border-red-200 bg-red-50 p-2.5 rounded-xl outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" placeholder="Dejar en blanco si no tiene" value={datosEdicion.condicion_medica || ''} onChange={e => setDatosEdicion({...datosEdicion, condicion_medica: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="mt-6 p-5 bg-gray-50 border border-gray-200 rounded-xl">
          <h3 className="font-bold text-sm mb-4 text-gray-700 uppercase tracking-wider">Actividades y Preferencias</h3>
          <div className="flex flex-wrap gap-8">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" checked={datosEdicion.hace_rappel || false} onChange={e => setDatosEdicion({...datosEdicion, hace_rappel: e.target.checked})} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
              <span className="font-semibold text-gray-700">Rappel</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" checked={datosEdicion.hace_tirolesa || false} onChange={e => setDatosEdicion({...datosEdicion, hace_tirolesa: e.target.checked})} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
              <span className="font-semibold text-gray-700">Tirolesa</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" checked={datosEdicion.es_vegetariano || false} onChange={e => setDatosEdicion({...datosEdicion, es_vegetariano: e.target.checked})} className="w-5 h-5 text-red-600 rounded border-red-300 focus:ring-red-500" />
              <span className="font-bold text-red-600">Es Vegetariano</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-100">
          <button onClick={onCerrar} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition">Cancelar</button>
          <button onClick={() => onGuardar(datosEdicion)} className="px-6 py-2.5 bg-blue-600 font-bold text-white rounded-xl hover:bg-blue-700 shadow-md transition">Guardar Cambios</button>
        </div>
      </div>
    </div>
  )
}

export default ModalEdicion
