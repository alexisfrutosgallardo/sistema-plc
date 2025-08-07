// backend/src/controllers/userController.js
const userRepository = require('../repositories/userRepository');

const userController = {
  // Listar todos los usuarios
  getAllUsers: async (req, res) => {
    try {
      const users = await userRepository.getAllUsers();
      res.json(users);
    } catch (err) {
      console.error("❌ Error al obtener usuarios:", err.message);
      res.status(500).json({ error: "Error al obtener usuarios." });
    }
  },

  // Obtener un usuario por legajo
  getUserByLegajo: async (req, res) => {
    const { legajo } = req.params;
    try {
      const user = await userRepository.getUserByLegajo(legajo);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado." });
      }
      res.json(user);
    } catch (err) {
      console.error("❌ Error al obtener usuario:", err.message);
      res.status(500).json({ error: "Error al obtener usuario." });
    }
  },

  // Crear un nuevo usuario
  createUser: async (req, res) => {
    const { legajo, contrasena, rol } = req.body;

    if (!legajo || legajo.trim() === '') {
      return res.status(400).json({ error: "⚠️ El legajo no puede estar vacío." });
    }

    try {
      const existingUser = await userRepository.getUserByLegajo(legajo);
      if (existingUser) {
        return res.status(400).json({ error: "⚠️ Ya existe un usuario con ese legajo." });
      }

      const opcionesPermisos = {
        registro: ['Usuario', 'Lista de Usuarios', 'Producto', 'Lista de Productos', 'Tipo de producto', 'Lista de Tipo de producto', 'Aprobador', 'Cargo', 'Cigarrillera', 'Minisilo', 'Tipo de blend', 'Máquina', 'Lista de Máquinas', 'Silo', 'Lista de Silos', 'Relación de SiloBlend1', 'Lista de Relación Productos con Silos', 'Entrada', 'Lista de Entradas', 'Salida', 'Lista de Salidas'],
        mantenimiento: ['Estado de movimiento', 'Repesaje'],
        historial: ['Blend x cigarrillera', 'Blend minisilo', 'Dash depósito', 'Dash gráfico', 'Dash silo', 'Movimiento tabaco', 'Operación'],
        movimientos: ['Movimiento', 'Pesaje'],
        utilidad: ['Cambiar contraseña']
      };

      const permisosFinales = rol === 'admin'
        ? Object.values(opcionesPermisos).flat()
        : req.body.permisos || {};

      const userData = { ...req.body, permisos: permisosFinales };
      const result = await userRepository.createUser(userData);
      res.status(201).json(result);
    } catch (err) {
      console.error("❌ Error al crear usuario:", err.message);
      res.status(500).json({ error: "Error al registrar el usuario." });
    }
  },

  // Actualizar usuario
  updateUser: async (req, res) => {
    const { legajo } = req.params;
    const { rol } = req.body;

    try {
      const opcionesPermisos = {
        registro: ['Usuario', 'Lista de Usuarios', 'Producto', 'Lista de Productos', 'Tipo de producto', 'Lista de Tipo de producto', 'Aprobador', 'Cargo', 'Cigarrillera', 'Minisilo', 'Tipo de blend', 'Máquina', 'Lista de Máquinas', 'Silo', 'Lista de Silos', 'Relación de SiloBlend1', 'Lista de Relación Productos con Silos', 'Entrada', 'Lista de Entradas', 'Salida', 'Lista de Salidas'],
        mantenimiento: ['Estado de movimiento', 'Repesaje'],
        historial: ['Blend x cigarrillera', 'Blend minisilo', 'Dash depósito', 'Dash gráfico', 'Dash silo', 'Movimiento tabaco', 'Operación'],
        movimientos: ['Movimiento', 'Pesaje'],
        utilidad: ['Cambiar contraseña']
      };

      const permisosFinales = rol === 'admin'
        ? Object.values(opcionesPermisos).flat()
        : req.body.permisos || {};

      const userData = { ...req.body, permisos: permisosFinales };
      const result = await userRepository.updateUser(legajo, userData);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Usuario no encontrado o no hubo cambios para actualizar." });
      }
      res.json(result);
    } catch (err) {
      console.error("❌ Error al actualizar usuario:", err.message);
      res.status(500).json({ error: "Error al actualizar usuario." });
    }
  },

  // Actualizar estado de usuario
  updateUserStatus: async (req, res) => {
    const { legajo } = req.params;
    const { estado } = req.body;
    try {
      const result = await userRepository.updateUserStatus(legajo, estado);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Usuario no encontrado o no se pudo actualizar el estado." });
      }
      res.json(result);
    } catch (err) {
      console.error("❌ Error al actualizar estado:", err.message);
      res.status(500).json({ error: 'Error al actualizar estado del usuario' });
    }
  },

  // Eliminar usuario
  deleteUser: async (req, res) => {
    const { legajo } = req.params;
    try {
      const result = await userRepository.deleteUser(legajo);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Usuario no encontrado." });
      }
      res.json(result);
    } catch (err) {
      console.error("❌ Error al eliminar usuario:", err.message);
      res.status(500).json({ error: "Error al eliminar usuario." });
    }
  },

  // Login de usuario
  loginUser: async (req, res) => {
    const { legajo, contrasena } = req.body;
    try {
      const user = await userRepository.verifyUserCredentials(legajo, contrasena);
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      if (user.estado !== 'Activo') {
        return res.status(403).json({ error: '🚫 Tu cuenta está inactiva. Contactá con un administrador.' });
      }
      res.json({
        message: 'Login exitoso',
        usuario: {
          UsuCodigo: user.UsuCodigo,
          UsuNombre: user.UsuNombre,
          estado: user.estado,
          rol: user.rol,
          legajo: user.legajo,
          permisos: user.permisos
        }
      });
    } catch (err) {
      console.error("Error en BD:", err);
      res.status(500).json({ error: 'Error de servidor' });
    }
  },

  // Cambiar contraseña (para el propio usuario)
  changePassword: async (req, res) => {
    const { legajo, contrasenaActual, nuevaContrasena } = req.body;

    if (!legajo || !contrasenaActual || !nuevaContrasena) {
      return res.status(400).json({ error: "⚠️ Faltan campos obligatorios." });
    }

    try {
      const user = await userRepository.verifyUserCredentials(legajo, contrasenaActual);
      if (!user) {
        return res.status(401).json({ error: "🚫 Contraseña actual incorrecta." });
      }

      const result = await userRepository.updatePassword(legajo, nuevaContrasena);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Usuario no encontrado o no se pudo actualizar." });
      }
      res.json(result);
    } catch (err) {
      console.error("❌ Error al cambiar contraseña:", err.message);
      res.status(500).json({ error: "Error interno del servidor al actualizar contraseña." });
    }
  },

  // Resetear contraseña (solo para administradores)
  resetPasswordByAdmin: async (req, res) => {
    const { adminLegajo, targetLegajo, nuevaContrasena } = req.body;

    if (!adminLegajo || !targetLegajo || !nuevaContrasena) {
      return res.status(400).json({ error: "⚠️ Faltan campos obligatorios para resetear la contraseña." });
    }

    try {
      const adminUser = await userRepository.getUserByLegajo(adminLegajo);
      if (!adminUser || adminUser.rol !== 'admin') {
        return res.status(403).json({ error: "🚫 Acceso denegado. Solo los administradores pueden resetear contraseñas." });
      }

      const result = await userRepository.updatePassword(targetLegajo, nuevaContrasena);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Usuario objetivo no encontrado o no se pudo actualizar." });
      }
      res.json({ message: `✅ Contraseña del usuario ${targetLegajo} reseteada exitosamente.` });
    } catch (err) {
      console.error("❌ Error al resetear contraseña:", err.message);
      res.status(500).json({ error: "Error interno del servidor al resetear contraseña." });
    }
  },

  // Valida las credenciales de un usuario y verifica si tiene un rol permitido.
  validateRoleForDeletion: async (req, res) => {
    const { legajo, password } = req.body;

    if (!legajo || !password) {
      return res.status(400).json({ error: "⚠️ Legajo y contraseña son obligatorios." });
    }

    try {
      const user = await userRepository.verifyUserCredentials(legajo, password);

      if (!user) {
        return res.status(401).json({ error: "❌ Credenciales inválidas." });
      }

      const allowedRoles = ['supervisor', 'admin'];

      if (allowedRoles.includes(user.rol.toLowerCase())) {
        return res.status(200).json({ success: true, message: "✅ Credenciales válidas. Permiso concedido.", userRole: user.rol });
      } else {
        const formattedAllowedRoles = allowedRoles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ');
        return res.status(403).json({ error: `❌ Su rol (${user.rol}) no tiene permiso para realizar esta acción. Roles permitidos: ${formattedAllowedRoles}.` });
      }

    } catch (err) {
      console.error("❌ Error en validateRoleForDeletion:", err.message);
      res.status(500).json({ error: "Error interno del servidor al validar credenciales." });
    }
  },
};

module.exports = userController;
