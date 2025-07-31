import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config/config';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

// Función para obtener fecha local en formato YYYY-MM-DD
function getFechaLocal(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Función de utilidad para formatear la fecha a YYYY-MM-DD HH:mm:ss o DD-MM-YYYY HH:mm:ss
// Ahora es más robusta para aceptar Date objects o strings
const formatDateToYYYYMMDDHHMMSS = (inputDate, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!inputDate) return '–';

  let date;
  if (inputDate instanceof Date) {
    date = inputDate;
  } else if (typeof inputDate === 'string') {
    // Intentar parsear la cadena. Si incluye tiempo, reemplazar ' ' con 'T' para ISO.
    if (inputDate.includes(' ')) {
      date = new Date(inputDate.replace(' ', 'T'));
    } else {
      // Si es solo una fecha (YYYY-MM-DD), interpretarla como local a las 00:00:00
      date = new Date(`${inputDate}T00:00:00`);
    }
  } else {
    return 'Fecha inválida';
  }

  if (isNaN(date.getTime())) {
    return 'Fecha inválida';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  if (format === 'DD-MM-YYYY HH:mm:ss') {
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  }
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Función para sumar horas a una fecha (objeto Date) y devolver un string YYYY-MM-DD HH:mm:ss
function addHoursToDateTimeString(baseDate, hoursToAdd) {
  if (!(baseDate instanceof Date) || hoursToAdd === undefined || hoursToAdd === null || isNaN(hoursToAdd)) {
    return ''; // Retorna cadena vacía para entrada inválida
  }
  const newDate = new Date(baseDate.getTime()); // Clonar la fecha base para no modificar la original
  newDate.setHours(newDate.getHours() + hoursToAdd);

  // Devolver en el formato YYYY-MM-DD HH:mm:ss para guardar en la DB
  const year = newDate.getFullYear();
  const month = String(newDate.getMonth() + 1).padStart(2, '0');
  const day = String(newDate.getDate()).padStart(2, '0');
  const hours = String(newDate.getHours()).padStart(2, '0');
  const minutes = String(newDate.getMinutes()).padStart(2, '0');
  const seconds = String(newDate.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export default function Registro_Entrada_Supervisor({ usuario, entNumeroParam }) {
  const navigate = useNavigate();

  const [formCabecera, setFormCabecera] = useState({
    Fecha: getFechaLocal(), // Esto sigue siendo solo la fecha (YYYY-MM-DD)
    NroCorte: '',
    Estado: 'Abierto', // Siempre 'Abierto' al crear
    Comentario: '',
    FechaCat: formatDateToYYYYMMDDHHMMSS(new Date()), // Fecha de carga con hora exacta
    ProdCodigo: '',
    FechaCura: '', // Se inicializa vacía y se calcula con hora exacta
  });

  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [nroCorteError, setNroCorteError] = useState('');
  const [editando, setEditando] = useState(false);
  const [tieneDetalles, setTieneDetalles] = useState(0); // Para saber si tiene detalles cargados

  useEffect(() => {
    // Cargar productos disponibles
    fetch(`${API_BASE_URL}/producto`, {
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(setProductosDisponibles)
      .catch(() => {
        setTipoMensaje('error');
        setMensaje('❌ Error al cargar productos disponibles.');
      });

    // Si estamos editando una entrada existente (Supervisor solo puede cambiar estado)
    if (entNumeroParam) {
      setEditando(true);
      const fetchEntradaParaEditar = async () => {
        try {
          const resCabecera = await fetch(`${API_BASE_URL}/entrada/${entNumeroParam}`);
          if (!resCabecera.ok) throw new Error('Error al cargar la cabecera de la entrada.');
          const dataCabecera = await resCabecera.json();

          setFormCabecera({
            Fecha: getFechaLocal(new Date(dataCabecera.Fecha)),
            NroCorte: dataCabecera.NroCorte,
            Estado: dataCabecera.Estado,
            Comentario: dataCabecera.Comentario,
            FechaCat: dataCabecera.FechaCat, // Mantener la fecha de carga original
            ProdCodigo: dataCabecera.ProdCodigo,
            FechaCura: dataCabecera.FechaCura, // Mantener la fecha de cura original (ya viene de la DB)
          });
          setTieneDetalles(dataCabecera.TieneDetalles || 0);

        } catch (err) {
          console.error("❌ Error al cargar entrada para edición (Supervisor):", err);
          setTipoMensaje('error');
          setMensaje(`❌ ${err.message || 'Ocurrió un error al cargar la entrada para edición.'}`);
        }
      };
      fetchEntradaParaEditar();
    }
  }, [entNumeroParam]);

  // Efecto para calcular FechaCura cuando cambia ProdCodigo
  // Ahora usa new Date() para obtener la hora exacta del momento
  useEffect(() => {
    if (!editando && formCabecera.ProdCodigo) { // Solo calcular automáticamente en modo creación
      const selectedProduct = productosDisponibles.find(p => p.ProdCodigo === formCabecera.ProdCodigo);
      if (selectedProduct && selectedProduct.HorasCura !== undefined && selectedProduct.HorasCura !== null) {
        const now = new Date(); // Obtener la fecha y hora exacta actual
        const calculatedFechaCura = addHoursToDateTimeString(now, selectedProduct.HorasCura);
        setFormCabecera(prev => ({ ...prev, FechaCura: calculatedFechaCura }));
      } else {
        setFormCabecera(prev => ({ ...prev, FechaCura: '' })); // Reset if no HorasCura
      }
    } else if (editando && formCabecera.ProdCodigo && !formCabecera.FechaCura) {
      // Si estamos editando y no hay FechaCura (ej. producto principal cambiado), recalculamos
      const selectedProduct = productosDisponibles.find(p => p.ProdCodigo === formCabecera.ProdCodigo);
      if (selectedProduct && selectedProduct.HorasCura !== undefined && selectedProduct.HorasCura !== null) {
        const now = new Date(); // Obtener la fecha y hora exacta actual
        const calculatedFechaCura = addHoursToDateTimeString(now, selectedProduct.HorasCura);
        setFormCabecera(prev => ({ ...prev, FechaCura: calculatedFechaCura }));
      }
    }
  }, [formCabecera.ProdCodigo, productosDisponibles, editando]);


  const handleCabeceraChange = async e => {
    const { name, value } = e.target;
    setFormCabecera(prev => ({ ...prev, [name]: value }));

    if (name === 'NroCorte' && value.trim() !== '') {
      // La validación de NroCorte solo aplica en modo creación
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

  const handleSubmitCabecera = async (e) => {
    e.preventDefault();
    setMensaje('');
    setTipoMensaje('');

    if (!usuario?.legajo) {
      setTipoMensaje('error');
      setMensaje('❌ No se detectó el usuario autenticado. Por favor, inicie sesión.');
      return;
    }

    const { Fecha, NroCorte, ProdCodigo, FechaCura } = formCabecera;
    if (!Fecha || !NroCorte || !ProdCodigo || !FechaCura) {
      setTipoMensaje('error');
      setMensaje('⚠️ Por favor, complete todos los campos obligatorios de la cabecera (Fecha, Número de Corte, Producto Principal, Fecha Cura).');
      return;
    }

    if (nroCorteError) {
      setTipoMensaje('error');
      setMensaje('⚠️ El Número de Corte ingresado ya existe. Por favor, corrija el error.');
      return;
    }

    const payload = {
      ...formCabecera,
      Usuario: usuario.legajo,
      FechaCat: formatDateToYYYYMMDDHHMMSS(new Date()), // Fecha de carga siempre al momento del submit
    };

    try {
      let res;
      let data;

      if (editando) {
        // Supervisor solo puede cambiar el estado de una entrada existente
        if (payload.Estado === 'Cerrado' && tieneDetalles === 0) {
          setTipoMensaje('error');
          setMensaje('❌ No se puede cerrar la operación sin tener productos de detalle cargados.');
          return;
        }

        res = await fetch(`${API_BASE_URL}/entrada/${entNumeroParam}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Estado: payload.Estado, Comentario: payload.Comentario, Usuario: payload.Usuario, FechaCat: payload.FechaCat }) // Ahora también enviamos el Comentario
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error desconocido al actualizar la cabecera.');
        setTipoMensaje('success');
        setMensaje(data.message);

      } else {
        // Creación de nueva cabecera por el Supervisor
        res = await fetch(`${API_BASE_URL}/entrada`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error desconocido al registrar la cabecera.');
        setTipoMensaje('success');
        setMensaje(data.message);
      }

      // Limpiar formulario y reiniciar estados si es una nueva entrada
      if (!editando) {
        setFormCabecera({
          Fecha: getFechaLocal(),
          NroCorte: '',
          Estado: 'Abierto',
          Comentario: '',
          FechaCat: formatDateToYYYYMMDDHHMMSS(new Date()),
          ProdCodigo: '',
          FechaCura: '', // Resetear FechaCura
        });
      }
      
      setTimeout(() => {
        setMensaje('');
        navigate('/registro/lista-entradas'); // Redirección final
      } , 1500);

    } catch (err) {
      console.error('❌ Error al procesar cabecera de entrada:', err);
      setTipoMensaje('error');
      setMensaje(`❌ ${err.message || 'Ocurrió un error inesperado al procesar la cabecera.'}`);
      setTimeout(() => setMensaje(''), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 shadow-lg rounded-lg mt-10">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
        {editando ? 'Editar Estado de Entrada (Supervisor)' : 'Registro de Cabecera de Entrada (Supervisor)'}
      </h2>

      <form onSubmit={handleSubmitCabecera} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
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
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
              required
              readOnly // Supervisor no edita la fecha después de la creación
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
              className={`mt-1 block w-full p-2 border rounded-md shadow-sm ${editando ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-blue-500 focus:border-blue-500'} ${nroCorteError ? 'border-red-500' : 'border-gray-300'}`}
              required
              readOnly={editando} // NroCorte editable en creación, no editable en edición
            />
            {nroCorteError && <p className="text-red-500 text-xs mt-1">{nroCorteError}</p>}
          </div>
          {/* Campo Estado solo visible en modo edición */}
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
                <option value="Cerrado">Cerrado</option>
                <option value="Anulado">Anulado</option>
              </select>
            </div>
          )}
          <div className="md:col-span-2">
            <label htmlFor="ProdCodigo" className="block text-sm font-medium text-gray-700">Producto Principal:</label>
            <select
              id="ProdCodigo"
              name="ProdCodigo"
              value={formCabecera.ProdCodigo}
              onChange={handleCabeceraChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={editando} // Deshabilita el selector visualmente en edición
            >
              <option value="">Seleccione un producto principal</option>
              {productosDisponibles.map(p => (
                <option key={p.ProdCodigo} value={p.ProdCodigo}>
                  {p.ProdNombre} ({p.TipProdNombre})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="FechaCura" className="block text-sm font-medium text-gray-700">Fecha Cura:</label>
            <input
              type="text" // Cambiado a type="text"
              id="FechaCura"
              name="FechaCura"
              value={formatDateToYYYYMMDDHHMMSS(formCabecera.FechaCura, 'DD-MM-YYYY HH:mm:ss')} // Formateado para mostrar
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
              required
              readOnly // Siempre de solo lectura para el supervisor
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
              // ✅ Eliminado el atributo readOnly para que el supervisor pueda editarlo
            ></textarea>
          </div>
        </div>

        {editando && (
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
            {editando ? 'Actualizar Estado' : 'Registrar Cabecera'}
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
