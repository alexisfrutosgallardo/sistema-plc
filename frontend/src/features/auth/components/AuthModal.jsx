import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config/config';

const AuthModal = ({ isOpen, onClose, onAuthSuccess, requiredRoles, errorMessage }) => {
  const [legajo, setLegajo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLegajo('');
      setPassword('');
      setError(errorMessage);
    }
  }, [isOpen, errorMessage]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!legajo || !password) {
      setError("⚠️ Por favor, ingrese el legajo y la contraseña.");
      setLoading(false);
      return;
    }

    try {
      // ✅ CORRECCIÓN CLAVE: La URL se construye correctamente para evitar el doble /api/
      const response = await fetch(`${API_BASE_URL}/auth/validate-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legajo, password }),
      });

      const data = await response.json();
      if (response.ok) {
        onAuthSuccess(data.userRole);
        onClose();
      } else {
        setError(data.error || "Error de validación de credenciales.");
      }
    } catch (err) {
      console.error("Error al validar credenciales:", err);
      setError("Error de conexión con el servidor de autenticación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative bg-white rounded-lg shadow-xl p-8 m-4 max-w-sm w-full transform transition-all duration-300 scale-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Validación de Credenciales</h2>
        <p className="text-gray-600 mb-4">
          Esta acción requiere autorización de un rol específico. Por favor, pida a un **{requiredRoles.join(' o ')}** que ingrese sus credenciales.
        </p>

        {error && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="legajo">
              Legajo
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:border-blue-300"
              id="legajo"
              type="text"
              placeholder="Legajo de usuario"
              value={legajo}
              onChange={(e) => setLegajo(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Contraseña
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring focus:border-blue-300"
              id="password"
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Validando...' : 'Validar'}
            </button>
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
