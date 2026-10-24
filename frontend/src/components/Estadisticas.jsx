function Tarjeta({ titulo, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col justify-center items-center ${className}`}>
      <span className="text-gray-500 text-sm font-bold uppercase tracking-wider">{titulo}</span>
      {children}
    </div>
  )
}

function Estadisticas({ turistas }) {
  const totalRappel = turistas.filter(t => t.hace_rappel).length;
  const totalTirolesa = turistas.filter(t => t.hace_tirolesa).length;
  const totalReservasBs = turistas.reduce((sum, t) => sum + Number(t.reserva || 0), 0);
  const totalSaldoBs = turistas.reduce((sum, t) => sum + Number(t.saldo || 0), 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Tarjeta titulo="Pasajeros"><span className="text-3xl font-extrabold text-blue-600 mt-1">{turistas.length}</span></Tarjeta>
      <Tarjeta titulo="Rappel"><span className="text-3xl font-extrabold text-orange-500 mt-1">{totalRappel}</span></Tarjeta>
      <Tarjeta titulo="Tirolesa"><span className="text-3xl font-extrabold text-teal-500 mt-1">{totalTirolesa}</span></Tarjeta>
      <Tarjeta titulo="Reservas"><span className="text-2xl font-extrabold text-green-600 mt-1">{totalReservasBs} <span className="text-sm">Bs</span></span></Tarjeta>
      <Tarjeta titulo="Por cobrar" className="col-span-2 md:col-span-1"><span className="text-2xl font-extrabold text-red-500 mt-1">{totalSaldoBs} <span className="text-sm">Bs</span></span></Tarjeta>
    </div>
  )
}

export default Estadisticas
