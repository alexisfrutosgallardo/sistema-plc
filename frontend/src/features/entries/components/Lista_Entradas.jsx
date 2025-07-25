import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../config/config';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Trash2, Plus, ArrowUp, ArrowDown, Edit, CheckCircle2, XCircle } from 'lucide-react'; // ✅ Importar XCircle para el botón de cerrar

// Función de utilidad para formatear la fecha a YYYY-MM-DD HH:mm:ss
const formatDateToYYYYMMDDHHMMSS = (dateString) => {
  if (!dateString) return '–';

  let date;
  if (dateString.includes(' ')) {
    date = new Date(dateString.replace(' ', 'T'));
  } else {
    date = new Date(`${dateString}T00:00:00`);
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

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export default function Lista_Entradas() {
  const [entradas, setEntradas] = useState([]);
  const [detalles, setDetalles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [sortBy, setSortBy] = useState('EntNumero');
  const [sortOrder, setSortOrder] = useState('DESC');
  const navigate = useNavigate();

  // ✅ Nuevos estados para el modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [entryToClose, setEntryToClose] = useState(null);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState(''); // 'success' or 'error'

  // Obtener el usuario del localStorage para determinar el rol
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const userRole = usuario ? usuario.rol : null;

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true);
        setError('');

        const queryParams = new URLSearchParams();
        // Filtrar por estado 'Abierto' si el usuario no es admin
        if (userRole === 'supervisor' || userRole === 'operador') {
          queryParams.append('estado', 'Abierto');
        }
        queryParams.append('sortBy', sortBy);
        queryParams.append('order', sortOrder);

        const url = `${API_BASE_URL}/entrada?${queryParams.toString()}`;
        const response = await fetch(url, {
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setEntradas(data);
      } catch (err) {
        console.error("Error al obtener entradas:", err);
        setError(`❌ Error al cargar las entradas: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [sortBy, sortOrder, userRole]);

  const fetchDetails = async (entNumero) => {
    try {
      const response = await fetch(`${API_BASE_URL}/entrada/${entNumero}/detalle`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDetalles(prev => ({ ...prev, [entNumero]: data }));
    } catch (err) {
      console.error(`Error al obtener detalles para EntNumero ${entNumero}:`, err);
      setError(`❌ Error al cargar los detalles para la entrada ${entNumero}: ${err.message}`);
    }
  };

  const handleToggleExpand = (entNumero) => {
    if (expandedRow === entNumero) {
      setExpandedRow(null);
    } else {
      setExpandedRow(entNumero);
      if (!detalles[entNumero]) {
        fetchDetails(entNumero);
      }
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
  };

  const handleDelete = async (entNumero) => {
    // ✅ Usar un modal de confirmación personalizado en lugar de window.confirm
    // Para simplificar, aquí se usa window.confirm, pero se recomienda un modal personalizado.
    if (window.confirm(`¿Estás seguro de que deseas eliminar la entrada N° ${entNumero}?`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/entrada/${entNumero}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al eliminar la entrada.');
        }

        setEntradas(entradas.filter(ent => ent.EntNumero !== entNumero));
        setDetalles(prev => {
          const newDetalles = { ...prev };
          delete newDetalles[entNumero];
          return newDetalles;
        });
        setModalMessage(`✅ Entrada N° ${entNumero} eliminada correctamente.`);
        setModalType('success');
        setShowConfirmModal(true); // Reutilizar el modal para el mensaje de éxito/error
      } catch (err) {
        console.error("Error al eliminar entrada:", err);
        setModalMessage(`❌ Error: ${err.message}`);
        setModalType('error');
        setShowConfirmModal(true); // Reutilizar el modal para el mensaje de éxito/error
      }
    }
  };

  const handleEdit = (entNumero) => {
    if (userRole === 'admin') {
      navigate(`/registro/entrada?entNumero=${entNumero}`);
    } else if (userRole === 'supervisor') {
      navigate(`/registro/entrada/cabecera?entNumero=${entNumero}`);
    } else if (userRole === 'operador') {
      navigate(`/registro/entrada/detalle?entNumero=${entNumero}`);
    }
  };

  const handleNewEntry = () => {
    if (userRole === 'admin') {
      navigate('/registro/entrada');
    } else if (userRole === 'supervisor') {
      navigate('/registro/entrada/cabecera');
    }
  };

  // ✅ Función para abrir el modal de confirmación de cierre
  const handleOpenCloseModal = (entNumero, tieneDetalles) => {
    if (tieneDetalles === 0) {
      setModalMessage('❌ No se puede cerrar la operación sin tener productos de detalle cargados.');
      setModalType('error');
      setShowConfirmModal(true);
      setEntryToClose(null); // No hay entrada para cerrar si no tiene detalles
    } else {
      setEntryToClose(entNumero);
      setModalMessage(`¿Estás seguro de que deseas cerrar la operación N° ${entNumero}? Una vez cerrada, no se podrán modificar sus detalles.`);
      setModalType('confirm');
      setShowConfirmModal(true);
    }
  };

  // ✅ Función para confirmar el cierre de la operación
  const handleConfirmClose = async () => {
    if (!entryToClose) return;

    try {
      const response = await fetch(`${API_BASE_URL}/entrada/${entryToClose}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Estado: 'Cerrado' }), // Solo enviamos el estado
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error desconocido al cerrar la operación.');
      }

      // Actualizar el estado local de las entradas
      setEntradas(prevEntries =>
        prevEntries.map(ent =>
          ent.EntNumero === entryToClose ? { ...ent, Estado: 'Cerrado' } : ent
        )
      );

      setModalMessage(`✅ Operación N° ${entryToClose} cerrada correctamente.`);
      setModalType('success');
      // No cerramos el modal aquí, esperamos que el usuario haga clic en "Cerrar"
    } catch (err) {
      console.error("Error al cerrar operación:", err);
      setModalMessage(`❌ Error al cerrar operación: ${err.message}`);
      setModalType('error');
    } finally {
      setEntryToClose(null); // Limpiar la entrada a cerrar
    }
  };

  // ✅ Función para cancelar o cerrar el modal
  const handleCloseModal = () => {
    setShowConfirmModal(false);
    setEntryToClose(null);
    setModalMessage('');
    setModalType('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Cargando entradas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">¡Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 shadow-lg rounded-lg mt-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Lista de Entradas</h1>

      {/* Botón para nueva entrada */}
      {(userRole === 'admin' || userRole === 'supervisor') && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleNewEntry}
            className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition-colors shadow-md text-base font-medium flex items-center gap-2"
          >
            <Plus size={20} /> Nueva Entrada
          </button>
        </div>
      )}

      <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-200">
            <tr>
              <th scope="col" className="p-2"></th> {/* Columna para expandir/colapsar */}
              <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('EntNumero')}>
                N° Entrada
                {sortBy === 'EntNumero' && (sortOrder === 'ASC' ? <ArrowUp className="inline ml-1" size={16} /> : <ArrowDown className="inline ml-1" size={16} />)}
              </th>
              <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('Fecha')}>
                Fecha
                {sortBy === 'Fecha' && (sortOrder === 'ASC' ? <ArrowUp className="inline ml-1" size={16} /> : <ArrowDown className="inline ml-1" size={16} />)}
              </th>
              <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('NroCorte')}>
                N° Corte
                {sortBy === 'NroCorte' && (sortOrder === 'ASC' ? <ArrowUp className="inline ml-1" size={16} /> : <ArrowDown className="inline ml-1" size={16} />)}
              </th>
              <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('Estado')}>
                Estado
                {sortBy === 'Estado' && (sortOrder === 'ASC' ? <ArrowUp className="inline ml-1" size={16} /> : <ArrowDown className="inline ml-1" size={16} />)}
              </th>
              <th scope="col" className="px-6 py-3">Comentario</th>
              <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('FechaCat')}>
                Fecha Carga
                {sortBy === 'FechaCat' && (sortOrder === 'ASC' ? <ArrowUp className="inline ml-1" size={16} /> : <ArrowDown className="inline ml-1" size={16} />)}
              </th>
              <th scope="col" className="px-6 py-3">Usuario</th>
              <th scope="col" className="px-6 py-3">Producto Principal</th>
              <th scope="col" className="px-6 py-3">Fecha Cura (Cabecera)</th>
              <th scope="col" className="px-6 py-3 text-center">Detalles Cargados</th>
              <th scope="col" className="px-6 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {entradas.length > 0 ? (
              entradas.map((ent) => (
                <React.Fragment key={ent.EntNumero}>
                  <tr className="bg-white border-b hover:bg-gray-100">
                    <td className="p-2">
                      <button
                        onClick={() => handleToggleExpand(ent.EntNumero)}
                        className="text-blue-600 hover:text-blue-800"
                        aria-expanded={expandedRow === ent.EntNumero}
                        aria-controls={`details-${ent.EntNumero}`}
                      >
                        {expandedRow === ent.EntNumero ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{ent.EntNumero}</td>
                    <td className="px-6 py-4">{formatDateToYYYYMMDDHHMMSS(ent.Fecha)}</td>
                    <td className="px-6 py-4">{ent.NroCorte}</td>
                    <td className="px-6 py-4">{ent.Estado}</td>
                    <td className="px-6 py-4">{ent.Comentario || '-'}</td>
                    <td className="px-6 py-4">{formatDateToYYYYMMDDHHMMSS(ent.FechaCat)}</td>
                    <td className="px-6 py-4">{ent.UsuarioNombre || ent.Usuario}</td>
                    <td className="px-6 py-4">{ent.ProdPrincipalNombre ? `${ent.ProdPrincipalNombre}` : '-'}</td>
                    <td className="px-6 py-4">{formatDateToYYYYMMDDHHMMSS(ent.FechaCura) || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      {ent.TieneDetalles === 1 ? (
                        <CheckCircle2 size={20} className="text-green-500 mx-auto" title="Detalles Cargados" />
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center flex items-center justify-center space-x-2">
                      {/* Botón de Editar */}
                      {(userRole === 'admin' || userRole === 'supervisor' || userRole === 'operador') && (
                        <button
                          onClick={() => handleEdit(ent.EntNumero)}
                          className="font-medium text-indigo-600 hover:text-indigo-900"
                          title="Editar Entrada"
                        >
                          <Edit size={20} />
                        </button>
                      )}
                      {/* Botón de Cerrar (solo para admin y supervisor, si no está cerrada y tiene detalles) */}
                      {(userRole === 'admin' || userRole === 'supervisor') && ent.Estado === 'Abierto' && (
                        <button
                          onClick={() => handleOpenCloseModal(ent.EntNumero, ent.TieneDetalles)}
                          className={`font-medium px-2 py-1 rounded-md text-white transition-colors
                            ${ent.TieneDetalles === 1 ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
                          title={ent.TieneDetalles === 1 ? 'Cerrar Operación' : 'Cerrar Operación (Requiere Detalles)'}
                          disabled={ent.TieneDetalles !== 1}
                        >
                          Cerrar
                        </button>
                      )}
                      {/* Solo Admin puede eliminar */}
                      {userRole === 'admin' && (
                        <button
                          onClick={() => handleDelete(ent.EntNumero)}
                          className="font-medium text-red-600 hover:text-red-900"
                          title="Eliminar Entrada"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedRow === ent.EntNumero && detalles[ent.EntNumero] && (
                    <tr className="bg-gray-50">
                      <td colSpan="12" className="p-4">
                        <h4 className="text-lg font-semibold text-gray-700 mb-3">Detalles de Productos:</h4>
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                          <table className="min-w-full text-xs text-left text-gray-600">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="p-2 text-center">Ítem</th>
                                <th className="p-2">Producto</th>
                                <th className="p-2">Serie</th>
                                <th className="p-2 text-right">Cantidad</th>
                                <th className="p-2">Fecha</th>
                                <th className="p-2">Fecha Cura</th>
                                <th className="p-2">Fecha Ingreso</th>
                                <th className="p-2">Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detalles[ent.EntNumero].map((det, i) => (
                                <tr key={i} className="border-b hover:bg-gray-50">
                                  <td className="p-2 text-center">{det.Iten}</td>
                                  <td className="p-2">{det.ProdNombre} ({det.TipProdNombre})</td>
                                  <td className="p-2">{det.Serie}</td>
                                  <td className="p-2 text-right">{det.Cantidad}</td>
                                  <td className="p-2">{formatDateToYYYYMMDDHHMMSS(det.Fecha)}</td>
                                  <td className="p-2">{formatDateToYYYYMMDDHHMMSS(det.FechaCura)}</td>
                                  <td className="p-2">{formatDateToYYYYMMDDHHMMSS(det.FechaIngr) || '-'}</td>
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
                <td colSpan="12" className="text-center text-gray-500 py-4">
                  No hay entradas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Modal de Confirmación / Mensaje */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <XCircle size={24} />
            </button>
            <div className="text-center mb-6">
              {modalType === 'confirm' && (
                <p className="text-xl font-semibold text-gray-800">{modalMessage}</p>
              )}
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
