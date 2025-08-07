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
          e.TieneDetalles,
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
  
        try {
          // 1. Obtener el próximo EntNumero
          const nextEntNumero = await new Promise((res, rej) => {
            db.get(`SELECT EntNumero FROM Entrada1 ORDER BY EntNumero DESC LIMIT 1`, (err, row) => {
              if (err) return rej(err);
              res(row && row.EntNumero ? row.EntNumero + 1 : 1);
            });
          });
  
          // 2. Obtener la serie actual de Parametro
          let currentSerie = await new Promise((res, rej) => {
            db.get(`SELECT serie FROM Parametro WHERE id = 1`, (err, row) => {
              if (err) return rej(err);
              res(row ? parseInt(row.serie) : 0);
            });
          });
  
          // 3. Incrementar la serie
          const newSerie = currentSerie + 1;
  
          // 4. Actualizar la serie en Parametro
          await new Promise((res, rej) => {
            db.run(`UPDATE Parametro SET serie = ? WHERE id = 1`, [newSerie], function (err) {
              if (err) return rej(err);
              res();
            });
          });
  
          // 5. Insertar la nueva entrada
          const sql1 = `
            INSERT INTO Entrada1 (EntNumero, Fecha, NroCorte, Estado, Comentario, Usuario, FechaCat, ProdCodigo, FechaCura, TieneDetalles)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            FechaCura,
            tieneDetalles
          ];
  
          await new Promise((res, rej) => {
            db.run(sql1, params1, function (err) {
              if (err) return rej(err);
              res();
            });
          });
  
          db.run("COMMIT;", (commitErr) => {
            if (commitErr) {
              db.run("ROLLBACK;");
              return reject(commitErr);
            }
            resolve({
              message: "✅ Cabecera de entrada registrada correctamente y serie actualizada",
              EntNumero: nextEntNumero,
              NroCorte: NroCorte,
              Serie: newSerie
            });
          });
  
        } catch (err) {
          db.run("ROLLBACK;");
          reject(err);
        }
      });
    });
  },

  // Agregar un detalle a una entrada existente
  addEntryDetail: (entNumero, detailData) => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION;", async (beginErr) => {
          if (beginErr) {
            return reject(beginErr);
          }
  
          try {
            const { ProdCodigo, Cantidad, Fecha, FechaCura, FechaIngr, Estado, Usuario, FechaCat } = detailData;
  
            // 1. Obtener el próximo Iten para esta entrada
            const maxItenRow = await new Promise((resMaxIten, rejMaxIten) => {
              db.get(`SELECT MAX(Iten) AS maxIten FROM Entrada2 WHERE EntNumero = ?`, [entNumero], (err, row) => {
                if (err) rejMaxIten(err);
                else resMaxIten(row);
              });
            });
            const nextIten = (maxItenRow && maxItenRow.maxIten) ? maxItenRow.maxIten + 1 : 1;
  
            // 2. Obtener la serie actual de Parametro
            let currentSerie = await new Promise((res, rej) => {
              db.get(`SELECT serie FROM Parametro WHERE id = 1`, (err, row) => {
                if (err) return rej(err);
                res(row ? parseInt(row.serie) : 0);
              });
            });
  
            // 3. Incrementar la serie para este detalle
            const newSerie = currentSerie + 1;
  
            // 4. Insertar el nuevo detalle en Entrada2
            const sqlInsertDetail = `
              INSERT INTO Entrada2 (EntNumero, Iten, ProdCodigo, Serie, Cantidad, Fecha, FechaCura, FechaIngr, Estado, Usuario, FechaCat)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            await new Promise((resInsert, rejInsert) => {
              db.run(sqlInsertDetail, [
                entNumero, nextIten, ProdCodigo, newSerie, Cantidad, Fecha, FechaCura, FechaIngr, Estado, Usuario, FechaCat
              ], function (err) {
                if (err) rejInsert(err);
                else resInsert();
              });
            });
  
            // 5. Actualizar la serie en Parametro
            await new Promise((res, rej) => {
              db.run(`UPDATE Parametro SET serie = ? WHERE id = 1`, [newSerie], function (err) {
                if (err) return rej(err);
                res();
              });
            });
  
            // 6. Actualizar el stock del producto
            const sqlUpdateStock = `UPDATE Producto SET Stock = Stock + ? WHERE ProdCodigo = ?`;
            await new Promise((resStock, rejStock) => {
              db.run(sqlUpdateStock, [Cantidad, ProdCodigo], function (err) {
                if (err) rejStock(err);
                else resStock();
              });
            });
  
            // 7. Asegurarse de que TieneDetalles en Entrada1 sea 1
            const sqlUpdateTieneDetalles = `UPDATE Entrada1 SET TieneDetalles = 1 WHERE EntNumero = ? AND TieneDetalles = 0`;
            await new Promise((resUpdate, rejUpdate) => {
              db.run(sqlUpdateTieneDetalles, [entNumero], function (err) {
                if (err) rejUpdate(err);
                else resUpdate();
              });
            });
  
            // 8. Confirmar la transacción
            db.run("COMMIT;", (commitErr) => {
              if (commitErr) {
                db.run("ROLLBACK;");
                return reject(commitErr);
              }
              resolve({ message: "✅ Detalle de entrada registrado correctamente y serie actualizada.", Iten: nextIten, Serie: newSerie });
            });
  
          } catch (err) {
            db.run("ROLLBACK;");
            reject(err);
          }
        });
      });
    });
  },


  // Actualizar una entrada (cabecera y/o detalles)
  updateEntry: (entNumero, entryData) => {
    return new Promise(async (resolve, reject) => {
      const { productosSeleccionados, ...headerData } = entryData; // Separamos productosSeleccionados

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

            // 2. Actualizar la cabecera si hay datos de cabecera en headerData
            if (Object.keys(headerData).length > 0) {
              let sqlUpdateEntrada1 = `UPDATE Entrada1 SET FechaCat = ?, Usuario = ?`;
              const paramsEntrada1 = [headerData.FechaCat !== undefined ? headerData.FechaCat : currentEntry.FechaCat, headerData.Usuario !== undefined ? headerData.Usuario : currentEntry.Usuario];

              if (headerData.Fecha !== undefined) {
                sqlUpdateEntrada1 += `, Fecha = ?`;
                paramsEntrada1.push(headerData.Fecha);
              }
              if (headerData.NroCorte !== undefined) {
                sqlUpdateEntrada1 += `, NroCorte = ?`;
                paramsEntrada1.push(headerData.NroCorte);
              }
              if (headerData.Estado !== undefined) {
                sqlUpdateEntrada1 += `, Estado = ?`;
                paramsEntrada1.push(headerData.Estado);
              }
              if (headerData.Comentario !== undefined) {
                sqlUpdateEntrada1 += `, Comentario = ?`;
                paramsEntrada1.push(headerData.Comentario);
              }
              if (headerData.ProdCodigo !== undefined) {
                sqlUpdateEntrada1 += `, ProdCodigo = ?`;
                paramsEntrada1.push(headerData.ProdCodigo);
              }
              if (headerData.FechaCura !== undefined) {
                sqlUpdateEntrada1 += `, FechaCura = ?`;
                paramsEntrada1.push(headerData.FechaCura);
              }
              
              // Si se envían productosSeleccionados (para reemplazar), actualizar TieneDetalles a 1
              // Si productosSeleccionados es un array vacío, actualizar TieneDetalles a 0
              if (productosSeleccionados !== undefined) {
                  sqlUpdateEntrada1 += `, TieneDetalles = ?`;
                  paramsEntrada1.push(productosSeleccionados.length > 0 ? 1 : 0);
              }


              sqlUpdateEntrada1 += ` WHERE EntNumero = ?`;
              paramsEntrada1.push(entNumero);

              await new Promise((resolveUpdate, rejectUpdate) => {
                db.run(sqlUpdateEntrada1, paramsEntrada1, function (err) {
                  if (err) return rejectUpdate(err);
                  resolveUpdate();
                });
              });
            }

            // Si productosSeleccionados está presente, significa que se quieren reemplazar los detalles
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

              // Insertar los nuevos detalles y actualizar stock
              if (productosSeleccionados.length > 0) {
                let maxSerieInThisUpdate = await entryRepository.obtenerUltimaSerie(); // Obtener la serie global actual

                const insertPromises = productosSeleccionados.map(async detail => {
                  let serieToUse = detail.Serie;
                  if (!serieToUse || parseInt(serieToUse) <= maxSerieInThisUpdate) {
                      maxSerieInThisUpdate++;
                      serieToUse = String(maxSerieInThisUpdate);
                  } else {
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
                      headerData.FechaCura !== undefined ? headerData.FechaCura : currentEntry.FechaCura, // Usar FechaCura de la cabecera actualizada
                      detail.FechaIngr,
                      detail.Estado,
                      headerData.Usuario !== undefined ? headerData.Usuario : currentEntry.Usuario, // Usar Usuario de la cabecera actualizada
                      headerData.FechaCat !== undefined ? headerData.FechaCat : currentEntry.FechaCat, // Usar FechaCat de la cabecera actualizada
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

                await entryRepository.incrementarSerieGlobal(maxSerieInThisUpdate);
              }
            }

            // 4. Confirmar la transacción
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

  // ✅ FUNCIÓN EXISTENTE: Eliminar un detalle de entrada por número de entrada y serie
  deleteEntryDetail: (entNumero, serie) => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION;", (err) => {
          if (err) return reject(err);

          // 1. Obtener los detalles del producto para revertir el stock
          const sqlGetDetail = `SELECT ProdCodigo, Cantidad FROM Entrada2 WHERE EntNumero = ? AND Serie = ?`;
          db.get(sqlGetDetail, [entNumero, serie], (err, detail) => {
            if (err) {
              db.run("ROLLBACK;");
              return reject(err);
            }
            if (!detail) {
              db.run("ROLLBACK;");
              return resolve({ message: "Detalle no encontrado.", changes: 0 });
            }

            // 2. Revertir el stock del producto
            // Nota: Aquí se asume que la columna es 'Stock', no 'ProdStock' como en otros lugares.
            // Asegúrate de que el nombre de la columna de stock en tu tabla 'Producto' sea consistente.
            const sqlUpdateStock = `UPDATE Producto SET Stock = Stock - ? WHERE ProdCodigo = ?`;
            db.run(sqlUpdateStock, [detail.Cantidad, detail.ProdCodigo], function (err) {
              if (err) {
                db.run("ROLLBACK;");
                return reject(err);
              }

              // 3. Eliminar el detalle de Entrada2
              const sqlDeleteDetail = `DELETE FROM Entrada2 WHERE EntNumero = ? AND Serie = ?`;
              db.run(sqlDeleteDetail, [entNumero, serie], function (err) {
                if (err) {
                  db.run("ROLLBACK;");
                  return reject(err);
                }

                db.run("COMMIT;", (commitErr) => {
                  if (commitErr) {
                    db.run("ROLLBACK;");
                    return reject(commitErr);
                  }
                  resolve({ message: "✅ Detalle eliminado correctamente y stock revertido.", changes: this.changes });
                });
              });
            });
          });
        });
      });
    });
  },
};

module.exports = entryRepository;
