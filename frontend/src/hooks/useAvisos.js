import { useState, useCallback } from 'react'

// Mensajes cortos que desaparecen solos (reemplazan a los alert)
function useAvisos() {
  const [avisos, setAvisos] = useState([])

  const avisar = useCallback((texto, tipo = 'ok') => {
    const id = Date.now() + Math.random()
    setAvisos(a => [...a, { id, texto, tipo }])
    setTimeout(() => setAvisos(a => a.filter(x => x.id !== id)), 3500)
  }, [])

  return { avisos, avisar }
}

export default useAvisos
