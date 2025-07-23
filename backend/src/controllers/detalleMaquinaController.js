// backend/src/controllers/detalleMaquinaController.js
const detalleMaquinaRepository = require('../repositories/detalleMaquinaRepository');

const detalleMaquinaController = {
  // Obtener todas las máquinas asociadas a una relación Silo-Blend específica
  getAllDetalleMaquinas: async (req, res) => {
    const { nroRelacion } = req.params; // Obtener nroRelacion de los parámetros de la URL
    try {
      const detalleMaquinas = await detalleMaquinaRepository.getAllDetalleMaquinas(nroRelacion);
      res.json(detalleMaquinas);
    } catch (err) {
      console.error("❌ Error al obtener máquinas asociadas:", err.message);
      res.status(500).json({ error: "Error al obtener máquinas asociadas." });
    }
  },

  // Crear una nueva máquina asociada
  createDetalleMaquina: async (req, res) => {
    const { NroRelacion, Iten, MaqCodigo, Estado, Usuario, FechaCat } = req.body;
    if (!NroRelacion || !Iten || !MaqCodigo || !Estado || !Usuario || !FechaCat) {
      return res.status(400).json({ error: "⚠️ Faltan campos obligatorios para registrar la máquina asociada." });
    }
    try {
      const result = await detalleMaquinaRepository.createDetalleMaquina(req.body);
      res.status(201).json(result);
    } catch (err) {
      console.error("❌ Error al crear máquina asociada:", err.message);
      res.status(500).json({ error: "Error al registrar la máquina asociada." });
    }
  },

  // Eliminar una máquina asociada
  deleteDetalleMaquina: async (req, res) => {
    const { nroRelacion, iten } = req.params;
    try {
      const result = await detalleMaquinaRepository.deleteDetalleMaquina(nroRelacion, iten);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Máquina asociada no encontrada." });
      }
      res.json(result);
    } catch (err) {
      console.error("❌ Error al eliminar máquina asociada:", err.message);
      res.status(500).json({ error: "Error al eliminar máquina asociada." });
    }
  },
};

module.exports = detalleMaquinaController;
