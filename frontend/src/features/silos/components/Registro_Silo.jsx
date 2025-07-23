import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config/config';
import { useLocation, useNavigate } from 'react-router-dom';

// Función para obtener fecha y hora local en formato ISO completo (con TZ corregida)
function getFechaHoraLocal() {
  const ahora = new Date();
  const zonaLocal = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return zonaLocal.toISOString().slice(0, 19).replace('T', ' '); // Formato compatible con SQLite DATETIME
}

export default function Registro_Silo({ usuario }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    SiloNombre: '',
    IP: '',
    Estado: '',
  });

  const [editando, setEditando] = useState(false);
  const [codigoEditar, setCodigoEditar] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    // ✅ CORREGIDO: Cambiado 'SiloCodigo' a 'siloCodigo' para que coincida con la URL
    const codigo = params.get('siloCodigo'); 

    console.log("Registro_Silo useEffect: location.search =", location.search);
    console.log("Registro_Silo useEffect: codigo (from URL) =", codigo);

    if (codigo) {
      setEditando(true);
      setCodigoEditar(codigo);

      fetch(`${API_BASE_URL}/silo/${codigo}`)
        .then(res => {
          console.log("Registro_Silo Fetch response:", res);
          if (!res.ok) {
            return res.json().then(errorData => {
              throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
            });
          }
          return res.json();
        })
        .then(data => {
          console.log("Registro_Silo Datos del silo recibidos:", data);
          setForm({
            SiloNombre: data.SiloNombre || '',
            IP: data.IP || '',
            Estado: data.Estado || '',
          });
          setMensaje("✅ Datos del silo cargados correctamente.");
          setTipoMensaje("success");
        })
        .catch(err => {
          console.error("❌ Registro_Silo Error al obtener silo:", err);
          setMensaje(`❌ Error al cargar los datos del silo: ${err.message}`);
          setTipoMensaje("error");
        });
    } else {
      console.log("Registro_Silo: No siloCodigo en la URL, reseteando formulario.");
      setEditando(false);
      setCodigoEditar(null);
      setForm({
        SiloNombre: '',
        IP: '',
        Estado: '',
      });
      setMensaje('');
      setTipoMensaje('');
    }
  }, [location.search]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setTipoMensaje('');

    if (!usuario?.legajo) {
      setTipoMensaje('error');
      setMensaje('❌ No se detectó el usuario autenticado. Por favor, inicie sesión.');
      return;
    }

    try {
      let res, data;
      const payload = { ...form };

      if (editando) {
        res = await fetch(`${API_BASE_URL}/silo/${codigoEditar}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        payload.Usuario = usuario.legajo;
        payload.FechaCat = getFechaHoraLocal();

        res = await fetch(`${API_BASE_URL}/silo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error desconocido');

      setTipoMensaje('success');
      setMensaje(data.message);
      
      if (!editando) {
          setTimeout(() => {
              navigate('/registro/lista-silos');
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
    setForm({
      SiloNombre: '',
      IP: '',
      Estado: '',
    });
    setMensaje('');
    setTipoMensaje('');
    setEditando(false);
    setCodigoEditar(null);
    navigate('/registro/silo');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-50 shadow-lg rounded-lg mt-10">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
        {editando ? 'Editar Silo' : 'Registrar Silo'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
        <div>
          <label htmlFor="SiloNombre" className="block text-sm font-medium text-gray-700">Nombre del Silo:</label>
          <input
            id="SiloNombre"
            type="text"
            name="SiloNombre"
            placeholder="Ej: Silo Principal"
            value={form.SiloNombre}
            onChange={handleChange}
            required
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="IP" className="block text-sm font-medium text-gray-700">Dirección IP:</label>
          <input
            id="IP"
            type="text"
            name="IP"
            placeholder="Ej: 192.168.1.100"
            value={form.IP}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="Estado" className="block text-sm font-medium text-gray-700">Estado:</label>
          <select
            id="Estado"
            name="Estado"
            value={form.Estado}
            onChange={handleChange}
            required
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Seleccionar Estado --</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors shadow-md text-lg font-medium"
          >
            {editando ? 'Actualizar Silo' : 'Registrar Silo'}
          </button>
          <button
            type="button"
            onClick={resetFormulario}
            className="flex-1 bg-gray-400 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors shadow-md text-lg font-medium"
          >
            Limpiar
          </button>
        </div>

        {mensaje && (
          <p className={`text-base text-center mt-4 ${tipoMensaje === 'success' ? 'text-green-600' : 'text-red-500'}`}>
            {mensaje}
          </p>
        )}
      </form>
    </div>
  );
}
