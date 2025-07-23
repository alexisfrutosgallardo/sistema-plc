import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config/config';

export default function Registro_Maquina({ usuario }) {
  const [formData, setFormData] = useState({
    MaqNombre: '',
    // FechaCat y Usuario se añadirán en handleSubmit para POST
    // ModificadoPor y FechaModif se añadirán en handleSubmit para PUT
  });

  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const codigoMaquina = queryParams.get('MaqCodigo');

  useEffect(() => {
    if (codigoMaquina) {
      fetch(`${API_BASE_URL}/maquina/${codigoMaquina}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setFormData({
            MaqNombre: data.MaqNombre || '',
            // No cargamos FechaCat, Usuario, ModificadoPor, FechaModif aquí
            // ya que son datos de auditoría que se gestionan en el backend o en el submit.
          });
        })
        .catch(err => {
          console.error('Error al cargar máquina:', err);
          setTipoMensaje('error');
          setMensaje('❌ Error al cargar la máquina');
        });
    }
  }, [codigoMaquina]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!usuario?.legajo) {
        setTipoMensaje('error');
        setMensaje('❌ No se detectó el usuario autenticado. Por favor, inicie sesión.');
        return;
    }

    try {
        const url = codigoMaquina
            ? `${API_BASE_URL}/maquina/${codigoMaquina}`
            : `${API_BASE_URL}/maquina`;

        const method = codigoMaquina ? 'PUT' : 'POST';

        const now = new Date().toISOString(); // Fecha actual en formato ISO

        const payload = {
            ...formData,
            ...(codigoMaquina
                ? { ModificadoPor: usuario.legajo, FechaModif: now }  // Para PUT
                : { Usuario: usuario.legajo, FechaCat: now }          // Para POST
            )
        };

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error desconocido');

        setTipoMensaje('success');
        setMensaje(data.message);

        if (!codigoMaquina) {
            setTimeout(() => {
                navigate('/registro/lista-maquinas');
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
      MaqNombre: '',
    });
    setMensaje('');
    setTipoMensaje('');
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-gray-50 shadow-lg rounded-lg mt-10">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
        {codigoMaquina ? 'Editar Máquina' : 'Registrar Máquina'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
        <div>
          <label htmlFor="MaqNombre" className="block text-sm font-medium text-gray-700">Nombre de la Máquina:</label>
          <input
            id="MaqNombre"
            type="text"
            name="MaqNombre"
            value={formData.MaqNombre}
            onChange={handleChange}
            required
            placeholder="Ej: PROTOS01"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-4 justify-center">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors shadow-md text-lg font-medium"
          >
            {codigoMaquina ? 'Actualizar' : 'Registrar'}
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
          <p
            className={`text-base text-center mt-4 ${
              tipoMensaje === 'success' ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {mensaje}
          </p>
        )}
      </form>
    </div>
  );
}
