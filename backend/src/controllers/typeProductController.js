// backend/src/controllers/typeProductController.js
const typeProductRepository = require('../repositories/typeProductRepository'); // ✅ Importación correcta

const typeProductController = {
  // Obtener todos los tipos de producto con opción de ordenamiento
  getAllTypeProducts: async (req, res) => {
    try {
      // ✅ Obtener parámetros de ordenamiento de la query string
      const sortBy = req.query.sortBy;
      const order = req.query.order;
      const typeProducts = await typeProductRepository.getAllTypeProducts(sortBy, order);
      res.json(typeProducts);
    } catch (err) {
      console.error("❌ Error al obtener tipos de producto:", err.message);
      res.status(500).json({ error: "Error al obtener tipos de producto." });
    }
  },

  // Obtener un tipo de producto por código
  getTypeProductByCode: async (req, res) => {
    const { tipProdCodigo } = req.params;
    try {
      const typeProduct = await typeProductRepository.getTypeProductByCode(tipProdCodigo);
      if (!typeProduct) {
        return res.status(404).json({ error: "Tipo de producto no encontrado." });
      }
      res.json(typeProduct);
    } catch (err) {
      console.error("❌ Error al obtener tipo de producto:", err.message);
      res.status(500).json({ error: "Error al obtener tipo de producto." });
    }
  },

  // Crear un nuevo tipo de producto
  createTypeProduct: async (req, res) => {
    const { TipProdNombre, Usuario, FechaCat } = req.body;
    if (!TipProdNombre || !Usuario || !FechaCat) {
      return res.status(400).json({ error: "⚠️ El nombre del tipo de producto, usuario y fecha de carga son obligatorios." });
    }
    try {
      const result = await typeProductRepository.createTypeProduct(req.body);
      res.status(201).json(result);
    } catch (err) {
      console.error("❌ Error al crear tipo de producto:", err.message);
      res.status(500).json({ error: "Error al registrar el tipo de producto." });
    }
  },

  // Actualizar un tipo de producto
  updateTypeProduct: async (req, res) => {
    const { tipProdCodigo } = req.params;
    try {
      const result = await typeProductRepository.updateTypeProduct(tipProdCodigo, req.body);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Tipo de producto no encontrado o no hubo cambios para actualizar." });
      }
      res.json(result);
    } catch (err) {
      console.error("❌ Error al actualizar tipo de producto:", err.message);
      res.status(500).json({ error: "Error al actualizar tipo de producto." });
    }
  },

  // Eliminar un tipo de producto
  deleteTypeProduct: async (req, res) => {
    const { tipProdCodigo } = req.params;
    try {
      const result = await typeProductRepository.deleteTypeProduct(tipProdCodigo);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Tipo de producto no encontrado." });
      }
      res.json(result);
    } catch (err) {
      console.error("❌ Error al eliminar tipo de producto:", err.message);
      res.status(500).json({ error: "Error al eliminar tipo de producto." });
    }
  },
};

module.exports = typeProductController;
