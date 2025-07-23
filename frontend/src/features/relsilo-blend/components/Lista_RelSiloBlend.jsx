import React, { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '../../../config/config';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowUp, ArrowDown, ChevronDown, ChevronUp } from 'lucide-react'; // Importamos iconos de flecha y chevron

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

export default function Lista_RelSiloBlend() {
  const [relaciones, setRelaciones] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [sortColumn, setSortColumn] = useState('NroRelacion');
  const [sortDirection, setSortDirection] = useState('DESC');
  const [expandedRelaciones, setExpandedRelaciones] = useState({});
  const [maquinasDetalle, setMaquinasDetalle] = useState({});
  const navigate = useNavigate();

  // ✅ Estados para el modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [relacionToToggle, setRelacionToToggle] = useState(null); // { nroRelacion, estadoActual }

  // Envolvemos cargarRelaciones en useCallback
  const cargarRelaciones = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/relsilo?sortBy=${sortColumn}&order=${sortDirection}`); 
      const data = await res.json();
      if (Array.isArray(data)) {
        setRelaciones(data);
      } else {
        setMensaje('❌ Error al cargar relaciones: Formato de datos inesperado.');
        console.error('Datos recibidos no son un array:', data);
      }
    } catch (err) {
      console.error("❌ Error al consultar relaciones:", err);
      setMensaje('❌ No se pudo conectar al servidor o error al cargar relaciones.');
    }
  }, [sortColumn, sortDirection]);

  useEffect(() => {
    cargarRelaciones();
  }, [cargarRelaciones]);

  const fetchMaquinasDetalle = async (nroRelacion) => {
    try {
      const res = await fetch(`${API_BASE_URL}/relsiloblend2/${nroRelacion}`);
      const data = await res.json();
      if (res.ok) {
        setMaquinasDetalle(prev => ({ ...prev, [nroRelacion]: data }));
      } else {
        setMensaje(`❌ Error al cargar máquinas: ${data.error || 'Error desconocido.'}`);
      }
    } catch (err) {
      console.error("❌ Error al cargar máquinas:", err);
      setMensaje('❌ No se pudo conectar al servidor o error al cargar máquinas.');
    }
  };

  const toggleExpand = (nroRelacion) => {
    setExpandedRelaciones(prev => {
      const newState = { ...prev, [nroRelacion]: !prev[nroRelacion] };
      if (newState[nroRelacion] && !maquinasDetalle[nroRelacion]) {
        fetchMaquinasDetalle(nroRelacion);
      }
      return newState;
    });
  };

  // ✅ Función para abrir el modal de confirmación para cambiar estado
  const handleToggleEstadoClick = (nroRelacion, estadoActual) => {
    setRelacionToToggle({ nroRelacion, estadoActual });
    setShowConfirmModal(true);
  };

  // ✅ Función para confirmar y cambiar el estado
  const confirmToggleEstado = async () => {
    setShowConfirmModal(false); // Cerrar el modal
    if (!relacionToToggle) return;

    const { nroRelacion, estadoActual } = relacionToToggle;
    const nuevoEstado = estadoActual === 'Activo' ? 'Inactivo' : 'Activo';

    try {
      const res = await fetch(`${API_BASE_URL}/relsilo/estado/${nroRelacion}`, {
        method: 'PATCH', // Usamos PATCH para actualización parcial
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje(`✅ ${data.message}`);
        cargarRelaciones(); // Recargar la lista para ver el estado actualizado
      } else {
        setMensaje(`❌ Error: ${data.error || 'No se pudo actualizar el estado.'}`);
      }
    } catch (err) {
      console.error("❌ Error al alternar estado de relación:", err);
      setMensaje('❌ No se pudo conectar al servidor para actualizar el estado.');
    } finally {
      setRelacionToToggle(null); // Limpiar la relación a alternar
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  // ✅ Función para cancelar la acción del modal
  const cancelToggleEstado = () => {
    setShowConfirmModal(false);
    setRelacionToToggle(null);
  };

  const eliminarRelacion = async (nroRelacion) => {
    if (!window.confirm(`¿Estás segura que quieres eliminar esta relación? Esta acción es irreversible.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/relsilo/${nroRelacion}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje(`✅ ${data.message}`);
        cargarRelaciones();
      } else {
        setMensaje(`❌ Error: ${data.error || 'No se pudo eliminar la relación.'}`);
      }
    } catch (err) {
      console.error("❌ Error al eliminar relación:", err);
      setMensaje('❌ No se pudo conectar al servidor para eliminar la relación.');
    }
    setTimeout(() => setMensaje(''), 3000);
  };

  const irAEditar = (nroRelacion) => {
    navigate(`/registro/relsilo?NroRelacion=${nroRelacion}`);
  };

  const irARegistroRelSiloBlend = () => {
    navigate('/registro/relsilo');
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortColumn(column);
      setSortDirection('DESC');
    }
  };

  const renderSortIcon = (column) => {
    if (sortColumn === column) {
      return sortDirection === 'ASC' ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 shadow-lg rounded-lg mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Lista de Relaciones Silo-Blend</h2>

      <div className="flex justify-end mb-6">
        <button
          onClick={irARegistroRelSiloBlend}
          className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md text-lg font-medium flex items-center gap-2"
        >
          <Plus size={20} /> Nueva Relación
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
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('NroRelacion')}>
                <div className="flex items-center">Nro. Relación {renderSortIcon('NroRelacion')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('ProdNombre')}>
                <div className="flex items-center">Producto {renderSortIcon('ProdNombre')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('SiloNombre')}>
                <div className="flex items-center">Silo {renderSortIcon('SiloNombre')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('Corte')}>
                <div className="flex items-center">Corte {renderSortIcon('Corte')}</div>
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
              <th className="px-8 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider" colSpan="2">Acciones</th> {/* Colspan para acciones y toggle estado */}
            </tr>
          </thead>
          <tbody>
            {relaciones.length > 0 ? (
              relaciones.map((rel) => (
                <React.Fragment key={rel.NroRelacion}>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm">{rel.NroRelacion}</td>
                    <td className="px-5 py-3 text-sm">{rel.ProdNombre}</td>
                    <td className="px-5 py-3 text-sm">{rel.SiloNombre}</td>
                    <td className="px-5 py-3 text-sm">{rel.Corte}</td>
                    <td className="px-5 py-3 text-sm">{rel.Estado}</td>
                    <td className="px-5 py-3 text-sm">{rel.UsuarioNombre || rel.Usuario}</td>
                    <td className="px-5 py-3 text-sm">{formatDateToYYYYMMDDHHMMSS(rel.FechaCat)}</td>
                    <td className="px-8 py-3 text-center space-x-2 flex flex-col sm:flex-row sm:space-x-2 sm:space-y-0 space-y-2 justify-center items-center">
                      <button
                        onClick={() => irAEditar(rel.NroRelacion)}
                        className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm w-full sm:w-auto"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleEstadoClick(rel.NroRelacion, rel.Estado)}
                        className={`px-3 py-1 rounded text-white ${
                          rel.Estado === 'Activo' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'
                        } transition-colors text-sm w-full sm:w-auto`}
                      >
                        {rel.Estado === 'Activo' ? 'Inactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => eliminarRelacion(rel.NroRelacion)}
                        className="px-3 py-1 rounded bg-gray-700 text-white hover:bg-black transition-colors text-sm w-full sm:w-auto"
                      >
                        Eliminar
                      </button>
                    </td>
                    {/* Celda para el botón de detalle de máquinas */}
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => toggleExpand(rel.NroRelacion)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {expandedRelaciones[rel.NroRelacion] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </td>
                  </tr>
                  {/* Fila expandible para mostrar las máquinas */}
                  {expandedRelaciones[rel.NroRelacion] && maquinasDetalle[rel.NroRelacion] && (
                    <tr>
                      {/* El colspan debe ser el número total de columnas en la tabla principal (9 + 1 para el nuevo botón) */}
                      <td colSpan="10" className="p-0"> 
                        <div className="bg-gray-100 p-4 border-t border-gray-200">
                          <h4 className="font-semibold text-gray-700 mb-3 ml-2">Máquinas Asociadas a la Relación {rel.NroRelacion}:</h4>
                          {maquinasDetalle[rel.NroRelacion].length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-inner">
                                <thead className="bg-gray-200">
                                  <tr>
                                    <th className="p-2 text-left text-xs font-semibold text-gray-600 uppercase">Nombre Máquina</th>
                                    <th className="p-2 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {maquinasDetalle[rel.NroRelacion].map((maq, i) => (
                                    <tr key={i} className="border-b hover:bg-gray-50">
                                      <td className="p-2">{maq.MaqNombre}</td>
                                      <td className="p-2">{maq.Estado}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-center text-gray-500 py-2">No hay máquinas asociadas a esta relación.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                {/* Ajusta el colspan según el número total de columnas en la tabla principal */}
                <td colSpan="10" className="text-center text-gray-500 py-4"> 
                  No hay relaciones Silo-Blend registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Modal de Confirmación Personalizado */}
      {showConfirmModal && relacionToToggle && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Cambio de Estado</h3>
            <p className="text-gray-700 mb-6">
              ¿Estás segura que quieres {relacionToToggle.estadoActual === 'Activo' ? 'inactivar' : 'activar'} la relación Silo-Blend #
              <span className="font-bold">{relacionToToggle.nroRelacion}</span>?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={confirmToggleEstado}
                className={`px-4 py-2 rounded-md text-white font-medium ${
                  relacionToToggle.estadoActual === 'Activo' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'
                } transition-colors`}
              >
                Confirmar
              </button>
              <button
                onClick={cancelToggleEstado}
                className="px-4 py-2 rounded-md bg-gray-300 text-gray-800 font-medium hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
