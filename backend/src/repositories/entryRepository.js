// backend/src/repositories/entryRepository.js
const db = require('../database'); // Importa la instancia de la base de datos

const entryRepository = {
  // Obtener todas las entradas (cabecera) con opción de ordenamiento y filtrado por estado
  getAllEntries: (sortBy = 'EntNumero', order = 'DESC', estado = null) => {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT
          e.EntNumero,
          e.Fecha,
          e.NroCorte,
          e.Estado,
          e.Comentario,
          e.FechaCat,
          e.Usuario,
          e.ProdCodigo,
          e.FechaCura,
          e.TieneDetalles, -- Incluir la nueva columna
          u.UsuNombre AS UsuarioNombre,
          p.ProdNombre AS ProdPrincipalNombre,
          tp.TipProdNombre AS ProdPrincipalTipoNombre
        FROM Entrada1 e
        LEFT JOIN Usuario u ON e.Usuario = u.legajo
        LEFT JOIN Producto p ON e.ProdCodigo = p.ProdCodigo
        LEFT JOIN TipoProducto tp ON p.TipProdCodigo = tp.TipProdCodigo
      `;
      const params = [];

      if (estado) {
        sql += ` WHERE e.Estado = ?`;
        params.push(estado);
      }

      // Lista blanca de columnas permitidas para ordenar (para seguridad)
      const allowedSortColumns = [
        'e.EntNumero', 'e.Fecha', 'e.NroCorte', 'e.Estado', 'e.Comentario',
        'e.FechaCat', 'e.Usuario', 'e.ProdCodigo',
        'u.UsuNombre', 'p.ProdNombre', 'tp.TipProdNombre'
      ];
      let qualifiedSortBy = sortBy;
      if (!sortBy.includes('.')) {
        if (sortBy === 'UsuarioNombre') {
          qualifiedSortBy = 'u.UsuNombre';
        } else if (sortBy === 'ProdPrincipalNombre') {
          qualifiedSortBy = 'p.ProdNombre';
        } else if (sortBy === 'ProdPrincipalTipoNombre') {
          qualifiedSortBy = 'tp.TipProdNombre';
        } else {
          qualifiedSortBy = `e.${sortBy}`;
        }
      }
      if (!allowedSortColumns.includes(qualifiedSortBy)) {
        qualifiedSortBy = 'e.EntNumero'; // Default seguro
      }
      const allowedOrderDirections = ['ASC', 'DESC'];
      if (!allowedOrderDirections.includes(order.toUpperCase())) {
        order = 'DESC'; // Default seguro
      }

      sql += ` ORDER BY ${qualifiedSortBy} ${order}`;

      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Obtener una entrada (cabecera) por su número
  getEntryByNumber: (entNumero) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT e.EntNumero, e.Fecha, e.NroCorte, e.Estado, e.Comentario, e.FechaCat, e.Usuario, e.ProdCodigo, e.FechaCura, e.TieneDetalles,
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

  // Obtener la única entrada con estado 'Abierto'
  getSingleOpenEntry: () => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT e.EntNumero, e.Fecha, e.NroCorte, e.Estado, e.Comentario, e.FechaCat, e.Usuario, e.ProdCodigo, e.FechaCura, e.TieneDetalles,
               u.UsuNombre AS UsuarioNombre,
               p.ProdNombre AS ProdPrincipalNombre, tp.TipProdNombre AS ProdPrincipalTipoNombre
        FROM Entrada1 e
        LEFT JOIN Usuario u ON e.Usuario = u.legajo
        LEFT JOIN Producto p ON e.ProdCodigo = p.ProdCodigo
        LEFT JOIN TipoProducto tp ON p.TipProdCodigo = tp.TipProdCodigo
        WHERE e.Estado = 'Abierto'
        LIMIT 1
      `;
      db.get(sql, [], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row); // Retorna null si no hay ninguna entrada abierta
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

  // Crear una nueva entrada (solo cabecera inicialmente)
  createEntry: (entryData) => {
    return new Promise((resolve, reject) => {
      const { Fecha, NroCorte, Estado, Comentario, Usuario, FechaCat, ProdCodigo, FechaCura } = entryData;
      const tieneDetalles = 0; // Siempre 0 al crear solo la cabecera

      db.serialize(async () => {
        db.run("BEGIN TRANSACTION;");

        db.get(`SELECT EntNumero FROM Entrada1 ORDER BY EntNumero DESC LIMIT 1`, async (err, row) => {
          if (err) {
            db.run("ROLLBACK;");
            return reject(err);
          }

          let nextEntNumero = row && row.EntNumero ? row.EntNumero + 1 : 1;

          const sql1 = `
            INSERT INTO Entrada1 (EntNumero, Fecha, NroCorte, Estado, Comentario, Usuario, FechaCat, ProdCodigo, FechaCura, TieneDetalles)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          const params1 = [
            nextEntNumero,
            Fecha,
            NroCorte,
            Estado || 'Abierto', // Por defecto 'Abierto'
            Comentario,
            Usuario,
            FechaCat,
            ProdCodigo,
            FechaCura,
            tieneDetalles
          ];

          db.run(sql1, params1, async function (err) {
            if (err) {
              db.run("ROLLBACK;");
              return reject(err);
            }

            db.run("COMMIT;", (commitErr) => {
              if (commitErr) {
                db.run("ROLLBACK;");
                return reject(commitErr);
              }
              resolve({
                message: "✅ Cabecera de entrada registrada correctamente",
                EntNumero: nextEntNumero,
                NroCorte: NroCorte
              });
            });
          });
        });
      });
    });
  },

  // Actualizar una entrada (cabecera y/o detalles)
  updateEntry: (entNumero, entryData) => {
    return new Promise(async (resolve, reject) => {
      const { productosSeleccionados } = entryData;

      db.serialize(async () => {
        db.run("BEGIN TRANSACTION;", async (beginErr) => {
          if (beginErr) {
            return reject(beginErr);
          }

          try {
            // 1. Obtener los datos actuales de la cabecera
            const currentEntry = await entryRepository.getEntryByNumber(entNumero);
            if (!currentEntry) {
              db.run("ROLLBACK;");
              return reject(new Error("Entrada no encontrada para actualizar."));
            }

            // 2. Fusionar los datos existentes con los datos recibidos
            // Solo actualizamos los campos si están presentes en entryData
            const updatedHeader = {
              Fecha: entryData.Fecha !== undefined ? entryData.Fecha : currentEntry.Fecha,
              NroCorte: entryData.NroCorte !== undefined ? entryData.NroCorte : currentEntry.NroCorte,
              Estado: entryData.Estado !== undefined ? entryData.Estado : currentEntry.Estado,
              Comentario: entryData.Comentario !== undefined ? entryData.Comentario : currentEntry.Comentario,
              FechaCat: entryData.FechaCat !== undefined ? entryData.FechaCat : currentEntry.FechaCat,
              Usuario: entryData.Usuario !== undefined ? entryData.Usuario : currentEntry.Usuario,
              ProdCodigo: entryData.ProdCodigo !== undefined ? entryData.ProdCodigo : currentEntry.ProdCodigo,
              FechaCura: entryData.FechaCura !== undefined ? entryData.FechaCura : currentEntry.FechaCura,
              // TieneDetalles se actualiza si se envían productos o si se envía explícitamente
              TieneDetalles: (productosSeleccionados !== undefined) ? (productosSeleccionados.length > 0 ? 1 : 0) : currentEntry.TieneDetalles
            };

            // 3. Actualizar la cabecera con los datos fusionados
            const sqlUpdateEntry = `
              UPDATE Entrada1
              SET Fecha = ?, NroCorte = ?, Estado = ?, Comentario = ?, FechaCat = ?, Usuario = ?, ProdCodigo = ?, FechaCura = ?, TieneDetalles = ?
              WHERE EntNumero = ?
            `;
            await new Promise((resolveRun, rejectRun) => {
              db.run(sqlUpdateEntry, [
                updatedHeader.Fecha,
                updatedHeader.NroCorte,
                updatedHeader.Estado,
                updatedHeader.Comentario,
                updatedHeader.FechaCat,
                updatedHeader.Usuario,
                updatedHeader.ProdCodigo,
                updatedHeader.FechaCura,
                updatedHeader.TieneDetalles,
                entNumero,
              ], function (err) {
                if (err) return rejectRun(err);
                resolveRun();
              });
            });

            // 4. Actualizar detalles si productosSeleccionados están presentes en el payload
            if (productosSeleccionados !== undefined) {
              // Obtener detalles actuales para revertir stock
              const oldDetails = await new Promise((resolveOldDetails, rejectOldDetails) => {
                db.all(`SELECT ProdCodigo, Cantidad FROM Entrada2 WHERE EntNumero = ?`, [entNumero], (err, rows) => {
                  if (err) return rejectOldDetails(err);
                  resolveOldDetails(rows);
                });
              });

              // Revertir stock de los detalles antiguos
              const stockRevertPromises = oldDetails.map(detail => {
                return new Promise((resolveRevert, rejectRevert) => {
                  const updateStockSql = `UPDATE Producto SET Stock = Stock - ? WHERE ProdCodigo = ?`;
                  db.run(updateStockSql, [detail.Cantidad, detail.ProdCodigo], function(err) {
                    if (err) rejectRevert(err);
                    else resolveRevert();
                  });
                });
              });
              await Promise.all(stockRevertPromises);

              // Eliminar detalles existentes para esta entrada
              const sqlDeleteDetails = `DELETE FROM Entrada2 WHERE EntNumero = ?`;
              await new Promise((resolveRun, rejectRun) => {
                db.run(sqlDeleteDetails, [entNumero], function (err) {
                  if (err) return rejectRun(err);
                  resolveRun();
                });
              });

              // Insertar nuevos detalles y actualizar stock
              if (productosSeleccionados.length > 0) {
                let maxSerieInThisUpdate = await entryRepository.obtenerUltimaSerie(); // Obtener la serie global actual

                const insertPromises = productosSeleccionados.map(async detail => {
                  // Si la serie del detalle es nueva (no venía de la DB), la generamos y actualizamos el contador global
                  let serieToUse = detail.Serie;
                  if (!serieToUse || parseInt(serieToUse) <= maxSerieInThisUpdate) { // Si no tiene serie o es menor/igual a la última global
                      maxSerieInThisUpdate++;
                      serieToUse = String(maxSerieInThisUpdate);
                  } else {
                    // Si la serie ya existe y es mayor, la usamos y actualizamos el maxSerieInThisUpdate
                    const currentProdSerie = parseInt(serieToUse);
                    if (!isNaN(currentProdSerie) && currentProdSerie > maxSerieInThisUpdate) {
                      maxSerieInThisUpdate = currentProdSerie;
                    }
                  }

                  return new Promise((resolveDetail, rejectDetail) => {
                    const sqlInsertDetail = `INSERT INTO Entrada2 (EntNumero, Iten, ProdCodigo, Serie, Cantidad, Fecha, FechaCura, FechaIngr, Estado, Usuario, FechaCat) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    db.run(sqlInsertDetail, [
                      entNumero,
                      detail.Iten,
                      detail.ProdCodigo,
                      serieToUse,
                      detail.Cantidad,
                      detail.Fecha,
                      updatedHeader.FechaCura, // Usar FechaCura de la cabecera actualizada
                      detail.FechaIngr,
                      detail.Estado,
                      updatedHeader.Usuario, // Usar Usuario de la cabecera actualizada
                      updatedHeader.FechaCat, // Usar FechaCat de la cabecera actualizada
                    ], function (detailErr) {
                      if (detailErr) return rejectDetail(detailErr);

                      const updateStockSql = `UPDATE Producto SET Stock = Stock + ? WHERE ProdCodigo = ?`;
                      db.run(updateStockSql, [detail.Cantidad, detail.ProdCodigo], function(stockErr) {
                        if (stockErr) rejectDetail(stockErr);
                        else resolveDetail();
                      });
                    });
                  });
                });
                await Promise.all(insertPromises);

                // Actualizar el contador global de serie si se generaron nuevas series
                await entryRepository.incrementarSerieGlobal(maxSerieInThisUpdate);
              }
            }

            // 5. Confirmar la transacción
            db.run("COMMIT;", (commitErr) => {
              if (commitErr) {
                db.run("ROLLBACK;");
                return reject(commitErr);
              }
              resolve({ message: "✅ Entrada y/o detalles actualizados correctamente", EntNumero: entNumero });
            });

          } catch (err) {
            db.run("ROLLBACK;");
            reject(err);
          }
        });
      });
    });
  },

  // Verificar si una entrada tiene detalles
  checkIfEntryHasDetails: (entNumero) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT COUNT(*) AS count FROM Entrada2 WHERE EntNumero = ?`;
      db.get(sql, [entNumero], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count > 0);
        }
      });
    });
  },

  // Obtener la última serie registrada (del único registro con id=1)
  obtenerUltimaSerie: () => {
    return new Promise((resolve, reject) => {
      const query = `SELECT serie FROM Parametro WHERE id = 1`;
      db.get(query, [], (err, row) => {
        if (err) {
          console.error("❌ Error al obtener la última serie:", err.message);
          return reject(err);
        }
        const ultimaSerie = row ? parseInt(row.serie) : 0;
        resolve(ultimaSerie);
      });
    });
  },

  // Insertar o actualizar la serie global (sobrescribir el único registro con id=1)
  // Solo se llama al registrar la entrada principal
  incrementarSerieGlobal: (nuevaSerie) => {
    return new Promise((resolve, reject) => {
      const sql = `INSERT OR REPLACE INTO Parametro (id, serie) VALUES (1, ?)`;
      db.run(sql, [nuevaSerie.toString()], function (err) {
        if (err) {
          console.error("❌ Error al guardar/actualizar la serie única:", err.message);
          return reject(err);
        }
        resolve({ message: "Serie guardada/actualizada", id: 1 });
      });
    });
  },

  getLatestEntries: (limit = 5) => {
    return new Promise((resolve, reject) => {
      const sql = `
            SELECT
              e.EntNumero,
              e.Fecha,
              e.NroCorte,
              e.Estado,
              u.UsuNombre
            FROM Entrada1 e
            LEFT JOIN Usuario u ON e.Usuario = u.legajo
            ORDER BY e.FechaCat DESC
            LIMIT ?`;
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

          // Obtener detalles para revertir stock antes de eliminar
          db.all(`SELECT ProdCodigo, Cantidad FROM Entrada2 WHERE EntNumero = ?`, [entNumero], (err, details) => {
            if (err) {
              db.run("ROLLBACK;", () => reject(err));
              return;
            }

            const stockRevertPromises = details.map(detail => {
              return new Promise((resolveStock, rejectStock) => {
                const updateStockSql = `
                  UPDATE Producto
                  SET Stock = Stock - ?
                  WHERE ProdCodigo = ?
                `;
                db.run(updateStockSql, [detail.Cantidad, detail.ProdCodigo], function(err) {
                  if (err) rejectStock(err);
                  else resolveStock();
                });
              });
            });

            Promise.all(stockRevertPromises)
              .then(() => {
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
                      resolve({ message: "🗑️ Entrada eliminada correctamente y stock revertido.", changes: this.changes });
                    });
                  });
                });
              })
              .catch(stockErr => {
                db.run("ROLLBACK;");
                reject(stockErr);
              });
          });
        });
      });
    });
  },

  // Verificar si existe al menos una entrada con estado 'Abierto'
  hasOpenEntry: () => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT COUNT(*) AS count FROM Entrada1 WHERE Estado = 'Abierto'`;
      db.get(sql, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count > 0);
        }
      });
    });
  },
};

module.exports = entryRepository;
