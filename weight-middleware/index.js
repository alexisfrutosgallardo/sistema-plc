// weight-middleware/index.js
const { SerialPort } = require('serialport');
const { DelimiterParser } = require('@serialport/parser-delimiter'); // Cambiado a DelimiterParser
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001; // Puerto para el middleware (diferente al de tu backend y frontend)

const COM_PORT = 'COM4'; // ¡Asegúrate de que este sea el puerto correcto!
const BAUD_RATE = 9600;

let currentWeight = null; // Variable para almacenar el último peso leído

// Configuración de CORS para permitir solicitudes desde tu frontend React
app.use(cors({
  origin: 'http://localhost:3000', // Reemplaza con la URL de tu frontend React si es diferente
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Inicializar el puerto serial con la configuración confirmada
const port = new SerialPort({
  path: COM_PORT,
  baudRate: BAUD_RATE,
  dataBits: 7,
  parity: 'even',
  stopBits: 2,
  autoOpen: false // No abrir automáticamente para manejar errores
});

// Usar un DelimiterParser con '\r' (retorno de carro) como delimitador
// Esto es crucial si la báscula sobrescribe en HyperTerminal
const parser = port.pipe(new DelimiterParser({ delimiter: Buffer.from([0x0D]) })); // 0x0D es el código ASCII para '\r'

// Manejar la apertura del puerto
port.on('open', () => {
  console.log(`✅ Puerto serial ${COM_PORT} abierto a ${BAUD_RATE} baudios.`);
});

// Manejar los datos recibidos del puerto serial
parser.on('data', buffer => {
  // Convertir el Buffer a string para el parseo de texto
  const data = buffer.toString('ascii'); 
  
  // También loguear en hexadecimal para depuración
  console.log(`Datos crudos (ASCII): "${data}"`);
  console.log(`Datos crudos (HEX): ${buffer.toString('hex')}`);

  try {
    // El formato esperado es: ;p`XXXXXXYYYYYY
    // Donde XXXXXX son los 6 dígitos del peso y YYYYYY son otros 6 dígitos.
    // El carácter STX () es 0x02 en HEX. Es posible que el parser lo incluya o no.
    // La expresión regular busca ';p`' seguido de 6 dígitos para el peso y luego 6 dígitos más.
    const match = data.match(/;p`(\d{6})(\d{6})/);

    if (match) {
      let rawWeightString = match[1]; // Captura la primera secuencia de 6 dígitos, ej: "000205"

      // Parsear el peso: el último dígito es el primer decimal
      let integerPart = rawWeightString.substring(0, rawWeightString.length - 1); // "00020"
      let decimalPart = rawWeightString.substring(rawWeightString.length - 1);   // "5"

      // Eliminar ceros iniciales de la parte entera, pero asegurarse de que no quede vacío si es "0"
      integerPart = integerPart.replace(/^0+/, '') || '0';

      const weightString = `${integerPart}.${decimalPart}`; // "20.5"
      const weight = parseFloat(weightString);

      if (!isNaN(weight)) {
        currentWeight = weight;
        console.log(`Peso detectado: ${currentWeight} kg`);
      } else {
        console.warn(`⚠️ No se pudo convertir a número el peso: "${weightString}" de la cadena: "${data}"`);
      }
    } else {
      console.warn(`⚠️ No se encontró el patrón de peso esperado (ej: ;p\`XXXXXXYYYYYY) en la cadena: "${data}"`);
    }
  } catch (error) {
    console.error(`❌ Error al procesar datos de la báscula: ${error.message}`);
  }
});

// Manejar errores del puerto serial
port.on('error', err => {
  console.error(`❌ Error en el puerto serial ${COM_PORT}:`, err.message);
  // Intentar reabrir el puerto después de un breve retraso en caso de error
  setTimeout(() => {
    console.log(`Intentando reabrir el puerto ${COM_PORT}...`);
    port.open((err) => {
      if (err) {
        console.error(`Fallo al reabrir el puerto ${COM_PORT}:`, err.message);
      }
    });
  }, 2000); // Reintentar en 2 segundos
});

// Manejar el cierre del puerto
port.on('close', () => {
  console.log(`Puerto serial ${COM_PORT} cerrado.`);
});

// Abrir el puerto serial al iniciar el middleware
port.open((err) => {
  if (err) {
    console.error(`❌ Error al abrir el puerto serial ${COM_PORT}:`, err.message);
    console.error("Asegúrate de que la báscula esté conectada, encendida y que el puerto COM no esté siendo usado por otra aplicación.");
  }
});

// Endpoint HTTP para que el frontend obtenga el peso
app.get('/weight', (req, res) => {
  if (currentWeight !== null) {
    res.json({ weight: currentWeight, unit: 'kg' }); // Asumimos kg, ajusta si es necesario
  } else {
    res.status(404).json({ error: 'No se ha recibido peso de la báscula aún.' });
  }
});

// Iniciar el servidor Express
app.listen(PORT, () => {
  console.log(`🚀 Middleware de báscula escuchando en http://localhost:${PORT}`);
  console.log(`Endpoint para obtener peso: http://localhost:${PORT}/weight`);
});

// Manejo de cierre de la aplicación para cerrar el puerto serial
process.on('SIGINT', () => {
  console.log('Cerrando middleware...');
  if (port.isOpen) {
    port.close(() => {
      console.log('Puerto serial cerrado. Saliendo.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});
