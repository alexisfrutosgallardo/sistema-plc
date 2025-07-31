import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '../../../config/config';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';

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

export default function Registro_Entrada_Operador({ usuario }) {
  const navigate = useNavigate();

  const [formCabecera, setFormCabecera] = useState({
    EntNumero: '',
    Fecha: '',
    NroCorte: '',
    Estado: '',
    Comentario: '',
    FechaCat: '',
    ProdCodigo: '',
    FechaCura: '',
    Usuario: '',
  });

  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [nextGlobalSerie, setNextGlobalSerie] = useState(0);

  // Cargar la única entrada 'Abierta' al montar el componente
  useEffect(() => {
    const fetchOpenEntry = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/entrada/abierta`, {
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (res.ok) {
          setFormCabecera({
            EntNumero: data.EntNumero,
            Fecha: getFechaLocal(new Date(data.Fecha)),
            NroCorte: data.NroCorte,
            Estado: data.Estado,
            Comentario: data.Comentario,
            FechaCat: data.FechaCat,
            ProdCodigo: data.ProdCodigo,
            FechaCura: data.FechaCura, // Mantener el formato original de la DB para FechaCura
            Usuario: data.Usuario,
          });

          // Cargar los detalles existentes para esta entrada
          const resDetalles = await fetch(`${API_BASE_URL}/entrada/${data.EntNumero}/detalle`);
          const dataDetalles = await resDetalles.json();
          if (resDetalles.ok) {
            setProductosSeleccionados(dataDetalles.map(det => ({
              ProdCodigo: det.ProdCodigo,
              Serie: det.Serie,
              Cantidad: det.Cantidad,
              Fecha: getFechaLocal(new Date(det.Fecha)),
              FechaCura: det.FechaCura, // Mantener el formato original de la DB
              FechaIngr: det.FechaIngr ? getFechaLocal(new Date(det.FechaIngr)) : '',
              Estado: det.Estado,
              Iten: det.Iten // Mantener el Iten existente
            })));
          } else {
            setMensaje('❌ Error al cargar detalles de la entrada abierta.');
            setTipoMensaje('error');
          }

        } else {
          setTipoMensaje('info');
          setMensaje(data.error || 'No hay ninguna entrada con estado "Abierto" para cargar detalles.');
          setFormCabecera(prev => ({ ...prev, EntNumero: null })); // Indicar que no hay entrada abierta
        }
      } catch (err) {
        console.error("❌ Error al cargar la entrada abierta:", err);
        setTipoMensaje('error');
        setMensaje('❌ No se pudo conectar al servidor para cargar la entrada abierta.');
      }
    };

    const fetchProductosYSerie = async () => {
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
      
      // Obtener la última serie global
      try {
        const resSerie = await fetch(`${API_BASE_URL}/entrada/series-counters`);
        const dataSerie = await resSerie.json();
        if (resSerie.ok) {
          setNextGlobalSerie(dataSerie.globalSerie + 1);
        } else {
          console.error("Error al obtener serie global:", dataSerie.error);
        }
      } catch (err) {
        console.error("Error de conexión al obtener serie global:", err);
      }
    };

    fetchOpenEntry();
    fetchProductosYSerie();
  }, []);

  const productoPrincipalSeleccionado = useMemo(() => {
    return productosDisponibles.find(p => p.ProdCodigo === formCabecera.ProdCodigo);
  }, [formCabecera.ProdCodigo, productosDisponibles]);

  const handleAgregarProducto = () => {
    if (!formCabecera.EntNumero) {
      setTipoMensaje('error');
      setMensaje('⚠️ No hay una entrada abierta para agregar productos. El supervisor debe crear una primero.');
      return;
    }
    if (!formCabecera.ProdCodigo) {
      setTipoMensaje('error');
      setMensaje('⚠️ La cabecera de la entrada abierta no tiene un Producto Principal definido.');
      return;
    }

    const newSerie = String(nextGlobalSerie);
    setNextGlobalSerie(prev => prev + 1); // Incrementar para el próximo producto

    setProductosSeleccionados(prev => [
      ...prev,
      {
        ProdCodigo: formCabecera.ProdCodigo, // Asignar el producto principal de la cabecera
        Serie: newSerie,
        Cantidad: '',
        Fecha: getFechaLocal(),
        FechaCura: formCabecera.FechaCura, // Usar FechaCura de la cabecera (ya viene formateada de la DB)
        FechaIngr: getFechaLocal(), // Por defecto FechaIngr al momento de agregar
        Estado: 'Activo',
        Usuario: usuario.legajo, // Asignar el usuario actual
        FechaCat: formatDateToYYYYMMDDHHMMSS(new Date()), // Asignar la fecha de carga actual
        Iten: prev.length + 1 // Asignar el siguiente Iten
      }
    ]);
  };

  const handleProductoChange = (index, field, value) => {
    const nuevosProductos = [...productosSeleccionados];
    nuevosProductos[index][field] = value;
    setProductosSeleccionados(nuevosProductos);
  };

  const handleEliminarProducto = (index) => {
    setProductosSeleccionados(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitDetalles = async (e) => {
    e.preventDefault();
    setMensaje('');
    setTipoMensaje('');

    if (!formCabecera.EntNumero) {
      setTipoMensaje('error');
      setMensaje('❌ No hay una entrada abierta para guardar detalles.');
      return;
    }

    if (productosSeleccionados.length === 0) {
      setTipoMensaje('error');
      setMensaje('⚠️ Debe agregar al menos un producto a la entrada.');
      return;
    }

    for (const prod of productosSeleccionados) {
      if (!prod.Serie || prod.Cantidad === '' || !prod.Fecha || !prod.FechaCura || !prod.Estado) {
        setTipoMensaje('error');
        setMensaje('⚠️ Por favor, complete todos los campos obligatorios de cada producto de entrada (Serie, Cantidad, Fecha, Fecha Cura, Estado).');
        return;
      }
    }

    const payload = {
      // No enviamos los campos de cabecera aquí, solo los detalles
      productosSeleccionados: productosSeleccionados.map(p => ({
        ...p,
        Cantidad: parseFloat(p.Cantidad),
        // Asegurarse de que el usuario y la fecha de carga del detalle sean los del operador
        Usuario: usuario.legajo, 
        FechaCat: formatDateToYYYYMMDDHHMMSS(new Date()),
        FechaCura: formCabecera.FechaCura // Usar la FechaCura de la cabecera
      }))
    };

    try {
      const res = await fetch(`${API_BASE_URL}/entrada/${formCabecera.EntNumero}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error desconocido al actualizar los detalles.');

      setTipoMensaje('success');
      setMensaje(data.message);
      
      // Reiniciar productos seleccionados para una nueva carga
      setProductosSeleccionados([]);
      // Volver a cargar la serie global para el próximo detalle
      const resSerie = await fetch(`${API_BASE_URL}/entrada/series-counters`);
      const dataSerie = await resSerie.json();
      if (resSerie.ok) {
        setNextGlobalSerie(dataSerie.globalSerie + 1);
      }

      setTimeout(() => {
        setMensaje('');
        navigate('/registro/lista-entradas'); // Redirección final
      } , 1500);

    } catch (err) {
      console.error('❌ Error al procesar detalles de entrada:', err);
      setTipoMensaje('error');
      setMensaje(`❌ ${err.message || 'Ocurrió un error inesperado al procesar los detalles.'}`);
      setTimeout(() => setMensaje(''), 4000);
    }
  };

  if (!formCabecera.EntNumero && tipoMensaje === 'info') {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-yellow-100 text-yellow-700 rounded-lg shadow-lg mt-10 text-center">
        <p className="text-xl font-semibold mb-4">¡Atención!</p>
        <p className="text-lg">{mensaje}</p>
        <p className="mt-4">Por favor, espera a que un supervisor registre una nueva cabecera de entrada.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 shadow-lg rounded-lg mt-10">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
        Cargar Detalles de Entrada (Operador)
      </h2>

      <form onSubmit={handleSubmitDetalles} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        {/* Sección de Cabecera de Entrada (Solo lectura) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md bg-blue-50 border-blue-200">
          <h3 className="md:col-span-2 text-xl font-semibold text-blue-800 mb-3">Cabecera de Entrada (Solo Lectura)</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nro. Entrada:</label>
            <p className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-blue-100 text-blue-900 font-bold">{formCabecera.EntNumero}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha:</label>
            <p className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-blue-100 text-blue-900">{formatDateToYYYYMMDDHHMMSS(formCabecera.Fecha, 'DD-MM-YYYY HH:mm:ss')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Número de Corte:</label>
            <p className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-blue-100 text-blue-900">{formCabecera.NroCorte}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Estado:</label>
            <p className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-blue-100 text-blue-900">{formCabecera.Estado}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Producto Principal:</label>
            <p className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-blue-100 text-blue-900">
              {productoPrincipalSeleccionado ? 
               `${productoPrincipalSeleccionado.ProdNombre} (${productoPrincipalSeleccionado.TipProdNombre})` : 
               'Cargando...'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha Cura (Cabecera):</label>
            <p className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-blue-100 text-blue-900">{formatDateToYYYYMMDDHHMMSS(formCabecera.FechaCura, 'DD-MM-YYYY HH:mm:ss')}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Comentario:</label>
            <p className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-blue-100 text-blue-900">{formCabecera.Comentario || 'N/A'}</p>
          </div>
        </div>

        {/* Sección de Productos de Entrada (Detalles) */}
        <h3 className="font-semibold mt-6 text-xl text-gray-700 mb-4">Productos a Ingresar (Detalle)</h3>
        {productosSeleccionados.length === 0 && (
          <p className="text-center text-gray-500">Haz clic en "Agregar Producto" para añadir detalles de la entrada.</p>
        )}
        {productosSeleccionados.map((item, index) => (
          <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-4 p-4 border border-gray-200 rounded-md bg-gray-50">
            <div>
              <label className="block text-sm font-medium text-gray-700">Producto:</label>
              <p className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-800">
                {productoPrincipalSeleccionado ? 
                 `${productoPrincipalSeleccionado.ProdNombre} (${productoPrincipalSeleccionado.TipProdNombre})` : 
                 'Producto no seleccionado'}
              </p>
              <input type="hidden" name="ProdCodigo" value={item.ProdCodigo} />
            </div>
            {/* Campo Serie ahora es de solo lectura y muestra el número autoincremental */}
            <div>
              <label htmlFor={`Serie-${index}`} className="block text-sm font-medium text-gray-700">Serie:</label>
              <input
                type="text"
                id={`Serie-${index}`}
                value={item.Serie}
                readOnly
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-800 cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor={`Cantidad-${index}`} className="block text-sm font-medium text-gray-700">Cantidad:</label>
              <input
                type="number"
                id={`Cantidad-${index}`}
                placeholder="Cantidad"
                min="0"
                step="0.01"
                value={item.Cantidad}
                onChange={e => handleProductoChange(index, 'Cantidad', e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor={`Fecha-${index}`} className="block text-sm font-medium text-gray-700">Fecha:</label>
              <input
                type="date"
                id={`Fecha-${index}`}
                value={item.Fecha}
                onChange={e => handleProductoChange(index, 'Fecha', e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor={`FechaCura-${index}`} className="block text-sm font-medium text-gray-700">Fecha Cura:</label>
              <input
                type="text" // Cambiado a type="text"
                id={`FechaCura-${index}`}
                value={formatDateToYYYYMMDDHHMMSS(item.FechaCura, 'DD-MM-YYYY HH:mm:ss')} // Formateado para mostrar
                onChange={e => handleProductoChange(index, 'FechaCura', e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-800 cursor-not-allowed"
                readOnly // FechaCura de detalle es la misma que la de cabecera
                required
              />
            </div>
            <div>
              <label htmlFor={`FechaIngr-${index}`} className="block text-sm font-medium text-gray-700">Fecha Ingreso (Opcional):</label>
              <input
                type="date"
                id={`FechaIngr-${index}`}
                value={item.FechaIngr}
                onChange={e => handleProductoChange(index, 'FechaIngr', e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor={`EstadoProducto-${index}`} className="block text-sm font-medium text-gray-700">Estado Producto:</label>
              <select
                id={`EstadoProducto-${index}`}
                value={item.Estado}
                onChange={e => handleProductoChange(index, 'Estado', e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => handleEliminarProducto(index)}
                className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors shadow-sm text-sm flex items-center justify-center gap-1"
              >
                <Trash2 size={16} /> Eliminar
              </button>
            </div>
          </div>
        ))}

        {/* Botones de acción para productos */}
        <div className="flex justify-start gap-4 mt-4">
          <button
            type="button"
            onClick={handleAgregarProducto}
            className="bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 transition-colors shadow-md text-base font-medium flex items-center gap-2"
          >
            <Plus size={20} /> Agregar Producto
          </button>
          <button
            type="button"
            onClick={() => setProductosSeleccionados([])}
            className="bg-gray-400 text-white px-5 py-2 rounded-md hover:bg-gray-600 transition-colors shadow-md text-base font-medium"
          >
            Limpiar Productos
          </button>
        </div>

        {/* Botón de Envío del Formulario Principal */}
        <div className="flex justify-center mt-6">
          <button
            type="submit"
            className="w-full max-w-xs bg-blue-600 text-white py-3 px-6 rounded-md shadow-lg text-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Guardar Detalles
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
