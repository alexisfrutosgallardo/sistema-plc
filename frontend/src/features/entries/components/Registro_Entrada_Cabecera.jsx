import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config/config';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

// Función para obtener fecha local en formato YYYY-MM-DD
function getFechaLocal(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Función para obtener fecha y hora local en formato ISO completo (con TZ corregida)
function getFechaHoraLocal(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Función para sumar horas a una fecha (para FechaCura de cabecera)
function addHoursToDate(dateString, hoursToAdd) {
  if (!dateString || hoursToAdd === undefined || hoursToAdd === null || isNaN(parseInt(hoursToAdd))) return '';
  const date = new Date(dateString);
  date.setHours(date.getHours() + parseInt(hoursToAdd, 10));
  return getFechaHoraLocal(date);
}

export default function Registro_Entrada_Cabecera({ usuario }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const entNumeroParam = queryParams.get('entNumero');

  const userRole = usuario ? usuario.rol : null;

  const [formCabecera, setFormCabecera] = useState({
    Fecha: getFechaLocal(),
    NroCorte: '',
    Estado: 'Abierto',
    Comentario: '',
    FechaCat: getFechaHoraLocal(),
    ProdCodigo: '',
    FechaCura: '',
    Usuario: usuario ? usuario.legajo : '',
  });

  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [nroCorteError, setNroCorteError] = useState('');
  const [editando, setEditando] = useState(false);
  const [tieneDetalles, setTieneDetalles] = useState(0); // ✅ Nuevo estado para TieneDetalles

  // Cargar productos disponibles y datos de la entrada si se está editando
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Cargar productos disponibles (necesario para el select de Producto Principal)
        const productosRes = await fetch(`${API_BASE_URL}/producto`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!productosRes.ok) {
          throw new Error(`HTTP error! status: ${productosRes.status} al obtener productos`);
        }
        const productosData = await productosRes.json();
        setProductosDisponibles(productosData);

        if (entNumeroParam) {
          setEditando(true);
          const resCabecera = await fetch(`${API_BASE_URL}/entrada/${entNumeroParam}`);
          if (!resCabecera.ok) throw new Error('Error al cargar la cabecera de la entrada.');
          const dataCabecera = await resCabecera.json();

          setFormCabecera(prev => ({
            ...prev,
            Fecha: getFechaLocal(new Date(dataCabecera.Fecha)),
            NroCorte: dataCabecera.NroCorte,
            Estado: dataCabecera.Estado,
            Comentario: dataCabecera.Comentario,
            FechaCat: dataCabecera.FechaCat,
            Usuario: dataCabecera.Usuario,
            ProdCodigo: dataCabecera.ProdCodigo,
            FechaCura: dataCabecera.FechaCura || '',
          }));
          setTieneDetalles(dataCabecera.TieneDetalles || 0); // ✅ Cargar TieneDetalles
        }
      } catch (err) {
        console.error("Error al cargar datos iniciales:", err);
        setTipoMensaje('error');
        setMensaje(`❌ Error al cargar datos: ${err.message}`);
      }
    };

    fetchInitialData();
  }, [entNumeroParam, usuario]);

  // useEffect para actualizar FechaCura de la cabecera usando la fecha y hora actual
  useEffect(() => {
    if (formCabecera.ProdCodigo && productosDisponibles.length > 0) {
      const selectedProduct = productosDisponibles.find(p => p.ProdCodigo === formCabecera.ProdCodigo);
      if (selectedProduct && selectedProduct.HorasCura !== undefined) {
        const now = new Date();
        const calculatedFechaCura = addHoursToDate(getFechaHoraLocal(now), selectedProduct.HorasCura);
        setFormCabecera(prev => ({ ...prev, FechaCura: calculatedFechaCura }));
      } else {
        setFormCabecera(prev => ({ ...prev, FechaCura: '' }));
      }
    } else {
      setFormCabecera(prev => ({ ...prev, FechaCura: '' }));
    }
  }, [formCabecera.ProdCodigo, productosDisponibles]);

  // Actualizar el usuario en formCabecera si cambia
  useEffect(() => {
    if (usuario && usuario.legajo) {
      setFormCabecera(prev => ({ ...prev, Usuario: usuario.legajo }));
    }
  }, [usuario]);

  const handleCabeceraChange = async e => {
    const { name, value } = e.target;
    setFormCabecera(prev => ({ ...prev, [name]: value }));

    if (name === 'NroCorte' && value.trim() !== '') {
      if (!editando || (editando && value.trim() !== formCabecera.NroCorte)) {
        try {
          const res = await fetch(`${API_BASE_URL}/entrada/check-nrocorte/${value.trim()}`, {
            headers: { 'Content-Type': 'application/json' },
          });
          const data = await res.json();
          if (data.exists) {
            setNroCorteError(`⚠️ El Número de Corte '${value.trim()}' ya existe.`);
          } else {
            setNroCorteError('');
          }
        } catch (err) {
          console.error("Error al verificar NroCorte:", err);
          setNroCorteError('Error al verificar el número de corte.');
        }
      } else {
        setNroCorteError('');
      }
    } else if (name === 'NroCorte' && value.trim() === '') {
      setNroCorteError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setTipoMensaje('');

    if (!usuario?.legajo) {
      setTipoMensaje('error');
      setMensaje('❌ No se detectó el usuario autenticado. Por favor, inicie sesión.');
      setTimeout(() => setMensaje(''), 4000);
      return;
    }

    const { Fecha, NroCorte, ProdCodigo, FechaCura, Estado } = formCabecera;
    if (!Fecha || !NroCorte || !ProdCodigo || !FechaCura) {
        setTipoMensaje('error');
        setMensaje('⚠️ Por favor, complete todos los campos obligatorios de la cabecera (Fecha, Número de Corte, Producto Principal, Fecha Cura).');
        setTimeout(() => setMensaje(''), 4000);
        return;
    }

    if (nroCorteError) {
      setTipoMensaje('error');
      setMensaje('⚠️ El Número de Corte ingresado ya existe. Por favor, corrija el error.');
      setTimeout(() => setMensaje(''), 4000);
      return;
    }

    // ✅ Validación frontend para cerrar la operación (solo para supervisor)
    if (userRole === 'supervisor' && editando && Estado === 'Cerrado' && tieneDetalles !== 1) {
      setTipoMensaje('error');
      setMensaje('❌ No se puede cerrar la operación sin tener productos de detalle cargados.');
      setTimeout(() => setMensaje(''), 5000);
      return;
    }


    // Payload solo con datos de cabecera
    const payload = {
      Fecha: formCabecera.Fecha,
      NroCorte: formCabecera.NroCorte,
      Estado: formCabecera.Estado,
      Comentario: formCabecera.Comentario,
      FechaCat: getFechaHoraLocal(), // Actualizar FechaCat al guardar
      Usuario: usuario.legajo,
      ProdCodigo: formCabecera.ProdCodigo,
      FechaCura: formCabecera.FechaCura,
      productosSeleccionados: [] // Enviar array vacío para que el backend no espere detalles
    };

    try {
      let res;
      let data;
      let url = '';
      let method = '';

      if (editando) {
        url = `${API_BASE_URL}/entrada/${entNumeroParam}`;
        method = 'PUT';
      } else {
        url = `${API_BASE_URL}/entrada`;
        method = 'POST';
      }

      res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error desconocido al procesar la entrada.');
      
      setTipoMensaje('success');
      setMensaje(data.message);
      
      // Limpiar formulario y reiniciar estados después de éxito
      setFormCabecera({
        Fecha: getFechaLocal(),
        NroCorte: '',
        Estado: 'Abierto',
        Comentario: '',
        FechaCat: getFechaHoraLocal(),
        ProdCodigo: '',
        FechaCura: '',
        Usuario: usuario ? usuario.legajo : '',
      });
      setEditando(false);
      setTieneDetalles(0); // Resetear el estado de detalles

      setTimeout(() => {
        setMensaje('');
        navigate('/registro/lista-entradas');
      }, 1500);

    } catch (err) {
      console.error('❌ Error al procesar entrada:', err);
      setTipoMensaje('error');
      setMensaje(`❌ ${err.message || 'Ocurrió un error inesperado al procesar la entrada.'}`);
      setTimeout(() => setMensaje(''), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 shadow-lg rounded-lg mt-10">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
        {editando ? 'Editar Cabecera de Entrada' : 'Registro de Nueva Entrada (Cabecera)'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        {/* Sección de Cabecera de Entrada */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="Fecha" className="block text-sm font-medium text-gray-700">Fecha:</label>
            <input
              type="date"
              id="Fecha"
              name="Fecha"
              value={formCabecera.Fecha}
              onChange={handleCabeceraChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="NroCorte" className="block text-sm font-medium text-gray-700">Número de Corte:</label>
            <input
              type="text"
              id="NroCorte"
              name="NroCorte"
              placeholder="Ej: C-001"
              value={formCabecera.NroCorte}
              onChange={handleCabeceraChange}
              className={`mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${nroCorteError ? 'border-red-500' : 'border-gray-300'}`}
              required
              readOnly={editando} // NroCorte no se edita si ya existe
            />
            {nroCorteError && <p className="text-red-500 text-xs mt-1">{nroCorteError}</p>}
          </div>
          {editando && (
            <div>
              <label htmlFor="Estado" className="block text-sm font-medium text-gray-700">Estado:</label>
              <select
                id="Estado"
                name="Estado"
                value={formCabecera.Estado}
                onChange={handleCabeceraChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="Abierto">Abierto</option>
                {/* ✅ Deshabilitar la opción "Cerrado" si no tiene detalles */}
                <option value="Cerrado" disabled={tieneDetalles !== 1}>Cerrado</option> 
                <option value="Anulado">Anulado</option>
              </select>
              {formCabecera.Estado === 'Cerrado' && tieneDetalles !== 1 && (
                <p className="text-red-500 text-xs mt-1">Esta operación no puede cerrarse sin detalles.</p>
              )}
            </div>
          )}
          <div className="md:col-span-1">
            <label htmlFor="ProdCodigo" className="block text-sm font-medium text-gray-700">Producto Principal:</label>
            <select
              id="ProdCodigo"
              name="ProdCodigo"
              value={formCabecera.ProdCodigo}
              onChange={handleCabeceraChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Seleccione un producto principal</option>
              {productosDisponibles.map(p => (
                <option key={p.ProdCodigo} value={p.ProdCodigo}>
                  {p.ProdNombre} ({p.TipProdNombre})
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Fecha Cura:</label>
            <input
              type="text"
              value={formCabecera.FechaCura}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
            />
          </div>


          <div className="md:col-span-2">
            <label htmlFor="Comentario" className="block text-sm font-medium text-gray-700">Comentario:</label>
            <textarea
              id="Comentario"
              name="Comentario"
              placeholder="Comentarios adicionales sobre la entrada"
              value={formCabecera.Comentario}
              onChange={handleCabeceraChange}
              rows="2"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
        </div>

        {/* Mensaje para el supervisor sobre los detalles */}
        {editando && userRole === 'supervisor' && (
          <div className={`mt-4 p-3 rounded-md ${tieneDetalles === 1 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {tieneDetalles === 1 ? (
              <p className="flex items-center gap-2">
                <CheckCircle2 size={20} /> Esta entrada tiene detalles de productos cargados.
              </p>
            ) : (
              <p className="flex items-center gap-2">
                <span className="text-lg font-bold">!</span> Esta entrada aún no tiene detalles de productos cargados. No puede ser cerrada.
              </p>
            )}
          </div>
        )}

        {/* Botón de Envío del Formulario Principal */}
        <div className="flex justify-center mt-6">
          <button
            type="submit"
            className="w-full max-w-xs bg-blue-600 text-white py-3 px-6 rounded-md shadow-lg text-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {editando ? 'Actualizar Cabecera' : 'Registrar Cabecera'}
          </button>
        </div>

        {/* Mensaje de feedback */}
        {mensaje && (
          <p className={`text-base text-center mt-4 ${tipoMensaje === 'success' ? 'text-green-600' : 'text-red-500'}`}>
            {mensaje}
          </p>
        )}
      </form>
    </div>
  );
}
