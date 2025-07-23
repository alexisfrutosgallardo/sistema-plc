import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function DashboardLayout({ usuario, onLogout }) {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  return (
    <div className="flex relative min-h-screen bg-gray-100">
      {/* ☰ Botón hamburguesa visible en móviles */}
      <button
        onClick={() => setSidebarAbierto(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-gray-800 text-white p-2 rounded"
      >
        ☰
      </button>

      {/* Sidebar deslizante */}
      <Sidebar
        usuario={usuario}
        onLogout={onLogout}
        sidebarAbierto={sidebarAbierto}
        setSidebarAbierto={setSidebarAbierto}
      />

      {/* Contenido principal */}
      <main className="flex-1 ml-0 md:ml-64 p-6 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
}
