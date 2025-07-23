import React, { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '../../../config/config';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowUp, ArrowDown } from 'lucide-react';

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

export default function Lista_TipoProducto() {
  const [tiposProducto, setTiposProducto] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [sortColumn, setSortColumn] = useState('TipProdCodigo');
  const [sortDirection, setSortDirection] = useState('ASC');
  const navigate = useNavigate();

  const cargarTiposProducto = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/tipoproducto?sortBy=${sortColumn}&order=${sortDirection}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setTiposProducto(data);
      } else {
        setMensaje('❌ Error al cargar tipos de producto: Formato de datos inesperado.');
        console.error('Datos recibidos no son un array:', data);
      }
    } catch (err) {
      console.error("❌ Error al consultar tipos de producto:", err);
      setMensaje('❌ No se pudo conectar al servidor o error al cargar tipos de producto.');
    }
  }, [sortColumn, sortDirection]);

  useEffect(() => {
    cargarTiposProducto();
  }, [cargarTiposProducto]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortColumn(column);
      setSortDirection('ASC');
    }
  };

  const eliminarTipoProducto = async (tipProdCodigo) => {
    if (!window.confirm(`¿Estás segura que quieres eliminar este tipo de producto? Esta acción es irreversible.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/tipoproducto/${tipProdCodigo}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje(`✅ ${data.message}`);
        cargarTiposProducto(); // Recargar la lista
      } else {
        setMensaje(`❌ Error: ${data.error || 'No se pudo eliminar el tipo de producto.'}`);
      }
    } catch (err) {
      console.error("❌ Error al eliminar tipo de producto:", err);
      setMensaje('❌ No se pudo conectar al servidor para eliminar el tipo de producto.');
    }
    setTimeout(() => setMensaje(''), 3000);
  };

  const irAEditar = (tipProdCodigo) => {
    // ✅ CORREGIDO: Ruta a /registro/tipoproducto para que coincida con App.jsx
    navigate(`/registro/tipoproducto?tipProdCodigo=${tipProdCodigo}`); 
  };

  const irARegistroTipoProducto = () => {
    navigate('/registro/tipoproducto');
  };

  const renderSortIcon = (column) => {
    if (sortColumn === column) {
      return sortDirection === 'ASC' ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 shadow-lg rounded-lg mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Lista de Tipos de Producto</h2>

      <div className="flex justify-end items-center mb-6">
        <button
          onClick={irARegistroTipoProducto}
          className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md text-lg font-medium flex items-center gap-2"
        >
          <Plus size={20} /> Nuevo Tipo Producto
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
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('TipProdCodigo')}>
                <div className="flex items-center">Código {renderSortIcon('TipProdCodigo')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('TipProdNombre')}>
                <div className="flex items-center">Nombre {renderSortIcon('TipProdNombre')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('Usuario')}>
                <div className="flex items-center">Usuario Carga {renderSortIcon('Usuario')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('FechaCat')}>
                <div className="flex items-center">Fecha Carga {renderSortIcon('FechaCat')}</div>
              </th>
              <th className="px-8 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tiposProducto.length > 0 ? (
              tiposProducto.map((tipo) => (
                <tr key={tipo.TipProdCodigo} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm">{tipo.TipProdCodigo}</td>
                  <td className="px-5 py-3 text-sm">{tipo.TipProdNombre}</td>
                  <td className="px-5 py-3 text-sm">{tipo.UsuarioNombre || tipo.Usuario}</td>
                  <td className="px-5 py-3 text-sm">{formatDateToYYYYMMDDHHMMSS(tipo.FechaCat)}</td>
                  <td className="px-8 py-3 text-center space-x-2 flex flex-col sm:flex-row sm:space-x-2 sm:space-y-0 space-y-2 justify-center items-center">
                    <button
                      onClick={() => irAEditar(tipo.TipProdCodigo)}
                      className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm w-full sm:w-auto"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarTipoProducto(tipo.TipProdCodigo)}
                      className="px-3 py-1 rounded bg-gray-700 text-white hover:bg-black transition-colors text-sm w-full sm:w-auto"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-gray-500 py-4">
                  No hay tipos de producto registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
