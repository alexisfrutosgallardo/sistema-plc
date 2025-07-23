// backend/src/controllers/productController.js
const productRepository = require('../repositories/productRepository');

const productController = {
  // Obtener todos los productos con opción de ordenamiento
  getAllProducts: async (req, res) => {
    try {
      // ✅ Obtener parámetros de ordenamiento de la query string
      const sortBy = req.query.sortBy;
      const order = req.query.order;
      const products = await productRepository.getAllProducts(sortBy, order);
      res.json(products);
    } catch (err) {
      console.error("❌ Error al obtener productos:", err.message);
      res.status(500).json({ error: "Error al obtener productos." });
    }
  },

  // Obtener un producto por código
  getProductByCode: async (req, res) => {
    const { prodCodigo } = req.params;
    try {
      const product = await productRepository.getProductByCode(prodCodigo);
      if (!product) {
        return res.status(404).json({ error: "Producto no encontrado." });
      }
      res.json(product);
    } catch (err) {
      console.error("❌ Error al obtener producto:", err.message);
      res.status(500).json({ error: "Error al obtener producto." });
    }
  },

  // Crear un nuevo producto
  createProduct: async (req, res) => {
    const { ProdNombre, TipProdCodigo, Usuario, FechaCat } = req.body;
    if (!ProdNombre || !TipProdCodigo || !Usuario || !FechaCat) {
      return res.status(400).json({ error: "⚠️ El nombre, tipo de producto, usuario y fecha de carga son obligatorios." });
    }
    try {
      const result = await productRepository.createProduct(req.body);
      res.status(201).json(result);
    } catch (err) {
      console.error("❌ Error al crear producto:", err.message);
      res.status(500).json({ error: "Error al registrar el producto." });
    }
  },

  // Actualizar un producto
  updateProduct: async (req, res) => {
    const { prodCodigo } = req.params;
    try {
      const result = await productRepository.updateProduct(prodCodigo, req.body);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Producto no encontrado o no hubo cambios para actualizar." });
      }
      res.json(result);
    } catch (err) {
      console.error("❌ Error al actualizar producto:", err.message);
      res.status(500).json({ error: "Error al actualizar producto." });
    }
  },

  // Eliminar un producto
  deleteProduct: async (req, res) => {
    const { prodCodigo } = req.params;
    try {
      const result = await productRepository.deleteProduct(prodCodigo);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Producto no encontrado." });
      }
      res.json(result);
    } catch (err) {
      console.error("❌ Error al eliminar producto:", err.message);
      res.status(500).json({ error: "Error al eliminar producto." });
    }
  },
};

module.exports = productController;
