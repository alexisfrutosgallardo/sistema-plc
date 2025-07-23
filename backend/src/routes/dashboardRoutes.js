// backend/src/routes/dashboardRoutes.js
const express = require('express');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// Rutas para el DASHBOARD
router.get('/dashboard/total-usuarios', dashboardController.getTotalUsers);
router.get('/dashboard/maquinas-activas', dashboardController.getActiveMachines);
router.get('/dashboard/total-stock', dashboardController.getTotalProductStock);
router.get('/dashboard/ultimas-entradas', dashboardController.getLatestEntries);
router.get('/dashboard/entradas-hoy', dashboardController.getTodayEntriesCount);

module.exports = router;
