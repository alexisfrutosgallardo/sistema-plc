// backend/src/routes/productRoutes.js
const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

// Rutas para PRODUCTOS
router.get('/producto', productController.getAllProducts);
router.get('/producto/:prodCodigo', productController.getProductByCode);
router.post('/producto', productController.createProduct);
router.put('/producto/:prodCodigo', productController.updateProduct);
router.delete('/producto/:prodCodigo', productController.deleteProduct);

module.exports = router;
