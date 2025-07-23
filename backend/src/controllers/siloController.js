// backend/src/controllers/siloController.js
const siloRepository = require('../repositories/siloRepository');

const siloController = {
  // Obtener todos los silos con opción de ordenamiento
  getAllSilos: async (req, res) => { // ✅ Añadidos req, res
    try {
      // ✅ Obtener parámetros de ordenamiento de la query string
      const sortBy = req.query.sortBy;
      const order = req.query.order;
      const silos = await siloRepository.getAllSilos(sortBy, order);
      res.json(silos);
    } catch (err) {
      console.error("❌ Error al obtener silos:", err.message);
      res.status(500).json({ error: "Error al obtener silos." });
    }
  },

  // Obtener un silo por código
  getSiloByCode: async (req, res) => {
    const { siloCodigo } = req.params;
    try {
      const silo = await siloRepository.getSiloByCode(siloCodigo);
      if (!silo) {
        return res.status(404).json({ error: "Silo no encontrado." });
      }
      res.json(silo);
    } catch (err) {
      console.error("❌ Error al obtener silo:", err.message);
      res.status(500).json({ error: "Error al obtener silo." });
    }
  },

  // Crear un nuevo silo
  createSilo: async (req, res) => {
    // ✅ Asegurarse de desestructurar Usuario y FechaCat directamente del req.body
    const { SiloNombre, IP, Estado, Usuario, FechaCat } = req.body; 
    if (!SiloNombre || !IP || !Estado || !Usuario || !FechaCat) { 
      return res.status(400).json({ error: "⚠️ El nombre, la IP, el estado, el usuario y la fecha de carga del silo son obligatorios." });
    }
    try {
      // ✅ Pasar el objeto completo req.body al repositorio, que ya contiene todos los campos
      const result = await siloRepository.createSilo(req.body); 
      res.status(201).json(result);
    } catch (err) {
      console.error("❌ Error al crear silo:", err.message);
      res.status(500).json({ error: "Error al registrar el silo." });
    }
  },

  // Actualizar un silo
  updateSilo: async (req, res) => {
    const { siloCodigo } = req.params;
    const { SiloNombre, IP, Estado } = req.body; 
    if (!SiloNombre || !IP || !Estado) {
      return res.status(400).json({ error: "⚠️ El nombre, la IP y el estado del silo son obligatorios para actualizar." });
    }
    try {
      const result = await siloRepository.updateSilo(siloCodigo, req.body);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Silo no encontrado o no hubo cambios para actualizar." });
      }
      res.json(result);
    } catch (err) {
      console.error("❌ Error al actualizar silo:", err.message);
      res.status(500).json({ error: "Error al actualizar silo." });
    }
  },

  // Eliminar un silo
  deleteSilo: async (req, res) => {
    const { siloCodigo } = req.params;
    try {
      const result = await siloRepository.deleteSilo(siloCodigo);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Silo no encontrado." });
      }
      res.json(result);
    } catch (err) {
      console.error("❌ Error al eliminar silo:", err.message);
      res.status(500).json({ error: "Error al eliminar silo." });
    }
  },
};

module.exports = siloController;
