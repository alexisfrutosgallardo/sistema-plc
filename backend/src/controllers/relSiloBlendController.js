// backend/src/controllers/relSiloBlendController.js
const relSiloBlendRepository = require('../repositories/relSiloBlendRepository');

const relSiloBlendController = {
  // Obtener todas las relaciones RelSiloBlend con opción de ordenamiento
  getAllRelSiloBlend: async (req, res) => {
    try {
      const sortBy = req.query.sortBy;
      const order = req.query.order;
      const relations = await relSiloBlendRepository.getAllRelSiloBlend(sortBy, order);
      res.json(relations);
    } catch (err) {
      console.error("❌ Error al obtener relaciones Silo-Blend:", err.message);
      res.status(500).json({ error: "Error al obtener relaciones Silo-Blend." });
    }
  },

  // Obtener una relación RelSiloBlend por NroRelacion
  getRelSiloBlendByNroRelacion: async (req, res) => {
    const { nroRelacion } = req.params;
    try {
      const relation = await relSiloBlendRepository.getRelSiloBlendByNroRelacion(nroRelacion);
      if (!relation) {
        return res.status(404).json({ error: "Relación Silo-Blend no encontrada." });
      }
      res.json(relation);
    } catch (err) {
      console.error("❌ Error al obtener relación Silo-Blend:", err.message);
      res.status(500).json({ error: "Error al obtener relación Silo-Blend." });
    }
  },

  // Crear una nueva relación RelSiloBlend
  createRelSiloBlend: async (req, res) => {
    const { ProdCodigo, SiloCodigo, Corte, Estado, Usuario, FechaCat } = req.body;
    if (!ProdCodigo || !SiloCodigo || !Corte || !Estado || !Usuario || !FechaCat) {
      return res.status(400).json({ error: "⚠️ Código de Producto, Código de Silo, Corte, Estado, Usuario y Fecha de Carga son obligatorios." });
    }
    try {
      const result = await relSiloBlendRepository.createRelSiloBlend(req.body);
      res.status(201).json(result);
    } catch (err) {
      console.error("❌ Error al crear relación Silo-Blend:", err.message);
      res.status(500).json({ error: "Error al registrar la relación Silo-Blend." });
    }
  },

  // Actualizar una relación RelSiloBlend
  updateRelSiloBlend: async (req, res) => {
    const { nroRelacion } = req.params;
    const { ProdCodigo, SiloCodigo, Corte, Estado } = req.body;
    if (!ProdCodigo || !SiloCodigo || !Corte || !Estado) {
      return res.status(400).json({ error: "⚠️ Código de Producto, Código de Silo, Corte y Estado son obligatorios para actualizar." });
    }
    try {
      const result = await relSiloBlendRepository.updateRelSiloBlend(nroRelacion, req.body);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Relación Silo-Blend no encontrada o no hubo cambios para actualizar." });
      }
      res.json(result);
    } catch (err) {
      console.error("❌ Error al actualizar relación Silo-Blend:", err.message);
      res.status(500).json({ error: "Error al actualizar relación Silo-Blend." });
    }
  },

  // Eliminar una relación RelSiloBlend
  deleteRelSiloBlend: async (req, res) => {
    const { nroRelacion } = req.params;
    try {
      const result = await relSiloBlendRepository.deleteRelSiloBlend(nroRelacion);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Relación Silo-Blend no encontrada." });
      }
      res.json(result);
    } catch (err) {
      console.error("❌ Error al eliminar relación Silo-Blend:", err.message);
      res.status(500).json({ error: "Error al eliminar relación Silo-Blend." });
    }
  },



  // ✅ NUEVO MÉTODO: Alternar el estado de una relación Silo-Blend
  toggleEstadoRelacion: async (req, res) => {
    const { nroRelacion } = req.params;
    const { estado } = req.body; // Esperamos el nuevo estado en el cuerpo de la solicitud

    if (!estado || (estado !== 'Activo' && estado !== 'Inactivo')) {
      return res.status(400).json({ error: "⚠️ El estado proporcionado no es válido." });
    }

    try {
      const result = await relSiloBlendRepository.updateRelSiloBlendEstado(nroRelacion, estado);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Relación Silo-Blend no encontrada o el estado ya es el mismo." });
      }
      res.json({ message: `✅ Estado de la relación ${nroRelacion} actualizado a ${estado}.` });
    } catch (err) {
      console.error("❌ Error al alternar estado de relación Silo-Blend:", err.message);
      res.status(500).json({ error: "Error al actualizar el estado de la relación Silo-Blend." });
    }
  },


};

module.exports = relSiloBlendController;
