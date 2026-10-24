function Avisos({ avisos }) {
  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] space-y-2" aria-live="polite">
      {avisos.map(a => (
        <div key={a.id} className={`px-4 py-3 rounded-xl shadow-lg font-semibold text-sm text-white ${a.tipo === 'error' ? 'bg-red-600' : 'bg-gray-900'}`}>
          {a.tipo === 'error' ? '⚠️ ' : '✅ '}{a.texto}
        </div>
      ))}
    </div>
  )
}

export default Avisos
