import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config/config';
import { Lock, CheckCircle, XCircle, User } from 'lucide-react';

export default function Utilidad_CambiarContrasena({ usuario }) {

  const [formData, setFormData] = useState({
    legajo: '',
    contrasenaActual: '',
    nuevaContrasena: '',
    confirmarContrasena: ''
  });

  const [targetLegajo, setTargetLegajo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (usuario && usuario.legajo) {
      setFormData(prev => ({ ...prev, legajo: usuario.legajo }));
    }
  }, [usuario]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTargetLegajoChange = (e) => {
    setTargetLegajo(e.target.value);
  };

  // ✅ Declaración de isResettingOtherUser antes de su uso en el JSX y en la lógica
  const isAdmin = usuario?.rol === 'admin';
  const isResettingOtherUser = isAdmin && targetLegajo.trim() !== '' && targetLegajo !== (usuario?.legajo || '');


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setTipoMensaje('');
    setLoading(true);

    if (!usuario?.legajo) {
      setTipoMensaje('error');
      setMensaje('❌ Error: No se detectó el usuario autenticado. Por favor, inicie sesión.');
      setLoading(false);
      return;
    }

    // Validaciones generales
    if (!formData.nuevaContrasena || !formData.confirmarContrasena) {
      setTipoMensaje('error');
      setMensaje('⚠️ Por favor, complete los campos de nueva contraseña y confirmación.');
      setLoading(false);
      return;
    }

    if (formData.nuevaContrasena !== formData.confirmarContrasena) {
      setTipoMensaje('error');
      setMensaje('⚠️ La nueva contraseña y su confirmación no coinciden.');
      setLoading(false);
      return;
    }

    if (formData.nuevaContrasena.length < 6) {
      setTipoMensaje('error');
      setMensaje('⚠️ La nueva contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    let endpoint = '';
    let payload = {};

    if (isResettingOtherUser) {
      if (!targetLegajo.trim()) {
        setTipoMensaje('error');
        setMensaje('⚠️ Como administrador, debe especificar el legajo del usuario a quien desea cambiar la contraseña.');
        setLoading(false);
        return;
      }
      endpoint = `${API_BASE_URL}/admin/reset-contrasena`;
      payload = {
        adminLegajo: usuario.legajo,
        targetLegajo: targetLegajo,
        nuevaContrasena: formData.nuevaContrasena
      };
    } else {
      if (!formData.contrasenaActual) {
        setTipoMensaje('error');
        setMensaje('⚠️ Por favor, ingrese su contraseña actual.');
        setLoading(false);
        return;
      }
      endpoint = `${API_BASE_URL}/usuario/cambiar-contrasena`;
      payload = {
        legajo: formData.legajo,
        contrasenaActual: formData.contrasenaActual,
        nuevaContrasena: formData.nuevaContrasena
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error desconocido al cambiar la contraseña.');
      }

      setTipoMensaje('success');
      setMensaje(data.message || '✅ Contraseña cambiada exitosamente.');

      setFormData({
        ...formData,
        contrasenaActual: '',
        nuevaContrasena: '',
        confirmarContrasena: ''
      });
      setTargetLegajo('');

    } catch (error) {
      console.error('❌ Error en el cambio de contraseña:', error);
      setTipoMensaje('error');
      setMensaje(error.message || '❌ Ocurrió un error inesperado al intentar cambiar la contraseña.');
    } finally {
      setLoading(false);
      setTimeout(() => setMensaje(''), 5000);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center flex items-center justify-center gap-2">
        <Lock size={32} className="text-blue-600" /> Cambiar Contraseña
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {isAdmin && ( // ✅ Usa la variable isAdmin aquí
          <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-md">
            <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <User size={20} /> Modo Administrador
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Puedes cambiar tu propia contraseña o la de otro usuario.
            </p>
            <div>
              <label htmlFor="targetLegajo" className="block text-sm font-medium text-gray-700">
                Legajo del Usuario a Cambiar (dejar vacío para cambiar tu propia contraseña):
              </label>
              <input
                type="text"
                id="targetLegajo"
                name="targetLegajo"
                value={targetLegajo}
                onChange={handleTargetLegajoChange}
                placeholder="Ej: 123456"
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="legajo" className="block text-sm font-medium text-gray-700">Legajo de Usuario:</label>
          <input
            type="text"
            id="legajo"
            name="legajo"
            value={isResettingOtherUser ? targetLegajo : formData.legajo} // ✅ Usa la variable isResettingOtherUser aquí
            disabled
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600 cursor-not-allowed"
          />
        </div>

        {!isResettingOtherUser && ( // ✅ Usa la variable isResettingOtherUser aquí
          <div>
            <label htmlFor="contrasenaActual" className="block text-sm font-medium text-gray-700">Contraseña Actual:</label>
            <input
              type="password"
              id="contrasenaActual"
              name="contrasenaActual"
              value={formData.contrasenaActual}
              onChange={handleChange}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required={!isResettingOtherUser}
            />
          </div>
        )}

        <div>
          <label htmlFor="nuevaContrasena" className="block text-sm font-medium text-gray-700">Nueva Contraseña:</label>
          <input
            type="password"
            id="nuevaContrasena"
            name="nuevaContrasena"
            value={formData.nuevaContrasena}
            onChange={handleChange}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="confirmarContrasena" className="block text-sm font-medium text-gray-700">Confirmar Nueva Contraseña:</label>
          <input
            type="password"
            id="confirmarContrasena"
            name="confirmarContrasena"
            value={formData.confirmarContrasena}
            onChange={handleChange}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          className={`w-full py-3 px-4 rounded-md shadow-lg text-lg font-semibold transition-colors flex items-center justify-center gap-2
            ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Cambiando...
            </>
          ) : (
            isResettingOtherUser ? 'Resetear Contraseña' : 'Cambiar Contraseña' // ✅ Usa la variable isResettingOtherUser aquí
          )}
        </button>
      </form>

      {mensaje && (
        <div className={`mt-6 p-3 rounded-md flex items-center gap-2 ${
          tipoMensaje === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {tipoMensaje === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          <p className="text-sm font-medium">{mensaje}</p>
        </div>
      )}
    </div>
  );
}
