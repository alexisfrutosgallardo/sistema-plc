import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '../../../config/config';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';

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

export default function Registro_Entrada({ usuario }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const entNumeroParam = queryParams.get('entNumero');

  const [formCabecera, setFormCabecera] = useState({
    Fecha: getFechaLocal(),
    NroCorte: '',
    Estado: 'Abierto',
    Comentario: '',
    FechaCat: getFechaHoraLocal(),
    ProdCodigo: '',
    FechaCura: getFechaHoraLocal()
  });

  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [nroCorteError, setNroCorteError] = useState('');
  const [editando, setEditando] = useState(false);
  const [fechaCuraCabecera, setFechaCuraCabecera] = useState('');



  // ✅ Estados para los contadores de serie y prefijo de IdParam
  const [nextGlobalSerie, setNextGlobalSerie] = useState(0);
  const [currentEntryIdParam, setCurrentEntryIdParam] = useState(''); // El 'paXXX' real para esta entrada

  const calcularFechaCuraCabecera = async (codigoProducto) => {
    if (!codigoProducto) {
      setFechaCuraCabecera('');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/producto/${codigoProducto}`);
      const producto = await response.json();

      if (producto && producto.HorasCura !== undefined) {
        const ahora = new Date();
        ahora.setHours(ahora.getHours() + parseInt(producto.HorasCura));
        //const fechaCura = ahora.toISOString().slice(0, 19).replace('T', ' ');
        const fechaCura = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')} ${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}:${String(ahora.getSeconds()).padStart(2, '0')}`;
        setFechaCuraCabecera(fechaCura);
      }
    } catch (error) {
      console.error("Error al calcular Fecha Cura:", error);
      setFechaCuraCabecera('');
    }
  };


  // Cargar productos disponibles y datos de la entrada si es edición
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
            FechaCat: dataCabecera.FechaCat,
            ProdCodigo: dataCabecera.ProdCodigo,
            FechaCura: getFechaHoraLocal()
          });

          // Establecer el IdParam de la entrada para los detalles existentes
          if (dataDetalles.length > 0 && dataDetalles[0].IdParam) {
            setCurrentEntryIdParam(dataDetalles[0].IdParam);
          } else {
            // Si no hay detalles o IdParam en la entrada existente, generamos uno nuevo
            // Esto es un caso de borde, idealmente todas las entradas tendrían un IdParam.
            // Para simplificar, si no hay, se generará uno nuevo al agregar un producto.
            const fetchNewIdParamForEdit = async () => {
              try {
                const resCounters = await fetch(`${API_BASE_URL}/entrada/series-counters`, {
                  headers: { 'Content-Type': 'application/json' },
                });
                const dataCounters = await resCounters.json();
                if (resCounters.ok) {
                  const newEntryIdParam = `pa${String(dataCounters.entryIdParam + 1).padStart(3, '0')}`;
                  setCurrentEntryIdParam(newEntryIdParam);
                }
              } catch (err) {
                console.error("Error al obtener nuevo IdParam para edición:", err);
              }
            };
            fetchNewIdParamForEdit();
          }
          
          setProductosSeleccionados(dataDetalles.map(det => ({
            ProdCodigo: det.ProdCodigo,
            Serie: det.Serie,
            Cantidad: det.Cantidad,
            Fecha: getFechaLocal(new Date(det.Fecha)),
            FechaCura: getFechaLocal(new Date(det.FechaCura)),
            FechaIngr: det.FechaIngr ? getFechaLocal(new Date(det.FechaIngr)) : '',
            Estado: det.Estado,
            IdParam: det.IdParam // ✅ Mantener el IdParam existente
          })));

        } catch (err) {
          console.error("❌ Error al cargar entrada para edición:", err);
          setTipoMensaje('error');
          setMensaje(`❌ ${err.message || 'Ocurrió un error al cargar la entrada para edición.'}`);
        }
      };
      fetchEntradaParaEditar();
    } else {
      // ✅ Si es una nueva entrada, obtener los contadores del backend
      const fetchCounters = async () => {
        try {
          console.log("➡️ Fetching series counters for new entry..."); // DEBUG
          const res = await fetch(`${API_BASE_URL}/entrada/series-counters`, {
            headers: { 'Content-Type': 'application/json' },
          });
          const data = await res.json();
          if (res.ok) {
            console.log("✅ Counters fetched:", data); // DEBUG
            setNextGlobalSerie(data.globalSerie + 1); // El siguiente número de serie global disponible
            setCurrentEntryIdParam(`pa${String(data.entryIdParam + 1).padStart(3, '0')}`); // Formatear el IdParam para esta nueva entrada
          } else {
            console.error("❌ Error al obtener contadores:", data.error || 'Error desconocido'); // DEBUG
            setTipoMensaje('error');
            setMensaje('❌ Error al cargar los contadores iniciales de serie.');
          }
        } catch (err) {
          console.error("❌ Error al obtener contadores (fetch):", err); // DEBUG
          setTipoMensaje('error');
          setMensaje('❌ No se pudo conectar al servidor para obtener los contadores.');
        }
      };
      fetchCounters();
    }
  }, [entNumeroParam, editando]); // ✅ Añadido 'editando' a las dependencias para forzar re-fetch en ciertos casos

  const productoPrincipalSeleccionado = useMemo(() => {
    return productosDisponibles.find(p => p.ProdCodigo === formCabecera.ProdCodigo);
  }, [formCabecera.ProdCodigo, productosDisponibles]);

  
  useEffect(() => {
    if (formCabecera.ProdCodigo) {
      setProductosSeleccionados(prevProductos =>
        prevProductos.map(prod => ({
          ...prod,
          ProdCodigo: formCabecera.ProdCodigo
        }))
      );
    }
  }, [formCabecera.ProdCodigo]);

  useEffect(() => {
    calcularFechaCuraCabecera(formCabecera.ProdCodigo);
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

  // ✅ Modificado: handleAgregarProducto ahora genera Serie e IdParam localmente
  const handleAgregarProducto = () => {
    if (!formCabecera.ProdCodigo) {
      setTipoMensaje('error');
      setMensaje('⚠️ Primero debe seleccionar un Producto Principal en la cabecera.');
      return;
    }

    // Para nuevos productos, generar la siguiente Serie global
    const newSerie = String(nextGlobalSerie);
    console.log(`Adding product: Serie=${newSerie}, IdParam=${currentEntryIdParam}, nextGlobalSerie will be ${nextGlobalSerie + 1}`); // DEBUG
    setNextGlobalSerie(prev => prev + 1); // Incrementar para el próximo producto

    // Asignar el IdParam de la entrada actual (pa000, pa001, etc.)
    const idParamForNewDetail = currentEntryIdParam;

    setProductosSeleccionados(prev => [
      ...prev,
      {
        ProdCodigo: formCabecera.ProdCodigo,
        Serie: newSerie,
        Cantidad: '',
        Fecha: getFechaLocal(),
        FechaCura: '',
        FechaIngr: '',
        Estado: 'Activo',
        IdParam: idParamForNewDetail // ✅ Asignar el IdParam
      }
    ]);
  };

  // ✅ Función para manejar cambios en los productos del detalle
const handleProductoChange = (index, campo, valor) => {
  setProductosSeleccionados(prev =>
    prev.map((prod, i) =>
      i === index ? { ...prod, [campo]: valor } : prod
    )
  );
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

    const { Fecha, NroCorte, FechaCat, ProdCodigo } = formCabecera;
    if (!Fecha || !NroCorte || !FechaCat || !ProdCodigo) {
        setTipoMensaje('error');
        setMensaje('⚠️ Por favor, complete todos los campos obligatorios de la cabecera (Fecha, Número de Corte, Producto Principal, Fecha de Carga).');
        return;
    }

    if (nroCorteError) {
      setTipoMensaje('error');
      setMensaje('⚠️ El Número de Corte ingresado ya existe. Por favor, corrija el error.');
      return;
    }

    if (productosSeleccionados.length === 0) {
      setTipoMensaje('error');
      setMensaje('⚠️ Debe agregar al menos un producto a la entrada.');
      return;
    }

    for (const prod of productosSeleccionados) {
        // ✅ Asegurarse de que IdParam también esté presente para nuevos productos
        if (!prod.Serie || prod.Cantidad === '' || !prod.Fecha || !prod.Cantidad || !prod.FechaCura || !prod.Estado || !prod.IdParam) {
            setTipoMensaje('error');
            setMensaje('⚠️ Por favor, complete todos los campos obligatorios de cada producto de entrada (Serie, Cantidad, Fecha, Fecha Cura, Estado, IdParam).');
            return;
        }
    }

    const payload = {
      ...formCabecera,
      Estado: editando ? formCabecera.Estado : 'Abierto',
      Usuario: usuario.legajo,
      productosSeleccionados: productosSeleccionados.map(p => ({
        ...p,
        Cantidad: parseFloat(p.Cantidad),
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
      
      // ✅ Redirección a /registro/lista-entradas después de un registro/actualización exitosa
      // Limpiar formulario y reiniciar estados
      setFormCabecera({
        Fecha: getFechaLocal(),
        NroCorte: '',
        Estado: 'Abierto',
        Comentario: '',
        FechaCat: getFechaHoraLocal(),
        ProdCodigo: '',
        FechaCura: getFechaHoraLocal()
      });
      setProductosSeleccionados([]);
      setEditando(false);
      // ✅ Reiniciar contadores para la próxima nueva entrada (se volverán a cargar en useEffect)
      setNextGlobalSerie(0); 
      setCurrentEntryIdParam(''); // Reiniciar también el IdParam de la entrada

      setTimeout(() => {
        setMensaje('');
        navigate('/registro/lista-entradas'); // Redirección final
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
        {editando ? 'Editar Entrada Existente' : 'Registro de Nueva Entrada'}
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
              readOnly={editando}
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
                <option value="Cerrado">Cerrado</option>
                <option value="Anulado">Anulado</option>
              </select>
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
              value={fechaCuraCabecera}
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

            {/* ✅ Campo Serie ahora es de solo lectura y muestra el número autoincremental */}
            <div>
              <label htmlFor={`Serie-${index}`} className="block text-sm font-medium text-gray-700">Serie:</label>
              <input
                type="text"
                id={`Serie-${index}`}
                value={item.Serie}
                readOnly // Hacerlo de solo lectura
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
                type="date"
                id={`FechaCura-${index}`}
                value={item.FechaCura}
                onChange={e => handleProductoChange(index, 'FechaCura', e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
            {editando ? 'Actualizar Entrada' : 'Registrar Entrada'}
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
