import { useState } from 'react'
import axios from 'axios'

function App() {
  const [mensaje, setMensaje] = useState('')
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(false)

  const procesarMensaje = async () => {
    if (!mensaje) return;
    setCargando(true);
    
    try {
      // Hacemos la petición POST a tu API de Django
      const response = await axios.post('http://127.0.0.1:8000/api/procesar-mensaje/', {
        mensaje: mensaje
      });
      // Guardamos la respuesta de la IA
      setResultado(response.data);
    } catch (error) {
      console.error("Error al procesar", error);
      alert("Hubo un error al conectar con el servidor. ¿Está Django encendido?");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-600">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Control de Reservas</h1>
        <p className="text-gray-500 mb-6">Jardín de las Delicias - Procesamiento de pasajeros</p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mensaje de WhatsApp del Turista
          </label>
          <textarea 
            className="w-full border border-gray-300 rounded-lg p-4 h-40 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
            placeholder="Pega aquí el mensaje con los datos..."
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
          ></textarea>
        </div>
        
        <button 
          onClick={procesarMensaje}
          disabled={cargando}
          className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 transition duration-200 disabled:bg-gray-400"
        >
          {cargando ? 'Analizando con Inteligencia Artificial...' : 'Procesar Datos'}
        </button>

        {/* Sección que aparece solo cuando la IA devuelve los datos */}
        {resultado && (
          <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Turistas Detectados ({resultado.length})</h2>
            <pre className="text-sm bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto shadow-inner">
              {JSON.stringify(resultado, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default App