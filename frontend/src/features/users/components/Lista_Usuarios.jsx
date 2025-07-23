import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config/config';

export default function Lista_Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const navigate = useNavigate();

  const fetchUsuarios = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/usuarios`);
      const data = await res.json();
      setUsuarios(data);
    } catch (err) {
      console.error("❌ Error al cargar usuarios:", err);
    }
  };

  const toggleEstadoUsuario = async (legajo, estadoActual) => {
    const nuevoEstado = estadoActual === 'Activo' ? 'Inactivo' : 'Activo';
    // Reemplazar window.confirm con un modal personalizado en un entorno de producción
    const confirmacion = window.confirm(
      `¿Estás segura que querés ${nuevoEstado === 'Activo' ? 'activar' : 'inactivar'} este usuario?`
    );

    if (!confirmacion) return;

    try {
      const res = await fetch(`${API_BASE_URL}/usuario/estado/${legajo}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      const data = await res.json();
      alert(data.message); // Reemplazar alert con un modal personalizado
      fetchUsuarios();
    } catch (err) {
      alert('❌ Error al actualizar estado'); // Reemplazar alert con un modal personalizado
    }
  };

  const eliminarUsuario = async (legajo) => {
    // Reemplazar window.confirm con un modal personalizado en un entorno de producción
    const confirmar = window.confirm('⚠️ Esta acción eliminará permanentemente el usuario. ¿Deseás continuar?');
    if (!confirmar) return;

    try {
      const res = await fetch(`${API_BASE_URL}/usuario/${legajo}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      alert(data.message); // Reemplazar alert con un modal personalizado
      fetchUsuarios();
    } catch (err) {
      console.error("❌ Error al eliminar usuario:", err);
      alert("❌ Error al eliminar usuario"); // Reemplazar alert con un modal personalizado
    }
  };

  const irAEditar = (legajo) => {
    navigate(`/registro/usuario?legajo=${legajo}`);
  };

  const irANuevoUsuario = () => {
    navigate('/registro/usuario'); // Navega a la ruta del formulario de registro de usuario
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 shadow-lg rounded-lg mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Lista de Usuarios</h2>

      {/* Botón para agregar nuevo usuario */}
      <div className="flex justify-end mb-6">
        <button
          onClick={irANuevoUsuario}
          className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md text-lg font-medium flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
          Nuevo Usuario
        </button>
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-200">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Legajo</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rol</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length > 0 ? (
              usuarios.map(u => (
                <tr key={u.legajo} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm">{u.legajo}</td>
                  <td className="px-5 py-3 text-sm">{u.UsuNombre}</td>
                  <td className="px-5 py-3 text-sm">{u.rol}</td>
                  <td className="px-5 py-3 text-sm">{u.estado}</td>
                  <td className="px-5 py-3 text-center space-x-2">
                    <button
                      onClick={() => irAEditar(u.legajo)}
                      className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleEstadoUsuario(u.legajo, u.estado)}
                      className={`px-3 py-1 rounded text-white ${
                        u.estado === 'Activo' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                      } transition-colors text-sm`}
                    >
                      {u.estado === 'Activo' ? 'Inactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => eliminarUsuario(u.legajo)}
                      className="px-3 py-1 rounded bg-gray-700 text-white hover:bg-black transition-colors text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-gray-500 py-4">
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
