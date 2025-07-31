// backend/src/routes/entryRoutes.js
const express = require('express');
const entryController = require('../controllers/entryController');

const router = express.Router();

// ✅ NUEVA RUTA: Obtener la única entrada con estado 'Abierto'
router.get('/entrada/abierta', entryController.getSingleOpenEntry);

// ✅ RUTA EXISTENTE: Obtener los contadores de serie global
router.get('/entrada/series-counters', entryController.getEntrySeriesCounters);

// ✅ Ruta nueva para el dashboard (últimas entradas)
router.get('/entrada/ultimas', entryController.getLatestEntries);


// ✅ RUTA EXISTENTE: Para verificar si un NroCorte ya existe
router.get('/entrada/check-nrocorte/:nroCorte', entryController.checkNroCorte);

// Rutas para ENTRADAS
router.get('/entrada', entryController.getAllEntries);
router.post('/entrada', entryController.createEntry);
router.delete('/entrada/:entNumero', entryController.deleteEntry);

router.get('/entrada/:entNumero/detalle', entryController.getEntryDetails);
router.get('/entrada/:entNumero', entryController.getEntryByNumber);
router.put('/entrada/:entNumero', entryController.updateEntry);

// Ruta para obtener los NroCorte únicos de Entrada1
router.get('/cortes-entrada1', entryController.getUniqueCortes);

module.exports = router;
