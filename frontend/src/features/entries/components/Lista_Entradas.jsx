import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../config/config';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Trash2, Plus, ArrowUp, ArrowDown, Edit } from 'lucide-react'; // Importamos iconos, incluyendo Edit

// Función de utilidad para formatear la fecha a YYYY-MM-DD HH:mm:ss
const formatDateToYYYYMMDDHHMMSS = (dateString) => {
  if (!dateString) return '–';

  let date;
  // Si la cadena incluye una parte de tiempo (ej. "YYYY-MM-DD HH:MM:SS"),
  // la convertimos a formato ISO local para que new Date() la interprete correctamente.
  if (dateString.includes(' ')) {
    date = new Date(dateString.replace(' ', 'T')); // Interpreta como hora local
  } else {
    // Si es solo una fecha (YYYY-MM-DD), la interpretamos como fecha local
    // agregando una parte de tiempo para asegurar que new Date() la trate como local.
    date = new Date(`${dateString}T00:00:00`); // Interpreta como 00:00:00 del día en hora local
  }

  if (isNaN(date.getTime())) {
    return 'Fecha inválida';
  }

  // Ahora formateamos esta fecha (que ya está en la zona horaria correcta)
  // a los componentes de la hora local del navegador.
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
  const [mensaje, setMensaje] = useState('');
  const [detalles, setDetalles] = useState({}); // Estado para almacenar los detalles de cada entrada
  const [expandedEntradas, setExpandedEntradas] = useState({}); // Estado para controlar qué entradas están expandidas
  const [sortColumn, setSortColumn] = useState('EntNumero'); // Estado para la columna de ordenamiento
  const [sortDirection, setSortDirection] = useState('DESC'); // Estado para la dirección de ordenamiento
  const navigate = useNavigate();

  const fetchEntradas = async () => {
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
  };

  useEffect(() => {
    fetchEntradas();
  }, [sortColumn, sortDirection]); // Recargar entradas cuando cambie la columna o dirección de ordenamiento

  const fetchDetalles = async (entNumero) => {
    try {
      const res = await fetch(`${API_BASE_URL}/entrada/${entNumero}/detalle`);
      const data = await res.json();
      if (res.ok) {
        setDetalles(prev => ({ ...prev, [entNumero]: data }));
      } else {
        setMensaje(`❌ Error al cargar detalles: ${data.error || 'Error desconocido.'}`);
      }
    } catch (err) {
      console.error("❌ Error al cargar detalles:", err);
      setMensaje('❌ No se pudo conectar al servidor o error al cargar detalles.');
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

  const eliminarEntrada = async (entNumero) => {
    if (!window.confirm(`¿Estás segura que quieres eliminar la entrada número ${entNumero} y todos sus detalles? Esta acción es irreversible y revertirá el stock.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/entrada/${entNumero}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje(`✅ ${data.message}`);
        fetchEntradas(); // Recargar la lista de entradas
      } else {
        setMensaje(`❌ Error: ${data.error || 'No se pudo eliminar la entrada.'}`);
      }
    } catch (err) {
      console.error("❌ Error al eliminar entrada:", err);
      setMensaje('❌ No se pudo conectar al servidor para eliminar la entrada.');
    }
    setTimeout(() => setMensaje(''), 3000);
  };

  const irARegistroEntrada = () => {
    navigate('/registro/entrada');
  };

  // ✅ NUEVA FUNCIÓN: Redirigir a la página de registro/edición con el EntNumero
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

  // Helper para renderizar el icono de ordenamiento
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
        <button
          onClick={irARegistroEntrada}
          className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md text-lg font-medium flex items-center gap-2"
        >
          <Plus size={20} /> Nueva Entrada
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
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('EntNumero')}>
                <div className="flex items-center">Número {renderSortIcon('EntNumero')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('Fecha')}>
                <div className="flex items-center">Fecha {renderSortIcon('Fecha')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('NroCorte')}>
                <div className="flex items-center">Nro. Corte {renderSortIcon('NroCorte')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('Estado')}>
                <div className="flex items-center">Estado {renderSortIcon('Estado')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('UsuarioNombre')}>
                <div className="flex items-center">Usuario {renderSortIcon('UsuarioNombre')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('ProdPrincipalNombre')}>
                <div className="flex items-center">Producto {renderSortIcon('ProdPrincipalNombre')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('Comentario')}>
                <div className="flex items-center">Comentario {renderSortIcon('Comentario')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('FechaCat')}>
                <div className="flex items-center">Fecha de Carga {renderSortIcon('FechaCat')}</div>
              </th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider" colSpan="2">Acciones</th> {/* Colspan ajustado para incluir Editar */}
         
            </tr>
          </thead>
          <tbody>
            {entradas.length > 0 ? (
              entradas.map((ent) => (
                <React.Fragment key={ent.EntNumero}>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm">{ent.EntNumero}</td>
                    <td className="px-5 py-3 text-sm">{formatDateToYYYYMMDDHHMMSS(ent.Fecha)}</td>
                    <td className="px-5 py-3 text-sm">{ent.NroCorte}</td>
                    <td className="px-5 py-3 text-sm">{ent.Estado}</td>
                    <td className="px-5 py-3 text-sm">{ent.UsuarioNombre}</td>
                    <td className="px-5 py-3 text-sm">{ent.ProdPrincipalNombre} ({ent.ProdPrincipalTipoNombre})</td>
                    <td className="px-5 py-3 text-sm">{ent.Comentario}</td>
                    <td className="px-5 py-3 text-sm">{formatDateToYYYYMMDDHHMMSS(ent.FechaCat)}</td>
                    <td className="px-5 py-3 text-center space-x-2 flex flex-col sm:flex-row sm:space-x-2 sm:space-y-0 space-y-2 justify-center items-center">
                      {/* ✅ Botón de Editar */}
                      <button
                        onClick={() => irAEditar(ent.EntNumero)}
                        className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm w-full sm:w-auto flex items-center justify-center gap-1"
                      >
                        <Edit size={16} /> Editar
                      </button>
                      <button
                        onClick={() => eliminarEntrada(ent.EntNumero)}
                        className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors text-sm flex items-center justify-center mx-auto w-full sm:w-auto"
                      >
                        <Trash2 size={16} /> Eliminar
                      </button>
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
                      <td colSpan="11" className="p-0"> {/* ✅ Colspan ajustado a 11 */}
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
                <td colSpan="11" className="text-center text-gray-500 py-4"> {/* ✅ Colspan ajustado a 11 */}
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
