// backend/src/controllers/dashboardController.js
const userRepository = require('../repositories/userRepository');
const machineRepository = require('../repositories/machineRepository');
const productRepository = require('../repositories/productRepository');
const entryRepository = require('../repositories/entryRepository');
const exitRepository = require('../repositories/exitRepository');
const siloRepository = require('../repositories/siloRepository'); // Importado

const dashboardController = {
  // Obtener el total de usuarios
  getTotalUsers: async (req, res) => {
    try {
      const result = await userRepository.getAllUsers();
      res.json({ count: result.length });
    } catch (err) {
      console.error("❌ Error al obtener total de usuarios:", err.message);
      res.status(500).json({ error: "Error al obtener total de usuarios." });
    }
  },

  // Obtener el total de máquinas
  getActiveMachines: async (req, res) => {
    try {
      const result = await machineRepository.getActiveMachinesCount();
      res.json(result);
    } catch (err) {
      console.error("❌ Error al obtener máquinas:", err.message);
      res.status(500).json({ error: "Error al obtener máquinas." });
    }
  },

  // Obtener el stock total de productos
  getTotalProductStock: async (req, res) => {
    try {
      const result = await productRepository.getTotalProductStock();
      res.json(result);
    } catch (err) {
      console.error("❌ Error al obtener stock total:", err.message);
      res.status(500).json({ error: "Error al obtener stock total." });
    }
  },

  // Obtener las últimas 5 entradas
  getLatestEntries: async (req, res) => {
    try {
      const result = await entryRepository.getLatestEntries();
      res.json(result);
    } catch (err) {
      console.error("❌ Error al obtener últimas entradas:", err.message);
      res.status(500).json({ error: "Error al obtener últimas entradas." });
    }
  },

  // Obtener el conteo de entradas hoy
  getTodayEntriesCount: async (req, res) => {
    try {
        const result = await entryRepository.getEntriesTodayCount();
        res.json(result);
    } catch (err) {
        console.error("❌ Error al obtener entradas de hoy:", err.message);
        res.status(500).json({ error: "Error al obtener entradas de hoy." });
    }
  },

  // Obtener el conteo de salidas este mes
  getMonthlyExitsCount: async (req, res) => {
    try {
        const result = await exitRepository.getMonthlyExitsCount();
        res.json(result);
    } catch (err) {
        console.error("❌ Error al obtener salidas de este mes:", err.message);
        res.status(500).json({ error: "Error al obtener salidas de este mes." });
    }
  },

  // Obtener el conteo de silos (anteriormente "Silos Activos", ahora cuenta todos)
  getActiveSilosCount: async (req, res) => {
    try {
        const result = await siloRepository.getActiveSilosCount(); // Ahora cuenta todos los silos
        res.json(result);
    } catch (err) {
        console.error("❌ Error al obtener silos:", err.message); // Mensaje ajustado
        res.status(500).json({ error: "Error al obtener silos." });
    }
  },
};

module.exports = dashboardController;
