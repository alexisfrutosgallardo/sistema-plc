// backend/src/controllers/entryController.js
const entryRepository = require('../repositories/entryRepository');

const entryController = {
  // Obtener todas las entradas con opción de ordenamiento y filtrado por estado
  getAllEntries: async (req, res) => {
    try {
      const sortBy = req.query.sortBy;
      const order = req.query.order;
      const estado = req.query.estado;
      const entries = await entryRepository.getAllEntries(sortBy, order, estado);
      res.json(entries);
    } catch (err) {
      console.error("❌ Error al obtener entradas:", err.message);
      res.status(500).json({ error: "Error al obtener entradas." });
    }
  },

  // Obtener una entrada por número
  getEntryByNumber: async (req, res) => {
    const { entNumero } = req.params;
    try {
      const entry = await entryRepository.getEntryByNumber(entNumero);
      if (!entry) {
        return res.status(404).json({ error: "Entrada no encontrada." });
      }
      res.json(entry);
    } catch (err) {
      console.error("❌ Error al obtener entrada:", err.message);
      res.status(500).json({ error: "Error al obtener entrada." });
    }
  },

  // Obtener detalles de una entrada
  getEntryDetails: async (req, res) => {
    const { entNumero } = req.params;
    try {
      const details = await entryRepository.getEntryDetails(entNumero);
      res.json(details);
    } catch (err) {
      console.error("❌ Error al obtener detalles de entrada:", err.message);
      res.status(500).json({ error: "Error al obtener detalles de entrada." });
    }
  },

  // Obtener la única entrada con estado 'Abierto'
  getSingleOpenEntry: async (req, res) => {
    try {
      const openEntry = await entryRepository.getSingleOpenEntry();
      if (!openEntry) {
        return res.status(404).json({ error: "No hay ninguna entrada con estado 'Abierto'." });
      }
      res.json(openEntry);
    } catch (err) {
      console.error("❌ Error al obtener entrada abierta:", err.message);
      res.status(500).json({ error: "Error al obtener la entrada abierta." });
    }
  },

  // Crear una nueva entrada (solo cabecera para supervisor, o completa para admin)
  createEntry: async (req, res) => {
    const { Fecha, NroCorte } = req.body;
    if (!Fecha || !NroCorte) {
      return res.status(400).json({ error: "⚠️ Faltan campos obligatorios de la cabecera (Fecha, NroCorte)." });
    }

    // Control: No permitir crear si ya existe una entrada "Abierto"
    try {
      const hasOpen = await entryRepository.hasOpenEntry();
      if (hasOpen) {
        return res.status(409).json({ error: "⚠️ Ya existe una entrada con estado 'Abierto'. Cierre o anule la entrada existente antes de crear una nueva." });
      }
    } catch (err) {
      console.error("❌ Error al verificar entradas abiertas:", err.message);
      return res.status(500).json({ error: "Error interno del servidor al verificar entradas abiertas." });
    }

    try {
      const result = await entryRepository.createEntry(req.body);
      res.status(201).json(result);
    } catch (err) {
      console.error("❌ Error al crear entrada:", err.message);
      if (err.message.includes('UNIQUE constraint failed: Entrada1.NroCorte')) {
        return res.status(409).json({ error: `El Número de Corte '${NroCorte}' ya existe. Por favor, ingrese uno diferente.` });
      }
      res.status(500).json({ error: "Error al registrar la entrada." });
    }
  },

  // ✅ NUEVO MÉTODO: Agregar un detalle a una entrada existente
  addEntryDetail: async (req, res) => {
    const { entNumero } = req.params;
    const detailData = req.body; // Un solo objeto de detalle

    if (!entNumero || !detailData.ProdCodigo || !detailData.Serie || !detailData.Cantidad || !detailData.Fecha || !detailData.FechaCura || !detailData.Estado) {
      return res.status(400).json({ error: "⚠️ Faltan campos obligatorios para el detalle de la entrada." });
    }

    try {
      const result = await entryRepository.addEntryDetail(parseInt(entNumero), detailData);
      res.status(201).json(result);
    } catch (err) {
      console.error("❌ Error al agregar detalle de entrada:", err.message);
      res.status(500).json({ error: "Error al agregar el detalle de la entrada." });
    }
  },

  // Actualizar una entrada existente (flexible para cabecera y/o detalles)
  updateEntry: async (req, res) => {
    const { entNumero } = req.params;
    const { Estado, productosSeleccionados, NroCorte } = req.body;

    try {
      // Validación para cerrar la operación: Solo si se intenta cambiar a 'Cerrado'
      if (Estado === 'Cerrado') {
        const hasDetails = await entryRepository.checkIfEntryHasDetails(entNumero);
        if (!hasDetails) {
          return res.status(400).json({ error: "❌ No se puede cerrar la operación sin tener productos de detalle cargados." });
        }
      }

      const payload = { ...req.body };
      // Si productosSeleccionados no está presente, significa que es una actualización de solo cabecera.
      // Si está presente, es una actualización de detalles (o completa).
      if (productosSeleccionados === undefined) {
        delete payload.productosSeleccionados; // Asegurarse de que no se envíe si no se pretende actualizar detalles
      }

      const result = await entryRepository.updateEntry(parseInt(entNumero), payload);
      res.json(result);
    } catch (err) {
      console.error("❌ Error al actualizar entrada:", err.message);
      if (err.message.includes('UNIQUE constraint failed: Entrada1.NroCorte')) {
        return res.status(409).json({ error: `El Número de Corte '${NroCorte}' ya existe para otra entrada.` });
      }
      res.status(500).json({ error: "Error al actualizar la entrada." });
    }
  },

  // Obtener cortes únicos de Entrada1
  getUniqueCortes: async (req, res) => {
    try {
      const cortes = await entryRepository.getUniqueCortes();
      res.json(cortes);
    } catch (err) {
      console.error("❌ Error al obtener cortes únicos:", err.message);
      res.status(500).json({ error: "Error al obtener la lista de cortes." });
    }
  },

  // Verificar si un NroCorte ya existe
  checkNroCorte: async (req, res) => {
    const { nroCorte } = req.params;
    if (!nroCorte) {
      return res.status(400).json({ error: "⚠️ El NroCorte es obligatorio para la verificación." });
    }
    try {
      const exists = await entryRepository.checkNroCorteExists(nroCorte);
      res.json({ exists: exists });
    } catch (err) {
      console.error("❌ Error al verificar NroCorte:", err.message);
      res.status(500).json({ error: "Error interno del servidor al verificar el número de corte." });
    }
  },

  // Eliminar una entrada
  deleteEntry: async (req, res) => {
    const { entNumero } = req.params;
    try {
      const result = await entryRepository.deleteEntry(parseInt(entNumero));
      if (result.changes === 0) {
        return res.status(404).json({ error: "Entrada no encontrada." });
      }
      res.json(result);
    } catch (err) {
      console.error("❌ Error al eliminar entrada:", err.message);
      res.status(500).json({ error: "Error al eliminar la entrada." });
    }
  },

  // Obtener los contadores actuales (serie global)
  getEntrySeriesCounters: async (req, res) => {
    try {
      const ultimaSerie = await entryRepository.obtenerUltimaSerie();
      res.json({ globalSerie: ultimaSerie });
    } catch (err) {
      console.error("❌ Error al obtener contadores de serie:", err.message);
      res.status(500).json({ error: "Error al obtener los contadores de serie." });
    }
  },

  getLatestEntries: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const entries = await entryRepository.getLatestEntries(limit);
      res.json(entries);
    } catch (err) {
      console.error("❌ Error al obtener últimas entradas:", err.message);
      res.status(500).json({ error: "Error al obtener últimas entradas." });
    }
  },

  // Para verificar si existe una entrada con estado 'Abierto'
  hasOpenEntry: async (req, res) => {
    try {
      const exists = await entryRepository.hasOpenEntry();
      res.json({ exists: exists });
    } catch (err) {
      console.error("❌ Error al verificar entradas abiertas:", err.message);
      res.status(500).json({ error: "Error interno del servidor al verificar entradas abiertas." });
    }
  },
};

module.exports = entryController;
