// backend/src/repositories/relSiloBlendRepository.js
const db = require('../database'); // Importa la instancia de la base de datos

const relSiloBlendRepository = {
  // Obtener todas las relaciones RelSiloBlend con opción de ordenamiento
  getAllRelSiloBlend: (sortBy = 'NroRelacion', order = 'DESC') => {
    return new Promise((resolve, reject) => {
      // Lista blanca de columnas permitidas para ordenar (para seguridad)
      const allowedSortColumns = [
        'r1.NroRelacion', 'r1.ProdCodigo', 'p.ProdNombre', 'r1.SiloCodigo',
        's.SiloNombre', 'r1.Corte', 'r1.Estado', 'r1.Usuario', 'u.UsuNombre', 'r1.FechaCat'
      ];
      const allowedOrderDirections = ['ASC', 'DESC'];

      // Validar sortBy: Si el sortBy no está calificado, lo calificamos
      let qualifiedSortBy = sortBy;
      if (!sortBy.includes('.')) {
        if (sortBy === 'ProdNombre') {
          qualifiedSortBy = 'p.ProdNombre';
        } else if (sortBy === 'SiloNombre') {
          qualifiedSortBy = 's.SiloNombre';
        } else if (sortBy === 'UsuarioNombre') {
          qualifiedSortBy = 'u.UsuNombre';
        } else {
          qualifiedSortBy = `r1.${sortBy}`; // Por defecto, calificar con el alias de la tabla RelSiloBlend1
        }
      }
      if (!allowedSortColumns.includes(qualifiedSortBy)) {
        qualifiedSortBy = 'r1.NroRelacion'; // Valor por defecto si la columna no es válida
      }
      
      // Validar order
      if (!allowedOrderDirections.includes(order.toUpperCase())) {
        order = 'DESC'; // Valor por defecto si la dirección no es válida
      }

      const sql = `
        SELECT r1.NroRelacion, r1.ProdCodigo, p.ProdNombre AS ProdNombre, r1.SiloCodigo, s.SiloNombre AS SiloNombre,
               r1.Corte, r1.Estado, r1.Usuario, u.UsuNombre AS UsuarioNombre, r1.FechaCat
        FROM RelSiloBlend1 r1
        LEFT JOIN Producto p ON r1.ProdCodigo = p.ProdCodigo
        LEFT JOIN Silo s ON r1.SiloCodigo = s.SiloCodigo
        LEFT JOIN Usuario u ON r1.Usuario = u.legajo
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

  // Obtener una relación RelSiloBlend por NroRelacion
  getRelSiloBlendByNroRelacion: (nroRelacion) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT r1.NroRelacion, r1.ProdCodigo, p.ProdNombre AS ProdNombre, r1.SiloCodigo, s.SiloNombre AS SiloNombre,
               r1.Corte, r1.Estado, r1.Usuario, u.UsuNombre AS UsuarioNombre, r1.FechaCat
        FROM RelSiloBlend1 r1
        LEFT JOIN Producto p ON r1.ProdCodigo = p.ProdCodigo
        LEFT JOIN Silo s ON r1.SiloCodigo = s.SiloCodigo
        LEFT JOIN Usuario u ON r1.Usuario = u.legajo
        WHERE r1.NroRelacion = ?
      `;
      db.get(sql, [nroRelacion], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  // Crear una nueva relación RelSiloBlend
  createRelSiloBlend: (relData) => {
    return new Promise((resolve, reject) => {
      const { ProdCodigo, SiloCodigo, Corte, Estado, Usuario, FechaCat } = relData;

      // Generar el siguiente NroRelacion
      db.get(`SELECT NroRelacion FROM RelSiloBlend1 ORDER BY NroRelacion DESC LIMIT 1`, (err, row) => {
        if (err) return reject(err);

        let nextNroRelacion = 1;
        if (row && row.NroRelacion) {
          nextNroRelacion = row.NroRelacion + 1;
        }

        const sql = `
          INSERT INTO RelSiloBlend1 (NroRelacion, ProdCodigo, SiloCodigo, Corte, Estado, Usuario, FechaCat)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
          nextNroRelacion,
          ProdCodigo,
          SiloCodigo,
          Corte,
          Estado || 'Activo', // Valor por defecto
          Usuario,
          FechaCat
        ];

        db.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ message: "✅ Relación Silo-Blend registrada correctamente", NroRelacion: nextNroRelacion });
        });
      });
    });
  },

  // Actualizar una relación RelSiloBlend existente
  updateRelSiloBlend: (nroRelacion, relData) => {
    return new Promise((resolve, reject) => {
      const { ProdCodigo, SiloCodigo, Corte, Estado } = relData;
      const sql = `
        UPDATE RelSiloBlend1
        SET ProdCodigo = ?, SiloCodigo = ?, Corte = ?, Estado = ?
        WHERE NroRelacion = ?
      `;
      const params = [
        ProdCodigo,
        SiloCodigo,
        Corte,
        Estado,
        nroRelacion
      ];
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ message: "✅ Relación Silo-Blend actualizada correctamente", changes: this.changes });
      });
    });
  },

  // Eliminar una relación RelSiloBlend
  deleteRelSiloBlend: (nroRelacion) => {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM RelSiloBlend1 WHERE NroRelacion = ?`;
      db.run(sql, [nroRelacion], function (err) {
        if (err) reject(err);
        else resolve({ message: "🗑️ Relación Silo-Blend eliminada correctamente", changes: this.changes });
      });
    });
  },


  // ✅ NUEVA FUNCIÓN: Actualizar el estado de una relación Silo-Blend
  updateRelSiloBlendEstado: (nroRelacion, nuevoEstado) => {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE RelSiloBlend1
        SET Estado = ?
        WHERE NroRelacion = ?
      `;
      db.run(sql, [nuevoEstado, nroRelacion], function (err) {
        if (err) {
          console.error("❌ Error al actualizar estado de relación Silo-Blend:", err);
          reject(err);
        } else {
          resolve({ message: "✅ Estado de relación Silo-Blend actualizado correctamente", changes: this.changes });
        }
      });
    });
  },


};

module.exports = relSiloBlendRepository;
