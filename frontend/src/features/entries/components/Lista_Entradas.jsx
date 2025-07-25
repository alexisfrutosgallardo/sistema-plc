import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../config/config';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Trash2, Plus, ArrowUp, ArrowDown, Edit } from 'lucide-react';

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
        alert(`✅ Entrada N° ${entNumero} eliminada correctamente.`); // Usar un modal en lugar de alert
      } catch (err) {
        console.error("Error al eliminar entrada:", err);
        alert(`❌ Error: ${err.message}`); // Usar un modal en lugar de alert
      }
    }
  };

  // ✅ Modificado: Navegación a diferentes formularios según el rol
  const handleEdit = (entNumero) => {
    if (userRole === 'admin') {
      navigate(`/registro/entrada?entNumero=${entNumero}`); // Admin: formulario completo
    } else if (userRole === 'supervisor') {
      navigate(`/registro/entrada/cabecera?entNumero=${entNumero}`); // Supervisor: solo cabecera
    } else if (userRole === 'operador') {
      navigate(`/registro/entrada/detalle?entNumero=${entNumero}`); // Operador: solo detalle
    }
  };

  // ✅ Modificado: Navegación para nueva entrada
  const handleNewEntry = () => {
    if (userRole === 'admin') {
      navigate('/registro/entrada'); // Admin: formulario completo
    } else if (userRole === 'supervisor') {
      navigate('/registro/entrada/cabecera'); // Supervisor: solo cabecera
    }
    // Operador no tiene botón de nueva entrada
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
      {/* Solo 'supervisor' y 'admin' pueden crear nuevas entradas */}
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
                    <td className="px-6 py-4">{ent.ProdPrincipalNombre ? `${ent.ProdPrincipalNombre} (${ent.TipProdNombre})` : '-'}</td>
                    <td className="px-6 py-4">{formatDateToYYYYMMDDHHMMSS(ent.FechaCura) || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      {/* Botones de acción condicionales por rol */}
                      {(userRole === 'admin' || userRole === 'supervisor' || userRole === 'operador') && (
                        <button
                          onClick={() => handleEdit(ent.EntNumero)}
                          className="font-medium text-indigo-600 hover:text-indigo-900 mr-3"
                          title="Editar Entrada"
                        >
                          <Edit size={20} />
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
                      <td colSpan="11" className="p-4">
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
                <td colSpan="11" className="text-center text-gray-500 py-4">
                  No hay entradas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
