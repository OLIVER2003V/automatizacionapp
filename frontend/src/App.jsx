import { useState, useEffect } from 'react'
import api, { leerSesion, guardarSesion, configurarSesion } from './api'
import Login from './components/Login'
import Panel from './components/Panel'

// Muestra el login hasta que haya una sesión válida; luego el panel
function App() {
  const [sesion, setSesion] = useState(leerSesion)

  const cambiarSesion = (nueva) => {
    guardarSesion(nueva)
    configurarSesion(nueva)
    setSesion(nueva)
  }

  useEffect(() => {
    // Si el servidor rechaza el token (vencido o borrado), se vuelve al login
    configurarSesion(sesion, () => cambiarSesion(null))
  }, [sesion])

  const salir = async () => {
    try { await api.post('/logout/') } catch { /* igual se cierra en este navegador */ }
    cambiarSesion(null)
  }

  if (!sesion) return <Login onEntrar={cambiarSesion} />
  return <Panel usuario={sesion.usuario} onSalir={salir} />
}

export default App
