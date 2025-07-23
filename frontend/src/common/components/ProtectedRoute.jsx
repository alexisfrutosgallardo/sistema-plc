import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ usuario, children, requiredPermission, specificPermission }) {
  // 1. Si no hay sesión
  if (!usuario) return <Navigate to="/" />;

  // 2. Si es admin, tiene acceso total
  if (usuario.rol === 'admin') return children;

  // 3. Validación defensiva de permisos
  const permisos = usuario.permisos || {};

  // 4. Si se requiere permiso específico
  if (requiredPermission && specificPermission) {
    const hasPermission = permisos?.[requiredPermission]?.includes(specificPermission);
    if (!hasPermission) return <Navigate to="/dashboard" />;
  }

  // 5. Si se requiere grupo de permisos
  if (requiredPermission && !specificPermission) {
    const hasGroupPermission = Array.isArray(permisos[requiredPermission]) && permisos[requiredPermission].length > 0;
    if (!hasGroupPermission) return <Navigate to="/dashboard" />;
  }

  // 6. Todo OK
  return children;
}
