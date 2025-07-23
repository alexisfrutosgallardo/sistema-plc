import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../config/config';
import { Plus, Trash2 } from 'lucide-react'; // Importamos iconos

// Función para obtener fecha y hora local en formato ISO completo (con TZ corregida)
function getFechaHoraLocal() {
  const ahora = new Date();
  const zonaLocal = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return zonaLocal.toISOString().slice(0, 19).replace('T', ' '); // Formato compatible con SQLite DATETIME
}

// Función de utilidad para formatear la fecha a YYYY-MM-DD HH:mm:ss
const formatDateToYYYYMMDDHHMMSS = (dateString) => {
  if (!dateString) return '–';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Fecha inválida';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};


export default function Detalle_Maquinas({ nroRelacion, usuario }) { // ✅ Renombrado a Detalle_Maquinas
  const [datos, setDatos] = useState([]); // Datos de las máquinas asociadas (RelSiloBlend2)
  const [nuevoItem, setNuevoItem] = useState({ MaqCodigo: '', Estado: 'Activo' });
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [maquinas, setMaquinas] = useState([]); // Lista de todas las máquinas disponibles

  // Cargar máquinas asociadas y máquinas disponibles al inicio o cuando cambia nroRelacion
  useEffect(() => {
    if (!nroRelacion) {
      setMensaje('⚠️ No se ha recibido un número de relación.');
      setTipoMensaje('error');
      return;
    }

    // Cargar máquinas asociadas a esta relación
    const fetchDatosRelacion = async () => {
      try {
        // ✅ Ruta corregida para el nuevo endpoint de detalle de máquinas
        const res = await fetch(`${API_BASE_URL}/relsiloblend2/${nroRelacion}`);
        if (!res.ok) throw new Error('Error al cargar detalles de la relación.');
        const data = await res.json();
        setDatos(data);
      } catch (err) {
        console.error('❌ Error al cargar detalles de la relación:', err);
        setTipoMensaje('error');
        setMensaje('❌ Error al cargar detalles de la relación.');
      }
    };

    // Cargar todas las máquinas disponibles
    const fetchMaquinasDisponibles = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/maquina`);
        if (!res.ok) throw new Error('Error al cargar máquinas disponibles.');
        const data = await res.json();
        setMaquinas(data);
      } catch (err) {
        console.error('❌ Error al cargar máquinas:', err);
        setTipoMensaje('error');
        setMensaje('❌ Error al cargar máquinas disponibles.');
      }
    };

    fetchDatosRelacion();
    fetchMaquinasDisponibles();
  }, [nroRelacion]); // Dependencia: recargar si cambia nroRelacion

  const handleChange = e => {
    const { name, value } = e.target;
    setNuevoItem(prev => ({ ...prev, [name]: value }));
  };

  const agregarItem = async () => {
    setMensaje('');
    setTipoMensaje('');

    if (!nuevoItem.MaqCodigo) {
      setTipoMensaje('error');
      setMensaje('⚠️ Debe seleccionar una máquina.');
      return;
    }
    if (!nroRelacion) {
      setTipoMensaje('error');
      setMensaje('❌ No se ha proporcionado un número de relación para asociar la máquina.');
      return;
    }
    if (!usuario?.legajo) {
      setTipoMensaje('error');
      setMensaje('❌ No se detectó el usuario autenticado. Por favor, inicie sesión.');
      return;
    }

    // Determinar el próximo 'Iten'
    // Se asume que Iten es secuencial por NroRelacion
    const nextIten = datos.length > 0 ? Math.max(...datos.map(d => d.Iten)) + 1 : 1;

    const payload = {
      NroRelacion: parseInt(nroRelacion),
      Iten: nextIten,
      MaqCodigo: nuevoItem.MaqCodigo,
      Estado: nuevoItem.Estado,
      Usuario: usuario.legajo,
      FechaCat: getFechaHoraLocal(),
    };

    try {
      // ✅ Ruta corregida para el nuevo endpoint POST
      const res = await fetch(`${API_BASE_URL}/relsiloblend2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al agregar máquina asociada.');

      setTipoMensaje('success');
      setMensaje(data.message);
      setNuevoItem({ MaqCodigo: '', Estado: 'Activo' });

      // Volver a cargar los datos para actualizar la tabla
      const updatedRes = await fetch(`${API_BASE_URL}/relsiloblend2/${nroRelacion}`);
      const updatedData = await updatedRes.json();
      setDatos(updatedData);

    } catch (err) {
      console.error('❌ Error al agregar máquina:', err);
      setTipoMensaje('error');
      setMensaje(`❌ ${err.message || 'Ocurrió un error al agregar la máquina.'}`);
    } finally {
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  const eliminarItem = async (nroRelacionToDelete, itenToDelete) => {
    setMensaje('');
    setTipoMensaje('');

    // Reemplazar window.confirm con un modal personalizado en un entorno de producción
    const confirmar = window.confirm(`¿Eliminar la máquina con Ítem ${itenToDelete} de la relación ${nroRelacionToDelete}?`);
    if (!confirmar) return;

    try {
      // ✅ Ruta corregida para el nuevo endpoint DELETE
      const res = await fetch(`${API_BASE_URL}/relsiloblend2/${nroRelacionToDelete}/${itenToDelete}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar máquina asociada.');

      setTipoMensaje('success');
      setMensaje(data.message);

      // Actualizar el estado para reflejar la eliminación
      setDatos(prevDatos => prevDatos.filter(item => !(item.NroRelacion === nroRelacionToDelete && item.Iten === itenToDelete)));

    } catch (err) {
      console.error('❌ Error al eliminar máquina:', err);
      setTipoMensaje('error');
      setMensaje(`❌ ${err.message || 'Ocurrió un error al eliminar la máquina.'}`);
    } finally {
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      {mensaje && (
        <p className={`text-center text-sm mb-4 ${tipoMensaje === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {mensaje}
        </p>
      )}

      {/* Formulario para agregar nueva máquina asociada */}
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label htmlFor="MaqCodigo" className="block text-sm font-medium text-gray-700">Máquina:</label>
          <select
            id="MaqCodigo"
            name="MaqCodigo"
            value={nuevoItem.MaqCodigo}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Seleccione una máquina</option>
            {maquinas.map(m => (
              <option key={m.MaqCodigo} value={m.MaqCodigo}>
                {m.MaqNombre} ({m.MaqCodigo})
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 w-full">
          <label htmlFor="Estado" className="block text-sm font-medium text-gray-700">Estado:</label>
          <select
            id="Estado"
            name="Estado"
            value={nuevoItem.Estado}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
        <button
          type="button"
          onClick={agregarItem}
          className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors shadow-md flex items-center justify-center gap-2"
        >
          <Plus size={20} /> Agregar
        </button>
      </div>

      {/* Tabla de máquinas asociadas */}
      <h4 className="text-xl font-semibold mt-6 mb-4 text-gray-700">Listado de Máquinas Asociadas</h4>
      {datos.length === 0 ? (
        <p className="text-center text-gray-500">No hay máquinas asociadas a esta relación.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse bg-white shadow-sm rounded-lg">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-sm uppercase">
                <th className="p-3 border text-left">#</th>
                <th className="p-3 border text-left">Código Máquina</th>
                <th className="p-3 border text-left">Nombre Máquina</th>
                <th className="p-3 border text-left">Estado</th>
                <th className="p-3 border text-left">Usuario</th>
                <th className="p-3 border text-left">Fecha de Registro</th>
                <th className="p-3 border text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((item, idx) => (
                <tr key={`${item.NroRelacion}-${item.Iten}`} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="p-3 border text-center">{item.Iten}</td>
                  <td className="p-3 border">{item.MaqCodigo}</td>
                  <td className="p-3 border">{item.MaqNombre}</td>
                  <td className="p-3 border">{item.Estado}</td>
                  <td className="p-3 border">{item.UsuarioNombre || item.Usuario}</td>
                  <td className="p-3 border">{formatDateToYYYYMMDDHHMMSS(item.FechaCat)}</td>
                  <td className="p-3 border text-center">
                    <button
                      onClick={() => eliminarItem(item.NroRelacion, item.Iten)}
                      className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors text-sm flex items-center justify-center mx-auto gap-1"
                    >
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
