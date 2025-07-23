import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bgImage from '../../../assets/bg-login.jpg'; 
import { API_BASE_URL } from '../../../config/config'; 

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [credenciales, setCredenciales] = useState({ legajo: '', contrasena: '' });
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    setCredenciales({ ...credenciales, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setTipoMensaje('');
    setCargando(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credenciales),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error desconocido');

      if (!data.usuario || typeof data.usuario.permisos !== 'object') {
        throw new Error('Estructura de usuario inválida recibida del servidor');
      }

      setTipoMensaje('success');
      setMensaje('✅ Login exitoso');

      // ⏳ Desaparecer mensaje y redirigir luego de 800ms
      setTimeout(() => {
        setMensaje('');
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        onLogin(data.usuario);
        navigate('/dashboard');
      }, 800);
    } catch (error) {
      console.error('Error en login:', error);
      setTipoMensaje('error');
      setMensaje('❌ ' + error.message);

      // ⏳ Eliminar mensaje de error a los 3 segundos
      setTimeout(() => {
        setMensaje('');
        setTipoMensaje('');
      }, 3000);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-4"
      style={{ backgroundImage: `url(${bgImage})`} }
    >
      <div className="bg-white bg-opacity-90 rounded-lg shadow-lg w-full max-w-md p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Bienvenido al Sistema
        </h2>

        {mensaje && (
          <div
            className={`p-2 rounded text-sm mb-4 text-center ${
              tipoMensaje === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {mensaje}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700">Legajo</label>
            <input
              name="legajo"
              value={credenciales.legajo}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingrese su legajo"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700">Contraseña</label>
            <input
              type="password"
              name="contrasena"
              value={credenciales.contrasena}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingrese su contraseña"
              required
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className={`w-full font-semibold py-3 rounded-lg transition duration-300 shadow ${
              cargando
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gray-800 hover:bg-blue-700 text-white'
            }`}
          >
            {cargando ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ©️ 2025 Control y Monitoreo PLC · Desarrollado por AF 🛠️
        </p>
      </div>
    </div>
  );
}
