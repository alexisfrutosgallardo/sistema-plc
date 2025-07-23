// backend/src/routes/exitRoutes.js
const express = require('express');
const exitController = require('../controllers/exitController');

const router = express.Router();

// Rutas para SALIDAS
router.get('/salida', exitController.getAllExits);
router.get('/salida/:salNumero', exitController.getExitByNumber);
router.post('/salida', exitController.createExit);

// No se incluyen rutas para PUT/DELETE de salidas completas o ítems individuales
// debido a la complejidad de la lógica de negocio y la estructura de clave compuesta.
// Si se necesitan, deben ser manejados con cuidado.

module.exports = router;
