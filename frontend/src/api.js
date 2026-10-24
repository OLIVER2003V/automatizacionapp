import axios from 'axios'

// En local se configura en frontend/.env.local -> VITE_API_URL=http://127.0.0.1:8000
export const API_URL = import.meta.env.VITE_API_URL || 'https://automatizacionapp.onrender.com'

const CLAVE_SESION = 'sesion'

// El navegador puede bloquear localStorage (modo privado); en ese caso la sesión dura hasta recargar
export const leerSesion = () => {
  try { return JSON.parse(localStorage.getItem(CLAVE_SESION)) } catch { return null }
}

export const guardarSesion = (sesion) => {
  try {
    if (sesion) localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
    else localStorage.removeItem(CLAVE_SESION)
  } catch { /* sin almacenamiento */ }
}

const api = axios.create({ baseURL: `${API_URL}/api` })

let sesionActual = leerSesion()
let alExpirar = () => {}

export const configurarSesion = (sesion, onExpira) => {
  sesionActual = sesion
  if (onExpira) alExpirar = onExpira
}

api.interceptors.request.use(config => {
  if (sesionActual?.token) config.headers.Authorization = `Token ${sesionActual.token}`
  return config
})

// Token vencido o borrado: volver a la pantalla de login
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && sesionActual) alExpirar()
    return Promise.reject(error)
  }
)

export default api
