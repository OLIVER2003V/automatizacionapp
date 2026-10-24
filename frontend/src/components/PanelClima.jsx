import { useState, useEffect } from 'react'
import axios from 'axios'

// --- INTERPRETACIÓN DEL CLIMA ---
const obtenerIconoClima = (codigo) => {
  if (codigo === 0) return { emoji: '☀️', texto: 'Soleado' };
  if (codigo > 0 && codigo <= 3) return { emoji: '⛅', texto: 'Parcial' };
  if (codigo >= 51 && codigo <= 67) return { emoji: '🌧️', texto: 'Lluvia' };
  if (codigo >= 80 && codigo <= 82) return { emoji: '🌦️', texto: 'Chubascos' };
  if (codigo >= 95) return { emoji: '⛈️', texto: 'Tormenta' };
  return { emoji: '☁️', texto: 'Nublado' };
}

const formatearFecha = (fechaString) => {
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const partes = fechaString.split('-');
  const fecha = new Date(partes[0], partes[1] - 1, partes[2]);
  return `${dias[fecha.getDay()]} ${fecha.getDate()}`;
}

// Pronóstico de Open-Meteo para el Jardín de las Delicias
function PanelClima() {
  const [climaDiario, setClimaDiario] = useState([])
  const [climaHorario, setClimaHorario] = useState([])
  const [diaClimaSeleccionado, setDiaClimaSeleccionado] = useState(null)

  useEffect(() => {
    const cargarClima = async () => {
      try {
        const lat = -17.8625;
        const lon = -63.0113;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&hourly=temperature_2m,precipitation_probability,weathercode&timezone=America/La_Paz&forecast_days=14`;

        const response = await axios.get(url);

        const datosDiarios = response.data.daily.time.map((fecha, index) => ({
          fecha: fecha,
          max: response.data.daily.temperature_2m_max[index],
          min: response.data.daily.temperature_2m_min[index],
          lluvia: response.data.daily.precipitation_probability_max[index],
          codigo: response.data.daily.weathercode[index]
        }));

        const datosPorHora = response.data.hourly.time.map((tiempo, index) => ({
          tiempo: tiempo,
          temp: response.data.hourly.temperature_2m[index],
          lluvia: response.data.hourly.precipitation_probability[index],
          codigo: response.data.hourly.weathercode[index]
        }));

        setClimaDiario(datosDiarios);
        setClimaHorario(datosPorHora);

        if (datosDiarios.length > 0) {
          setDiaClimaSeleccionado(datosDiarios[0].fecha);
        }
      } catch (error) {
        console.error("No se pudo cargar el clima", error);
      }
    }
    cargarClima()
  }, [])

  return (
    <div className="bg-gradient-to-r from-cyan-700 to-blue-800 rounded-2xl shadow-md border border-blue-500 p-5 text-white">
      <h2 className="font-bold mb-3 flex justify-between items-center text-sm uppercase tracking-wider opacity-90">
        <span>🌤️ Pronóstico exacto - Jardín de las Delicias (14 Días)</span>
      </h2>

      <div className="flex overflow-x-auto gap-2 pb-2" style={{ scrollbarWidth: 'none' }}>
        {climaDiario.map((dia, idx) => {
          const icono = obtenerIconoClima(dia.codigo);
          const alertaLluvia = dia.lluvia > 40;
          const esSeleccionado = diaClimaSeleccionado === dia.fecha;

          return (
            <div
              key={idx}
              onClick={() => setDiaClimaSeleccionado(dia.fecha)}
              className={`cursor-pointer flex flex-col items-center justify-center p-2 min-w-[70px] md:min-w-[80px] rounded-xl backdrop-blur-sm border transition-all ${
                esSeleccionado ? 'bg-white/30 border-white' : 'bg-white/10 border-white/10 hover:bg-white/20'
              } ${alertaLluvia && !esSeleccionado ? 'border-red-400/80 bg-red-500/30' : ''}`}
            >
              <span className="text-xs font-medium opacity-90 mb-1">{formatearFecha(dia.fecha)}</span>
              <span className="text-2xl mb-1" title={icono.texto}>{icono.emoji}</span>
              <span className="text-sm font-bold">{Math.round(dia.max)}° <span className="text-[10px] opacity-70 font-normal">{Math.round(dia.min)}°</span></span>
              <span className={`text-[10px] mt-1 font-bold px-1.5 py-0.5 rounded ${alertaLluvia ? 'bg-red-500 text-white' : 'bg-blue-900/40 text-blue-100'}`}>
                {dia.lluvia}% 💧
              </span>
            </div>
          )
        })}
      </div>

      {diaClimaSeleccionado && (
        <div className="mt-4 pt-4 border-t border-white/20 animate-fade-in">
          <h3 className="text-xs font-bold mb-3 uppercase opacity-80 text-cyan-100">
            ⌚ Pronóstico detallado por hora - {formatearFecha(diaClimaSeleccionado)}
          </h3>
          <div className="flex overflow-x-auto gap-2 pb-2" style={{ scrollbarWidth: 'none' }}>
            {climaHorario
              .filter(h => h.tiempo.startsWith(diaClimaSeleccionado))
              .map((hora, idx) => {
                const iconoH = obtenerIconoClima(hora.codigo);
                const horaTexto = hora.tiempo.split('T')[1];
                const alertaLluviaH = hora.lluvia > 40;

                return (
                  <div key={idx} className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg bg-black/20 ${alertaLluviaH ? 'border border-red-400/50 bg-red-900/40' : ''}`}>
                    <span className="text-xs opacity-80 mb-1">{horaTexto}</span>
                    <span className="text-lg mb-1" title={iconoH.texto}>{iconoH.emoji}</span>
                    <span className="text-sm font-bold">{Math.round(hora.temp)}°</span>
                    <span className={`text-[9px] mt-1 font-bold px-1 rounded ${alertaLluviaH ? 'bg-red-500 text-white' : 'text-cyan-200'}`}>
                      {hora.lluvia}%
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}

export default PanelClima
