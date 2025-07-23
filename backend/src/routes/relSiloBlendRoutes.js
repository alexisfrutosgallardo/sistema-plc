// backend/src/routes/relSiloBlendRoutes.js
const express = require('express');
const relSiloBlendController = require('../controllers/relSiloBlendController'); // ✅ Ruta de importación actualizada

const router = express.Router();

// Rutas para RELACIONES SILO-BLEND
router.get('/relsilo', relSiloBlendController.getAllRelSiloBlend); // ✅ Ruta cambiada de /relsilo1 a /relsilo
router.get('/relsilo/:nroRelacion', relSiloBlendController.getRelSiloBlendByNroRelacion);
router.post('/relsilo', relSiloBlendController.createRelSiloBlend);
router.put('/relsilo/:nroRelacion', relSiloBlendController.updateRelSiloBlend); 
router.delete('/relsilo/:nroRelacion', relSiloBlendController.deleteRelSiloBlend); 
router.patch('/relsilo/estado/:nroRelacion', relSiloBlendController.toggleEstadoRelacion); // ✅ Ruta para alternar el estado de una relación Silo-Blend

module.exports = router;
