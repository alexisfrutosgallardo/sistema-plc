import React from 'react';
import { useLocation } from 'react-router-dom';
import Registro_Entrada_Supervisor from './Registro_Entrada_Supervisor';
import Registro_Entrada_Operador from './Registro_Entrada_Operador';
import Registro_Entrada_Admin from './Registro_Entrada_Admin';

export default function Registro_Entrada({ usuario }) {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const entNumeroParam = queryParams.get('entNumero');

  if (!usuario) {
    return (
      <div className="max-w-md mx-auto p-6 bg-red-100 text-red-700 rounded-lg shadow-lg mt-10 text-center">
        <p>No se ha detectado un usuario autenticado. Por favor, inicie sesión.</p>
      </div>
    );
  }

  // Lógica para determinar qué componente renderizar
  if (entNumeroParam) {
    // Si hay un entNumeroParam, siempre es una edición
    // El Admin puede editar todo, el Supervisor solo el estado de la cabecera
    // El Operador no debería llegar aquí directamente para editar, solo para cargar detalles
    if (usuario.rol === 'admin') {
      return <Registro_Entrada_Admin usuario={usuario} entNumeroParam={entNumeroParam} />;
    } else if (usuario.rol === 'supervisor') {
      // El supervisor solo puede cambiar el estado de una entrada existente
      return <Registro_Entrada_Supervisor usuario={usuario} entNumeroParam={entNumeroParam} />;
    } else {
      // Otros roles (incluido operador) no pueden editar entradas por número
      return (
        <div className="max-w-md mx-auto p-6 bg-red-100 text-red-700 rounded-lg shadow-lg mt-10 text-center">
          <p>🚫 No tienes permisos para editar esta entrada directamente.</p>
        </div>
      );
    }
  } else {
    // Si no hay entNumeroParam, es un nuevo registro
    if (usuario.rol === 'supervisor') {
      return <Registro_Entrada_Supervisor usuario={usuario} />;
    } else if (usuario.rol === 'operador') {
      return <Registro_Entrada_Operador usuario={usuario} />;
    } else if (usuario.rol === 'admin') {
      return <Registro_Entrada_Admin usuario={usuario} />;
    } else {
      return (
        <div className="max-w-md mx-auto p-6 bg-red-100 text-red-700 rounded-lg shadow-lg mt-10 text-center">
          <p>🚫 Tu rol no tiene permisos para registrar nuevas entradas.</p>
        </div>
      );
    }
  }
}
