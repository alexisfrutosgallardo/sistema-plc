    // backend/src/database/index.js
    const path = require('path');
    const sqlite3 = require('sqlite3').verbose();

    // 📂 Ruta segura a la base de datos
    const dbPath = path.resolve(__dirname, '../../plc.db'); // ✅ Ajusta la ruta a tu DB

    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("❌ Error al conectar con la base de datos:", err.message);
      } else {
        console.log("✅ Conectado a la base de datos SQLite.");
      }
    });

    module.exports = db;
    