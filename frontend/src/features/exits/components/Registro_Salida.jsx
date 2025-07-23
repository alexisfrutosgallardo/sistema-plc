import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config/config';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react'; // Importamos iconos para los botones

// Función para obtener fecha local en formato YYYY-MM-DD
function getFechaLocal() {
  const ahora = new Date();
  const zonaLocal = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return zonaLocal.toISOString().slice(0, 10);
}

// Función para obtener fecha y hora local en formato ISO completo (con TZ corregida)
function getFechaHoraLocal() {
  const ahora = new Date();
  const zonaLocal = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return zonaLocal.toISOString().slice(0, 19).replace('T', ' '); // Formato compatible con SQLite DATETIME
}

export default function Registro_Salida({ usuario }) {
  const navigate = useNavigate();

  // Estado para la cabecera de la salida (solo los campos que no son por producto)
  const [formCabecera, setFormCabecera] = useState({
    NroRelacion: '',
    Estado: 'Activo',
    FechaCat: getFechaHoraLocal(),
  });

  // Estados para los selectores de productos, relaciones y cortes
  const [relacionesDisponibles, setRelacionesDisponibles] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [cortesDisponibles, setCortesDisponibles] = useState([]);

  // Estado para los productos de detalle de la salida
  const [productosSalida, setProductosSalida] = useState([]);

  // Estado para mensajes de feedback
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');

  // Cargar datos iniciales: relaciones, productos y cortes
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Cargar relaciones Silo-Blend1
        const resRelaciones = await fetch(`${API_BASE_URL}/relsilo`); // ✅ Ruta corregida a /relsilo
        if (!resRelaciones.ok) throw new Error('Error al cargar relaciones Silo-Blend.');
        const dataRelaciones = await resRelaciones.json();
        setRelacionesDisponibles(dataRelaciones);

        // Cargar productos
        const resProductos = await fetch(`${API_BASE_URL}/producto`);
        if (!resProductos.ok) throw new Error('Error al cargar productos.');
        const dataProductos = await resProductos.json();
        setProductosDisponibles(dataProductos);

        // Cargar cortes de Entrada1
        // Asumiendo que tienes un endpoint para obtener los cortes únicos de Entrada1
        // Si no lo tienes, necesitarás crearlo o ajustar esta lógica.
        const resCortes = await fetch(`${API_BASE_URL}/cortes-entrada1`); // Esta ruta puede necesitar ser implementada
        if (!resCortes.ok) throw new Error('Error al cargar cortes.');
        const dataCortes = await resCortes.json();
        setCortesDisponibles(dataCortes);

      } catch (err) {
        console.error('❌ Error al cargar datos iniciales:', err);
        setTipoMensaje('error');
        setMensaje(`❌ ${err.message || 'Error al cargar datos iniciales para el formulario.'}`);
      }
    };

    fetchInitialData();
  }, []);

  // Manejador de cambios para los campos de la cabecera
  const handleCabeceraChange = e => {
    const { name, value } = e.target;
    setFormCabecera(prev => ({ ...prev, [name]: value }));
  };

  // Manejador para agregar un nuevo producto a la salida
  const handleAgregarProducto = () => {
    setProductosSalida(prev => [
      ...prev,
      {
        ProdCodigo: '',
        Cantidad: '',
        Corte: '',
        Serie: '',
      }
    ]);
  };

  // Manejador de cambios para los campos de un producto de la salida
  const handleProductoChange = (index, field, value) => {
    const nuevosProductos = [...productosSalida];
    nuevosProductos[index][field] = value;
    setProductosSalida(nuevosProductos);
  };

  // Manejador para eliminar un producto de la salida
  const handleEliminarProducto = (index) => {
    setProductosSalida(prev => prev.filter((_, i) => i !== index));
  };

  // Manejador para el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setTipoMensaje('');

    if (!usuario?.legajo) {
      setTipoMensaje('error');
      setMensaje('❌ No se detectó el usuario autenticado. Por favor, inicie sesión.');
      return;
    }

    if (productosSalida.length === 0) {
      setTipoMensaje('error');
      setMensaje('⚠️ Debe agregar al menos un producto a la salida.');
      return;
    }

    // Validaciones frontend detalladas para cada producto
    for (const prod of productosSalida) {
      if (!prod.ProdCodigo || prod.Cantidad === '' || prod.Corte === '' || !prod.Serie) {
        setTipoMensaje('error');
        setMensaje('⚠️ Asegúrese de que todos los productos tengan Producto, Cantidad, Corte y Serie.');
        return;
      }
    }

    const payload = {
      ...formCabecera,
      Usuario: usuario.legajo, // Asignar el usuario logueado
      FechaCat: getFechaHoraLocal(), // Asegurar la fecha y hora actual
      items: productosSalida.map(p => ({ // Cambiado 'productos' a 'items' para coincidir con el backend
        ...p,
        Cantidad: parseFloat(p.Cantidad), // Convertir cantidad a número flotante
        Corte: parseInt(p.Corte, 10) // Convertir corte a número entero
      }))
    };

    try {
      const res = await fetch(`${API_BASE_URL}/salida`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error desconocido al registrar la salida.');

      setTipoMensaje('success');
      setMensaje(data.message);

      // Limpiar formulario después de éxito
      setFormCabecera({
        NroRelacion: '',
        Estado: 'Activo',
        FechaCat: getFechaHoraLocal(),
      });
      setProductosSalida([]);

      // Redirigir a la lista de salidas
      setTimeout(() => {
        navigate('/registro/lista-salidas'); // ✅ Ruta corregida para la lista de salidas
      }, 1500);

    } catch (err) {
      console.error('❌ Error al registrar salida:', err);
      setTipoMensaje('error');
      setMensaje(`❌ ${err.message || 'Ocurrió un error inesperado al registrar la salida.'}`);
      setTimeout(() => setMensaje(''), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 shadow-lg rounded-lg mt-10">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Registro de Salida</h2>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        {/* Sección de Cabecera de Salida */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="NroRelacion" className="block text-sm font-medium text-gray-700">Relación Silo-Blend:</label>
            <select
              id="NroRelacion"
              name="NroRelacion"
              value={formCabecera.NroRelacion}
              onChange={handleCabeceraChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">-- Seleccionar Relación --</option>
              {relacionesDisponibles.map(rel => (
                <option key={rel.NroRelacion} value={rel.NroRelacion}>
                  {rel.NroRelacion} - {rel.ProdNombre} ({rel.SiloNombre})
                </option>
              ))}
            </select>
          </div>
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
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        {/* Sección de Productos de Salida (Detalles) */}
        <h3 className="font-semibold mt-6 text-xl text-gray-700 mb-4">Productos a Salir</h3>
        {productosSalida.length === 0 && (
          <p className="text-center text-gray-500">Haz clic en "Agregar Producto" para añadir detalles de la salida.</p>
        )}
        {productosSalida.map((item, index) => (
          <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-4 p-4 border border-gray-200 rounded-md bg-gray-50">
            {/* Selector de Producto */}
            <div>
              <label htmlFor={`ProdCodigo-${index}`} className="block text-sm font-medium text-gray-700">Producto:</label>
              <select
                id={`ProdCodigo-${index}`}
                value={item.ProdCodigo}
                onChange={e => handleProductoChange(index, 'ProdCodigo', e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleccione un producto</option>
                {productosDisponibles.map(p => (
                  <option key={p.ProdCodigo} value={p.ProdCodigo}>
                    {p.ProdNombre} ({p.TipProdNombre})
                  </option>
                ))}
              </select>
            </div>
            {/* Cantidad */}
            <div>
              <label htmlFor={`Cantidad-${index}`} className="block text-sm font-medium text-gray-700">Cantidad:</label>
              <input
                type="number"
                id={`Cantidad-${index}`}
                placeholder="Cantidad"
                min="1"
                step="0.01" // Permite números decimales para cantidad
                value={item.Cantidad}
                onChange={e => handleProductoChange(index, 'Cantidad', e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            {/* Selector de Corte */}
            <div>
              <label htmlFor={`Corte-${index}`} className="block text-sm font-medium text-gray-700">Corte:</label>
              <select
                id={`Corte-${index}`}
                value={item.Corte}
                onChange={e => handleProductoChange(index, 'Corte', e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- Seleccionar Corte --</option>
                {cortesDisponibles.map(corte => (
                  <option key={corte} value={corte}>{corte}</option>
                ))}
              </select>
            </div>
            {/* Serie */}
            <div>
              <label htmlFor={`Serie-${index}`} className="block text-sm font-medium text-gray-700">Serie:</label>
              <input
                type="text"
                id={`Serie-${index}`}
                placeholder="Serie del producto"
                value={item.Serie}
                onChange={e => handleProductoChange(index, 'Serie', e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            {/* Botón Eliminar Producto */}
            <div className="flex items-end lg:col-span-1">
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
            onClick={() => setProductosSalida([])}
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
            Registrar Salida
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
