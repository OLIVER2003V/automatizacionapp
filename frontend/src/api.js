import axios from 'axios'

// En local se configura en frontend/.env.local -> VITE_API_URL=http://127.0.0.1:8000
export const API_URL = import.meta.env.VITE_API_URL || 'https://automatizacionapp.onrender.com'

const api = axios.create({ baseURL: `${API_URL}/api` })

export default api
