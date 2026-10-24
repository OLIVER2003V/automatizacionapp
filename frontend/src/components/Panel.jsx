import { useState, useEffect, useCallback } from 'react'
import api from '../api'
import { descargarExcel, descargarContactosVCF } from '../descargas'
import useAvisos from '../hooks/useAvisos'
import Avisos from './Avisos'
import SelectorFecha from './SelectorFecha'
import EscanerIA from './EscanerIA'
import RevisionIA from './RevisionIA'
import PanelClima from './PanelClima'
import Estadisticas from './Estadisticas'
import TablaPasajeros from './TablaPasajeros'
import ModalEdicion from './ModalEdicion'
import ModalPrecios from './ModalPrecios'

function Panel({ usuario, onSalir }) {
  // --- ESTADOS ---
  const { avisos, avisar } = useAvisos()
  const [tarifa, setTarifa] = useState(null)
  const [modalPrecios, setModalPrecios] = useState(false)

  const [viajes, setViajes] = useState([])
  const [viajeSeleccionado, setViajeSeleccionado] = useState('')

  const [mensaje, setMensaje] = useState('')
  const [turistasIA, setTuristasIA] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [turistasBD, setTuristasBD] = useState([])
  const [turistaEditando, setTuristaEditando] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  // --- FUNCIONES DE CARGA ---
  const cargarViajes = useCallback(async () => {
    try {
      const response = await api.get('/viajes/')
      setViajes(response.data)
      setViajeSeleccionado(actual => actual || (response.data[0]?.id ?? ''))
    } catch (error) { console.error(error); avisar("No se pudieron cargar las fechas.", 'error') }
  }, [avisar])

  const cargarTuristasBD = useCallback(async () => {
    try {
      const response = await api.get('/turistas/')
      setTuristasBD(response.data)
    } catch (error) { console.error(error); avisar("No se pudieron cargar los pasajeros.", 'error') }
  }, [avisar])

  useEffect(() => {
    cargarViajes()
    cargarTuristasBD()
    api.get('/tarifa/').then(r => setTarifa(r.data)).catch(console.error)
  }, [cargarViajes, cargarTuristasBD])

  // --- FUNCIONES DE VIAJES E IA ---
  const crearViaje = async (fecha) => {
    try {
      const response = await api.post('/viajes/', { fecha_salida: fecha, destino: 'Jardín de las Delicias' })
      avisar("¡Fecha creada!")
      setViajeSeleccionado(response.data.id)
      cargarViajes()
      return true
    } catch { avisar("Error al crear la fecha. ¿Ya existe?", 'error'); return false }
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

  const guardarEdicion = async (datos) => {
    try {
      await api.put(`/turistas/${datos.id}/`, datos)
      setTuristaEditando(null)
      // Cambiar a alguien de grupo cambia los saldos de sus compañeros
      cargarTuristasBD()
      avisar("¡Pasajero actualizado!")
    } catch { avisar("Error al actualizar", 'error') }
  }

  // --- DESCARGAS ---
  const bajarExcel = async (tipo) => {
    try { await descargarExcel(viajeActual, tipo) }
    catch { avisar("No se pudo generar el Excel.", 'error') }
  }

  const bajarContactos = () => {
    if (descargarContactosVCF(turistasFiltrados, viajeActual) === 0) {
      avisar("No hay celulares personales registrados para exportar.", 'error');
    }
  }

  // --- LÓGICA DE FILTRADO ---
  const viajeActual = viajes.find(v => v.id === parseInt(viajeSeleccionado));
  const turistasDelViaje = turistasBD.filter(t => t.viaje === parseInt(viajeSeleccionado));

  // Grupos numerados G1, G2... en orden de llegada (igual que en el Excel)
  const idsGrupo = [...new Set(turistasDelViaje.map(t => t.grupo).filter(Boolean))].sort((a, b) => a - b);
  const numeroGrupo = Object.fromEntries(idsGrupo.map((id, i) => [id, i + 1]));
  const tamanoGrupo = turistasDelViaje.reduce((acc, t) => (t.grupo ? { ...acc, [t.grupo]: (acc[t.grupo] || 0) + 1 } : acc), {});

  const turistasFiltrados = turistasDelViaje
    .filter(t => t.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) || t.ci?.includes(busqueda))
    .sort((a, b) => (a.grupo ?? Infinity) - (b.grupo ?? Infinity) || a.id - b.id);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">

      {/* HEADER DE LA APLICACIÓN */}
      <div className="max-w-7xl mx-auto mb-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-green-700 tracking-tight">Jardín de las Delicias</h1>
          <p className="text-gray-500 font-medium mt-1">Panel de Control de Reservas Logísticas</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setModalPrecios(true)} disabled={!tarifa} className="bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-xl font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition">
            💲 Precios
          </button>
          <button onClick={onSalir} className="px-4 py-2 rounded-xl font-semibold text-gray-500 hover:bg-gray-200 transition" title={`Sesión de ${usuario}`}>
            Salir ({usuario})
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* COLUMNA IZQUIERDA: GESTIÓN E IA */}
        <div className="xl:col-span-1 space-y-6">
          <SelectorFecha
            viajes={viajes}
            viajeSeleccionado={viajeSeleccionado}
            viajeActual={viajeActual}
            onSeleccionar={setViajeSeleccionado}
            onCrear={crearViaje}
          />
          <EscanerIA mensaje={mensaje} setMensaje={setMensaje} cargando={cargando} onProcesar={procesarMensaje} />
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
          <PanelClima />
          <Estadisticas turistas={turistasFiltrados} />
          <TablaPasajeros
            turistas={turistasFiltrados}
            numeroGrupo={numeroGrupo}
            tamanoGrupo={tamanoGrupo}
            busqueda={busqueda}
            setBusqueda={setBusqueda}
            deshabilitarDescargas={!viajeActual || turistasFiltrados.length === 0}
            onContactos={bajarContactos}
            onExcel={bajarExcel}
            onEditar={setTuristaEditando}
            onEliminar={eliminarTurista}
          />
        </div>
      </div>

      {turistaEditando && (
        <ModalEdicion turista={turistaEditando} viajes={viajes} turistasBD={turistasBD} onGuardar={guardarEdicion} onCerrar={() => setTuristaEditando(null)} />
      )}

      {modalPrecios && tarifa && (
        <ModalPrecios tarifa={tarifa} viaje={viajeActual} onGuardar={guardarPrecios} onCerrar={() => setModalPrecios(false)} />
      )}

      <Avisos avisos={avisos} />
    </div>
  )
}

export default Panel
