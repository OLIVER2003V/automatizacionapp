// Paso 2: pegar el mensaje de WhatsApp para que la IA extraiga a los turistas
function EscanerIA({ mensaje, setMensaje, cargando, onProcesar }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
      <h2 className="font-bold text-gray-800 mb-4 flex items-center">🤖 2. Escáner IA de WhatsApp</h2>
      <textarea
        className="w-full border border-gray-200 rounded-xl p-4 h-32 mb-4 font-mono text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition resize-none"
        placeholder="Pega aquí el mensaje de UN grupo (un chat)..." value={mensaje} onChange={(e) => setMensaje(e.target.value)}
      ></textarea>
      <button onClick={onProcesar} disabled={cargando || !mensaje} className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 font-bold shadow-md transition-all">
        {cargando ? 'Procesando con IA...' : 'Extraer Datos Mágicamente'}
      </button>
    </div>
  )
}

export default EscanerIA
