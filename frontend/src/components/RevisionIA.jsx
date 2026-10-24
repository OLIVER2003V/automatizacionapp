import { calcularMontos, bs } from '../precios'

// Paso 3: lo que extrajo la IA, editable antes de guardar. Todo el mensaje se guarda como un grupo.
function RevisionIA({ turistas, setTuristas, precios, guardando, onGuardar, onCancelar }) {
  const tamano = turistas.length
  const conDescuento = precios && tamano >= precios.minimo_grupo

  const cambiar = (i, campo, valor) =>
    setTuristas(turistas.map((t, j) => (j === i ? { ...t, [campo]: valor } : t)))

  const quitar = (i) => setTuristas(turistas.filter((_, j) => j !== i))

  const total = precios ? turistas.reduce((s, t) => s + calcularMontos(t, precios, tamano).saldo, 0) : 0

  return (
    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-sm border border-orange-200 p-6">
      <h2 className="font-bold text-orange-800 mb-1">⚠️ 3. Revisar y confirmar</h2>
      <p className="text-xs text-orange-700 mb-4">
        Se guardarán como <strong>un grupo de {tamano}</strong>.{' '}
        {precios && (conDescuento
          ? <span className="font-bold text-green-700">Descuento de {bs(precios.descuento_grupo)} por persona en el paquete.</span>
          : <span>Desde {precios.minimo_grupo} personas tienen {bs(precios.descuento_grupo)} de descuento c/u.</span>)}
      </p>

      <div className="space-y-3 mb-4 max-h-[28rem] overflow-y-auto pr-1">
        {turistas.map((t, i) => {
          const montos = precios ? calcularMontos(t, precios, tamano) : null
          return (
            <div key={i} className="bg-white p-3 rounded-xl shadow-sm text-sm border border-orange-100 space-y-2">
              <div className="flex gap-2">
                <input className="flex-1 min-w-0 font-bold text-gray-800 border-b border-transparent focus:border-orange-400 outline-none" value={t.nombre_completo || ''} onChange={e => cambiar(i, 'nombre_completo', e.target.value)} aria-label="Nombre" />
                <button onClick={() => quitar(i)} className="text-gray-400 hover:text-red-600 text-xs px-1" title="Quitar de la lista">✕</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <label className="text-[10px] uppercase font-bold text-gray-400">CI
                  <input className="block w-full border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 font-normal" value={t.ci || ''} onChange={e => cambiar(i, 'ci', e.target.value)} />
                </label>
                <label className="text-[10px] uppercase font-bold text-gray-400">Edad
                  <input type="number" className="block w-full border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 font-normal" value={t.edad ?? ''} onChange={e => cambiar(i, 'edad', e.target.value === '' ? null : Number(e.target.value))} />
                </label>
                <label className="text-[10px] uppercase font-bold text-gray-400">Reserva
                  <input type="number" className="block w-full border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 font-normal" value={t.reserva ?? ''} onChange={e => cambiar(i, 'reserva', e.target.value)} />
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={!!t.hace_rappel} onChange={e => cambiar(i, 'hace_rappel', e.target.checked)} /> Rappel</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={!!t.hace_tirolesa} onChange={e => cambiar(i, 'hace_tirolesa', e.target.checked)} /> Tirolesa</label>
                <label className="flex items-center gap-1 cursor-pointer text-red-600"><input type="checkbox" checked={!!t.es_vegetariano} onChange={e => cambiar(i, 'es_vegetariano', e.target.checked)} /> Veg.</label>
                {montos && <span className="ml-auto font-bold text-gray-700">Saldo {bs(montos.saldo)}</span>}
              </div>
              {t.condicion_medica && <p className="text-xs text-red-600">⚕️ {t.condicion_medica}</p>}
            </div>
          )
        })}
      </div>

      {precios && <p className="text-right text-sm text-orange-800 mb-3">Saldo total del grupo: <strong>{bs(total)}</strong></p>}

      <div className="flex gap-2">
        <button onClick={onCancelar} disabled={guardando} className="px-4 py-3 rounded-xl font-bold text-orange-700 hover:bg-orange-200 transition">Descartar</button>
        <button onClick={onGuardar} disabled={guardando || tamano === 0} className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 shadow-md transition-all">
          {guardando ? 'Guardando...' : `Guardar grupo (${tamano})`}
        </button>
      </div>
    </div>
  )
}

export default RevisionIA
