// backend/src/repositories/exitRepository.js
const db = require('../database'); // Importa la instancia de la base de datos

const exitRepository = {
  // Obtener todas las salidas (todos los ítems de todas las salidas) con opción de ordenamiento
  getAllExits: (sortBy = 'SalNumero', order = 'DESC') => {
    return new Promise((resolve, reject) => {
      // Lista blanca de columnas permitidas para ordenar (para seguridad)
      const allowedSortColumns = [
        's.SalNumero', 's.NroRelacion', 'r.Corte', 's.Estado',
        's.Usuario', 'u.UsuNombre', 's.FechaCat'
      ];
      const allowedOrderDirections = ['ASC', 'DESC'];

      // Validar sortBy: Si el sortBy no está calificado, lo calificamos
      let qualifiedSortBy = sortBy;
      if (!sortBy.includes('.')) {
        if (sortBy === 'RelCorte') { // Alias para el corte de la relación
          qualifiedSortBy = 'r.Corte';
        } else if (sortBy === 'UsuarioNombre') {
          qualifiedSortBy = 'u.UsuNombre';
        } else {
          qualifiedSortBy = `s.${sortBy}`; // Por defecto, calificar con el alias de la tabla Salida
        }
      }
      if (!allowedSortColumns.includes(qualifiedSortBy)) {
        qualifiedSortBy = 's.SalNumero'; // Valor por defecto si la columna no es válida
      }
      
      // Validar order
      if (!allowedOrderDirections.includes(order.toUpperCase())) {
        order = 'DESC'; // Valor por defecto si la dirección no es válida
      }

      // La consulta SQL sigue incluyendo el ORDER BY para una primera pasada de ordenamiento,
      // pero el ordenamiento final se aplicará en JavaScript después de la agrupación.
      const sql = `
        SELECT s.SalNumero, s.Iten, s.NroRelacion, r.Corte AS RelCorte,
               s.ProdCodigo, p.ProdNombre AS ProdNombre, tp.TipProdNombre AS TipProdNombre,
               s.Corte AS SalidaCorte, s.Serie, s.Cantidad,
               s.Usuario, u.UsuNombre AS UsuarioNombre, s.FechaCat, s.Estado
        FROM Salida s
        LEFT JOIN Producto p ON s.ProdCodigo = p.ProdCodigo
        LEFT JOIN TipoProducto tp ON p.TipProdCodigo = tp.TipProdCodigo
        LEFT JOIN RelSiloBlend1 r ON s.NroRelacion = r.NroRelacion
        LEFT JOIN Usuario u ON s.Usuario = u.legajo
        ORDER BY ${qualifiedSortBy} ${order}, s.Iten ASC
      `;
      
      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const groupedExits = {};
          rows.forEach(row => {
            if (!groupedExits[row.SalNumero]) {
              groupedExits[row.SalNumero] = {
                SalNumero: row.SalNumero,
                NroRelacion: row.NroRelacion,
                RelCorte: row.RelCorte,
                Usuario: row.Usuario,
                UsuarioNombre: row.UsuarioNombre,
                FechaCat: row.FechaCat,
                Estado: row.Estado,
                items: []
              };
            }
            groupedExits[row.SalNumero].items.push({
              Iten: row.Iten,
              ProdCodigo: row.ProdCodigo,
              ProdNombre: row.ProdNombre,
              TipProdNombre: row.TipProdNombre,
              Corte: row.SalidaCorte,
              Serie: row.Serie,
              Cantidad: row.Cantidad,
            });
          });

          let finalSortedExits = Object.values(groupedExits);

          // ✅ APLICAR ORDENAMIENTO FINAL EN JAVASCRIPT
          finalSortedExits.sort((a, b) => {
            let valA, valB;

            // Determinar los valores a comparar según la columna de ordenamiento
            switch (sortBy) {
              case 'SalNumero':
                valA = a.SalNumero;
                valB = b.SalNumero;
                break;
              case 'NroRelacion':
                valA = a.NroRelacion;
                valB = b.NroRelacion;
                break;
              case 'RelCorte':
                valA = a.RelCorte;
                valB = b.RelCorte;
                break;
              case 'Estado':
                valA = a.Estado;
                valB = b.Estado;
                break;
              case 'Usuario':
              case 'UsuarioNombre': // Si UsuarioNombre se ordena por el nombre
                valA = a.UsuarioNombre || a.Usuario;
                valB = b.UsuarioNombre || b.Usuario;
                break;
              case 'FechaCat':
                valA = new Date(a.FechaCat);
                valB = new Date(b.FechaCat);
                break;
              default:
                // Por defecto, ordenar por SalNumero si la columna no es reconocida
                valA = a.SalNumero;
                valB = b.SalNumero;
            }

            // Comparar valores
            if (valA < valB) {
              return order === 'ASC' ? -1 : 1;
            }
            if (valA > valB) {
              return order === 'ASC' ? 1 : -1;
            }
            return 0; // Son iguales
          });

          resolve(finalSortedExits);
        }
      });
    });
  },

  // Obtener una salida específica (todos sus ítems) por SalNumero
  getExitByNumber: (salNumero) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT s.SalNumero, s.Iten, s.NroRelacion, r.Corte AS RelCorte,
               s.ProdCodigo, p.ProdNombre AS ProdNombre, tp.TipProdNombre AS TipProdNombre,
               s.Corte AS SalidaCorte, s.Serie, s.Cantidad,
               s.Usuario, u.UsuNombre AS UsuarioNombre, s.FechaCat, s.Estado
        FROM Salida s
        LEFT JOIN Producto p ON s.ProdCodigo = p.ProdCodigo
        LEFT JOIN TipoProducto tp ON p.TipProdCodigo = tp.TipProdCodigo
        LEFT JOIN RelSiloBlend1 r ON s.NroRelacion = r.NroRelacion
        LEFT JOIN Usuario u ON s.Usuario = u.legajo
        WHERE s.SalNumero = ?
        ORDER BY s.Iten ASC
      `;
      db.all(sql, [salNumero], (err, rows) => {
        if (err) {
          reject(err);
        } else if (rows.length === 0) {
          resolve(null); // No se encontró la salida
        } else {
          const header = {
            SalNumero: rows[0].SalNumero,
            NroRelacion: rows[0].NroRelacion,
            RelCorte: rows[0].RelCorte,
            Usuario: rows[0].Usuario,
            UsuarioNombre: rows[0].UsuarioNombre,
            FechaCat: rows[0].FechaCat,
            Estado: rows[0].Estado,
            items: rows.map(row => ({
              Iten: row.Iten,
              ProdCodigo: row.ProdCodigo,
              ProdNombre: row.ProdNombre,
              TipProdNombre: row.TipProdNombre,
              Corte: row.SalidaCorte,
              Serie: row.Serie,
              Cantidad: row.Cantidad,
            }))
          };
          resolve(header);
        }
      });
    });
  },

  // Crear una nueva salida (múltiples ítems en una transacción)
  createExit: (exitData) => {
    return new Promise((resolve, reject) => {
      const { NroRelacion, Usuario, FechaCat, Estado, items } = exitData;

      db.serialize(() => {
        db.run("BEGIN TRANSACTION;");

        // Obtener el siguiente SalNumero
        db.get(`SELECT SalNumero FROM Salida ORDER BY SalNumero DESC LIMIT 1`, (err, row) => {
          if (err) {
            db.run("ROLLBACK;");
            return reject(err);
          }

          let nextSalNumero = 1;
          if (row && row.SalNumero) {
            nextSalNumero = row.SalNumero + 1;
          }

          const insertPromises = items.map((item, index) => {
            return new Promise((resolveItem, rejectItem) => {
              // Primero, verificar si hay suficiente stock
              db.get(`SELECT Stock FROM Producto WHERE ProdCodigo = ?`, [item.ProdCodigo], (err, stockRow) => {
                if (err) {
                  return rejectItem(err);
                }
                if (!stockRow || stockRow.Stock < item.Cantidad) {
                  return rejectItem(new Error(`Stock insuficiente para el producto ${item.ProdCodigo}. Stock actual: ${stockRow ? stockRow.Stock : 0}, Cantidad solicitada: ${item.Cantidad}`));
                }

                const sql = `
                  INSERT INTO Salida (SalNumero, Iten, NroRelacion, ProdCodigo, Corte, Serie, Cantidad, Usuario, FechaCat, Estado)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const params = [
                  nextSalNumero,
                  index + 1, // Iten
                  NroRelacion,
                  item.ProdCodigo,
                  item.Corte, // Corte del ítem de salida
                  item.Serie,
                  item.Cantidad,
                  Usuario,
                  FechaCat,
                  Estado || 'Activo'
                ];

                db.run(sql, params, function (err) {
                  if (err) rejectItem(err);
                  else {
                    // Actualizar Stock del producto en la tabla Producto (restar)
                    const updateStockSql = `
                      UPDATE Producto
                      SET Stock = Stock - ?
                      WHERE ProdCodigo = ?
                    `;
                    db.run(updateStockSql, [item.Cantidad, item.ProdCodigo], function(err) {
                      if (err) rejectItem(err);
                      else resolveItem();
                    });
                  }
                });
              });
            });
          });

          Promise.all(insertPromises)
            .then(() => {
              db.run("COMMIT;", (commitErr) => {
                if (commitErr) {
                  db.run("ROLLBACK;");
                  return reject(commitErr);
                }
                resolve({ message: "✅ Salida y detalles registrados correctamente", SalNumero: nextSalNumero });
              });
            })
            .catch(detailErr => {
              db.run("ROLLBACK;");
              reject(detailErr);
            });
        });
      });
    });
  },

  // Obtener el conteo de salidas este mes (para el dashboard)
  getMonthlyExitsCount: () => {
    return new Promise((resolve, reject) => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0'); // Mes actual (01-12)
      const firstDayOfMonth = `${year}-${month}-01`;
      const lastDayOfMonth = `${year}-${month}-${new Date(year, now.getMonth() + 1, 0).getDate()}`; // Último día del mes

      const sql = `
        SELECT COUNT(DISTINCT SalNumero) AS count -- Contar SalNumero únicos para las salidas
        FROM Salida
        WHERE FechaCat BETWEEN ? AND ?
      `;
      db.get(sql, [firstDayOfMonth, lastDayOfMonth], (err, row) => {
        if (err) reject(err);
        else resolve(row); // Devolverá { count: X }
      });
    });
  },
};

module.exports = exitRepository;
