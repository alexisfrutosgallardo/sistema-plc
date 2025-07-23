import React, { useEffect, useState, useCallback } from 'react'; // ✅ Importamos useCallback
import { API_BASE_URL } from '../../../config/config';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowUp, ArrowDown } from 'lucide-react'; // Importamos iconos de flecha

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

export default function Lista_Silos() {
  const [silos, setSilos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [sortColumn, setSortColumn] = useState('SiloCodigo'); // Estado para la columna de ordenamiento
  const [sortDirection, setSortDirection] = useState('ASC'); // Estado para la dirección de ordenamiento ('ASC' o 'DESC')
  const navigate = useNavigate();

  // ✅ Envolvemos cargarSilos en useCallback
  const cargarSilos = useCallback(async () => {
    try {
      // ✅ Añadimos los parámetros de ordenamiento a la URL
      const res = await fetch(`${API_BASE_URL}/silo?sortBy=${sortColumn}&order=${sortDirection}`); 
      const data = await res.json();
      if (Array.isArray(data)) {
        setSilos(data);
      } else {
        setMensaje('❌ Error al cargar silos: Formato de datos inesperado.');
        console.error('Datos recibidos no son un array:', data);
      }
    } catch (err) {
      console.error("❌ Error al consultar silos:", err);
      setMensaje('❌ No se pudo conectar al servidor o error al cargar silos.');
    }
  }, [sortColumn, sortDirection]); // ✅ Dependencias de useCallback

  useEffect(() => {
    cargarSilos();
  }, [cargarSilos]); // ✅ Ahora cargarSilos es una dependencia estable

  const toggleEstadoSilo = async (siloCodigo, estadoActual) => {
    const nuevoEstado = estadoActual === 'Activo' ? 'Inactivo' : 'Activo';
    if (!window.confirm(`¿Estás segura que quieres ${nuevoEstado === 'Activo' ? 'activar' : 'inactivar'} este silo?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/silo/${siloCodigo}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Estado: nuevoEstado })
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje(`✅ ${data.message}`);
        cargarSilos();
      } else {
        setMensaje(`❌ Error: ${data.error || 'No se pudo actualizar el estado del silo.'}`);
      }
    } catch (err) {
      console.error("❌ Error al cambiar estado del silo:", err);
      setMensaje('❌ No se pudo conectar al servidor para actualizar el estado.');
    }
    setTimeout(() => setMensaje(''), 3000);
  };

  const eliminarSilo = async (siloCodigo) => {
    if (!window.confirm(`¿Estás segura que quieres eliminar este silo? Esta acción es irreversible.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/silo/${siloCodigo}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje(`✅ ${data.message}`);
        cargarSilos();
      } else {
        setMensaje(`❌ Error: ${data.error || 'No se pudo eliminar el silo.'}`);
      }
    } catch (err) {
      console.error("❌ Error al eliminar silo:", err);
      setMensaje('❌ No se pudo conectar al servidor para eliminar el silo.');
    }
    setTimeout(() => setMensaje(''), 3000);
  };

  const irAEditar = (siloCodigo) => {
    navigate(`/registro/silo?siloCodigo=${siloCodigo}`);
  };

  const irARegistroSilo = () => {
    navigate('/registro/silo');
  };

  // Función para manejar el clic en el encabezado de la columna
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Si se hace clic en la misma columna, invertir la dirección
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      // Si se hace clic en una nueva columna, establecerla como la columna de ordenamiento y ASC por defecto
      setSortColumn(column);
      setSortDirection('ASC');
    }
  };

  // Helper para renderizar el icono de ordenamiento
  const renderSortIcon = (column) => {
    if (sortColumn === column) {
      return sortDirection === 'ASC' ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 shadow-lg rounded-lg mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Lista de Silos</h2>

      {/* Botón para agregar nuevo silo */}
      <div className="flex justify-end mb-6"> {/* ✅ Cambiado justify-between a justify-end */}
        <button
          onClick={irARegistroSilo}
          className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md text-lg font-medium flex items-center gap-2"
        >
          <Plus size={20} /> Nuevo Silo
        </button>
      </div>

      {mensaje && (
        <div className={`p-3 rounded-md text-center mb-4 ${mensaje.startsWith('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {mensaje}
        </div>
      )}

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-200">
              {/* ✅ Encabezados de columna con onClick para ordenar */}
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('SiloCodigo')}>
                <div className="flex items-center">Código {renderSortIcon('SiloCodigo')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('SiloNombre')}>
                <div className="flex items-center">Nombre {renderSortIcon('SiloNombre')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('IP')}>
                <div className="flex items-center">IP {renderSortIcon('IP')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('Estado')}>
                <div className="flex items-center">Estado {renderSortIcon('Estado')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('Usuario')}>
                <div className="flex items-center">Usuario Carga {renderSortIcon('Usuario')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('FechaCat')}>
                <div className="flex items-center">Fecha Carga {renderSortIcon('FechaCat')}</div>
              </th>
              {/* ✅ Aumentado el padding para la columna de acciones y añadido flexbox para los botones */}
              <th className="px-8 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {silos.length > 0 ? (
              silos.map((silo) => (
                <tr key={silo.SiloCodigo} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm">{silo.SiloCodigo}</td>
                  <td className="px-5 py-3 text-sm">{silo.SiloNombre}</td>
                  <td className="px-5 py-3 text-sm">{silo.IP}</td>
                  <td className="px-5 py-3 text-sm">{silo.Estado}</td>
                  <td className="px-5 py-3 text-sm">{silo.UsuarioNombre || silo.Usuario}</td>
                  <td className="px-5 py-3 text-sm">{formatDateToYYYYMMDDHHMMSS(silo.FechaCat)}</td> {/* ✅ Formato de fecha */}
                  {/* ✅ Aumentado el padding y añadido flexbox para los botones */}
                  <td className="px-8 py-3 text-center space-x-2 flex flex-col sm:flex-row sm:space-x-2 sm:space-y-0 space-y-2 justify-center items-center">
                    <button
                      onClick={() => irAEditar(silo.SiloCodigo)}
                      className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm w-full sm:w-auto"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleEstadoSilo(silo.SiloCodigo, silo.Estado)}
                      className={`px-3 py-1 rounded text-white ${
                        silo.Estado === 'Activo' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                      } transition-colors text-sm w-full sm:w-auto`}
                    >
                      {silo.Estado === 'Activo' ? 'Inactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => eliminarSilo(silo.SiloCodigo)}
                      className="px-3 py-1 rounded bg-gray-700 text-white hover:bg-black transition-colors text-sm w-full sm:w-auto"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center text-gray-500 py-4">
                  No hay silos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
