// backend/src/repositories/productRepository.js
const db = require('../database'); // Importa la instancia de la base de datos

const productRepository = {
  // Obtener todos los productos con opción de ordenamiento
  getAllProducts: (sortBy = 'ProdCodigo', order = 'ASC') => {
    return new Promise((resolve, reject) => {
      // Lista blanca de columnas permitidas para ordenar (para seguridad)
      // Asegurarse de que los nombres de las columnas aquí coincidan con los nombres de las columnas en la tabla Producto
      // o los aliases de las columnas unidas si se quiere ordenar por ellas.
      const allowedSortColumns = [
        'p.ProdCodigo', 'p.TipProdCodigo', 'p.ProdNombre', 'p.Estado', 'p.Stock', 'p.HorasCura',
        'p.Usuario', 'p.FechaCat', 'tp.TipProdNombre', 'u.UsuNombre' // Añadidos aliases de tablas unidas
      ];
      const allowedOrderDirections = ['ASC', 'DESC'];

      // Validar sortBy
      // Si el sortBy no está calificado (ej. 'ProdCodigo' en lugar de 'p.ProdCodigo'), lo calificamos por defecto a 'p.'
      if (!sortBy.includes('.')) {
        sortBy = `p.${sortBy}`;
      }
      if (!allowedSortColumns.includes(sortBy)) {
        sortBy = 'p.ProdCodigo'; // Valor por defecto si la columna no es válida o no está en la lista blanca
      }
      
      // Validar order
      if (!allowedOrderDirections.includes(order.toUpperCase())) {
        order = 'ASC'; // Valor por defecto si la dirección no es válida
      }

      const sql = `
        SELECT p.ProdCodigo, p.TipProdCodigo, p.ProdNombre, p.Estado, p.Stock, p.HorasCura,
               p.Usuario, u.UsuNombre AS UsuarioNombre, p.FechaCat,
               tp.TipProdNombre
        FROM Producto p
        LEFT JOIN TipoProducto tp ON p.TipProdCodigo = tp.TipProdCodigo
        LEFT JOIN Usuario u ON p.Usuario = u.legajo
        ORDER BY ${sortBy} ${order} -- ✅ Cláusula ORDER BY dinámica con columnas calificadas
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

  // Obtener un producto por código
  getProductByCode: (prodCodigo) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT p.ProdCodigo, p.TipProdCodigo, p.ProdNombre, p.Estado, p.Stock, p.HorasCura,
               p.Usuario, u.UsuNombre AS UsuarioNombre, p.FechaCat,
               tp.TipProdNombre
        FROM Producto p
        LEFT JOIN TipoProducto tp ON p.TipProdCodigo = tp.TipProdCodigo
        LEFT JOIN Usuario u ON p.Usuario = u.legajo
        WHERE p.ProdCodigo = ?
      `;
      db.get(sql, [prodCodigo], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  // Crear un nuevo producto
  createProduct: (productData) => {
    return new Promise((resolve, reject) => {
      const { TipProdCodigo, ProdNombre, Estado, Stock, HorasCura, Usuario, FechaCat } = productData;

      // Generar un nuevo ProdCodigo
      db.get(`SELECT ProdCodigo FROM Producto ORDER BY ProdCodigo DESC LIMIT 1`, (err, row) => {
        if (err) return reject(err);

        let newCode = 'pr001';
        if (row?.ProdCodigo) {
          const num = parseInt(row.ProdCodigo.replace('pr', '')) + 1;
          newCode = 'pr' + num.toString().padStart(3, '0');
        }

        const sql = `
          INSERT INTO Producto (ProdCodigo, TipProdCodigo, ProdNombre, Estado, Stock, HorasCura, Usuario, FechaCat)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
          newCode,
          TipProdCodigo,
          ProdNombre,
          Estado || 'Activo', // Valor por defecto
          Stock || 0,         // Valor por defecto
          HorasCura || 0,     // Valor por defecto
          Usuario,
          FechaCat
        ];

        db.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ message: "✅ Producto registrado correctamente", ProdCodigo: newCode });
        });
      });
    });
  },

  // Actualizar un producto existente
  updateProduct: (prodCodigo, productData) => {
    return new Promise((resolve, reject) => {
      const { TipProdCodigo, ProdNombre, Estado, Stock, HorasCura } = productData;
      const sql = `
        UPDATE Producto
        SET TipProdCodigo = ?, ProdNombre = ?, Estado = ?, Stock = ?, HorasCura = ?
        WHERE ProdCodigo = ?
      `;
      const params = [
        TipProdCodigo,
        ProdNombre,
        Estado,
        Stock,
        HorasCura,
        prodCodigo
      ];
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ message: "✅ Producto actualizado correctamente", changes: this.changes });
      });
    });
  },

  // Eliminar un producto
  deleteProduct: (prodCodigo) => {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM Producto WHERE ProdCodigo = ?`;
      db.run(sql, [prodCodigo], function (err) {
        if (err) reject(err);
        else resolve({ message: "🗑️ Producto eliminado correctamente", changes: this.changes });
      });
    });
  },

  // Obtener productos con stock bajo (para el dashboard)
  getLowStockProducts: () => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT COUNT(*) AS count FROM Producto WHERE Estado = 'Activo' AND Stock < 10`; // Ajusta el umbral según tu necesidad
      db.get(sql, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Obtener el stock total de productos (para el dashboard)
  getTotalProductStock: () => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT SUM(Stock) AS totalStock FROM Producto`;
      db.get(sql, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
};

module.exports = productRepository;
