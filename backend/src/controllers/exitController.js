// backend/src/controllers/exitController.js
const exitRepository = require('../repositories/exitRepository');

const exitController = {
  // Obtener todas las salidas con opción de ordenamiento
  getAllExits: async (req, res) => {
    try {
      const sortBy = req.query.sortBy;
      const order = req.query.order;
      const exits = await exitRepository.getAllExits(sortBy, order);
      res.json(exits); // Esto devolverá un array de objetos agrupados por SalNumero, cada uno con un array de 'items'
    } catch (err) {
      console.error("❌ Error al obtener salidas:", err.message);
      res.status(500).json({ error: "Error al obtener salidas." });
    }
  },

  // Obtener una salida por número (todos sus ítems)
  getExitByNumber: async (req, res) => {
    const { salNumero } = req.params;
    try {
      const exit = await exitRepository.getExitByNumber(salNumero);
      if (!exit) {
        return res.status(404).json({ error: "Salida no encontrada." });
      }
      res.json(exit); // Esto devolverá un objeto con la cabecera y el array de 'items'
    } catch (err) {
      console.error("❌ Error al obtener salida:", err.message);
      res.status(500).json({ error: "Error al obtener salida." });
    }
  },

  // Crear una nueva salida
  createExit: async (req, res) => {
    const { NroRelacion, Usuario, FechaCat, Estado, items } = req.body;
    if (!NroRelacion || !Usuario || !FechaCat || !Estado || !items || items.length === 0) {
      return res.status(400).json({ error: "⚠️ Faltan campos obligatorios o no hay ítems de salida." });
    }
    // Validar cada ítem
    for (const item of items) {
      if (!item.ProdCodigo || !item.Corte || !item.Serie || !item.Cantidad) {
        return res.status(400).json({ error: "⚠️ Cada ítem de salida debe tener ProdCodigo, Corte, Serie y Cantidad." });
      }
    }

    try {
      const result = await exitRepository.createExit(req.body);
      res.status(201).json(result);
    } catch (err) {
      console.error("❌ Error al crear salida:", err.message);
      if (err.message.includes("Stock insuficiente")) {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: "Error al registrar la salida." });
    }
  },

  // No se implementan métodos para actualizar o eliminar salidas completas o ítems individuales
  // debido a la complejidad de la lógica de negocio (reversión de stock, etc.)
  // y la estructura de clave compuesta. Si se necesitan, deben ser manejados con cuidado.
};

module.exports = exitController;
