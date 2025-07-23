// backend/src/repositories/siloRepository.js
const db = require('../database'); // Importa la instancia de la base de datos

const siloRepository = {
  // Obtener todos los silos con opción de ordenamiento
  getAllSilos: (sortBy = 'SiloCodigo', order = 'ASC') => {
    return new Promise((resolve, reject) => {
      const allowedSortColumns = [
        's.SiloCodigo', 's.SiloNombre', 's.IP', 's.Estado',
        's.Usuario', 's.FechaCat', 'u.UsuNombre'
      ];
      let qualifiedSortBy = sortBy;
      if (!sortBy.includes('.')) {
        if (sortBy === 'UsuarioNombre') {
          qualifiedSortBy = 'u.UsuNombre';
        } else {
          qualifiedSortBy = `s.${sortBy}`;
        }
      }
      if (!allowedSortColumns.includes(qualifiedSortBy)) {
        qualifiedSortBy = 's.SiloCodigo';
      }
      
      const allowedOrderDirections = ['ASC', 'DESC'];
      if (!allowedOrderDirections.includes(order.toUpperCase())) {
        order = 'ASC';
      }

      const sql = `
        SELECT s.SiloCodigo, s.SiloNombre, s.IP, s.Estado,
               s.Usuario, u.UsuNombre AS UsuarioNombre, s.FechaCat
        FROM Silo s
        LEFT JOIN Usuario u ON s.Usuario = u.legajo
        ORDER BY ${qualifiedSortBy} ${order}
      `;
      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  // Obtener un silo por código
  getSiloByCode: (siloCodigo) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT s.SiloCodigo, s.SiloNombre, s.IP, s.Estado,
               s.Usuario, u.UsuNombre AS UsuarioNombre, s.FechaCat
        FROM Silo s
        LEFT JOIN Usuario u ON s.Usuario = u.legajo
        WHERE s.SiloCodigo = ?
      `;
      db.get(sql, [siloCodigo], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  // Crear un nuevo silo
  createSilo: (siloData) => {
    return new Promise((resolve, reject) => {
      const { SiloNombre, IP, Estado, Usuario, FechaCat } = siloData;

      // ✅ Lógica de generación de SiloCodigo más robusta
      db.all(`SELECT SiloCodigo FROM Silo`, (err, rows) => {
        if (err) return reject(err);

        let maxNum = 0;
        if (rows && rows.length > 0) {
          rows.forEach(row => {
            const numPart = parseInt(row.SiloCodigo.replace('si', ''), 10);
            if (!isNaN(numPart) && numPart > maxNum) {
              maxNum = numPart;
            }
          });
        }
        
        const nextNum = maxNum + 1;
        const newCode = 'si' + nextNum.toString().padStart(3, '0');

        const sql = `
          INSERT INTO Silo (SiloCodigo, SiloNombre, IP, Estado, Usuario, FechaCat)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        const params = [
          newCode,
          SiloNombre,
          IP,
          Estado || 'Activo', // Valor por defecto
          Usuario,
          FechaCat
        ];

        db.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ message: "✅ Silo registrado correctamente", SiloCodigo: newCode });
        });
      });
    });
  },

  // Actualizar un silo existente
  updateSilo: (siloCodigo, siloData) => {
    return new Promise((resolve, reject) => {
      const { SiloNombre, IP, Estado } = siloData;
      const sql = `
        UPDATE Silo
        SET SiloNombre = ?, IP = ?, Estado = ?
        WHERE SiloCodigo = ?
      `;
      const params = [
        SiloNombre,
        IP,
        Estado,
        siloCodigo
      ];
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ message: "✅ Silo actualizado correctamente", changes: this.changes });
      });
    });
  },

  // Eliminar un silo
  deleteSilo: (siloCodigo) => {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM Silo WHERE SiloCodigo = ?`;
      db.run(sql, [siloCodigo], function (err) {
        if (err) reject(err);
        else resolve({ message: "🗑️ Silo eliminado correctamente", changes: this.changes });
      });
    });
  },

  // Obtener el conteo de silos activos (para el dashboard)
  getActiveSilosCount: () => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT COUNT(*) AS count FROM Silo WHERE Estado = 'Activo'`;
      db.get(sql, [], (err, row) => {
        if (err) reject(err);
        else resolve(row); // Devolverá { count: X }
      });
    });
  },
};

module.exports = siloRepository;
