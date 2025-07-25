// backend/src/repositories/machineRepository.js
const db = require('../database'); // Importa la instancia de la base de datos

const machineRepository = {
  // Obtener todas las máquinas con opción de ordenamiento
  getAllMachines: (sortBy = 'MaqCodigo', order = 'ASC') => {
    return new Promise((resolve, reject) => {
      // Lista blanca de columnas permitidas para ordenar (para seguridad)
      const allowedSortColumns = [
        'm.MaqCodigo', 'm.MaqNombre', 'm.Usuario', 'm.FechaCat',
        'm.ModificadoPor', 'm.FechaModif', 'u.UsuNombre', 'um.UsuNombre'
      ];
      const allowedOrderDirections = ['ASC', 'DESC'];

      // Validar sortBy: Si el sortBy no está calificado, lo calificamos
      let qualifiedSortBy = sortBy;
      if (!sortBy.includes('.')) {
        if (sortBy === 'UsuarioNombre') {
          qualifiedSortBy = 'u.UsuNombre';
        } else if (sortBy === 'ModificadoPorNombre') {
          qualifiedSortBy = 'um.UsuNombre';
        } else {
          qualifiedSortBy = `m.${sortBy}`; // Por defecto, calificar con el alias de la tabla Maquina
        }
      }
      
      // Validar order
      if (!allowedOrderDirections.includes(order.toUpperCase())) {
        order = 'ASC'; // Valor por defecto si la dirección no es válida
      }

      const sql = `
        SELECT m.MaqCodigo, m.MaqNombre, m.Usuario, m.FechaCat, u.UsuNombre AS UsuarioNombre, um.UsuNombre AS ModificadoPorNombre, m.ModificadoPor, m.FechaModif
        FROM Maquina m
        LEFT JOIN Usuario u ON m.Usuario = u.legajo
        LEFT JOIN Usuario um ON m.ModificadoPor = um.legajo
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

  // Obtener una máquina por código
  getMachineByCode: (maqCodigo) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT MaqCodigo, MaqNombre, Usuario, FechaCat, ModificadoPor, FechaModif
        FROM Maquina
        WHERE MaqCodigo = ?
      `;
      db.get(sql, [maqCodigo], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  // Crear una nueva máquina
  createMachine: (machineData) => {
    return new Promise(async (resolve, reject) => {
      const { MaqNombre, Usuario, FechaCat } = machineData;

      try {
        // Obtener el último MaqCodigo para generar el nuevo de forma correlativa
        const lastMachine = await new Promise((resolveGet, rejectGet) => {
          // Ordenar por MaqCodigo de forma descendente para obtener el "último"
          // y asegurarse de que sea numéricamente el más alto si el prefijo es constante.
          db.get(`SELECT MaqCodigo FROM Maquina ORDER BY MaqCodigo DESC LIMIT 1`, (err, row) => {
            if (err) return rejectGet(err);
            resolveGet(row);
          });
        });

        let newCode = 'maq001'; // ✅ Cambiado a 'maq001'
        if (lastMachine && lastMachine.MaqCodigo) {
          // Extraer el número, asegurándose de que sea un número válido
          // ✅ Cambiado de 'mq' a 'maq'
          const lastNumStr = lastMachine.MaqCodigo.replace('maq', ''); 
          const lastNum = parseInt(lastNumStr, 10); // Especificar base 10

          if (!isNaN(lastNum)) { // Si la conversión fue exitosa
            const nextNum = lastNum + 1;
            newCode = 'maq' + nextNum.toString().padStart(3, '0');
          } else {
            // Si el último MaqCodigo no es un número válido después de 'maq',
            // volvemos a 'maq001' o manejamos el error.
            // Para simplicidad, si es inválido, asumimos que es la primera máquina válida.
            console.warn(`⚠️ MaqCodigo inválido encontrado: ${lastMachine.MaqCodigo}. Reiniciando contador a maq001.`);
            newCode = 'maq001';
          }
        }

        const sql = `
          INSERT INTO Maquina (MaqCodigo, MaqNombre, Usuario, FechaCat)
          VALUES (?, ?, ?, ?)
        `;
        const params = [
          newCode,
          MaqNombre,
          Usuario,
          FechaCat
        ];

        db.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ message: "✅ Máquina registrada correctamente", MaqCodigo: newCode });
        });
      } catch (err) {
        reject(err);
      }
    });
  },

  // Actualizar una máquina existente
  updateMachine: (maqCodigo, machineData) => {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. Obtener los datos actuales de la máquina
        const currentMachine = await machineRepository.getMachineByCode(maqCodigo);
        if (!currentMachine) {
          return reject(new Error("Máquina no encontrada para actualizar."));
        }

        // 2. Fusionar los datos existentes con los datos recibidos
        const updatedData = {
          MaqNombre: machineData.MaqNombre !== undefined ? machineData.MaqNombre : currentMachine.MaqNombre,
          ModificadoPor: machineData.ModificadoPor !== undefined ? machineData.ModificadoPor : currentMachine.ModificadoPor,
          FechaModif: machineData.FechaModif !== undefined ? machineData.FechaModif : currentMachine.FechaModif,
          Usuario: currentMachine.Usuario, // Mantener original
          FechaCat: currentMachine.FechaCat, // Mantener original
        };

        const sql = `
          UPDATE Maquina
          SET MaqNombre = ?, ModificadoPor = ?, FechaModif = ?
          WHERE MaqCodigo = ?
        `;
        const params = [
          updatedData.MaqNombre,
          updatedData.ModificadoPor,
          updatedData.FechaModif,
          maqCodigo
        ];
        
        db.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ message: "✅ Máquina actualizada correctamente", changes: this.changes });
        });
      } catch (err) {
        reject(err);
      }
    });
  },

  // Eliminar una máquina
  deleteMachine: (maqCodigo) => {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM Maquina WHERE MaqCodigo = ?`;
      db.run(sql, [maqCodigo], function (err) {
        if (err) reject(err);
        else resolve({ message: "🗑️ Máquina eliminada correctamente", changes: this.changes });
      });
    });
  },

  // Obtener el conteo total de máquinas (para el dashboard)
  getActiveMachinesCount: () => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT COUNT(*) AS count FROM Maquina`;
      db.get(sql, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
};

module.exports = machineRepository;
