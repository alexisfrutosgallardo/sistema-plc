// backend/src/repositories/typeProductRepository.js
const db = require('../database'); // Importa la instancia de la base de datos

const typeProductRepository = {
  // Obtener todos los tipos de producto con opción de ordenamiento
  getAllTypeProducts: (sortBy = 'TipProdCodigo', order = 'ASC') => { // ✅ Añadidos parámetros de ordenamiento
    return new Promise((resolve, reject) => {
      // ✅ Lista blanca de columnas permitidas para ordenar (para seguridad)
      // Asegurarse de que los nombres de las columnas aquí coincidan con los nombres de las columnas en la tabla TipoProducto
      // o los aliases de las columnas unidas si se quiere ordenar por ellas.
      const allowedSortColumns = [
        'tp.TipProdCodigo', 'tp.TipProdNombre', 'tp.Usuario', 'tp.FechaCat', 'u.UsuNombre'
      ];
      const allowedOrderDirections = ['ASC', 'DESC'];

      // Validar sortBy: Si el sortBy no está calificado (ej. 'Usuario' en lugar de 'tp.Usuario'), lo calificamos por defecto a 'tp.'
      let qualifiedSortBy = sortBy;
      if (!sortBy.includes('.')) {
        if (sortBy === 'UsuarioNombre') { // Si se quiere ordenar por el nombre del usuario unido
          qualifiedSortBy = 'u.UsuNombre';
        } else {
          qualifiedSortBy = `tp.${sortBy}`; // Por defecto, calificar con el alias de la tabla TipoProducto
        }
      }
      if (!allowedSortColumns.includes(qualifiedSortBy)) {
        qualifiedSortBy = 'tp.TipProdCodigo'; // Valor por defecto si la columna no es válida o no está en la lista blanca
      }
      
      // Validar order
      if (!allowedOrderDirections.includes(order.toUpperCase())) {
        order = 'ASC'; // Valor por defecto si la dirección no es válida
      }

      const sql = `
        SELECT tp.TipProdCodigo, tp.TipProdNombre,
               tp.Usuario, u.UsuNombre AS UsuarioNombre, tp.FechaCat
        FROM TipoProducto tp
        LEFT JOIN Usuario u ON tp.Usuario = u.legajo
        ORDER BY ${qualifiedSortBy} ${order} -- ✅ Cláusula ORDER BY dinámica con columnas calificadas
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

  // Obtener un tipo de producto por código
  getTypeProductByCode: (tipProdCodigo) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT tp.TipProdCodigo, tp.TipProdNombre,
               tp.Usuario, u.UsuNombre AS UsuarioNombre, tp.FechaCat
        FROM TipoProducto tp
        LEFT JOIN Usuario u ON tp.Usuario = u.legajo
        WHERE tp.TipProdCodigo = ?
      `;
      db.get(sql, [tipProdCodigo], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  // Crear un nuevo tipo de producto
  createTypeProduct: (typeProductData) => {
    return new Promise((resolve, reject) => {
      const { TipProdNombre, Usuario, FechaCat } = typeProductData;

      db.get(`SELECT TipProdCodigo FROM TipoProducto ORDER BY TipProdCodigo DESC LIMIT 1`, (err, row) => {
        if (err) return reject(err);

        let newCode = (row?.TipProdCodigo || 0) + 1;

        const sql = `
          INSERT INTO TipoProducto (TipProdCodigo, TipProdNombre, Usuario, FechaCat)
          VALUES (?, ?, ?, ?)
        `;
        const params = [
          newCode,
          TipProdNombre,
          Usuario,
          FechaCat
        ];

        db.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ message: "✅ Tipo de producto registrado correctamente", TipProdCodigo: newCode });
        });
      });
    });
  },

  // Actualizar un tipo de producto existente
  updateTypeProduct: (tipProdCodigo, typeProductData) => {
    return new Promise((resolve, reject) => {
      const { TipProdNombre } = typeProductData;
      const sql = `
        UPDATE TipoProducto
        SET TipProdNombre = ?
        WHERE TipProdCodigo = ?
      `;
      const params = [
        TipProdNombre,
        tipProdCodigo
      ];
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ message: "✅ Tipo de producto actualizado correctamente", changes: this.changes });
      });
    });
  },

  // Eliminar un tipo de producto
  deleteTypeProduct: (tipProdCodigo) => {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM TipoProducto WHERE TipProdCodigo = ?`;
      db.run(sql, [tipProdCodigo], function (err) {
        if (err) reject(err);
        else resolve({ message: "🗑️ Tipo de producto eliminado correctamente", changes: this.changes });
      });
    });
  },
};

module.exports = typeProductRepository;
