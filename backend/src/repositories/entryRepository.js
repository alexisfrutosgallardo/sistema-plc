// backend/src/repositories/entryRepository.js
const db = require('../database'); // Importa la instancia de la base de datos

const entryRepository = {
  // Obtener todas las entradas (cabecera) con nombres de usuario y producto
  getAllEntries: (sortBy = 'EntNumero', order = 'DESC') => {
    return new Promise((resolve, reject) => {
      // ✅ Modificado: Incluye JOINs para obtener UsuarioNombre, ProdPrincipalNombre y TipProdNombre
      const sql = `
        SELECT
          e.EntNumero,
          e.Fecha,
          e.NroCorte,
          e.Estado,
          e.Comentario,
          e.FechaCat,
          e.Usuario,
          e.ProdCodigo,
          u.UsuNombre AS UsuarioNombre,
          p.ProdNombre AS ProdPrincipalNombre,
          tp.TipProdNombre AS ProdPrincipalTipoNombre
        FROM Entrada1 e
        LEFT JOIN Usuario u ON e.Usuario = u.legajo
        LEFT JOIN Producto p ON e.ProdCodigo = p.ProdCodigo
        LEFT JOIN TipoProducto tp ON p.TipProdCodigo = tp.TipProdCodigo
        ORDER BY ${sortBy} ${order}
      `;
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Obtener una entrada (cabecera) por su número
  getEntryByNumber: (entNumero) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT e.EntNumero, e.Fecha, e.NroCorte, e.Estado, e.Comentario, e.FechaCat, e.Usuario, e.ProdCodigo,
              u.UsuNombre AS UsuarioNombre,
              p.ProdNombre AS ProdPrincipalNombre, tp.TipProdNombre AS ProdPrincipalTipoNombre
        FROM Entrada1 e
        LEFT JOIN Usuario u ON e.Usuario = u.legajo
        LEFT JOIN Producto p ON e.ProdCodigo = p.ProdCodigo
        LEFT JOIN TipoProducto tp ON p.TipProdCodigo = tp.TipProdCodigo
        WHERE e.EntNumero = ?
      `;
      db.get(sql, [entNumero], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });
  },

  // Obtener detalles de una entrada por número
  getEntryDetails: (entNumero) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT ed.*, p.ProdNombre, tp.TipProdNombre
        FROM Entrada2 ed
        LEFT JOIN Producto p ON ed.ProdCodigo = p.ProdCodigo
        LEFT JOIN TipoProducto tp ON p.TipProdCodigo = tp.TipProdCodigo
        WHERE ed.EntNumero = ?
        ORDER BY ed.Iten
      `;
      db.all(sql, [entNumero], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Obtener el próximo EntNumero disponible
  getNextEntNumero: () => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT MAX(EntNumero) as maxEntNumero FROM Entrada1`;
      db.get(sql, [], (err, row) => {
        if (err) {
          return reject(err);
        }
        const nextEntNumero = (row && row.maxEntNumero) ? row.maxEntNumero + 1 : 1;
        resolve(nextEntNumero);
      });
    });
  },

  // Obtener la última serie registrada en Entrada2 (global)
  getLatestDetailSerie: () => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT MAX(CAST(Serie AS INTEGER)) as maxSerie FROM Entrada2`;
      db.get(sql, [], (err, row) => {
        if (err) {
          return reject(err);
        }
        const maxSerie = (row && row.maxSerie) ? row.maxSerie : 0;
        resolve(maxSerie);
      });
    });
  },

  // Crear una nueva entrada (cabecera y detalles con serie incremental)
  createEntry: (entryData) => {
    return new Promise((resolve, reject) => {
      const { Fecha, NroCorte, Estado, Comentario, Usuario, FechaCat, ProdCodigo, productosSeleccionados } = entryData;

      db.serialize(async () => {
        db.run("BEGIN TRANSACTION;");

        db.get(`SELECT EntNumero FROM Entrada1 ORDER BY EntNumero DESC LIMIT 1`, async (err, row) => {
          if (err) {
            db.run("ROLLBACK;");
            return reject(err);
          }

          let nextEntNumero = row && row.EntNumero ? row.EntNumero + 1 : 1;

          const sql1 = `
            INSERT INTO Entrada1 (EntNumero, Fecha, NroCorte, Estado, Comentario, Usuario, FechaCat, ProdCodigo, FechaCura)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          const params1 = [
            nextEntNumero,
            Fecha,
            NroCorte,
            Estado || 'Abierto',
            Comentario,
            Usuario,
            FechaCat,
            ProdCodigo,
            entryData.FechaCura
          ];

          db.run(sql1, params1, async function (err) {
            if (err) {
              db.run("ROLLBACK;");
              return reject(err);
            }

            try {
              // No obtenemos la última serie aquí, ya que el frontend la envía
              const entNumeroInsertado = nextEntNumero;

              for (let i = 0; i < productosSeleccionados.length; i++) {
                const prod = productosSeleccionados[i];
                // La serie ya viene del frontend, la usamos directamente
                const serieToUse = prod.Serie;

                const sql2 = `
                  INSERT INTO Entrada2 (EntNumero, Iten, ProdCodigo, Serie, Cantidad, Fecha, FechaCura, FechaIngr, Estado, Usuario, FechaCat)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const params2 = [
                  entNumeroInsertado,
                  i + 1,
                  prod.ProdCodigo,
                  serieToUse,
                  prod.Cantidad,
                  prod.Fecha,
                  prod.FechaCura,
                  prod.FechaIngr,
                  prod.Estado || 'Activo',
                  Usuario, // ✅ Asegura que el usuario de la cabecera se use en el detalle
                  FechaCat
                ];

                await new Promise((resolveInsert, rejectInsert) => {
                  db.run(sql2, params2, function (err) {
                    if (err) return rejectInsert(err);

                    const updateStockSql = `
                      UPDATE Producto
                      SET Stock = Stock + ?
                      WHERE ProdCodigo = ?
                    `;
                    db.run(updateStockSql, [prod.Cantidad, prod.ProdCodigo], function (err) {
                      if (err) rejectInsert(err);
                      else resolveInsert();
                    });
                  });
                });
              }

              db.run("COMMIT;", (commitErr) => {
                if (commitErr) {
                  db.run("ROLLBACK;");
                  return reject(commitErr);
                }
                resolve({
                  message: "✅ Entrada y detalles registrados correctamente",
                  EntNumero: entNumeroInsertado,
                  NroCorte: NroCorte
                });
              });
            } catch (errFinal) {
              db.run("ROLLBACK;");
              reject(errFinal);
            }
          });
        });
      });
    });
  },

  // Insertar o actualizar la serie (sobrescribir el único registro)
  insertarNuevaSerie: () => {
    return new Promise((resolve, reject) => {
      const updateSQL = `UPDATE Parametro SET serie = serie + 1 WHERE id = 1`;
      db.run(updateSQL, function (err) {
        if (err) {
          return reject(err);
        }

        const selectSQL = `SELECT serie FROM Parametro WHERE id = 1`;
        db.get(selectSQL, (err, row) => {
          if (err) {
            return reject(err);
          }
          resolve(row.serie);  // Retorna el nuevo valor de serie
        });
      });
    });
  },


  getLatestEntries: (limit = 5) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM Entrada1 ORDER BY EntNumero DESC LIMIT ?`;
      db.all(sql, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Verificar si un NroCorte ya existe en Entrada1
  checkNroCorteExists: (nroCorte) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT COUNT(*) AS count FROM Entrada1 WHERE NroCorte = ?`;
      db.get(sql, [nroCorte], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count > 0);
        }
      });
    });
  },

  // Eliminar una entrada (cabecera y detalles)
  deleteEntry: (entNumero) => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION;", (beginErr) => {
          if (beginErr) {
            return reject(beginErr);
          }

          // Eliminar detalles de Entrada2
          const sqlDeleteDetails = `DELETE FROM Entrada2 WHERE EntNumero = ?`;
          db.run(sqlDeleteDetails, [entNumero], function (err) {
            if (err) {
              db.run("ROLLBACK;", () => reject(err));
              return;
            }

            // Eliminar cabecera de Entrada1
            const sqlDeleteEntry = `DELETE FROM Entrada1 WHERE EntNumero = ?`;
            db.run(sqlDeleteEntry, [entNumero], function (err) {
              if (err) {
                db.run("ROLLBACK;", () => reject(err));
                return;
              }
              db.run("COMMIT;", (commitErr) => {
                if (commitErr) {
                  db.run("ROLLBACK;");
                  return reject(commitErr);
                }
                resolve({ message: "✅ Entrada eliminada correctamente", changes: this.changes });
              });
            });
          });
        });
      });
    });
  },
};

module.exports = entryRepository;
