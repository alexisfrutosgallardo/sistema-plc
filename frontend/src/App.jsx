import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importaciones actualizadas según la estructura de carpetas del usuario
import Login from './features/auth/components/Login';
import DashboardLayout from './common/components/DashboardLayout';
import DashboardHome from './features/dashboard/components/DashboardHome';

// REGISTRO
import Registro_Aprobador from './features/misc-registers/components/Registro_Aprobador';
import Registro_Cargo from './features/misc-registers/components/Registro_Cargo';
import Registro_Cigarrillera from './features/misc-registers/components/Registro_Cigarrillera';
import Registro_Minisilo from './features/misc-registers/components/Registro_Minisilo';
import Registro_TipoBlend from './features/misc-registers/components/Registro_TipoBlend';

import Registro_Usuario from './features/users/components/Registro_Usuario'; 
import Lista_Usuarios from './features/users/components/Lista_Usuarios'; 

import Registro_Producto from './features/products/components/Registro_Producto'; 
import Lista_Productos from './features/products/components/Lista_Productos'; 

import Registro_TipoProducto from './features/products/components/Registro_TipoProducto'; 
import Lista_TipoProducto from './features/products/components/Lista_TipoProducto'; 

import Registro_Maquina from './features/machines/components/Registro_Maquina'; 
import Lista_Maquinas from './features/machines/components/Lista_Maquinas'; 

import Registro_Silo from './features/silos/components/Registro_Silo';
import Lista_Silos from './features/silos/components/Lista_Silos';

import Registro_Entrada from './features/entries/components/Registro_Entrada';
import Lista_Entradas from './features/entries/components/Lista_Entradas';

import Registro_RelSiloBlend from './features/relsilo-blend/components/Registro_RelSiloBlend'; 
import Lista_RelSiloBlend from './features/relsilo-blend/components/Lista_RelSiloBlend'; 

import Registro_Salida from './features/exits/components/Registro_Salida';
import Lista_Salidas from './features/exits/components/Lista_Salidas';    

// MOVIMIENTOS
import Movimiento_Movim from './features/movimientos/components/Movimiento_Movim';
import Movimiento_Pesaje from './features/movimientos/components/Movimiento_Pesaje';

// MANTENIMIENTO
import Mantenimiento_EstadoMovimiento from './features/maintenance/components/Mantenimiento_EstadoMovimiento';
import Mantenimiento_Repesaje from './features/maintenance/components/Mantenimiento_Repesaje';

// HISTORIAL
// ✅ RUTAS DE IMPORTACIÓN REVISADAS PARA 'history' (asumiendo carpeta 'history' en minúsculas)
import Historial_BlendXCigarrillera from './features/history/components/Historial_BlendXCigarrillera';
import Historial_BlendMinisilo from './features/history/components/Historial_BlendMinisilo';
import Historial_DashDeposito from './features/history/components/Historial_DashDeposito';
import Historial_DashGrafico from './features/history/components/Historial_DashGrafico';
import Historial_DashSilo from './features/history/components/Historial_DashSilo';
import Historial_MovimientoTabaco from './features/history/components/Historial_MovimientoTabaco';
import Historial_Operacion from './features/history/components/Historial_Operacion';

// UTILIDAD
import Utilidad_CambiarContrasena from './features/users/components/Utilidad_CambiarContrasena';

// Importación de ProtectedRoute desde common
import ProtectedRoute from './common/components/ProtectedRoute'; 

function App() {
  const [usuario, setUsuario] = useState(() => {
    const storedUser = localStorage.getItem('usuario');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const handleLogin = (usuarioAutenticado) => {
    localStorage.setItem('usuario', JSON.stringify(usuarioAutenticado));
    setUsuario(usuarioAutenticado);
  };

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  return (
    <Router>
      <Routes>
        {/* Página de login */}
        <Route
          path="/"
          element={
            usuario ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />
          }
        />

        {/* Rutas protegidas bajo DashboardLayout */}
        {usuario && (
          <Route path="/" element={<DashboardLayout usuario={usuario} onLogout={handleLogout} />}>
            <Route path="dashboard" element={<DashboardHome />} />

            {/* REGISTRO */}
            <Route path="registro/aprobador" element={
              <ProtectedRoute usuario={usuario} requiredPermission="registro" specificPermission="Aprobador">
                <Registro_Aprobador />
              </ProtectedRoute>
            } />
            <Route path="registro/cargo" element={
              <ProtectedRoute usuario={usuario} requiredPermission="registro" specificPermission="Cargo">
                <Registro_Cargo />
              </ProtectedRoute>
            } />
            <Route path="registro/cigarrillera" element={
              <ProtectedRoute usuario={usuario} requiredPermission="registro" specificPermission="Cigarrillera">
                <Registro_Cigarrillera />
              </ProtectedRoute>
            } />
            <Route path="registro/minisilo" element={
              <ProtectedRoute usuario={usuario} requiredPermission="registro" specificPermission="Minisilo">
                <Registro_Minisilo />
              </ProtectedRoute>
            } />
            <Route path="registro/tipoblend" element={
              <ProtectedRoute usuario={usuario} requiredPermission="registro" specificPermission="Tipo de blend">
                <Registro_TipoBlend />
              </ProtectedRoute>
            } />
            <Route path="registro/usuario" element={
              <ProtectedRoute usuario={usuario} requiredPermission="registro" specificPermission="Usuario">
                <Registro_Usuario />
              </ProtectedRoute>            
            } />
            <Route path="registro/lista-usuarios" element={
              <ProtectedRoute usuario={usuario} requiredPermission="registro" specificPermission="Lista de Usuarios">
                <Lista_Usuarios />
              </ProtectedRoute>
            } />
            <Route path="registro/producto" element={
              <ProtectedRoute usuario={usuario} requiredPermission="registro" specificPermission="Producto">
                <Registro_Producto usuario={usuario} />
              </ProtectedRoute>
            } />
            <Route path="registro/lista-productos" element={
              <ProtectedRoute usuario={usuario} requiredPermission="registro" specificPermission="Lista de Productos">
                <Lista_Productos />
              </ProtectedRoute>
            } />
            {/* ✅ Ruta para Registro de Tipo de Producto (permite TipProdCodigo para edición) */}
            <Route path="registro/tipoproducto" element={
              <ProtectedRoute usuario={usuario} requiredPermission="registro" specificPermission="Tipo de producto">
                <Registro_TipoProducto usuario={usuario} />
              </ProtectedRoute>
            } />
            {/* ✅ Nueva Ruta para Lista de Tipos de Producto */}
            <Route path="registro/lista-tipoproducto" element={
              <ProtectedRoute usuario={usuario} requiredPermission="registro" specificPermission="Lista de Tipo de producto"> {/* Asumiendo este permiso */}
                <Lista_TipoProducto />
              </ProtectedRoute>
            } />
            <Route path="registro/maquina" element={
              <ProtectedRoute usuario={usuario} requiredPermission="registro" specificPermission="Máquina">
                <Registro_Maquina usuario={usuario} />
              </ProtectedRoute>
            } />
            <Route path="registro/lista-maquinas" element={
              <ProtectedRoute usuario={usuario} requiredPermission="registro" specificPermission="Lista de Máquinas">
                <Lista_Maquinas />
              </ProtectedRoute>
            } />
            <Route path="registro/entrada" element={
              <ProtectedRoute usuario={usuario} requiredPermission="registro" specificPermission="Registro de Entrada">
                <Registro_Entrada usuario={usuario} />
              </ProtectedRoute>
            } />
            <Route path="registro/lista-entradas" element={
              <ProtectedRoute usuario={usuario} requiredPermission="registro" specificPermission="Lista de Entradas">
                <Lista_Entradas />
              </ProtectedRoute>
            } />
            <Route path="registro/silo" element={
              <ProtectedRoute usuario={usuario} requiredPermission="registro" specificPermission="Silo">
                <Registro_Silo usuario={usuario} />
              </ProtectedRoute>
            } />
            <Route path="registro/lista-silos" element={
              <ProtectedRoute usuario={usuario} requiredPermission="registro" specificPermission="Lista de Silos">
                <Lista_Silos />
              </ProtectedRoute>
            } />
            <Route path="registro/relsilo" element={
              <ProtectedRoute usuario={usuario} requiredPermission="registro" specificPermission="Relación Silo-Producto">
                <Registro_RelSiloBlend usuario={usuario} />
              </ProtectedRoute>
            } />
            <Route path="registro/lista-relsilo1" element={
              <ProtectedRoute usuario={usuario} requiredPermission="registro" specificPermission="Lista de Relación Silo-Producto">
                <Lista_RelSiloBlend />
              </ProtectedRoute>
            } />
            <Route path="registro/salida" element={
              <ProtectedRoute usuario={usuario} requiredPermission="registro" specificPermission="Registro de Salida">
                <Registro_Salida usuario={usuario} />
              </ProtectedRoute>
            } />
            <Route path="registro/lista-salidas" element={
              <ProtectedRoute usuario={usuario} requiredPermission="registro" specificPermission="Lista de Salidas">
                <Lista_Salidas />
              </ProtectedRoute>
            } />

            {/* MOVIMIENTOS */}
            <Route path="movimientos/movimiento" element={
              <ProtectedRoute usuario={usuario} requiredPermission="movimientos" specificPermission="Movimiento">
                <Movimiento_Movim />
              </ProtectedRoute>
            } />
            <Route path="movimientos/pesaje" element={
              <ProtectedRoute usuario={usuario} requiredPermission="movimientos" specificPermission="Pesaje">
                <Movimiento_Pesaje />
              </ProtectedRoute>
            } />

            {/* MANTENIMIENTO */}
            <Route path="mantenimiento/estado-movimiento" element={
              <ProtectedRoute usuario={usuario} requiredPermission="mantenimiento" specificPermission="Estado de movimiento">
                <Mantenimiento_EstadoMovimiento />
              </ProtectedRoute>
            } />
            <Route path="mantenimiento/repesaje" element={
              <ProtectedRoute usuario={usuario} requiredPermission="mantenimiento" specificPermission="Repesaje">
                <Mantenimiento_Repesaje />
              </ProtectedRoute>
            } />

            {/* HISTORIAL */}
            <Route path="historial/blend-x-cigarrillera" element={
              <ProtectedRoute usuario={usuario} requiredPermission="historial" specificPermission="Blend x cigarrillera">
                <Historial_BlendXCigarrillera />
              </ProtectedRoute>
            } />
            <Route path="historial/blend-minisilo" element={
              <ProtectedRoute usuario={usuario} requiredPermission="historial" specificPermission="Blend minisilo">
                <Historial_BlendMinisilo />
              </ProtectedRoute>
            } />
            <Route path="historial/dash-deposito" element={
              <ProtectedRoute usuario={usuario} requiredPermission="historial" specificPermission="Dash depósito">
                <Historial_DashDeposito />
              </ProtectedRoute>
            } />
            <Route path="historial/dash-grafico" element={
              <ProtectedRoute usuario={usuario} requiredPermission="historial" specificPermission="Dash gráfico">
                <Historial_DashGrafico />
              </ProtectedRoute>
            } />
            <Route path="historial/dash-silo" element={
              <ProtectedRoute usuario={usuario} requiredPermission="historial" specificPermission="Dash silo">
                <Historial_DashSilo />
              </ProtectedRoute>
            } />
            <Route path="historial/movimiento-tabaco" element={
              <ProtectedRoute usuario={usuario} requiredPermission="historial" specificPermission="Movimiento tabaco">
                <Historial_MovimientoTabaco />
              </ProtectedRoute>
            } />
            <Route path="historial/operacion" element={
              <ProtectedRoute usuario={usuario} requiredPermission="historial" specificPermission="Operación">
                <Historial_Operacion />
              </ProtectedRoute>
            } />

            {/* UTILIDAD */}
            <Route path="utilidad/cambiocontrasena" element={
              <ProtectedRoute usuario={usuario} requiredPermission="utilidad" specificPermission="Cambiar contraseña">
                <Utilidad_CambiarContrasena usuario={usuario} />
              </ProtectedRoute>
            } />
          </Route>
        )}

        {/* Ruta catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
