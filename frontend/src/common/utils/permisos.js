// ✅ utils/permisos.js
export const tienePermiso = (usuario, grupo, modulo) => {
  if (!usuario) return false;
  if (usuario.rol === 'admin') return true;
  if (!usuario.permisos || !usuario.permisos[grupo]) return false;

  return usuario.permisos[grupo].includes(modulo);
};
