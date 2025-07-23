// backend/server.js
const express = require('express');
const cors = require('cors');
const db = require('./src/database'); // Importa la instancia de la base de datos

// Importaciones de rutas (CADA UNA DEBE ESTAR SOLO UNA VEZ)
const userRoutes = require('./src/routes/userRoutes');
const productRoutes = require('./src/routes/productRoutes');
const typeProductRoutes = require('./src/routes/typeProductRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const machineRoutes = require('./src/routes/machineRoutes');
const entryRoutes = require('./src/routes/entryRoutes');
const exitRoutes = require('./src/routes/exitRoutes');
const siloRoutes = require('./src/routes/siloRoutes');
const relSiloBlendRoutes = require('./src/routes/relSiloBlendRoutes'); 
const detalleMaquinaRoutes = require('./src/routes/detalleMaquinaRoutes');

const app = express();
const PORT = 5000;

// Configuración de CORS para permitir acceso desde la misma red local
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://10.2.1.128:3000',
    ];

    const isLocalIp = origin && (
      origin.startsWith('http://192.168.') ||
      origin.startsWith('http://10.')
    );

    if (!origin || allowedOrigins.indexOf(origin) !== -1 || isLocalIp) {
      callback(null, true);
    } else {
      console.error(`❌ CORS: Origen no permitido: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

app.use(express.json()); // Middleware para parsear JSON en el cuerpo de las solicitudes

// ----------------------------------------------------------------------
// 📌 RUTAS DE LA API
// ----------------------------------------------------------------------

// Usa las rutas importadas
app.use('/api', userRoutes);
app.use('/api', productRoutes);
app.use('/api', typeProductRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', machineRoutes);
app.use('/api', entryRoutes); // ✅ Asegúrate de que esta línea esté presente y correcta
app.use('/api', exitRoutes);
app.use('/api', siloRoutes);
app.use('/api', relSiloBlendRoutes); // ✅ Usando el nombre de variable corregido
app.use('/api', detalleMaquinaRoutes);

// ----------------------------------------------------------------------
// ⚙️ INICIO DEL SERVIDOR
// ----------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`🚀 Servidor Express corriendo en http://localhost:${PORT}`);
  console.log(`✅ CORS configurado para localhost y IPs de red local.`);
});