// backend/src/routes/siloRoutes.js
const express = require('express');
const siloController = require('../controllers/siloController');

const router = express.Router();

// Rutas para SILOS
router.get('/silo', siloController.getAllSilos);
router.get('/silo/:siloCodigo', siloController.getSiloByCode);
router.post('/silo', siloController.createSilo);
router.put('/silo/:siloCodigo', siloController.updateSilo);
router.delete('/silo/:siloCodigo', siloController.deleteSilo);

module.exports = router;
