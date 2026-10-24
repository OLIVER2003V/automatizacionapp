import { useState } from 'react'
import api from '../api'

// Usa los mismos usuarios que el admin de Django
function Login({ onEntrar }) {
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [entrando, setEntrando] = useState(false)

  const entrar = async (e) => {
    e.preventDefault()
    setEntrando(true)
    setError('')
    try {
      const response = await api.post('/login/', { username: usuario, password: clave })
      onEntrar(response.data)
    } catch (err) {
      setError(err.response?.status === 400 ? 'Usuario o contraseña incorrectos.' : 'No se pudo conectar con el servidor. Puede tardar un minuto en despertar; inténtalo de nuevo.')
    } finally { setEntrando(false) }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <form onSubmit={entrar} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm space-y-5">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-green-700 tracking-tight">Jardín de las Delicias</h1>
          <p className="text-gray-500 font-medium mt-1 text-sm">Panel de Control de Reservas</p>
        </div>
        <label className="block text-xs font-bold text-gray-500 uppercase">Usuario
          <input autoFocus autoComplete="username" className="mt-1 w-full border border-gray-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-base text-gray-800 font-normal normal-case" value={usuario} onChange={e => setUsuario(e.target.value)} />
        </label>
        <label className="block text-xs font-bold text-gray-500 uppercase">Contraseña
          <input type="password" autoComplete="current-password" className="mt-1 w-full border border-gray-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-base text-gray-800 font-normal" value={clave} onChange={e => setClave(e.target.value)} />
        </label>
        {error && <p className="text-sm text-red-600 font-semibold" role="alert">{error}</p>}
        <button type="submit" disabled={entrando || !usuario || !clave} className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 font-bold shadow-md transition-all">
          {entrando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

export default Login
