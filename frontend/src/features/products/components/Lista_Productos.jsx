import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../config/config';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowUp, ArrowDown } from 'lucide-react'; // Importamos iconos de flecha

// Función de utilidad para formatear la fecha a YYYY-MM-DD HH:mm:ss
const formatDateToYYYYMMDDHHMMSS = (dateString) => {
  if (!dateString) return '–';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Fecha inválida'; // Manejar fechas inválidas
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};


export default function Lista_Productos() {
  const [productos, setProductos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [sortColumn, setSortColumn] = useState('ProdCodigo'); // Estado para la columna de ordenamiento
  const [sortDirection, setSortDirection] = useState('ASC'); // Estado para la dirección de ordenamiento ('ASC' o 'DESC')
  const navigate = useNavigate();

  const cargarProductos = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/producto?sortBy=${sortColumn}&order=${sortDirection}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setProductos(data);
      } else {
        setMensaje('❌ Error al cargar productos: Formato de datos inesperado.');
        console.error('Datos recibidos no son un array:', data);
      }
    } catch (err) {
      console.error("❌ Error al consultar productos:", err);
      setMensaje('❌ No se pudo conectar al servidor o error al cargar productos.');
    }
  };

  useEffect(() => {
    cargarProductos();
  }, [sortColumn, sortDirection]); // Recargar productos cuando cambie la columna o dirección de ordenamiento

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

  const toggleEstadoProducto = async (prodCodigo, estadoActual) => {
    const nuevoEstado = estadoActual === 'Activo' ? 'Inactivo' : 'Activo';
    if (!window.confirm(`¿Estás segura que quieres ${nuevoEstado === 'Activo' ? 'activar' : 'inactivar'} este producto?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/producto/${prodCodigo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Estado: nuevoEstado })
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje(`✅ ${data.message}`);
        cargarProductos(); // Recargar la lista
      } else {
        setMensaje(`❌ Error: ${data.error || 'No se pudo actualizar el estado del producto.'}`);
      }
    } catch (err) {
      console.error("❌ Error al cambiar estado del producto:", err);
      setMensaje('❌ No se pudo conectar al servidor para actualizar el estado.');
    }
    setTimeout(() => setMensaje(''), 3000);
  };

  const eliminarProducto = async (prodCodigo) => {
    if (!window.confirm(`¿Estás segura que quieres eliminar este producto? Esta acción es irreversible.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/producto/${prodCodigo}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje(`✅ ${data.message}`);
        cargarProductos(); // Recargar la lista
      } else {
        setMensaje(`❌ Error: ${data.error || 'No se pudo eliminar el producto.'}`);
      }
    } catch (err) {
      console.error("❌ Error al eliminar producto:", err);
      setMensaje('❌ No se pudo conectar al servidor para eliminar el producto.');
    }
    setTimeout(() => setMensaje(''), 3000);
  };

  const irAEditar = (prodCodigo) => {
    navigate(`/registro/producto?prodCodigo=${prodCodigo}`);
  };

  const irARegistroProducto = () => {
    navigate('/registro/producto');
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
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Lista de Productos</h2>

      {/* ✅ Cambiado justify-between a justify-end para alinear a la derecha */}
      <div className="flex justify-end items-center mb-6"> 
        <button
          onClick={irARegistroProducto}
          className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md text-lg font-medium flex items-center gap-2"
        >
          <Plus size={20} /> Nuevo Producto
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
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('ProdCodigo')}>
                <div className="flex items-center">Código {renderSortIcon('ProdCodigo')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('TipProdCodigo')}>
                <div className="flex items-center">Tipo Prod. {renderSortIcon('TipProdCodigo')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('ProdNombre')}>
                <div className="flex items-center">Nombre {renderSortIcon('ProdNombre')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('Estado')}>
                <div className="flex items-center">Estado {renderSortIcon('Estado')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('Stock')}>
                <div className="flex items-center">Stock {renderSortIcon('Stock')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('HorasCura')}>
                <div className="flex items-center">Horas Cura {renderSortIcon('HorasCura')}</div>
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
            {productos.length > 0 ? (
              productos.map((producto) => (
                <tr key={producto.ProdCodigo} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm">{producto.ProdCodigo}</td>
                  <td className="px-5 py-3 text-sm">{producto.TipProdNombre}</td>
                  <td className="px-5 py-3 text-sm">{producto.ProdNombre}</td>
                  <td className="px-5 py-3 text-sm">{producto.Estado}</td>
                  <td className="px-5 py-3 text-sm">{producto.Stock}</td>
                  <td className="px-5 py-3 text-sm">{producto.HorasCura}</td>
                  <td className="px-5 py-3 text-sm">{producto.UsuarioNombre || producto.Usuario}</td>
                  <td className="px-5 py-3 text-sm">{formatDateToYYYYMMDDHHMMSS(producto.FechaCat)}</td>
                  <td className="px-8 py-3 text-center space-x-2 flex flex-col sm:flex-row sm:space-x-2 sm:space-y-0 space-y-2 justify-center items-center">
                    <button
                      onClick={() => irAEditar(producto.ProdCodigo)}
                      className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm w-full sm:w-auto"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleEstadoProducto(producto.ProdCodigo, producto.Estado)}
                      className={`px-3 py-1 rounded text-white ${
                        producto.Estado === 'Activo' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                      } transition-colors text-sm w-full sm:w-auto`}
                    >
                      {producto.Estado === 'Activo' ? 'Inactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => eliminarProducto(producto.ProdCodigo)}
                      className="px-3 py-1 rounded bg-gray-700 text-white hover:bg-black transition-colors text-sm w-full sm:w-auto"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center text-gray-500 py-4">
                  No hay productos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
