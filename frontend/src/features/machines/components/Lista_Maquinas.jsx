import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config/config';
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

export default function Lista_Maquinas() {
  const [maquinas, setMaquinas] = useState([]);
  const [usuarios, setUsuarios] = useState([]); // Mantener para 'Creado por' si es necesario
  const [mensaje, setMensaje] = useState('');
  const [sortColumn, setSortColumn] = useState('MaqCodigo');
  const [sortDirection, setSortDirection] = useState('ASC');
  const navigate = useNavigate();

  const fetchMaquinas = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/maquina?sortBy=${sortColumn}&order=${sortDirection}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMaquinas(data);
      } else {
        setMensaje('❌ Error al cargar máquinas: Formato de datos inesperado.');
        console.error('Datos recibidos no son un array:', data);
      }
    } catch (err) {
      console.error("❌ Error al cargar máquinas:", err);
      setMensaje('❌ No se pudo conectar al servidor o error al cargar máquinas.');
    }
  }, [sortColumn, sortDirection]);

  const fetchUsuarios = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/usuarios`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsuarios(data);
      } else {
        console.error('Datos de usuarios recibidos no son un array:', data);
      }
    } catch (err) {
      console.error("❌ Error al cargar usuarios:", err);
    }
  };

  // Esta función sigue siendo útil si 'Usuario' (creador) no trae el nombre completo directamente
  const getNombreUsuario = (legajo) => {
    const usuario = usuarios.find(u => u.legajo === legajo);
    return usuario ? usuario.UsuNombre : legajo;
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortColumn(column);
      setSortDirection('ASC');
    }
  };

  const irAEditar = (codigo) => {
    navigate(`/registro/maquina?MaqCodigo=${codigo}`);
  };

  const irANuevaMaquina = () => {
    navigate('/registro/maquina');
  };

  const eliminarMaquina = async (codigo) => {
    if (!window.confirm('⚠️ Esta acción eliminará permanentemente la máquina. ¿Deseás continuar?')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/maquina/${codigo}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje(`✅ ${data.message}`);
        fetchMaquinas();
      } else {
        setMensaje(`❌ Error: ${data.error || 'No se pudo eliminar la máquina.'}`);
      }
    } catch (err) {
      console.error("❌ Error al eliminar máquina:", err);
      setMensaje('❌ No se pudo conectar al servidor para eliminar la máquina.');
    }
    setTimeout(() => setMensaje(''), 3000);
  };

  useEffect(() => {
    fetchMaquinas();
    fetchUsuarios(); // Todavía necesitamos usuarios para 'Creado por'
  }, [fetchMaquinas]);

  const renderSortIcon = (column) => {
    if (sortColumn === column) {
      return sortDirection === 'ASC' ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 shadow-lg rounded-lg mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Lista de Máquinas</h2>

      <div className="flex justify-end mb-6">
        <button
          onClick={irANuevaMaquina}
          className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md text-lg font-medium flex items-center gap-2"
        >
          <Plus size={20} /> Nueva Máquina
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
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('MaqCodigo')}>
                <div className="flex items-center">Código {renderSortIcon('MaqCodigo')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('MaqNombre')}>
                <div className="flex items-center">Nombre {renderSortIcon('MaqNombre')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('Usuario')}>
                <div className="flex items-center">Creado por {renderSortIcon('Usuario')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('FechaCat')}>
                <div className="flex items-center">Fecha creación {renderSortIcon('FechaCat')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('ModificadoPor')}>
                <div className="flex items-center">Modificado por {renderSortIcon('ModificadoPor')}</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('FechaModif')}>
                <div className="flex items-center">Fecha modificación {renderSortIcon('FechaModif')}</div>
              </th>
              <th className="px-8 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {maquinas.length > 0 ? (
              maquinas.map((m) => (
                <tr key={m.MaqCodigo} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm">{m.MaqCodigo}</td>
                  <td className="px-5 py-3 text-sm">{m.MaqNombre}</td>
                  {/* ✅ Usar m.UsuarioNombre que ya viene del JOIN en el backend */}
                  <td className="px-5 py-3 text-sm">{m.UsuarioNombre || '–'}</td> 
                  <td className="px-5 py-3 text-sm">{formatDateToYYYYMMDDHHMMSS(m.FechaCat)}</td>
                  {/* ✅ Usar m.ModificadoPorNombre que ya viene del JOIN en el backend */}
                  <td className="px-5 py-3 text-sm">{m.ModificadoPorNombre || '–'}</td> 
                  {/* ✅ Asegurarse de que FechaModif se formatee correctamente, si existe */}
                  <td className="px-5 py-3 text-sm">{formatDateToYYYYMMDDHHMMSS(m.FechaModif)}</td> 
                  <td className="px-8 py-3 text-center space-x-2 flex flex-col sm:flex-row sm:space-x-2 sm:space-y-0 space-y-2 justify-center items-center">
                    <button
                      onClick={() => irAEditar(m.MaqCodigo)}
                      className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm w-full sm:w-auto"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarMaquina(m.MaqCodigo)}
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
                  No hay máquinas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
