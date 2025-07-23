import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config/config';
import Detalle_Maquinas from './Detalle_Maquinas'; // Importamos el componente de máquinas asociadas

// Función para obtener fecha y hora local en formato ISO completo (con TZ corregida)
function getFechaHoraLocal() {
  const ahora = new Date();
  const zonaLocal = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return zonaLocal.toISOString().slice(0, 19).replace('T', ' '); // Formato compatible con SQLite DATETIME
}

export default function Registro_RelSiloBlend1({ usuario }) {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const nroRelacionParam = searchParams.get('NroRelacion');

  const [formData, setFormData] = useState({
    ProdCodigo: '',
    SiloCodigo: '',
    Corte: '',
    Estado: 'Activo',
    FechaCat: getFechaHoraLocal(),
  });

  const [productos, setProductos] = useState([]);
  const [silos, setSilos] = useState([]);
  const [cortesEntrada, setCortesEntrada] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [editando, setEditando] = useState(false);

  const [nroRelacionCreada, setNroRelacionCreada] = useState(null);

  useEffect(() => {
    // Cargar productos
    fetch(`${API_BASE_URL}/producto`)
      .then(res => res.json())
      .then(setProductos)
      .catch(() => {
        setTipoMensaje('error');
        setMensaje('❌ Error al cargar productos.');
      });

    // Cargar silos
    fetch(`${API_BASE_URL}/silo`)
      .then(res => res.json())
      .then(setSilos)
      .catch(() => {
        setTipoMensaje('error');
        setMensaje('❌ Error al cargar silos.');
      });

    // ✅ Cargar cortes de Entrada1 usando el nuevo endpoint
    fetch(`${API_BASE_URL}/cortes-entrada1`) // Usar el endpoint específico para cortes
      .then(res => res.json())
      .then(data => {
        setCortesEntrada(data); // La data ya es el array de cortes
      })
      .catch(() => {
        setTipoMensaje('error');
        setMensaje('❌ Error al cargar cortes de entrada.');
      });

    if (nroRelacionParam) {
      setEditando(true);
      setNroRelacionCreada(nroRelacionParam);
      fetch(`${API_BASE_URL}/relsilo/${nroRelacionParam}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setFormData({
              ProdCodigo: data.ProdCodigo || '',
              SiloCodigo: data.SiloCodigo || '',
              Corte: data.Corte || '',
              Estado: data.Estado || 'Activo',
              FechaCat: data.FechaCat || getFechaHoraLocal(),
            });
          } else {
            setTipoMensaje('error');
            setMensaje('❌ Relación no encontrada para editar.', 'error');
            setEditando(false);
          }
        })
        .catch(err => {
          console.error('Error al cargar relación para edición:', err);
          setTipoMensaje('error');
          setMensaje('❌ Error al cargar datos de la relación para edición.');
        });
    } else {
      setNroRelacionCreada(null);
    }
  }, [nroRelacionParam]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMensaje('');
    setTipoMensaje('');

    if (!usuario?.legajo) {
      setTipoMensaje('error');
      setMensaje('❌ No se detectó el usuario autenticado. Por favor, inicie sesión.');
      return;
    }

    const { ProdCodigo, SiloCodigo, Estado, Corte } = formData;
    if (!ProdCodigo || !SiloCodigo || !Estado || !Corte) {
      setTipoMensaje('error');
      setMensaje('⚠️ Por favor, complete todos los campos obligatorios.');
      return;
    }

    const payload = {
      ...formData,
      Usuario: usuario.legajo,
      FechaCat: getFechaHoraLocal(),
    };

    try {
      let res;
      let data;

      if (editando) {
        res = await fetch(`${API_BASE_URL}/relsilo/${nroRelacionParam}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al actualizar la relación.');

        setTipoMensaje('success');
        setMensaje('✅ Relación actualizada correctamente.');
        setTimeout(() => {
          setMensaje('');
          navigate('/registro/lista-relsilo1');
        }, 1500);

      } else {
        res = await fetch(`${API_BASE_URL}/relsilo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al registrar la relación.');

        setTipoMensaje('success');
        setMensaje(data.message);
        setNroRelacionCreada(data.NroRelacion);

        setTimeout(() => {
          setMensaje('');
        }, 3000);
      }

    } catch (err) {
      console.error('❌ Error en el registro/actualización:', err);
      setTipoMensaje('error');
      setMensaje(`❌ ${err.message || 'Ocurrió un error inesperado.'}`);
      setTimeout(() => setMensaje(''), 4000);
    }
  };

  const resetFormulario = () => {
    setFormData({
      ProdCodigo: '',
      SiloCodigo: '',
      Corte: '',
      Estado: 'Activo',
      FechaCat: getFechaHoraLocal(),
    });
    setMensaje('');
    setTipoMensaje('');
    setEditando(false);
    setNroRelacionCreada(null);
    navigate('/registro/lista-relsilo1');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 shadow-lg rounded-lg mt-10">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
        {editando ? `Editar Relación Principal #${nroRelacionParam}` : 'Registro de Relación Principal'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Selector de Producto */}
          <div>
            <label htmlFor="ProdCodigo" className="block text-sm font-medium text-gray-700">Producto:</label>
            <select
              id="ProdCodigo"
              name="ProdCodigo"
              value={formData.ProdCodigo}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Seleccione un producto</option>
              {productos.map(p => (
                <option key={p.ProdCodigo} value={p.ProdCodigo}>
                  {p.ProdNombre} ({p.TipProdNombre})
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Silo */}
          <div>
            <label htmlFor="SiloCodigo" className="block text-sm font-medium text-gray-700">Silo:</label>
            <select
              id="SiloCodigo"
              name="SiloCodigo"
              value={formData.SiloCodigo}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Seleccione un silo</option>
              {silos.map(s => (
                <option key={s.SiloCodigo} value={s.SiloCodigo}>
                  {s.SiloNombre}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Corte */}
          <div>
            <label htmlFor="Corte" className="block text-sm font-medium text-gray-700">Corte:</label>
            <select
              id="Corte"
              name="Corte"
              value={formData.Corte}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">-- Seleccionar Corte --</option>
              {cortesEntrada.map(corte => (
                <option key={corte} value={corte}>{corte}</option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label htmlFor="Estado" className="block text-sm font-medium text-gray-700">Estado:</label>
            <select
              id="Estado"
              name="Estado"
              value={formData.Estado}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            type="submit"
            className="bg-blue-600 text-white py-3 px-6 rounded-md shadow-lg text-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {editando ? 'Actualizar Relación' : 'Registrar Nueva Relación Principal'}
          </button>
          <button
            type="button"
            onClick={resetFormulario}
            className="bg-gray-400 text-white py-3 px-6 rounded-md shadow-lg text-lg font-semibold hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Limpiar Formulario
          </button>
        </div>

        {mensaje && (
          <p className={`text-base text-center mt-4 ${tipoMensaje === 'success' ? 'text-green-600' : 'text-red-500'}`}>
            {mensaje}
          </p>
        )}
      </form>

      {nroRelacionCreada && (
        <div className="mt-8 pt-8 border-t-2 border-gray-200">
          <h3 className="text-2xl font-bold mb-4 text-gray-800 text-center">
            Máquinas Asociadas a Relación #{nroRelacionCreada}
          </h3>
          <Detalle_Maquinas nroRelacion={nroRelacionCreada} usuario={usuario} />
        </div>
      )}
    </div>
  );
}
