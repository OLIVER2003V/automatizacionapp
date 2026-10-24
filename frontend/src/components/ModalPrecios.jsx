import { useState } from 'react'

const CAMPOS = [
  ['precio_paquete', 'Paquete (Bs)'],
  ['precio_rappel', 'Rappel (Bs)'],
  ['precio_tirolesa', 'Tirolesa (Bs)'],
  ['descuento_grupo', 'Descuento por persona en grupo (Bs)'],
  ['minimo_grupo', 'Personas mínimas para descuento'],
  ['reserva_sugerida', 'Reserva sugerida (Bs)'],
]

// Edita la tarifa vigente. Opcionalmente la aplica también al viaje seleccionado.
function ModalPrecios({ tarifa, viaje, onGuardar, onCerrar }) {
  const [datos, setDatos] = useState(tarifa)
  const [aplicarAlViaje, setAplicarAlViaje] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const guardar = async () => {
    setGuardando(true)
    try { await onGuardar(datos, aplicarAlViaje) } finally { setGuardando(false) }
  }

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-gray-100">
        <h2 className="text-2xl font-bold mb-1 text-gray-800">💲 Precios</h2>
        <p className="text-sm text-gray-500 mb-6">Se aplican a las fechas que crees desde ahora. Las fechas ya creadas conservan sus precios.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CAMPOS.map(([campo, etiqueta]) => (
            <label key={campo} className="block text-xs font-bold text-gray-500 uppercase">
              {etiqueta}
              <input type="number" min="0" className="mt-1 w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500 text-base text-gray-800 font-normal" value={datos[campo] ?? ''} onChange={e => setDatos({ ...datos, [campo]: e.target.value })} />
            </label>
          ))}
        </div>

        {viaje && (
          <label className="mt-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer">
            <input type="checkbox" className="mt-1 w-5 h-5" checked={aplicarAlViaje} onChange={e => setAplicarAlViaje(e.target.checked)} />
            <span className="text-sm text-amber-900">
              Aplicar también a la fecha <strong>{viaje.fecha_salida}</strong>.
              <span className="block text-xs text-amber-700">Se recalculan los saldos de los {viaje.turistas?.length ?? 0} pasajeros ya registrados.</span>
            </span>
          </label>
        )}

        <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-100">
          <button onClick={onCerrar} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition">Cancelar</button>
          <button onClick={guardar} disabled={guardando} className="px-6 py-2.5 bg-blue-600 font-bold text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-md transition">{guardando ? 'Guardando...' : 'Guardar precios'}</button>
        </div>
      </div>
    </div>
  )
}

export default ModalPrecios
