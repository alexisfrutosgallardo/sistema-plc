// backend/src/routes/typeProductRoutes.js
const express = require('express');
const typeProductController = require('../controllers/typeProductController'); // ✅ Importación correcta

const router = express.Router();

// Rutas para TIPO DE PRODUCTOS
router.get('/tipoproducto', typeProductController.getAllTypeProducts); // ✅ Ruta y referencia a la función correctas
router.get('/tipoproducto/:tipProdCodigo', typeProductController.getTypeProductByCode);
router.post('/tipoproducto', typeProductController.createTypeProduct);
router.put('/tipoproducto/:tipProdCodigo', typeProductController.updateTypeProduct);
router.delete('/tipoproducto/:tipProdCodigo', typeProductController.deleteTypeProduct);

module.exports = router;
