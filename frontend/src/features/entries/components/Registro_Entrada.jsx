// Contenido de Registro_Entrada.jsx (Admin Full Control) - Sin cambios
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

// Función para sumar horas a una fecha (para FechaCura de cabecera)
function addHoursToDate(dateString, hoursToAdd) {
  if (!dateString || hoursToAdd === undefined || hoursToAdd === null || isNaN(parseInt(hoursToAdd))) return '';
  const date = new Date(dateString);
  date.setHours(date.getHours() + parseInt(hoursToAdd, 10));
  return getFechaHoraLocal(date);
}

export default function Registro_Entrada({ usuario }) { // Este componente ahora es principalmente para Admin
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
    FechaCura: '',
    Usuario: usuario ? usuario.legajo : '',
  });

  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [nroCorteError, setNroCorteError] = useState('');
  const [editando, setEditando] = useState(false);

  const [lastRegisteredGlobalSerie, setLastRegisteredGlobalSerie] = useState(0);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Cargar productos disponibles
        const productosRes = await fetch(`${API_BASE_URL}/producto`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!productosRes.ok) {
          throw new Error(`HTTP error! status: ${productosRes.status} al obtener productos`);
        }
        const productosData = await productosRes.json();
        setProductosDisponibles(productosData);

        // Obtener la última serie global registrada (solo si es una nueva entrada)
        if (!entNumeroParam) {
          const resCounters = await fetch(`${API_BASE_URL}/entrada/series-counters`, {
            headers: { 'Content-Type': 'application/json' },
          });
          const dataCounters = await resCounters.json();
          if (resCounters.ok) {
            setLastRegisteredGlobalSerie(dataCounters.globalSerie);
          } else {
            console.error("❌ Error al obtener contadores iniciales:", dataCounters.error || 'Error desconocido');
            setTipoMensaje('error');
            setMensaje('❌ Error al cargar los contadores iniciales de serie.');
          }
        }

        if (entNumeroParam) {
          setEditando(true);
          const resCabecera = await fetch(`${API_BASE_URL}/entrada/${entNumeroParam}`);
          if (!resCabecera.ok) throw new Error('Error al cargar la cabecera de la entrada.');
          const dataCabecera = await resCabecera.json();

          const resDetalles = await fetch(`${API_BASE_URL}/entrada/${entNumeroParam}/detalle`);
          if (!resDetalles.ok) throw new Error('Error al cargar los detalles de la entrada.');
          const dataDetalles = await resDetalles.json();
          
          setProductosSeleccionados(dataDetalles.map(det => ({
            ProdCodigo: det.ProdCodigo,
            Serie: det.Serie,
            Cantidad: det.Cantidad,
            Fecha: getFechaLocal(new Date(det.Fecha)),
            FechaCura: getFechaLocal(new Date(det.FechaCura)),
            FechaIngr: det.FechaIngr ? getFechaLocal(new Date(det.FechaIngr)) : '',
            Estado: det.Estado,
          })));

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

  const handleAgregarProducto = () => {
    if (!formCabecera.ProdCodigo) {
      setTipoMensaje('error');
      setMensaje('⚠️ Primero debe seleccionar un Producto Principal en la cabecera.');
      setTimeout(() => {
        setMensaje('');
        setTipoMensaje('');
      }, 3000); 
      return;
    }

    const newSerie = String(lastRegisteredGlobalSerie + productosSeleccionados.length + 1);

    setProductosSeleccionados(prev => [
      ...prev,
      {
        ProdCodigo: formCabecera.ProdCodigo,
        Serie: newSerie,
        Cantidad: '',
        Fecha: getFechaLocal(),
        FechaCura: formCabecera.FechaCura,
        FechaIngr: '',
        Estado: 'Activo',
      }
    ]);
  };

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
      setTimeout(() => setMensaje(''), 4000);
      return;
    }

    const { Fecha, NroCorte, ProdCodigo, FechaCura } = formCabecera;
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

    if (productosSeleccionados.length === 0) {
      setTipoMensaje('error');
      setMensaje('⚠️ Debe agregar al menos un producto a la entrada.');
      setTimeout(() => setMensaje(''), 4000);
      return;
    }

    for (const prod of productosSeleccionados) {
        if (!prod.Serie || prod.Cantidad === '' || !prod.Fecha || !prod.FechaCura || !prod.Estado) {
            setTipoMensaje('error');
            setMensaje('⚠️ Por favor, complete todos los campos obligatorios de cada producto de entrada (Serie, Cantidad, Fecha, Fecha Cura, Estado).');
            setTimeout(() => setMensaje(''), 4000);
            return;
        }
    }

    const payload = {
      ...formCabecera,
      Estado: editando ? formCabecera.Estado : 'Abierto',
      FechaCat: getFechaHoraLocal(),
      Usuario: usuario.legajo,
      productosSeleccionados: productosSeleccionados.map(p => ({
        ...p,
        Cantidad: parseFloat(p.Cantidad),
        Iten: productosSeleccionados.indexOf(p) + 1,
        FechaCura: formCabecera.FechaCura,
      }))
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
      setProductosSeleccionados([]);
      setEditando(false);
      setLastRegisteredGlobalSerie(0);

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

  const selectedMainProduct = useMemo(() => {
    return productosDisponibles.find(p => p.ProdCodigo === formCabecera.ProdCodigo);
  }, [formCabecera.ProdCodigo, productosDisponibles]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 shadow-lg rounded-lg mt-10">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
        {editando ? 'Editar Entrada Completa (Admin)' : 'Registro de Nueva Entrada (Admin)'}
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
                {selectedMainProduct ? 
                 `${selectedMainProduct.ProdNombre} (${selectedMainProduct.TipProdNombre})` : 
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
                type="text"
                id={`FechaCura-${index}`}
                value={item.FechaCura}
                readOnly
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-800 cursor-not-allowed"
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
