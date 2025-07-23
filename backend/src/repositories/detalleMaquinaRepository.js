// backend/src/repositories/detalleMaquinaRepository.js
const db = require('../database'); // Importa la instancia de la base de datos

const detalleMaquinaRepository = {
  // Obtener todas las máquinas asociadas a una relación Silo-Blend específica
  getAllDetalleMaquinas: (nroRelacion) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT r2.NroRelacion, r2.Iten, r2.MaqCodigo, m.MaqNombre, r2.Estado,
               r2.Usuario, u.UsuNombre AS UsuarioNombre, r2.FechaCat
        FROM RelSiloBlend2 r2
        LEFT JOIN Maquina m ON r2.MaqCodigo = m.MaqCodigo
        LEFT JOIN Usuario u ON r2.Usuario = u.legajo
        WHERE r2.NroRelacion = ?
        ORDER BY r2.Iten ASC
      `;
      db.all(sql, [nroRelacion], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  // Obtener una máquina asociada específica por NroRelacion e Iten
  getDetalleMaquinaByNroRelacionAndIten: (nroRelacion, iten) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT r2.NroRelacion, r2.Iten, r2.MaqCodigo, m.MaqNombre, r2.Estado,
               r2.Usuario, u.UsuNombre AS UsuarioNombre, r2.FechaCat
        FROM RelSiloBlend2 r2
        LEFT JOIN Maquina m ON r2.MaqCodigo = m.MaqCodigo
        LEFT JOIN Usuario u ON r2.Usuario = u.legajo
        WHERE r2.NroRelacion = ? AND r2.Iten = ?
      `;
      db.get(sql, [nroRelacion, iten], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  // Crear una nueva máquina asociada
  createDetalleMaquina: (detalleMaquinaData) => {
    return new Promise((resolve, reject) => {
      const { NroRelacion, Iten, MaqCodigo, Estado, Usuario, FechaCat } = detalleMaquinaData;
      const sql = `
        INSERT INTO RelSiloBlend2 (NroRelacion, Iten, MaqCodigo, Estado, Usuario, FechaCat)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const params = [
        NroRelacion,
        Iten,
        MaqCodigo,
        Estado || 'Activo',
        Usuario,
        FechaCat
      ];
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ message: "✅ Máquina asociada registrada correctamente", changes: this.changes });
      });
    });
  },

  // Eliminar una máquina asociada
  deleteDetalleMaquina: (nroRelacion, iten) => {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM RelSiloBlend2 WHERE NroRelacion = ? AND Iten = ?`;
      db.run(sql, [nroRelacion, iten], function (err) {
        if (err) reject(err);
        else resolve({ message: "🗑️ Máquina asociada eliminada correctamente", changes: this.changes });
      });
    });
  },
};

module.exports = detalleMaquinaRepository;
