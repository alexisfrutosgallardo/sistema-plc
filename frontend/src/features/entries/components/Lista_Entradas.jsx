import React, { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '../../../config/config';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Trash2, Plus, ArrowUp, ArrowDown, Edit, CheckCircle2, XCircle } from 'lucide-react';

// Función de utilidad para formatear la fecha a YYYY-MM-DD HH:mm:ss o DD-MM-YYYY HH:mm:ss
// Ahora es más robusta para aceptar Date objects o strings
const formatDateToYYYYMMDDHHMMSS = (inputDate, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!inputDate) return '–';

  let date;
  if (inputDate instanceof Date) {
    date = inputDate;
  } else if (typeof inputDate === 'string') {
    // Intentar parsear la cadena. Si incluye tiempo, reemplazar ' ' con 'T' para ISO.
    if (inputDate.includes(' ')) {
      date = new Date(inputDate.replace(' ', 'T'));
    } else {
      // Si es solo una fecha (YYYY-MM-DD), interpretarla como local a las 00:00:00
      date = new Date(`${inputDate}T00:00:00`);
    }
  } else {
    return 'Fecha inválida';
  }

  if (isNaN(date.getTime())) {
    return 'Fecha inválida';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  if (format === 'DD-MM-YYYY HH:mm:ss') {
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  }
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export default function Lista_Entradas({ usuario }) {
  const [entradas, setEntradas] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [detalles, setDetalles] = useState({});
  const [expandedEntradas, setExpandedEntradas] = useState({});
  const [sortColumn, setSortColumn] = useState('EntNumero');
  const [sortDirection, setSortDirection] = useState('DESC');
  const navigate = useNavigate();

  // Estados para el modal personalizado
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState(''); // 'success', 'error', 'confirm'
  const [modalAction, setModalAction] = useState(null); // Función a ejecutar al confirmar

  // Nuevo estado para controlar si ya existe una entrada abierta
  const [hasOpenEntryExists, setHasOpenEntryExists] = useState(false);

  const fetchEntradas = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/entrada?sortBy=${sortColumn}&order=${sortDirection}`);
      const data = await res.json();
      if (res.ok) {
        setEntradas(data);
        setMensaje('');
      } else {
        setMensaje(`❌ Error al cargar entradas: ${data.error || 'Formato de datos inesperado.'}`);
        console.error('Datos recibidos no son un array:', data);
      }
    } catch (err) {
      console.error("❌ Error al cargar entradas:", err);
      setMensaje('❌ No se pudo conectar al servidor o error al cargar entradas.');
    }
  }, [sortColumn, sortDirection]);

  const checkOpenEntryStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/entrada/check-open-entry`);
      const data = await res.json();
      if (res.ok) {
        setHasOpenEntryExists(data.exists);
      } else {
        console.error("Error al verificar entrada abierta:", data.error);
      }
    } catch (err) {
      console.error("Error de conexión al verificar entrada abierta:", err);
    }
  };


  useEffect(() => {
    fetchEntradas();
    checkOpenEntryStatus(); // Verificar al cargar la lista
  }, [sortColumn, sortDirection, fetchEntradas]);

  const fetchDetalles = async (entNumero) => {
    try {
      const res = await fetch(`${API_BASE_URL}/entrada/${entNumero}/detalle`);
      const data = await res.json();
      if (res.ok) {
        setDetalles(prev => ({ ...prev, [entNumero]: data }));
      } else {
        setModalMessage(`❌ Error al cargar detalles: ${data.error || 'Error desconocido.'}`);
        setModalType('error');
        setShowModal(true);
      }
    } catch (err) {
      console.error("❌ Error al cargar detalles:", err);
      setModalMessage('❌ No se pudo conectar al servidor o error al cargar detalles.');
      setModalType('error');
      setShowModal(true);
    }
  };

  const toggleExpand = (entNumero) => {
    setExpandedEntradas(prev => {
      const newState = { ...prev, [entNumero]: !prev[entNumero] };
      if (newState[entNumero] && !detalles[entNumero]) {
        fetchDetalles(entNumero);
      }
      return newState;
    });
  };

  const handleDeleteConfirm = async (entNumero) => {
    try {
      const res = await fetch(`${API_BASE_URL}/entrada/${entNumero}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setModalMessage(`✅ ${data.message}`);
        setModalType('success');
        fetchEntradas(); // Recargar la lista de entradas
        checkOpenEntryStatus(); // Re-verificar estado de entradas abiertas
      } else {
        setModalMessage(`❌ Error: ${data.error || 'No se pudo eliminar la entrada.'}`);
        setModalType('error');
      }
    } catch (err) {
      console.error("❌ Error al eliminar entrada:", err);
      setModalMessage('❌ No se pudo conectar al servidor para eliminar la entrada.');
      setModalType('error');
    } finally {
      setShowModal(true);
    }
  };

  const eliminarEntrada = (entNumero) => {
    setModalMessage(`¿Estás segura que quieres eliminar la entrada número ${entNumero} y todos sus detalles? Esta acción es irreversible y revertirá el stock.`);
    setModalType('confirm');
    setModalAction(() => () => handleDeleteConfirm(entNumero)); // Usar un closure para pasar el argumento
    setShowModal(true);
  };

  const handleCloseEntryConfirm = async (entNumero) => {
    try {
      const res = await fetch(`${API_BASE_URL}/entrada/${entNumero}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Estado: 'Cerrado', Usuario: usuario.legajo, FechaCat: formatDateToYYYYMMDDHHMMSS(new Date()) }) // Usar la nueva función de formato
      });
      const data = await res.json();
      if (res.ok) {
        setModalMessage(`✅ Entrada ${entNumero} cerrada correctamente.`);
        setModalType('success');
        fetchEntradas(); // Recargar la lista de entradas
        checkOpenEntryStatus(); // Re-verificar estado de entradas abiertas
      } else {
        setModalMessage(`❌ Error al cerrar entrada ${entNumero}: ${data.error || 'Error desconocido.'}`);
        setModalType('error');
      }
    } catch (err) {
      console.error("❌ Error al cerrar entrada:", err);
      setModalMessage('❌ No se pudo conectar al servidor para cerrar la entrada.');
      setModalType('error');
    } finally {
      setShowModal(true);
    }
  };

  const closeEntry = (entNumero) => {
    setModalMessage(`¿Estás segura que quieres cerrar la entrada número ${entNumero}? Una vez cerrada, no se podrán agregar más detalles.`);
    setModalType('confirm');
    setModalAction(() => () => handleCloseEntryConfirm(entNumero));
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalMessage('');
    setModalType('');
    setModalAction(null);
  };

  const handleConfirmClose = () => {
    if (modalAction) {
      modalAction();
    }
    setShowModal(false);
    setModalMessage('');
    setModalType('');
    setModalAction(null);
  };

  const irARegistroEntrada = () => {
    navigate('/registro/entrada');
  };

  const irAEditar = (entNumero) => {
    navigate(`/registro/entrada?entNumero=${entNumero}`);
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortColumn(column);
      setSortDirection('ASC');
    }
  };

  const renderSortIcon = (column) => {
    if (sortColumn === column) {
      return sortDirection === 'ASC' ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 shadow-lg rounded-lg mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Lista de Entradas</h2>

      <div className="flex justify-end items-center mb-6">
        {/* Solo el Supervisor y Admin pueden registrar nuevas entradas */}
        {(usuario?.rol === 'supervisor' || usuario?.rol === 'admin') && (
          <button
            onClick={irARegistroEntrada}
            className={`bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md text-lg font-medium flex items-center gap-2
              ${hasOpenEntryExists ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={hasOpenEntryExists}
          >
            <Plus size={20} /> Nueva Entrada
          </button>
        )}
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
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('EntNumero')}>
                <div className="flex items-center">Número {renderSortIcon('EntNumero')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('Fecha')}>
                <div className="flex items-center">Fecha {renderSortIcon('Fecha')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('NroCorte')}>
                <div className="flex items-center">Nro. Corte {renderSortIcon('NroCorte')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('Estado')}>
                <div className="flex items-center">Estado {renderSortIcon('Estado')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('UsuarioNombre')}>
                <div className="flex items-center">Usuario {renderSortIcon('UsuarioNombre')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('ProdPrincipalNombre')}>
                <div className="flex items-center">Producto {renderSortIcon('ProdPrincipalNombre')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('Comentario')}>
                <div className="flex items-center">Comentario {renderSortIcon('Comentario')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('FechaCat')}>
                <div className="flex items-center">Fecha de Carga {renderSortIcon('FechaCat')}</div>
              </th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider" colSpan="2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {entradas.length > 0 ? (
              entradas.map((ent) => (
                <React.Fragment key={ent.EntNumero}>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm">{ent.EntNumero}</td>
                    <td className="px-5 py-3 text-sm">{formatDateToYYYYMMDDHHMMSS(ent.Fecha, 'DD-MM-YYYY HH:mm:ss')}</td>
                    <td className="px-5 py-3 text-sm">{ent.NroCorte}</td>
                    <td className="px-5 py-3 text-sm">{ent.Estado}</td>
                    <td className="px-5 py-3 text-sm">{ent.UsuarioNombre}</td>
                    <td className="px-5 py-3 text-sm">{ent.ProdPrincipalNombre} ({ent.ProdPrincipalTipoNombre})</td>
                    <td className="px-5 py-3 text-sm">{ent.Comentario}</td>
                    <td className="px-5 py-3 text-sm">{formatDateToYYYYMMDDHHMMSS(ent.FechaCat, 'DD-MM-YYYY HH:mm:ss')}</td>
                    <td className="px-5 py-3 text-center space-x-2 flex flex-col sm:flex-row sm:space-x-2 sm:space-y-0 space-y-2 justify-center items-center">
                      {/* Botón Editar solo para Supervisor y Admin */}
                      {(usuario?.rol === 'supervisor' || usuario?.rol === 'admin') && (
                        <button
                          onClick={() => irAEditar(ent.EntNumero)}
                          className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm w-full sm:w-auto flex items-center justify-center gap-1"
                        >
                          <Edit size={16} /> Editar
                        </button>
                      )}
                      {/* Botón Cerrar para Supervisor y Admin, si la entrada está Abierta y tiene detalles */}
                      {(usuario?.rol === 'supervisor' || usuario?.rol === 'admin') && ent.Estado === 'Abierto' && ent.TieneDetalles === 1 && (
                        <button
                          onClick={() => closeEntry(ent.EntNumero)}
                          className="px-3 py-1 rounded bg-orange-500 text-white hover:bg-orange-600 transition-colors text-sm w-full sm:w-auto flex items-center justify-center gap-1"
                        >
                          Cerrar
                        </button>
                      )}
                      {/* Botón Eliminar solo para Admin */}
                      {usuario?.rol === 'admin' && (
                        <button
                          onClick={() => eliminarEntrada(ent.EntNumero)}
                          className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors text-sm flex items-center justify-center mx-auto w-full sm:w-auto"
                        >
                          <Trash2 size={16} /> Eliminar
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => toggleExpand(ent.EntNumero)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {expandedEntradas[ent.EntNumero] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </td>
                  </tr>
                  {expandedEntradas[ent.EntNumero] && detalles[ent.EntNumero] && (
                    <tr>
                      <td colSpan="11" className="p-0">
                        <div className="bg-gray-100 p-4 border-t border-gray-200">
                          <h4 className="font-semibold text-gray-700 mb-3 ml-2">Detalles de la Entrada {ent.EntNumero}:</h4>
                          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-inner">
                            <thead className="bg-gray-200">
                              <tr>
                                <th className="p-2 text-center text-xs font-semibold text-gray-600 uppercase">Ítem</th>
                                <th className="p-2 text-left text-xs font-semibold text-gray-600 uppercase">Producto</th>
                                <th className="p-2 text-left text-xs font-semibold text-gray-600 uppercase">Serie</th>
                                <th className="p-2 text-right text-xs font-semibold text-gray-600 uppercase">Cantidad</th>
                                <th className="p-2 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                                <th className="p-2 text-left text-xs font-semibold text-gray-600 uppercase">Fecha Cura</th>
                                <th className="p-2 text-left text-xs font-semibold text-gray-600 uppercase">Fecha Ingreso</th>
                                <th className="p-2 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detalles[ent.EntNumero].map((det, i) => (
                                <tr key={i} className="border-b hover:bg-gray-50">
                                  <td className="p-2 text-center">{det.Iten}</td>
                                  <td className="p-2">{det.ProdNombre} ({det.TipProdNombre})</td>
                                  <td className="p-2">{det.Serie}</td>
                                  <td className="p-2 text-right">{det.Cantidad}</td>
                                  <td className="p-2">{formatDateToYYYYMMDDHHMMSS(det.Fecha, 'DD-MM-YYYY HH:mm:ss')}</td>
                                  <td className="p-2">{formatDateToYYYYMMDDHHMMSS(det.FechaCura, 'DD-MM-YYYY HH:mm:ss')}</td>
                                  <td className="p-2">{formatDateToYYYYMMDDHHMMSS(det.FechaIngr, 'DD-MM-YYYY HH:mm:ss') || '-'}</td>
                                  <td className="p-2">{det.Estado}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="text-center text-gray-500 py-4">
                  No hay entradas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Confirmación/Mensaje */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center">
            <div className="mb-6">
              {modalType === 'success' && (
                <p className="text-xl font-semibold text-green-600 flex items-center justify-center gap-2">
                  <CheckCircle2 size={24} /> {modalMessage}
                </p>
              )}
              {modalType === 'error' && (
                <p className="text-xl font-semibold text-red-600 flex items-center justify-center gap-2">
                  <XCircle size={24} /> {modalMessage}
                </p>
              )}
              {modalType === 'confirm' && (
                <p className="text-xl font-semibold text-gray-800 flex items-center justify-center gap-2">
                  {modalMessage}
                </p>
              )}
            </div>
            {modalType === 'confirm' && (
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleConfirmClose}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors shadow-md"
                >
                  Confirmar
                </button>
                <button
                  onClick={handleCloseModal}
                  className="bg-gray-400 text-white px-6 py-2 rounded-md hover:bg-gray-500 transition-colors shadow-md"
                >
                  Cancelar
                </button>
              </div>
            )}
            {(modalType === 'success' || modalType === 'error') && (
              <div className="flex justify-center">
                <button
                  onClick={handleCloseModal}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors shadow-md"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
