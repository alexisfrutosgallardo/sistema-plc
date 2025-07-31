import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// Iconos de Lucide
import {
  Home, Box, Layers, LogOut, Weight, Scale, BarChart2, Lock, BookOpen, Activity, Clock, Check,
  Columns3, Sprout, Signpost, Factory, ToggleRight, RefreshCcwDot, Warehouse, ChartNoAxesCombined,
  ArrowLeftRight, ClipboardList, Bolt, List, Monitor, Users, Truck,
  ChevronDown, ChevronRight 
} from 'lucide-react';

// Función de permisos
import { tienePermiso } from '../utils/permisos';

const MENU_CONFIG = [
  {
    grupo: 'registro',
    titulo: 'Registro',
    items: [
      { nombre: 'Usuarios', icono: Users, ruta: 'lista-usuarios', permiso: 'Lista de Usuarios' },
      { nombre: 'Productos', icono: Box, ruta: 'lista-productos', permiso: 'Lista de Productos' },
      { nombre: 'Tipos de Producto', icono: Layers, ruta: 'lista-tipoproducto', permiso: 'Lista de Tipo de producto' },
      { nombre: 'Aprobador', icono: Check, ruta: 'aprobador', permiso: 'Aprobador' },
      { nombre: 'Cargo', icono: Signpost, ruta: 'cargo', permiso: 'Cargo' },
      { nombre: 'Cigarrillera', icono: Columns3, ruta: 'cigarrillera', permiso: 'Cigarrillera' },
      { nombre: 'Minisilo', icono: Factory, ruta: 'minisilo', permiso: 'Minisilo' },
      { nombre: 'Tipo de Blend', icono: Sprout, ruta: 'tipoblend', permiso: 'Tipo de blend' },
      { nombre: 'Máquinas', icono: Monitor, ruta: 'lista-maquinas', permiso: 'Lista de Máquinas' },
      { nombre: 'Registro de Entrada', icono: ClipboardList, ruta: 'entrada', permiso: 'Registro de Entrada' },
      { nombre: 'Lista de Entradas', icono: ClipboardList, ruta: 'lista-entradas', permiso: 'Lista de Entradas' },
      { nombre: 'Silos', icono: Bolt, ruta: 'lista-silos', permiso: 'Lista de Silos' },
      { nombre: 'Relación Productos con Silos', icono: List, ruta: 'lista-relsilo1', permiso: 'ListaRelSilo1' },
      { nombre: 'Salidas', icono: Truck, ruta: 'lista-salidas', permiso: 'Lista de Salidas' }
    ]
  },
  {
    grupo: 'movimientos', // ✅ Grupo "movimientos" para entradas
    titulo: 'Movimientos',
    items: [
      { nombre: 'Movimiento', icono: Activity, ruta: 'movimiento', permiso: 'Movimiento' },
      { nombre: 'Pesaje', icono: Scale, ruta: 'pesaje', permiso: 'Pesaje' }
    ]
  },
  {
    grupo: 'mantenimiento',
    titulo: 'Mantenimiento',
    items: [
      { nombre: 'Estado Movimiento', icono: ToggleRight, ruta: 'estadomovimiento', permiso: 'Estado de movimiento' },
      { nombre: 'Repesaje', icono: Weight, ruta: 'repesaje', permiso: 'Repesaje' }
    ]
  },
  {
    grupo: 'historial',
    titulo: 'Historial',
    items: [
      { nombre: 'Blend x Cigarrillera', icono: BookOpen, ruta: 'blendxcigarrillera', permiso: 'Blend x cigarrillera' },
      { nombre: 'Cambios Blend Minisilo', icono: RefreshCcwDot, ruta: 'blendminisilo', permiso: 'Blend minisilo' },
      { nombre: 'Dash Depósito', icono: Warehouse, ruta: 'dashdeposito', permiso: 'Dash depósito' },
      { nombre: 'Dash Gráfico', icono: ChartNoAxesCombined, ruta: 'dashgrafico', permiso: 'Dash gráfico' },
      { nombre: 'Dash Silo', icono: BarChart2, ruta: 'dashsilo', permiso: 'Dash silo' },
      { nombre: 'Movimiento Tabaco', icono: Clock, ruta: 'movimtabaco', permiso: 'Movimiento tabaco' },
      { nombre: 'Operación', icono: ArrowLeftRight, ruta: 'operacion', permiso: 'Operación' }
    ]
  },
  {
    grupo: 'utilidad',
    titulo: 'Utilidad',
    items: [
      { nombre: 'Cambiar contraseña', icono: Lock, ruta: 'cambiocontrasena', permiso: 'Cambiar contraseña' }
    ]
  }
];

const Sidebar = ({ usuario, onLogout, sidebarAbierto, setSidebarAbierto }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [openGroups, setOpenGroups] = useState({});

  const toggleGroup = (grupo) => {
    setOpenGroups(prev => ({
      ...prev,
      [grupo]: !prev[grupo]
    }));
  };

  const esActivo = useMemo(() => {
    return (ruta) => location.pathname.includes(ruta);
  }, [location.pathname]);

  const menuItems = useMemo(() => (
    MENU_CONFIG.map(seccion => ({
      ...seccion,
      mostrarSeccion: seccion.items.some(item => tienePermiso(usuario, seccion.grupo, item.permiso)),
      items: seccion.items.filter(item => tienePermiso(usuario, seccion.grupo, item.permiso))
    })).filter(seccion => seccion.mostrarSeccion && seccion.items.length > 0)
  ), [usuario]);

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 w-64 bg-gray-900 text-white p-4 flex flex-col z-40
        transform ${sidebarAbierto ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        transition-transform duration-300 ease-in-out`}
    >
      {/* Botón para cerrar el sidebar en móviles */}
      <button
        onClick={() => setSidebarAbierto(false)}
        className="md:hidden absolute top-4 right-4 text-white text-2xl"
      >
        &times;
      </button>

      <div className="text-2xl font-bold text-center mb-6">PLC Control</div>
      <Link
        to="/dashboard"
        className={`flex items-center gap-2 p-2 rounded mb-4 ${
          esActivo('/dashboard') ? 'bg-blue-700' : 'hover:bg-gray-800'
        }`}
        onClick={() => setSidebarAbierto(false)} // Cerrar sidebar al navegar en móvil
      >
        <Home size={20} /> Dashboard
      </Link>

      {menuItems.map((seccion) => (
        <div key={seccion.grupo} className="mb-2">
          <button
            onClick={() => toggleGroup(seccion.grupo)}
            className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-800 text-left cursor-pointer"
          >
            <h3 className="text-sm uppercase text-gray-400 font-semibold">{seccion.titulo}</h3>
            {openGroups[seccion.grupo] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {/* Contenido desplegable */}
          {openGroups[seccion.grupo] && (
            <div className="space-y-1 mt-1 pl-4 border-l border-gray-700">
              {seccion.items.map((item) => {
                const IconComponent = item.icono;
                const rutaCompleta = `/${seccion.grupo}/${item.ruta}`;

                return (
                  <Link
                    key={item.ruta}
                    to={rutaCompleta}
                    className={`flex items-center gap-2 p-2 rounded ${
                      esActivo(rutaCompleta) ? 'bg-blue-700' : 'hover:bg-gray-800'
                    }`}
                    onClick={() => setSidebarAbierto(false)}
                  >
                    <IconComponent size={16} /> {item.nombre}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <div className="mt-auto pt-4">
        <hr className="my-4 border-gray-700" />
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 p-2 rounded bg-red-600 hover:bg-red-700"
        >
          <LogOut size={18} /> Cerrar sesión
        </button>
        <p className="text-xs text-gray-500 mt-4 text-center">
          Rol: {usuario?.rol || 'No autenticado'}
        </p>
      </div>
    </div>
  );
};

export default React.memo(Sidebar);
