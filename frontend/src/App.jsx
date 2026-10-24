import { useState, useEffect } from 'react'
import axios from 'axios'
import api, { API_URL } from './api'
import { colorGrupo, bs } from './precios'
import RevisionIA from './components/RevisionIA'
import ModalPrecios from './components/ModalPrecios'

function App() {
  // --- ESTADOS ---
  const [tarifa, setTarifa] = useState(null)
  const [modalPrecios, setModalPrecios] = useState(false)
  const [avisos, setAvisos] = useState([])

  const [viajes, setViajes] = useState([])
  const [viajeSeleccionado, setViajeSeleccionado] = useState('')
  const [nuevaFecha, setNuevaFecha] = useState('')

  const [mensaje, setMensaje] = useState('')
  const [turistasIA, setTuristasIA] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [turistasBD, setTuristasBD] = useState([])
  const [modalEdicion, setModalEdicion] = useState(false)
  const [datosEdicion, setDatosEdicion] = useState({})
  const [busqueda, setBusqueda] = useState('')

  const [climaDiario, setClimaDiario] = useState([])
  const [climaHorario, setClimaHorario] = useState([])
  const [diaClimaSeleccionado, setDiaClimaSeleccionado] = useState(null)

  // --- AVISOS (reemplazan a los alert) ---
  const avisar = (texto, tipo = 'ok') => {
    const id = Date.now() + Math.random()
    setAvisos(a => [...a, { id, texto, tipo }])
    setTimeout(() => setAvisos(a => a.filter(x => x.id !== id)), 3500)
  }

  // --- FUNCIONES DE CARGA ---
  const cargarViajes = async () => {
    try {
      const response = await api.get('/viajes/')
      setViajes(response.data)
      if (response.data.length > 0 && !viajeSeleccionado) {
        setViajeSeleccionado(response.data[0].id)
      }
    } catch (error) { console.error(error); avisar("No se pudieron cargar las fechas.", 'error') }
  }

  const cargarTuristasBD = async () => {
    try {
      const response = await api.get('/turistas/')
      setTuristasBD(response.data)
    } catch (error) { console.error(error); avisar("No se pudieron cargar los pasajeros.", 'error') }
  }

  const cargarTarifa = async () => {
    try {
      const response = await api.get('/tarifa/')
      setTarifa(response.data)
    } catch (error) { console.error(error) }
  }

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

  useEffect(() => {
    cargarViajes()
    cargarTuristasBD()
    cargarTarifa()
    cargarClima()
  }, [])

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

  // --- FUNCIONES DE VIAJES E IA ---
  const crearViaje = async () => {
    if (!nuevaFecha) return;
    try {
      const response = await api.post('/viajes/', { fecha_salida: nuevaFecha, destino: 'Jardín de las Delicias' })
      avisar("¡Fecha creada!")
      setNuevaFecha('')
      setViajeSeleccionado(response.data.id)
      cargarViajes()
    } catch { avisar("Error al crear la fecha. ¿Ya existe?", 'error') }
  }

  const procesarMensaje = async () => {
    if (!mensaje) return;
    setCargando(true);
    try {
      const response = await api.post('/procesar-mensaje/', { mensaje: mensaje });
      const reserva = tarifa?.reserva_sugerida ?? 50
      setTuristasIA(response.data.map(t => ({ reserva, ...t })));
    } catch { avisar("La IA no pudo leer el mensaje. Inténtalo de nuevo.", 'error'); }
    finally { setCargando(false); }
  }

  const guardarEnBaseDeDatos = async () => {
    if (!viajeSeleccionado) return avisar("Selecciona una fecha de salida arriba.", 'error');
    setGuardando(true);
    try {
      // Todo el mensaje se guarda como un grupo (de ahí sale el descuento)
      await api.post('/grupos/', { viaje: viajeSeleccionado, turistas: turistasIA });
      avisar(`¡Grupo de ${turistasIA.length} guardado!`);
      setTuristasIA(null); setMensaje('');
      cargarTuristasBD();
      cargarViajes();
    } catch { avisar("Error al guardar. Revisa los datos.", 'error'); }
    finally { setGuardando(false); }
  }

  const guardarPrecios = async (datos, aplicarAlViaje) => {
    try {
      const response = await api.put('/tarifa/', datos)
      setTarifa(response.data)
      if (aplicarAlViaje && viajeActual) {
        const campos = ['precio_paquete', 'precio_rappel', 'precio_tirolesa', 'descuento_grupo', 'minimo_grupo']
        await api.patch(`/viajes/${viajeActual.id}/`, Object.fromEntries(campos.map(c => [c, response.data[c]])))
        cargarTuristasBD()
      }
      cargarViajes()
      setModalPrecios(false)
      avisar("Precios actualizados")
    } catch { avisar("Error al guardar los precios.", 'error') }
  }

  // --- FUNCIONES CRUD ---
  const eliminarTurista = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar a este pasajero?")) return;
    try {
      await api.delete(`/turistas/${id}/`)
      cargarTuristasBD()
      avisar("Pasajero eliminado")
    } catch { avisar("Error al eliminar", 'error') }
  }

  const abrirEdicion = (turista) => {
    setDatosEdicion(turista)
    setModalEdicion(true)
  }

  const guardarEdicion = async () => {
    try {
      await api.put(`/turistas/${datosEdicion.id}/`, datosEdicion)
      setModalEdicion(false)
      // Cambiar a alguien de grupo cambia los saldos de sus compañeros
      cargarTuristasBD()
      avisar("¡Pasajero actualizado!")
    } catch { avisar("Error al actualizar", 'error') }
  }

  // --- LÓGICA DE FILTRADO Y ESTADÍSTICAS ---
  const viajeActual = viajes.find(v => v.id === parseInt(viajeSeleccionado));
  const turistasDelViaje = turistasBD.filter(t => t.viaje === parseInt(viajeSeleccionado));

  // Grupos numerados G1, G2... en orden de llegada (igual que en el Excel)
  const idsGrupo = [...new Set(turistasDelViaje.map(t => t.grupo).filter(Boolean))].sort((a, b) => a - b);
  const numeroGrupo = Object.fromEntries(idsGrupo.map((id, i) => [id, i + 1]));
  const tamanoGrupo = turistasDelViaje.reduce((acc, t) => (t.grupo ? { ...acc, [t.grupo]: (acc[t.grupo] || 0) + 1 } : acc), {});

  const turistasFiltrados = turistasDelViaje
    .filter(t => t.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) || t.ci?.includes(busqueda))
    .sort((a, b) => (a.grupo ?? Infinity) - (b.grupo ?? Infinity) || a.id - b.id);

  const totalPasajeros = turistasFiltrados.length;
  const totalRappel = turistasFiltrados.filter(t => t.hace_rappel).length;
  const totalTirolesa = turistasFiltrados.filter(t => t.hace_tirolesa).length;
  const totalReservasBs = turistasFiltrados.reduce((sum, t) => sum + Number(t.reserva || 0), 0);
  const totalSaldoBs = turistasFiltrados.reduce((sum, t) => sum + Number(t.saldo || 0), 0);

  // --- GENERADOR DE ARCHIVO DE CONTACTOS (VCF) ---
  const descargarContactosVCF = () => {
    let prefijoTour = 'Tour';
    
    // Convertimos la fecha YYYY-MM-DD a DD/MM/YYYY
    if (viajeActual && viajeActual.fecha_salida) {
      const [anio, mes, dia] = viajeActual.fecha_salida.split('-');
      prefijoTour = `${dia}/${mes}/${anio}`;
    }

    let contenidoVCF = "";
    let contador = 0;

    turistasFiltrados.forEach(t => {
      if (t.celular && t.celular.trim() !== '') {
        const numeroLimpio = `+591${t.celular.replace(/\s+/g, '')}`;
        // Formato final: "DD/MM/YYYY - Nombre Completo"
        contenidoVCF += `BEGIN:VCARD\nVERSION:3.0\nFN:${prefijoTour} - ${t.nombre_completo}\nTEL;TYPE=CELL:${numeroLimpio}\nEND:VCARD\n`;
        contador++;
      }
    });

    if (contador === 0) {
      avisar("No hay celulares personales registrados para exportar.", 'error');
      return;
    }

    const blob = new Blob([contenidoVCF], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // El archivo se descargará con la fecha en el nombre, cambiando las barras por guiones para que sea válido en Windows
    const nombreArchivo = prefijoTour.replace(/\//g, '-');
    link.download = `Contactos_${nombreArchivo}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      
      {/* HEADER DE LA APLICACIÓN */}
      <div className="max-w-7xl mx-auto mb-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-green-700 tracking-tight">Jardín de las Delicias</h1>
          <p className="text-gray-500 font-medium mt-1">Panel de Control de Reservas Logísticas</p>
        </div>
        <button onClick={() => setModalPrecios(true)} disabled={!tarifa} className="mt-4 md:mt-0 bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-xl font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition">
          💲 Precios
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: GESTIÓN E IA */}
        <div className="xl:col-span-1 space-y-6">
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center">🗓️ 1. Selecciona tu Fecha</h2>
            <select 
              className="w-full border-gray-300 border p-3 rounded-xl bg-gray-50 mb-4 focus:ring-2 focus:ring-green-500 outline-none transition"
              value={viajeSeleccionado} onChange={(e) => setViajeSeleccionado(e.target.value)}
            >
              <option value="">-- Selecciona un viaje --</option>
              {viajes.map(v => <option key={v.id} value={v.id}>{v.fecha_salida}</option>)}
            </select>

            {viajeActual && (
              <div className="mb-4 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-xl p-3 leading-relaxed">
                <span className="font-bold text-gray-500 uppercase">Precios de esta fecha: </span>
                Paquete {bs(viajeActual.precio_paquete)} · Rappel {bs(viajeActual.precio_rappel)} · Tirolesa {bs(viajeActual.precio_tirolesa)}
                {Number(viajeActual.descuento_grupo) > 0 && <> · <span className="text-green-700 font-semibold">−{bs(viajeActual.descuento_grupo)} c/u en grupos de {viajeActual.minimo_grupo}+</span></>}
              </div>
            )}

            <div className="pt-4 border-t border-gray-100">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Crear Nueva Fecha</label>
              <div className="flex space-x-2">
                <input type="date" className="flex-1 border border-gray-300 p-2 rounded-lg text-sm outline-none focus:border-green-500" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} />
                <button onClick={crearViaje} className="bg-gray-800 text-white px-4 rounded-lg hover:bg-gray-700 font-semibold text-sm transition">Crear</button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
            <h2 className="font-bold text-gray-800 mb-4 flex items-center">🤖 2. Escáner IA de WhatsApp</h2>
            <textarea 
              className="w-full border border-gray-200 rounded-xl p-4 h-32 mb-4 font-mono text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition resize-none"
              placeholder="Pega los mensajes de los turistas aquí..." value={mensaje} onChange={(e) => setMensaje(e.target.value)}
            ></textarea>
            <button onClick={procesarMensaje} disabled={cargando || !mensaje} className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 font-bold shadow-md transition-all">
              {cargando ? 'Procesando con IA...' : 'Extraer Datos Mágicamente'}
            </button>
          </div>

          {turistasIA && (
            <RevisionIA
              turistas={turistasIA}
              setTuristas={setTuristasIA}
              precios={viajeActual}
              guardando={guardando}
              onGuardar={guardarEnBaseDeDatos}
              onCancelar={() => setTuristasIA(null)}
            />
          )}
        </div>

        {/* COLUMNA DERECHA: DASHBOARD, CLIMA Y TABLA */}
        <div className="xl:col-span-2 space-y-6">
          
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

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col justify-center items-center">
              <span className="text-gray-500 text-sm font-bold uppercase tracking-wider">Pasajeros</span>
              <span className="text-3xl font-extrabold text-blue-600 mt-1">{totalPasajeros}</span>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col justify-center items-center">
              <span className="text-gray-500 text-sm font-bold uppercase tracking-wider">Rappel</span>
              <span className="text-3xl font-extrabold text-orange-500 mt-1">{totalRappel}</span>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col justify-center items-center">
              <span className="text-gray-500 text-sm font-bold uppercase tracking-wider">Tirolesa</span>
              <span className="text-3xl font-extrabold text-teal-500 mt-1">{totalTirolesa}</span>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col justify-center items-center">
              <span className="text-gray-500 text-sm font-bold uppercase tracking-wider">Reservas</span>
              <span className="text-2xl font-extrabold text-green-600 mt-1">{totalReservasBs} <span className="text-sm">Bs</span></span>
            </div>
            <div className="col-span-2 md:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col justify-center items-center">
              <span className="text-gray-500 text-sm font-bold uppercase tracking-wider">Por cobrar</span>
              <span className="text-2xl font-extrabold text-red-500 mt-1">{totalSaldoBs} <span className="text-sm">Bs</span></span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col xl:flex-row justify-between items-center gap-4">
              <div className="relative w-full xl:w-1/3">
                <input 
                  type="text" 
                  placeholder="🔍 Buscar turista o CI..." 
                  className="w-full border border-gray-300 rounded-xl p-2 pl-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap space-x-2 w-full xl:w-auto justify-end">
                <button 
                  onClick={descargarContactosVCF}
                  disabled={!viajeSeleccionado || turistasFiltrados.length === 0}
                  className="flex-1 md:flex-none bg-green-100 text-green-700 font-bold py-2 px-4 rounded-xl hover:bg-green-200 disabled:opacity-50 text-sm transition shadow-sm"
                >
                  📇 Archivo Contactos
                </button>
                <button 
                  onClick={() => window.open(`${API_URL}/api/exportar-excel/${viajeSeleccionado}/cobro/`, '_blank')}
                  disabled={!viajeSeleccionado || turistasFiltrados.length === 0}
                  className="flex-1 md:flex-none bg-blue-100 text-blue-700 font-bold py-2 px-4 rounded-xl hover:bg-blue-200 disabled:opacity-50 text-sm transition shadow-sm"
                >
                  📄 Excel Cobros
                </button>
                <button 
                  onClick={() => window.open(`${API_URL}/api/exportar-excel/${viajeSeleccionado}/logistica/`, '_blank')}
                  disabled={!viajeSeleccionado || turistasFiltrados.length === 0}
                  className="flex-1 md:flex-none bg-emerald-100 text-emerald-700 font-bold py-2 px-4 rounded-xl hover:bg-emerald-200 disabled:opacity-50 text-sm transition shadow-sm"
                >
                  📊 Excel Logística
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-white border-b text-gray-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold text-center">Grupo</th>
                    <th className="p-4 font-bold">Turista</th>
                    <th className="p-4 font-bold text-center">Actividades</th>
                    <th className="p-4 font-bold">Finanzas</th>
                    <th className="p-4 font-bold text-center">Alertas / Obs</th>
                    <th className="p-4 font-bold text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {turistasFiltrados.map(t => {
                    const tieneAlerta = t.es_vegetariano || (t.condicion_medica && t.condicion_medica.trim() !== '');
                    const n = numeroGrupo[t.grupo];
                    const color = n ? colorGrupo(n) : 'transparent';
                    return (
                      <tr key={t.id} className={`border-b transition-colors hover:bg-gray-50 ${tieneAlerta ? 'bg-red-50/40' : 'bg-white'}`} style={{ boxShadow: `inset 6px 0 0 ${color}` }}>
                        <td className="p-4 text-center">
                          {n ? (
                            <span className="inline-block px-2 py-1 rounded-lg text-xs font-bold text-gray-800" style={{ backgroundColor: color }} title={`${tamanoGrupo[t.grupo]} personas en el grupo`}>
                              G{n} · {tamanoGrupo[t.grupo]}
                            </span>
                          ) : <span className="text-gray-300 text-xs">-</span>}
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-gray-800">{t.nombre_completo}</p>
                          <p className="text-xs text-gray-500">CI: {t.ci || '-'} | Cel: {t.celular || '-'}</p>
                        </td>
                        
                        <td className="p-4 text-center">
                          <div className="flex justify-center space-x-1">
                            {t.hace_rappel ? <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold text-xs">Rappel</span> : null}
                            {t.hace_tirolesa ? <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded font-bold text-xs">Tirolesa</span> : null}
                            {!t.hace_rappel && !t.hace_tirolesa && <span className="text-gray-400 text-xs">-</span>}
                          </div>
                        </td>

                        <td className="p-4">
                          <p className="text-xs"><span className="text-gray-500">Res:</span> <strong className="text-green-600">{t.reserva}</strong></p>
                          {Number(t.descuento) > 0 && <p className="text-xs"><span className="text-gray-500">Desc:</span> <strong className="text-emerald-700">−{t.descuento}</strong></p>}
                          <p className="text-xs"><span className="text-gray-500">Sal:</span> <strong className="text-red-500">{t.saldo}</strong></p>
                        </td>

                        <td className="p-4 text-center">
                          {tieneAlerta ? (
                            <div className="flex flex-col items-center gap-1">
                              {t.es_vegetariano && <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold shadow-sm">Vegetariano</span>}
                              {t.condicion_medica && <span className="text-red-600 text-xs font-bold max-w-[150px] truncate" title={t.condicion_medica}>{t.condicion_medica}</span>}
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>

                        <td className="p-4 text-center">
                          <button onClick={() => abrirEdicion(t)} className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition" title="Editar">✏️</button>
                          <button onClick={() => eliminarTurista(t.id)} className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition ml-1" title="Eliminar">🗑️</button>
                        </td>
                      </tr>
                    );
                  })}
                  {turistasFiltrados.length === 0 && (
                    <tr><td colSpan="6" className="p-8 text-center text-gray-400">No hay pasajeros para mostrar.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE EDICIÓN FLOTANTE */}
      {modalEdicion && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl my-8 border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">✏️ Editar Pasajero</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Viaje (Cambiar de fecha)</label>
                  <select className="w-full border-gray-300 border p-2.5 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={datosEdicion.viaje} onChange={e => setDatosEdicion({...datosEdicion, viaje: Number(e.target.value), grupo: null})}>
                    {viajes.map(v => <option key={v.id} value={v.id}>{v.fecha_salida}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Grupo</label>
                  <select className="w-full border-gray-300 border p-2.5 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={datosEdicion.grupo ?? ''} onChange={e => setDatosEdicion({...datosEdicion, grupo: e.target.value ? Number(e.target.value) : null})}>
                    <option value="">Sin grupo (va solo)</option>
                    {[...new Set(turistasBD.filter(t => t.viaje === Number(datosEdicion.viaje) && t.grupo).map(t => t.grupo))].sort((a, b) => a - b).map((g, i) => {
                      const nombres = turistasBD.filter(t => t.grupo === g).map(t => t.nombre_completo.split(' ')[0]).join(', ')
                      return <option key={g} value={g}>G{i + 1}: {nombres}</option>
                    })}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">Al cambiar de grupo se recalcula el descuento de todos.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
                  <input className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" value={datosEdicion.nombre_completo || ''} onChange={e => setDatosEdicion({...datosEdicion, nombre_completo: e.target.value})} />
                </div>
                <div className="flex gap-3">
                  <div className="w-2/3">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">C.I.</label>
                    <input className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" value={datosEdicion.ci || ''} onChange={e => setDatosEdicion({...datosEdicion, ci: e.target.value})} />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Edad</label>
                    <input type="number" className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" value={datosEdicion.edad || ''} onChange={e => setDatosEdicion({...datosEdicion, edad: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-1/2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Celular</label>
                    <input className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" value={datosEdicion.celular || ''} onChange={e => setDatosEdicion({...datosEdicion, celular: e.target.value})} />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Referencia</label>
                    <input className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" value={datosEdicion.contacto_referencia || ''} onChange={e => setDatosEdicion({...datosEdicion, contacto_referencia: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reserva Depositada (Bs)</label>
                  <input type="number" className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" value={datosEdicion.reserva || ''} onChange={e => setDatosEdicion({...datosEdicion, reserva: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-red-500 uppercase mb-1">Condición Médica / Alergias</label>
                  <input className="w-full border border-red-200 bg-red-50 p-2.5 rounded-xl outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" placeholder="Dejar en blanco si no tiene" value={datosEdicion.condicion_medica || ''} onChange={e => setDatosEdicion({...datosEdicion, condicion_medica: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="mt-6 p-5 bg-gray-50 border border-gray-200 rounded-xl">
              <h3 className="font-bold text-sm mb-4 text-gray-700 uppercase tracking-wider">Actividades y Preferencias</h3>
              <div className="flex flex-wrap gap-8">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={datosEdicion.hace_rappel || false} onChange={e => setDatosEdicion({...datosEdicion, hace_rappel: e.target.checked})} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                  <span className="font-semibold text-gray-700">Rappel</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={datosEdicion.hace_tirolesa || false} onChange={e => setDatosEdicion({...datosEdicion, hace_tirolesa: e.target.checked})} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                  <span className="font-semibold text-gray-700">Tirolesa</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={datosEdicion.es_vegetariano || false} onChange={e => setDatosEdicion({...datosEdicion, es_vegetariano: e.target.checked})} className="w-5 h-5 text-red-600 rounded border-red-300 focus:ring-red-500" />
                  <span className="font-bold text-red-600">Es Vegetariano</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-100">
              <button onClick={() => setModalEdicion(false)} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition">Cancelar</button>
              <button onClick={guardarEdicion} className="px-6 py-2.5 bg-blue-600 font-bold text-white rounded-xl hover:bg-blue-700 shadow-md transition">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {modalPrecios && tarifa && (
        <ModalPrecios tarifa={tarifa} viaje={viajeActual} onGuardar={guardarPrecios} onCerrar={() => setModalPrecios(false)} />
      )}

      {/* AVISOS */}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] space-y-2" aria-live="polite">
        {avisos.map(a => (
          <div key={a.id} className={`px-4 py-3 rounded-xl shadow-lg font-semibold text-sm text-white ${a.tipo === 'error' ? 'bg-red-600' : 'bg-gray-900'}`}>
            {a.tipo === 'error' ? '⚠️ ' : '✅ '}{a.texto}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App