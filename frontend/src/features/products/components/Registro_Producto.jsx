import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config/config';
import { useLocation, useNavigate } from 'react-router-dom'; // Importamos useLocation y useNavigate

// Función para obtener fecha y hora local en formato ISO completo (con TZ corregida)
function getFechaHoraLocal() {
  const ahora = new Date();
  const zonaLocal = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return zonaLocal.toISOString().slice(0, 19).replace('T', ' '); // Formato compatible con SQLite DATETIME
}

export default function Registro_Producto({ usuario }) { // Recibe 'usuario' como prop
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  // ✅ CORREGIDO: Cambiado 'ProdCodigo' a 'prodCodigo' para que coincida con la URL
  const prodCodigoParam = queryParams.get('prodCodigo'); 

  const [formData, setFormData] = useState({
    TipProdCodigo: '',
    ProdNombre: '',
    Estado: 'Activo', // Valor por defecto
    Stock: '',
    HorasCura: '',
    Usuario: usuario?.legajo || '', // Usar el legajo del usuario logueado
    FechaCat: getFechaHoraLocal()
  });

  const [tipos, setTipos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [editando, setEditando] = useState(false); // Nuevo estado para saber si estamos editando

  useEffect(() => {
    // Cargar tipos de producto
    const cargarTipos = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/tipoproducto`);
        const data = await res.json();
        setTipos(data);
      } catch (err) {
        mostrarMensaje('❌ Error al cargar tipos de producto.', 'error');
      }
    };

    cargarTipos();

    // Si hay un ProdCodigo en la URL, cargar datos del producto para edición
    console.log("Registro_Producto useEffect: location.search =", location.search);
    console.log("Registro_Producto useEffect: prodCodigoParam (from URL) =", prodCodigoParam);

    if (prodCodigoParam) {
      setEditando(true);
      const fetchProducto = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/producto/${prodCodigoParam}`);
          console.log("Registro_Producto Fetch response:", res);
          if (!res.ok) {
            return res.json().then(errorData => {
              throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
            });
          }
          const data = await res.json();
          console.log("Registro_Producto Datos del producto recibidos:", data);
          if (data) {
            setFormData({
              TipProdCodigo: data.TipProdCodigo || '',
              ProdNombre: data.ProdNombre || '',
              Estado: data.Estado || 'Activo',
              Stock: data.Stock || '',
              HorasCura: data.HorasCura || '',
              Usuario: data.Usuario || usuario?.legajo || '', // Mantener usuario original si existe
              FechaCat: data.FechaCat || getFechaHoraLocal(),
            });
            mostrarMensaje('✅ Datos del producto cargados correctamente.', 'success');
          } else {
            mostrarMensaje('❌ Producto no encontrado para edición.', 'error');
            setEditando(false); // No se encontró, no estamos editando
          }
        } catch (err) {
          console.error("❌ Error al cargar producto para edición:", err);
          mostrarMensaje(`❌ Error al cargar datos del producto para edición: ${err.message}`, 'error');
          setEditando(false);
        }
      };
      fetchProducto();
    } else {
      console.log("Registro_Producto: No prodCodigo en la URL, reseteando formulario.");
      setEditando(false);
      // Resetear el formulario si no hay ProdCodigo en la URL
      setFormData({
        TipProdCodigo: '',
        ProdNombre: '',
        Estado: 'Activo',
        Stock: '',
        HorasCura: '',
        Usuario: usuario?.legajo || '',
        FechaCat: getFechaHoraLocal()
      });
      setMensaje('');
      setTipoMensaje('');
    }
  }, [prodCodigoParam, usuario?.legajo, location.search]); // Dependencias: recargar si cambia el código o el usuario o la URL completa

  const mostrarMensaje = (msg, tipo = 'success') => {
    setMensaje(msg);
    setTipoMensaje(tipo);
    setTimeout(() => setMensaje(''), 3000);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMensaje('');
    setTipoMensaje('');

    if (!usuario?.legajo) {
      mostrarMensaje('❌ No se detectó el usuario autenticado. Por favor, inicie sesión.', 'error');
      return;
    }

    // Asegurarse de que el usuario logueado sea el que se envía
    const payload = {
      ...formData,
      Usuario: usuario.legajo,
      FechaCat: formData.FechaCat || getFechaHoraLocal(), // Mantener FechaCat si ya existe, sino generar
    };

    const metodo = editando ? 'PUT' : 'POST';
    const url = editando
      ? `${API_BASE_URL}/producto/${prodCodigoParam}`
      : `${API_BASE_URL}/producto`;

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error inesperado');
      
      mostrarMensaje(data.message, 'success');
      
      // Después de registrar/actualizar, redirigir a la lista de productos
      setTimeout(() => {
        navigate('/registro/lista-productos'); 
      }, 1500); // Dar tiempo para leer el mensaje

    } catch (err) {
      console.error("Error en el registro/actualización de producto:", err);
      mostrarMensaje(`❌ ${err.message || 'Ocurrió un error inesperado al guardar el producto.'}`, 'error');
    }
  };

  const resetFormulario = () => {
    setFormData({
      TipProdCodigo: '',
      ProdNombre: '',
      Estado: 'Activo',
      Stock: '',
      HorasCura: '',
      Usuario: usuario?.legajo || '',
      FechaCat: getFechaHoraLocal()
    });
    setMensaje('');
    setTipoMensaje('');
    setEditando(false);
    navigate('/registro/producto'); // Limpia la URL también
  };

  return (
    <div className="max-w-3xl mx-auto bg-gray-50 p-6 rounded-lg shadow-lg mt-10">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
        {editando ? `Editar Producto #${prodCodigoParam}` : 'Registro de Producto'}
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-lg shadow-md">
        {/* Selector de Tipo de Producto */}
        <div>
          <label htmlFor="TipProdCodigo" className="block text-sm font-medium text-gray-700">Tipo de Producto:</label>
          <select
            id="TipProdCodigo"
            name="TipProdCodigo"
            value={formData.TipProdCodigo}
            onChange={handleChange}
            required
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Seleccione un tipo de producto</option>
            {tipos.map(tp => (
              <option key={tp.TipProdCodigo} value={tp.TipProdCodigo}>{tp.TipProdNombre}</option>
            ))}
          </select>
        </div>

        {/* Nombre del Producto */}
        <div>
          <label htmlFor="ProdNombre" className="block text-sm font-medium text-gray-700">Nombre del Producto:</label>
          <input
            type="text"
            id="ProdNombre"
            name="ProdNombre"
            value={formData.ProdNombre}
            onChange={handleChange}
            required
            placeholder="Nombre del producto"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Estado */}
        <div>
          <label htmlFor="Estado" className="block text-sm font-medium text-gray-700">Estado:</label>
          <select
            id="Estado"
            name="Estado"
            value={formData.Estado}
            onChange={handleChange}
            required
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>

        {/* Stock */}
        <div>
          <label htmlFor="Stock" className="block text-sm font-medium text-gray-700">Stock:</label>
          <input
            type="number"
            id="Stock"
            name="Stock"
            value={formData.Stock}
            onChange={handleChange}
            placeholder="Stock (ej. 100.50)"
            step="0.01" // Permite decimales
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Horas Cura */}
        <div>
          <label htmlFor="HorasCura" className="block text-sm font-medium text-gray-700">Horas de Cura:</label>
          <input
            type="number"
            id="HorasCura"
            name="HorasCura"
            value={formData.HorasCura}
            onChange={handleChange}
            placeholder="Horas de cura (ej. 72)"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Botones de acción */}
        <div className="col-span-1 md:col-span-2 flex justify-center gap-4 mt-6">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md shadow-lg text-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {editando ? 'Actualizar Producto' : 'Registrar Producto'}
          </button>
          <button
            type="button"
            onClick={resetFormulario}
            className="flex-1 bg-gray-400 text-white py-3 px-6 rounded-md shadow-lg text-lg font-semibold hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Limpiar Formulario
          </button>
        </div>
      </form>

      {/* Mensaje de estado */}
      {mensaje && (
        <p className={`text-base text-center mt-4 ${tipoMensaje === 'success' ? 'text-green-600' : 'text-red-500'}`}>
          {mensaje}
        </p>
      )}
    </div>
  );
}
