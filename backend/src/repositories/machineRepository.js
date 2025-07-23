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
      if (!allowedSortColumns.includes(qualifiedSortBy)) {
        qualifiedSortBy = 'm.MaqCodigo'; // Valor por defecto si la columna no es válida
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
        SELECT m.MaqCodigo, m.MaqNombre, m.Usuario, m.FechaCat, u.UsuNombre AS UsuarioNombre, um.UsuNombre AS ModificadoPorNombre, m.ModificadoPor, m.FechaModif
        FROM Maquina m
        LEFT JOIN Usuario u ON m.Usuario = u.legajo
        LEFT JOIN Usuario um ON m.ModificadoPor = um.legajo
        WHERE m.MaqCodigo = ?
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
    return new Promise((resolve, reject) => {
      const { MaqNombre, Usuario, FechaCat } = machineData;

      db.get(`SELECT MaqCodigo FROM Maquina ORDER BY MaqCodigo DESC LIMIT 1`, (err, row) => {
        if (err) return reject(err);

        let newCode = 'mq001';
        if (row?.MaqCodigo) {
          const num = parseInt(row.MaqCodigo.replace('mq', '')) + 1;
          newCode = 'mq' + num.toString().padStart(3, '0');
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
      });
    });
  },

  // Actualizar una máquina existente
  updateMachine: (maqCodigo, machineData) => {
    return new Promise((resolve, reject) => {
      const { MaqNombre, ModificadoPor, FechaModif } = machineData;
      const sql = `
        UPDATE Maquina
        SET MaqNombre = ?, ModificadoPor = ?, FechaModif = ?
        WHERE MaqCodigo = ?
      `;
      const params = [
        MaqNombre,
        ModificadoPor,
        FechaModif,
        maqCodigo
      ];
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ message: "✅ Máquina actualizada correctamente", changes: this.changes });
      });
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
