// backend/src/controllers/machineController.js
const machineRepository = require('../repositories/machineRepository');

const machineController = {
  // Obtener todas las máquinas con opción de ordenamiento
  getAllMachines: async (req, res) => {
    try {
      const sortBy = req.query.sortBy;
      const order = req.query.order;
      const machines = await machineRepository.getAllMachines(sortBy, order);
      res.json(machines);
    } catch (err) {
      console.error("❌ Error al obtener máquinas:", err.message);
      res.status(500).json({ error: "Error al obtener máquinas." });
    }
  },

  // Obtener una máquina por código
  getMachineByCode: async (req, res) => {
    const { maqCodigo } = req.params;
    try {
      const machine = await machineRepository.getMachineByCode(maqCodigo);
      if (!machine) {
        return res.status(404).json({ error: "Máquina no encontrada." });
      }
      res.json(machine);
    } catch (err) {
      console.error("❌ Error al obtener máquina:", err.message);
      res.status(500).json({ error: "Error al obtener máquina." });
    }
  },

  // Crear una nueva máquina
  createMachine: async (req, res) => {
    const { MaqNombre, Usuario, FechaCat } = req.body;
    if (!MaqNombre || !Usuario || !FechaCat) {
      return res.status(400).json({ error: "⚠️ El nombre de la máquina, usuario y fecha de carga son obligatorios." });
    }
    try {
      const result = await machineRepository.createMachine(req.body);
      res.status(201).json(result);
    } catch (err) {
      console.error("❌ Error al crear máquina:", err.message);
      res.status(500).json({ error: "Error al registrar la máquina." });
    }
  },

  // Actualizar una máquina
  updateMachine: async (req, res) => {
    const { maqCodigo } = req.params;
    const { MaqNombre } = req.body; // Solo validamos MaqNombre si es lo único que se espera en el payload
    if (!MaqNombre) { // ✅ Simplificada la validación
      return res.status(400).json({ error: "⚠️ El nombre de la máquina es obligatorio para actualizar." });
    }
    try {
      const result = await machineRepository.updateMachine(maqCodigo, req.body); // ✅ Pasamos el body completo
      if (result.changes === 0) {
        return res.status(404).json({ error: "Máquina no encontrada o no hubo cambios para actualizar." });
      }
      res.json(result);
    } catch (err) {
      console.error("❌ Error al actualizar máquina:", err.message);
      res.status(500).json({ error: "Error al actualizar máquina." });
    }
  },

  // Eliminar una máquina
  deleteMachine: async (req, res) => {
    const { maqCodigo } = req.params;
    try {
      const result = await machineRepository.deleteMachine(maqCodigo);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Máquina no encontrada." });
      }
      res.json(result);
    } catch (err) {
      console.error("❌ Error al eliminar máquina:", err.message);
      res.status(500).json({ error: "Error al eliminar máquina." });
    }
  },
};

module.exports = machineController;
