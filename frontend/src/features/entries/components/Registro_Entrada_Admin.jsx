import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '../../../config/config';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';

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

export default function Registro_Entrada_Admin({ usuario, entNumeroParam }) {
  const navigate = useNavigate();

  const [formCabecera, setFormCabecera] = useState({
    Fecha: getFechaLocal(), // Esto sigue siendo solo la fecha (YYYY-MM-DD)
    NroCorte: '',
    Estado: 'Abierto',
    Comentario: '',
    FechaCat: formatDateToYYYYMMDDHHMMSS(new Date()), // Fecha de carga con hora exacta
    ProdCodigo: '',
    FechaCura: '', // Se inicializa vacía y se calcula con hora exacta
  });

  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [nroCorteError, setNroCorteError] = useState('');
  const [editando, setEditando] = useState(false);
  const [nextGlobalSerie, setNextGlobalSerie] = useState(0);
  const [tieneDetalles, setTieneDetalles] = useState(0); // Para saber si tiene detalles cargados
  // ✅ Nuevo estado para controlar si ya existe una entrada abierta
  const [hasOpenEntryExists, setHasOpenEntryExists] = useState(false);

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

    // Obtener la última serie global (para nuevos detalles)
    const fetchGlobalSerie = async () => {
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
    fetchGlobalSerie();

    // ✅ Verificar si ya existe una entrada abierta (solo si no estamos editando)
    const checkOpenEntryStatus = async () => {
      if (!entNumeroParam) { // Solo si estamos en modo creación
        try {
          const res = await fetch(`${API_BASE_URL}/entrada/check-open-entry`);
          const data = await res.json();
          if (res.ok) {
            setHasOpenEntryExists(data.exists);
            if (data.exists) {
              setTipoMensaje('info');
              setMensaje('⚠️ Ya existe una entrada con estado "Abierto". No se puede crear una nueva hasta que la existente sea cerrada o anulada.');
            } else {
              setMensaje(''); // Limpiar mensaje si no hay entradas abiertas
            }
          } else {
            console.error("Error al verificar entrada abierta:", data.error);
            setTipoMensaje('error');
            setMensaje('❌ Error al verificar el estado de entradas abiertas.');
          }
        } catch (err) {
          console.error("Error de conexión al verificar entrada abierta:", err);
          setTipoMensaje('error');
          setMensaje('❌ No se pudo conectar al servidor para verificar entradas abiertas.');
        }
      }
    };
    checkOpenEntryStatus();


    // Lógica para cargar datos si estamos editando
    if (entNumeroParam) {
      setEditando(true);
      const fetchEntradaParaEditar = async () => {
        try {
          const resCabecera = await fetch(`${API_BASE_URL}/entrada/${entNumeroParam}`);
          if (!resCabecera.ok) throw new Error('Error al cargar la cabecera de la entrada.');
          const dataCabecera = await resCabecera.json();

          const resDetalles = await fetch(`${API_BASE_URL}/entrada/${entNumeroParam}/detalle`);
          if (!resDetalles.ok) throw new Error('Error al cargar los detalles de la entrada.');
          const dataDetalles = await resDetalles.json();

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

        } catch (err) {
          console.error("❌ Error al cargar entrada para edición (Admin):", err);
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
    if (formCabecera.ProdCodigo) {
      const selectedProduct = productosDisponibles.find(p => p.ProdCodigo === formCabecera.ProdCodigo);
      if (selectedProduct && selectedProduct.HorasCura !== undefined && selectedProduct.HorasCura !== null) {
        const now = new Date(); // Obtener la fecha y hora exacta actual
        const calculatedFechaCura = addHoursToDateTimeString(now, selectedProduct.HorasCura);
        setFormCabecera(prev => ({ ...prev, FechaCura: calculatedFechaCura }));
      } else {
        setFormCabecera(prev => ({ ...prev, FechaCura: '' })); // Reset if no HorasCura
      }
    } else {
      setFormCabecera(prev => ({ ...prev, FechaCura: '' })); // Clear if no product
    }
  }, [formCabecera.ProdCodigo, productosDisponibles]);

  const productoPrincipalSeleccionado = useMemo(() => {
    return productosDisponibles.find(p => p.ProdCodigo === formCabecera.ProdCodigo);
  }, [formCabecera.ProdCodigo, productosDisponibles]);

  useEffect(() => {
    // Si el producto principal cambia, actualiza el ProdCodigo en todos los detalles
    // Esto es útil si el admin cambia el producto principal después de agregar detalles
    if (formCabecera.ProdCodigo) {
      setProductosSeleccionados(prevProductos =>
        prevProductos.map(prod => ({
          ...prod,
          ProdCodigo: formCabecera.ProdCodigo
        }))
      );
    }
  }, [formCabecera.ProdCodigo]);

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

  const handleAgregarProducto = () => {
    if (!formCabecera.ProdCodigo) {
      setTipoMensaje('error');
      setMensaje('⚠️ Primero debe seleccionar un Producto Principal en la cabecera.');
      return;
    }

    const newSerie = String(nextGlobalSerie);
    setNextGlobalSerie(prev => prev + 1); // Incrementar para el próximo producto

    setProductosSeleccionados(prev => [
      ...prev,
      {
        ProdCodigo: formCabecera.ProdCodigo,
        Serie: newSerie,
        Cantidad: '',
        Fecha: getFechaLocal(),
        FechaCura: formCabecera.FechaCura, // Usar FechaCura de la cabecera
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setTipoMensaje('');

    if (!usuario?.legajo) {
      setTipoMensaje('error');
      setMensaje('❌ No se detectó el usuario autenticado. Por favor, inicie sesión.');
      return;
    }

    // ✅ Control adicional para no permitir crear si ya existe una entrada abierta
    if (!editando && hasOpenEntryExists) {
      setTipoMensaje('error');
      setMensaje('❌ No se puede crear una nueva entrada porque ya existe una con estado "Abierto".');
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

    // Validación para cerrar la operación
    if (formCabecera.Estado === 'Cerrado' && productosSeleccionados.length === 0) {
      setTipoMensaje('error');
      setMensaje('❌ No se puede cerrar la operación sin tener productos de detalle cargados.');
      return;
    }

    // Validar detalles si existen
    if (productosSeleccionados.length > 0) {
      for (const prod of productosSeleccionados) {
          if (!prod.Serie || prod.Cantidad === '' || !prod.Fecha || !prod.FechaCura || !prod.Estado) {
              setTipoMensaje('error');
              setMensaje('⚠️ Por favor, complete todos los campos obligatorios de cada producto de entrada (Serie, Cantidad, Fecha, Fecha Cura, Estado).');
              return;
          }
      }
    }

    const payload = {
      ...formCabecera,
      Usuario: usuario.legajo,
      FechaCat: formatDateToYYYYMMDDHHMMSS(new Date()), // Fecha de carga siempre al momento del submit
      productosSeleccionados: productosSeleccionados.map(p => ({
        ...p,
        Cantidad: parseFloat(p.Cantidad),
        // Asegurarse de que el usuario y la fecha de carga del detalle sean los del admin
        Usuario: usuario.legajo, 
        FechaCat: formatDateToYYYYMMDDHHMMSS(new Date()),
        FechaCura: formCabecera.FechaCura // Usar la FechaCura de la cabecera
      }))
    };

    try {
      let res;
      let data;

      if (editando) {
        res = await fetch(`${API_BASE_URL}/entrada/${entNumeroParam}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error desconocido al actualizar la entrada.');
        setTipoMensaje('success');
        setMensaje(data.message);
      } else {
        res = await fetch(`${API_BASE_URL}/entrada`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error desconocido al registrar la entrada.');
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
        setProductosSeleccionados([]);
        // Volver a cargar la serie global para la próxima nueva entrada
        const resSerie = await fetch(`${API_BASE_URL}/entrada/series-counters`);
        const dataSerie = await resSerie.json();
        if (resSerie.ok) {
          setNextGlobalSerie(dataSerie.globalSerie + 1);
        }
        // ✅ Volver a verificar el estado de entradas abiertas después de una creación exitosa
        setHasOpenEntryExists(true); // Asumimos que la recién creada está abierta
      }
      
      setTimeout(() => {
        setMensaje('');
        navigate('/registro/lista-entradas'); // Redirección final
      } , 1500);

    } catch (err) {
      console.error('❌ Error al procesar entrada (Admin):', err);
      setTipoMensaje('error');
      setMensaje(`❌ ${err.message || 'Ocurrió un error inesperado al procesar la entrada.'}`);
      setTimeout(() => setMensaje(''), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 shadow-lg rounded-lg mt-10">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
        {editando ? 'Editar Entrada (Administrador)' : 'Registro de Nueva Entrada (Administrador)'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        {/* Mensaje de advertencia si ya existe una entrada abierta */}
        {!editando && hasOpenEntryExists && (
          <div className="p-3 mb-4 rounded-md bg-yellow-100 text-yellow-700 flex items-center gap-2">
            <span className="text-lg font-bold">!</span>
            {mensaje} {/* Muestra el mensaje de advertencia */}
          </div>
        )}

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
              disabled={editando || hasOpenEntryExists} // Deshabilitado si estamos editando o si ya hay una abierta
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
              className={`mt-1 block w-full p-2 border rounded-md shadow-sm ${editando || hasOpenEntryExists ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-blue-500 focus:border-blue-500'} ${nroCorteError ? 'border-red-500' : 'border-gray-300'}`}
              required
              readOnly={editando || hasOpenEntryExists} // NroCorte no editable en edición o si ya hay una abierta
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
              disabled={editando || hasOpenEntryExists} // Deshabilita el selector visualmente en edición o si ya hay una abierta
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
              readOnly // Siempre de solo lectura para el admin
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
              disabled={hasOpenEntryExists && !editando} // Deshabilitado en creación si ya hay una abierta
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
                disabled={hasOpenEntryExists && !editando} // Deshabilitado en creación si ya hay una abierta
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
                disabled={hasOpenEntryExists && !editando} // Deshabilitado en creación si ya hay una abierta
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
                disabled={hasOpenEntryExists && !editando} // Deshabilitado en creación si ya hay una abierta
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
                disabled={hasOpenEntryExists && !editando} // Deshabilitado en creación si ya hay una abierta
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
                disabled={hasOpenEntryExists && !editando} // Deshabilitado en creación si ya hay una abierta
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
            disabled={hasOpenEntryExists && !editando} // Deshabilitado en creación si ya hay una abierta
          >
            <Plus size={20} /> Agregar Producto
          </button>
          <button
            type="button"
            onClick={() => setProductosSeleccionados([])}
            className="bg-gray-400 text-white px-5 py-2 rounded-md hover:bg-gray-600 transition-colors shadow-md text-base font-medium"
            disabled={hasOpenEntryExists && !editando} // Deshabilitado en creación si ya hay una abierta
          >
            Limpiar Productos
          </button>
        </div>

        {/* Botón de Envío del Formulario Principal */}
        <div className="flex justify-center mt-6">
          <button
            type="submit"
            className="w-full max-w-xs bg-blue-600 text-white py-3 px-6 rounded-md shadow-lg text-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={hasOpenEntryExists && !editando} // Deshabilitado en creación si ya hay una abierta
          >
            {editando ? 'Actualizar Entrada' : 'Registrar Entrada'}
          </button>
        </div>

        {/* Mensaje de feedback */}
        {mensaje && (
          <p className={`text-base text-center mt-4 ${tipoMensaje === 'success' ? 'text-green-600' : tipoMensaje === 'info' ? 'text-yellow-700' : 'text-red-500'}`}>
            {mensaje}
          </p>
        )}
      </form>
    </div>
  );
}
