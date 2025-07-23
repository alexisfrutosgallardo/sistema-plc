// backend/src/routes/detalleMaquinaRoutes.js
const express = require('express');
const detalleMaquinaController = require('../controllers/detalleMaquinaController');

const router = express.Router();

// Rutas para DETALLE DE MÁQUINAS ASOCIADAS A RELACIÓN SILO-BLEND
// Obtener todas las máquinas asociadas a una relación específica
router.get('/relsiloblend2/:nroRelacion', detalleMaquinaController.getAllDetalleMaquinas);
// Crear una nueva máquina asociada
router.post('/relsiloblend2', detalleMaquinaController.createDetalleMaquina);
// Eliminar una máquina asociada por NroRelacion e Iten
router.delete('/relsiloblend2/:nroRelacion/:iten', detalleMaquinaController.deleteDetalleMaquina);

module.exports = router;
