import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config/config';
import { useLocation, useNavigate } from 'react-router-dom';

// Función para obtener fecha y hora local en formato ISO completo (con TZ corregida)
function getFechaHoraLocal() {
  const ahora = new Date();
  const zonaLocal = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return zonaLocal.toISOString().slice(0, 19).replace('T', ' '); // Formato compatible con SQLite DATETIME
}

export default function Registro_TipoProducto({ usuario }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  // ✅ CORREGIDO: Cambiado 'TipProdCodigo' a 'tipProdCodigo' para que coincida con la URL
  const tipProdCodigoParam = queryParams.get('tipProdCodigo'); 

  const [nuevoTipo, setNuevoTipo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    console.log("Registro_TipoProducto useEffect: location.search =", location.search);
    console.log("Registro_TipoProducto useEffect: tipProdCodigoParam (from URL) =", tipProdCodigoParam);

    if (tipProdCodigoParam) {
      setEditando(true);
      const fetchTipoProducto = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/tipoproducto/${tipProdCodigoParam}`);
          console.log("Registro_TipoProducto Fetch response:", res);
          if (!res.ok) {
            return res.json().then(errorData => {
              throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
            });
          }
          const data = await res.json();
          console.log("Registro_TipoProducto Datos del tipo de producto recibidos:", data);
          if (data && data.TipProdNombre) {
            setNuevoTipo(data.TipProdNombre);
            mostrarMensaje('✅ Datos del tipo de producto cargados correctamente.', 'success');
          } else {
            mostrarMensaje('❌ Tipo de producto no encontrado para edición.', 'error');
            setEditando(false);
          }
        } catch (err) {
          console.error("❌ Error al cargar tipo de producto para edición:", err);
          mostrarMensaje(`❌ Error al cargar datos del tipo de producto para edición: ${err.message}`, 'error');
          setEditando(false);
        }
      };
      fetchTipoProducto();
    } else {
      console.log("Registro_TipoProducto: No tipProdCodigo en la URL, reseteando formulario.");
      setEditando(false);
      setNuevoTipo('');
      setMensaje('');
      setTipoMensaje('');
    }
  }, [tipProdCodigoParam, location.search]); // Agregamos location.search como dependencia por si cambia la URL completa

  const mostrarMensaje = (msg, tipo = 'success') => {
    setMensaje(msg);
    setTipoMensaje(tipo);
    setTimeout(() => setMensaje(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setTipoMensaje('');

    if (!nuevoTipo.trim()) {
      mostrarMensaje('⚠️ Ingrese un nombre válido para el tipo de producto.', 'error');
      return;
    }

    if (!usuario?.legajo) {
      mostrarMensaje('❌ No se detectó el usuario autenticado. Por favor, inicie sesión.', 'error');
      return;
    }

    const payload = {
      TipProdNombre: nuevoTipo,
      Usuario: usuario.legajo,
      FechaCat: getFechaHoraLocal(),
    };

    const metodo = editando ? 'PUT' : 'POST';
    const url = editando
      ? `${API_BASE_URL}/tipoproducto/${tipProdCodigoParam}`
      : `${API_BASE_URL}/tipoproducto`;

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error inesperado');
      
      mostrarMensaje(data.message, 'success');
      
      setTimeout(() => {
        navigate('/registro/lista-tipoproducto');
      }, 1500);

    } catch (err) {
      console.error("Error en el registro/actualización de tipo de producto:", err);
      mostrarMensaje(`❌ ${err.message || 'Ocurrió un error inesperado al guardar el tipo de producto.'}`, 'error');
    }
  };

  const resetFormulario = () => {
    setNuevoTipo('');
    setEditando(false);
    setMensaje('');
    setTipoMensaje('');
    navigate('/registro/tipoproducto'); // Redirige a la página de registro vacía
  };

  return (
    <div className="max-w-xl mx-auto bg-gray-50 p-6 rounded-lg shadow-lg mt-10">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
        {editando ? `Editar Tipo de Producto #${tipProdCodigoParam}` : 'Registro de Tipo de Producto'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
        <div>
          <label htmlFor="nuevoTipo" className="block text-sm font-medium text-gray-700">Nombre del Tipo de Producto:</label>
          <input
            type="text"
            id="nuevoTipo"
            value={nuevoTipo}
            onChange={(e) => setNuevoTipo(e.target.value)}
            placeholder="Ej. Tabaco Virginia, Tabaco Burley"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md shadow-lg text-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {editando ? 'Actualizar Tipo' : 'Registrar Tipo'}
          </button>
          <button
            type="button"
            onClick={resetFormulario}
            className="flex-1 bg-gray-400 text-white py-3 px-6 rounded-md shadow-lg text-lg font-semibold hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Limpiar Formulario
          </button>
        </div>
      </form>

      {mensaje && (
        <p className={`text-base text-center mt-4 ${tipoMensaje === 'success' ? 'text-green-600' : 'text-red-500'}`}>
          {mensaje}
        </p>
      )}
    </div>
  );
}
