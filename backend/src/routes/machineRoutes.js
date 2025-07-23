// backend/src/routes/machineRoutes.js
const express = require('express');
const machineController = require('../controllers/machineController');

const router = express.Router();

// Rutas para MÁQUINAS
router.get('/maquina', machineController.getAllMachines);
router.get('/maquina/:maqCodigo', machineController.getMachineByCode);
router.post('/maquina', machineController.createMachine);
router.put('/maquina/:maqCodigo', machineController.updateMachine);
router.delete('/maquina/:maqCodigo', machineController.deleteMachine);

module.exports = router;
