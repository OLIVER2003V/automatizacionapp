import { colorGrupo } from '../precios'

// Lista de pasajeros de la fecha, agrupados y con los colores del Excel de logística
function TablaPasajeros({ turistas, numeroGrupo, tamanoGrupo, busqueda, setBusqueda, deshabilitarDescargas, onContactos, onExcel, onEditar, onEliminar }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col xl:flex-row justify-between items-center gap-4">
        <div className="relative w-full xl:w-1/3">
          <input
            type="text"
            placeholder="🔍 Buscar turista o CI..."
            className="w-full border border-gray-300 rounded-xl p-2 pl-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full xl:w-auto justify-end">
          <button
            onClick={onContactos}
            disabled={deshabilitarDescargas}
            className="flex-1 md:flex-none bg-green-100 text-green-700 font-bold py-2 px-4 rounded-xl hover:bg-green-200 disabled:opacity-50 text-sm transition shadow-sm"
          >
            📇 Archivo Contactos
          </button>
          <button
            onClick={() => onExcel('cobro')}
            disabled={deshabilitarDescargas}
            className="flex-1 md:flex-none bg-blue-100 text-blue-700 font-bold py-2 px-4 rounded-xl hover:bg-blue-200 disabled:opacity-50 text-sm transition shadow-sm"
          >
            📄 Excel Cobros
          </button>
          <button
            onClick={() => onExcel('logistica')}
            disabled={deshabilitarDescargas}
            className="flex-1 md:flex-none bg-emerald-100 text-emerald-700 font-bold py-2 px-4 rounded-xl hover:bg-emerald-200 disabled:opacity-50 text-sm transition shadow-sm"
          >
            📊 Excel Logística
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-white border-b text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-bold text-center">Grupo</th>
              <th className="p-4 font-bold">Turista</th>
              <th className="p-4 font-bold text-center">Actividades</th>
              <th className="p-4 font-bold">Finanzas</th>
              <th className="p-4 font-bold text-center">Alertas / Obs</th>
              <th className="p-4 font-bold text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {turistas.map(t => {
              const tieneAlerta = t.es_vegetariano || (t.condicion_medica && t.condicion_medica.trim() !== '');
              const n = numeroGrupo[t.grupo];
              const color = n ? colorGrupo(n) : 'transparent';
              return (
                <tr key={t.id} className={`border-b transition-colors hover:bg-gray-50 ${tieneAlerta ? 'bg-red-50/40' : 'bg-white'}`} style={{ boxShadow: `inset 6px 0 0 ${color}` }}>
                  <td className="p-4 text-center">
                    {n ? (
                      <span className="inline-block px-2 py-1 rounded-lg text-xs font-bold text-gray-800" style={{ backgroundColor: color }} title={`${tamanoGrupo[t.grupo]} personas en el grupo`}>
                        G{n} · {tamanoGrupo[t.grupo]}
                      </span>
                    ) : <span className="text-gray-300 text-xs">-</span>}
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-gray-800">{t.nombre_completo}</p>
                    <p className="text-xs text-gray-500">CI: {t.ci || '-'} | Cel: {t.celular || '-'}</p>
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex justify-center space-x-1">
                      {t.hace_rappel ? <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold text-xs">Rappel</span> : null}
                      {t.hace_tirolesa ? <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded font-bold text-xs">Tirolesa</span> : null}
                      {!t.hace_rappel && !t.hace_tirolesa && <span className="text-gray-400 text-xs">-</span>}
                    </div>
                  </td>

                  <td className="p-4">
                    <p className="text-xs"><span className="text-gray-500">Res:</span> <strong className="text-green-600">{t.reserva}</strong></p>
                    {Number(t.descuento) > 0 && <p className="text-xs"><span className="text-gray-500">Desc:</span> <strong className="text-emerald-700">−{t.descuento}</strong></p>}
                    <p className="text-xs"><span className="text-gray-500">Sal:</span> <strong className="text-red-500">{t.saldo}</strong></p>
                  </td>

                  <td className="p-4 text-center">
                    {tieneAlerta ? (
                      <div className="flex flex-col items-center gap-1">
                        {t.es_vegetariano && <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold shadow-sm">Vegetariano</span>}
                        {t.condicion_medica && <span className="text-red-600 text-xs font-bold max-w-[150px] truncate" title={t.condicion_medica}>{t.condicion_medica}</span>}
                      </div>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>

                  <td className="p-4 text-center">
                    <button onClick={() => onEditar(t)} className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition" title="Editar">✏️</button>
                    <button onClick={() => onEliminar(t.id)} className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition ml-1" title="Eliminar">🗑️</button>
                  </td>
                </tr>
              );
            })}
            {turistas.length === 0 && (
              <tr><td colSpan="6" className="p-8 text-center text-gray-400">No hay pasajeros para mostrar.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TablaPasajeros
