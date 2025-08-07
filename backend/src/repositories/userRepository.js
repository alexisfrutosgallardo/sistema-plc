// backend/src/repositories/userRepository.js
const db = require('../database'); // Importa la instancia de la base de datos

const userRepository = {
  // Obtener todos los usuarios
  getAllUsers: () => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM Usuario ORDER BY UsuNombre`;
      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const users = rows.map(row => ({
            ...row,
            permisos: row.permisos ? JSON.parse(row.permisos) : {}
          }));
          resolve(users);
        }
      });
    });
  },

  // Obtener un usuario por legajo
  getUserByLegajo: (legajo) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM Usuario WHERE legajo = ?`;
      db.get(sql, [legajo], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null); // No encontrado
        } else {
          resolve({
            ...row,
            permisos: row.permisos ? JSON.parse(row.permisos) : {}
          });
        }
      });
    });
  },

  // ✅ NUEVA FUNCIÓN: Verificar credenciales de usuario (legajo y contraseña)
  verifyUserCredentials: (legajo, contrasena) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM Usuario WHERE legajo = ? AND contrasena = ?`;
      db.get(sql, [legajo, contrasena], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null); // Credenciales inválidas
        } else {
          resolve({
            ...row,
            permisos: row.permisos ? JSON.parse(row.permisos) : {}
          });
        }
      });
    });
  },

  // Crear un nuevo usuario
  createUser: (userData) => {
    return new Promise((resolve, reject) => {
      const { legajo, UsuNombre, fecha_cat, contrasena, estado, permisos, rol } = userData;
      
      db.get(`SELECT UsuCodigo FROM Usuario ORDER BY UsuCodigo DESC LIMIT 1`, (err, row) => {
        if (err) return reject(err);

        let newCode = 'us001';
        if (row?.UsuCodigo) {
          const num = parseInt(row.UsuCodigo.replace('us', '')) + 1;
          newCode = 'us' + num.toString().padStart(3, '0');
        }

        const sql = `
          INSERT INTO Usuario (UsuCodigo, legajo, UsuNombre, fecha_cat, contrasena, estado, rol, permisos)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
          newCode,
          legajo,
          UsuNombre,
          fecha_cat,
          contrasena,
          estado || 'Activo',
          rol,
          JSON.stringify(permisos)
        ];

        db.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ message: "✅ Usuario registrado correctamente", UsuCodigo: newCode });
        });
      });
    });
  },

  // Actualizar usuario
  updateUser: (legajo, userData) => {
    return new Promise((resolve, reject) => {
      const { UsuNombre, contrasena, estado, rol, permisos } = userData;
      const sql = `
        UPDATE Usuario
        SET UsuNombre = ?, contrasena = ?, estado = ?, rol = ?, permisos = ?
        WHERE legajo = ?
      `;
      const params = [
        UsuNombre,
        contrasena,
        estado,
        rol,
        JSON.stringify(permisos),
        legajo
      ];
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ message: "✅ Usuario actualizado correctamente.", changes: this.changes });
      });
    });
  },

  // Actualizar estado de usuario
  updateUserStatus: (legajo, estado) => {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE Usuario SET estado = ? WHERE legajo = ?`;
      db.run(sql, [estado, legajo], function (err) {
        if (err) reject(err);
        else resolve({ message: `✅ Usuario ${estado === 'Activo' ? 'activado' : 'inactivado'} correctamente`, changes: this.changes });
      });
    });
  },

  // Eliminar usuario
  deleteUser: (legajo) => {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM Usuario WHERE legajo = ?`;
      db.run(sql, [legajo], function (err) {
        if (err) reject(err);
        else resolve({ message: "🗑️ Usuario eliminado correctamente.", changes: this.changes });
      });
    });
  },

  // Actualizar contraseña
  updatePassword: (legajo, nuevaContrasena) => {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE Usuario SET contrasena = ? WHERE legajo = ?`;
      db.run(sql, [nuevaContrasena, legajo], function (err) {
        if (err) reject(err);
        else resolve({ message: "✅ Contraseña actualizada exitosamente.", changes: this.changes });
      });
    });
  }
};

module.exports = userRepository;
