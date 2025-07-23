import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config/config';

export default function Registro_Usuario() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const legajoParam = queryParams.get('legajo');

  const [formData, setFormData] = useState({
    legajo: '',
    UsuNombre: '',
    contrasena: '',
    rol: '',
    estado: 'Activo',
    fecha_cat: new Date().toISOString(),
    permisos: {}
  });

  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [passwordInputType, setPasswordInputType] = useState('password');

  // Opciones de permisos actualizadas con todos los módulos y nombres consistentes
  const opcionesPermisos = [
    {
      grupo: 'registro',
      modulos: [
        'Usuario',
        'Lista de Usuarios',
        'Producto',
        'Lista de Productos',
        'Tipo de producto',
        'Lista de Tipo de producto',
        'Aprobador',
        'Cargo',
        'Cigarrillera',
        'Minisilo',
        'Tipo de blend',
        'Máquina',
        'Lista de Máquinas',
        'Silo', // Coincide con App.jsx
        'Lista de Silos', // Coincide con App.jsx
        'Relación Silo-Producto', // Coincide con App.jsx
        'Lista de Relación Silo-Producto', // Coincide con App.jsx
        'Registro de Entrada', // Coincide con App.jsx
        'Lista de Entradas', // Coincide con App.jsx
        'Registro de Salida', // Coincide con App.jsx
        'Lista de Salidas', // Coincide con App.jsx
      ]
    },
    {
      grupo: 'movimientos',
      modulos: [
        'Movimiento', // Coincide con App.jsx
        'Pesaje', // Coincide con App.jsx
      ]
    },
    {
      grupo: 'mantenimiento',
      modulos: [
        'Estado de movimiento', // Coincide con App.jsx
        'Repesaje' // Coincide con App.jsx
      ]
    },
    {
      grupo: 'historial',
      modulos: [
        'Blend x cigarrillera', // Coincide con App.jsx
        'Blend minisilo', // Coincide con App.jsx
        'Dash depósito', // Coincide con App.jsx
        'Dash gráfico', // Coincide con App.jsx
        'Dash silo', // Coincide con App.jsx
        'Movimiento tabaco', // Coincide con App.jsx
        'Operación' // Coincide con App.jsx
      ]
    },
    {
      grupo: 'utilidad',
      modulos: [
        'Cambiar contraseña' // Coincide con App.jsx
      ]
    }
  ];

  useEffect(() => {
    if (legajoParam) {
      fetch(`${API_BASE_URL}/usuario/${legajoParam}`)
        .then(res => res.json())
        .then(data => {
          setFormData(prev => ({
            ...prev,
            ...data,
            permisos: data.permisos || {} 
          }));
        })
        .catch(err => console.error("❌ Error al cargar datos del usuario:", err));
    }
  }, [legajoParam]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'rol' && value === 'admin' ? { permisos: {} } : {})
    }));
  };

  const handlePasswordKeyDown = () => {
    setPasswordInputType('text');
  };

  const handlePasswordKeyUp = () => {
    setTimeout(() => {
      setPasswordInputType('password');
    }, 300);
  };

  const togglePermiso = (grupo, modulo) => {
    setFormData(prev => {
      const grupoActual = Array.isArray(prev.permisos?.[grupo]) ? prev.permisos[grupo] : [];
      
      const actualizado = grupoActual.includes(modulo)
        ? grupoActual.filter(p => p !== modulo)
        : [...grupoActual, modulo];

      const nuevosPermisos = { ...prev.permisos, [grupo]: actualizado };
      if (actualizado.length === 0) {
        delete nuevosPermisos[grupo];
      }

      return { ...prev, permisos: nuevosPermisos };
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/usuario${legajoParam ? `/${legajoParam}` : ''}`, {
        method: legajoParam ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error desconocido');

      setTipoMensaje('success');
      setMensaje(data.message);
      
      if (!legajoParam) {
          setTimeout(() => {
              navigate('/registro/lista-usuarios');
          }, 1500); 
      } else {
          setTimeout(() => setMensaje(''), 3000);
      }

    } catch (err) {
      setTipoMensaje('error');
      setMensaje('❌ ' + err.message);
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  const resetFormulario = () => {
    setFormData({
      legajo: '',
      UsuNombre: '',
      contrasena: '',
      rol: '',
      estado: 'Activo',
      fecha_cat: new Date().toISOString(),
      permisos: {}
    });
    setMensaje('');
    setTipoMensaje('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 shadow-lg rounded-lg mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        {legajoParam ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg shadow-md">
        {/* Campos de entrada */}
        <div>
          <label htmlFor="legajo" className="block text-sm font-medium text-gray-700">Legajo:</label>
          <input 
            id="legajo"
            name="legajo" 
            value={formData.legajo} 
            onChange={handleChange} 
            required 
            placeholder="Legajo" 
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
            disabled={!!legajoParam} 
          />
        </div>
        
        <div>
          <label htmlFor="UsuNombre" className="block text-sm font-medium text-gray-700">Nombre:</label>
          <input 
            id="UsuNombre"
            name="UsuNombre" 
            value={formData.UsuNombre} 
            onChange={handleChange} 
            required 
            placeholder="Nombre" 
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
          />
        </div>
        
        <div>
          <label htmlFor="contrasena" className="block text-sm font-medium text-gray-700">Contraseña:</label>
          <input 
            id="contrasena"
            name="contrasena" 
            type={passwordInputType}
            value={formData.contrasena} 
            onChange={handleChange} 
            onKeyDown={handlePasswordKeyDown}
            onKeyUp={handlePasswordKeyUp}
            required 
            placeholder="Contraseña" 
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
          />
        </div>

        {/* Selectores */}
        <div>
          <label htmlFor="rol" className="block text-sm font-medium text-gray-700">Rol:</label>
          <select 
            id="rol"
            name="rol" 
            value={formData.rol} 
            onChange={handleChange} 
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
            required
          >
            <option value="">-- Seleccionar Rol --</option>
            <option value="operador">Operador</option>
            <option value="supervisor">Supervisor</option>
            <option value="auditor">Auditor</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado:</label>
          <select 
            id="estado"
            name="estado" 
            value={formData.estado} 
            onChange={handleChange} 
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>

        {/* Sección de Permisos (oculta si el rol es 'admin') */}
        {formData.rol !== 'admin' && (
          <div className="col-span-1 md:col-span-2 mt-4 border border-gray-200 rounded-lg p-6 bg-gray-50">
            <h3 className="font-semibold mb-4 text-gray-700 text-lg">Permisos por Módulo</h3>
            {opcionesPermisos.map(({ grupo, modulos }) => (
              <div key={grupo} className="mb-5 last:mb-0">
                <p className="text-base font-medium text-gray-800 capitalize mb-2">{grupo.replace('_', ' ')}:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
                  {modulos.map(modulo => (
                    <label key={modulo} className="flex items-center text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permisos?.[grupo]?.includes(modulo) || false}
                        onChange={() => togglePermiso(grupo, modulo)}
                        className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      {modulo}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botones de acción */}
        <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row gap-4 mt-6">
          <button 
            type="submit" 
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md shadow-lg text-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {legajoParam ? 'Actualizar Usuario' : 'Registrar Usuario'}
          </button>
          <button 
            type="button" 
            onClick={resetFormulario} 
            className="flex-1 bg-gray-400 text-white py-3 px-6 rounded-md shadow-lg text-lg font-semibold hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Limpiar Formulario
          </button>
        </div>

        {/* Mensaje de estado */}
        {mensaje && (
          <p className={`col-span-1 md:col-span-2 text-base text-center mt-4 ${tipoMensaje === 'success' ? 'text-green-600' : 'text-red-500'}`}>
            {mensaje}
          </p>
        )}
      </form>
    </div>
  );
}
