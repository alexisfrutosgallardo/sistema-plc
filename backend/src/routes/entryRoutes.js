// backend/src/routes/entryRoutes.js
const express = require('express');
const entryController = require('../controllers/entryController');

const router = express.Router();

// ✅ RUTAS ESPECÍFICAS (DEBEN IR PRIMERO)
// Para verificar si existe una entrada con estado 'Abierto'
router.get('/entrada/check-open-entry', entryController.hasOpenEntry);

// Para verificar si un NroCorte ya existe
router.get('/entrada/check-nrocorte/:nroCorte', entryController.checkNroCorte);

// Obtener la única entrada con estado 'Abierto' (usada por el operador)
router.get('/entrada/abierta', entryController.getSingleOpenEntry);

// Obtener los contadores de serie global
router.get('/entrada/series-counters', entryController.getEntrySeriesCounters);

// Ruta nueva para el dashboard (últimas entradas)
router.get('/entrada/ultimas', entryController.getLatestEntries);

// Ruta para obtener los NroCorte únicos de Entrada1
router.get('/cortes-entrada1', entryController.getUniqueCortes);

// ✅ NUEVA RUTA: Agregar un detalle a una entrada existente
router.post('/entrada/:entNumero/detalle', entryController.addEntryDetail);


// ✅ RUTAS GENERALES (DEBEN IR DESPUÉS)
// Obtener todas las entradas
router.get('/entrada', entryController.getAllEntries);

// Crear una nueva entrada (cabecera)
router.post('/entrada', entryController.createEntry);

// Eliminar una entrada
router.delete('/entrada/:entNumero', entryController.deleteEntry);

// Obtener detalles de una entrada por número (esta ruta ya existía)
router.get('/entrada/:entNumero/detalle', entryController.getEntryDetails);

// Obtener una entrada por número (debe ir después de /:entNumero/detalle)
router.get('/entrada/:entNumero', entryController.getEntryByNumber);

// Actualizar una entrada (cabecera y/o reemplazar todos los detalles)
router.put('/entrada/:entNumero', entryController.updateEntry);


module.exports = router;
