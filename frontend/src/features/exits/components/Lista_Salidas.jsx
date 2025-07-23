import React, { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '../../../config/config';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';

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

export default function Lista_Salidas() {
  const [salidas, setSalidas] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [expandedSalidas, setExpandedSalidas] = useState({});
  const [sortColumn, setSortColumn] = useState('SalNumero');
  const [sortDirection, setSortDirection] = useState('DESC');
  const navigate = useNavigate();

  const cargarSalidas = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/salida?sortBy=${sortColumn}&order=${sortDirection}`);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setSalidas(data);
      } else {
        setMensaje('❌ Error al cargar salidas: Formato de datos inesperado.');
        console.error('Datos recibidos no son un array:', data);
      }
    } catch (err) {
      console.error("❌ Error al consultar salidas:", err);
      setMensaje('❌ No se pudo conectar al servidor o error al cargar salidas.');
    }
  }, [sortColumn, sortDirection]);

  useEffect(() => {
    cargarSalidas();
  }, [cargarSalidas]); // ✅ CORREGIDO: Ahora es 'cargarSalidas'

  const toggleExpand = (salNumero) => {
    setExpandedSalidas(prev => ({
      ...prev,
      [salNumero]: !prev[salNumero]
    }));
  };

  const irARegistroSalida = () => {
    navigate('/registro/salida');
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
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 shadow-lg rounded-lg mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Lista de Salidas</h2>

      <div className="flex justify-end items-center mb-6">
        <button
          onClick={irARegistroSalida}
          className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md text-lg font-medium flex items-center gap-2"
        >
          <Plus size={20} /> Nueva Salida
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
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('SalNumero')}>
                <div className="flex items-center">Nro. Salida {renderSortIcon('SalNumero')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('NroRelacion')}>
                <div className="flex items-center">Nro. Relación {renderSortIcon('NroRelacion')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('RelCorte')}>
                <div className="flex items-center">Corte Relación {renderSortIcon('RelCorte')}</div>
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
              <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Detalles</th>
            </tr>
          </thead>
          <tbody>
            {salidas.length > 0 ? (
              salidas.map((salida) => (
                <React.Fragment key={salida.SalNumero}>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm">{salida.SalNumero}</td>
                    <td className="px-5 py-3 text-sm">{salida.NroRelacion}</td>
                    <td className="px-5 py-3 text-sm">{salida.RelCorte}</td>
                    <td className="px-5 py-3 text-sm">{salida.Estado}</td>
                    <td className="px-5 py-3 text-sm">{salida.UsuarioNombre || salida.Usuario}</td>
                    <td className="px-5 py-3 text-sm">{formatDateToYYYYMMDDHHMMSS(salida.FechaCat)}</td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => toggleExpand(salida.SalNumero)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {expandedSalidas[salida.SalNumero] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </td>
                  </tr>
                  {expandedSalidas[salida.SalNumero] && (
                    <tr>
                      <td colSpan="7" className="p-0">
                        <div className="bg-gray-50 p-4 border-t border-gray-200">
                          <h4 className="font-semibold text-gray-700 mb-2">Detalles de la Salida {salida.SalNumero}:</h4>
                          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="p-2 text-center text-xs font-semibold text-gray-600 uppercase">Ítem</th>
                                <th className="p-2 text-left text-xs font-semibold text-gray-600 uppercase">Producto</th>
                                <th className="p-2 text-left text-xs font-semibold text-gray-600 uppercase">Serie</th>
                                <th className="p-2 text-right text-xs font-semibold text-gray-600 uppercase">Cantidad</th>
                                <th className="p-2 text-left text-xs font-semibold text-gray-600 uppercase">Corte Ítem</th>
                              </tr>
                            </thead>
                            <tbody>
                              {salida.items.map((item, i) => (
                                <tr key={i} className="border-b hover:bg-gray-50">
                                  <td className="p-2 text-center text-sm">{item.Iten}</td>
                                  <td className="p-2 text-sm">{item.ProdNombre} ({item.ProdCodigo})</td>
                                  <td className="p-2 text-sm">{item.Serie}</td>
                                  <td className="p-2 text-right text-sm">{item.Cantidad}</td>
                                  <td className="p-2 text-sm">{item.Corte}</td>
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
                <td colSpan="7" className="text-center text-gray-500 py-4">
                  No hay salidas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
