// weight-middleware/index.js
const { SerialPort } = require('serialport');
const { DelimiterParser } = require('@serialport/parser-delimiter'); // ✅ Volvemos a DelimiterParser
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001; // Puerto para el middleware (diferente al de tu backend y frontend)

const COM_PORT = 'COM3'; // ✅ COM3 según tu última configuración
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
  dataBits: 7,    // ✅ 7 bits de datos
  parity: 'none', // ✅ Sin paridad
  stopBits: 2,
  autoOpen: false // No abrir automáticamente para manejar errores
});

// ✅ CAMBIO CLAVE: Usar DelimiterParser con retorno de carro (0x0D) como delimitador
// La imagen de HyperTerminal y los logs HEX confirman que 0x0D se envía al final de la trama.
const parser = port.pipe(new DelimiterParser({ delimiter: Buffer.from([0x0D]) }));

// Manejar la apertura del puerto
port.on('open', () => {
  console.log(`✅ Puerto serial ${COM_PORT} abierto a ${BAUD_RATE} baudios.`);
});

// Manejar los datos recibidos del puerto serial
parser.on('data', buffer => {
  // Convertir el Buffer a string para el parseo de texto
  // Usamos 'ascii' porque los caracteres como STX (0x02) son caracteres ASCII extendidos.
  const data = buffer.toString('ascii').trim(); // ✅ .trim() para quitar posibles espacios en blanco extra
  
  // Loguear en hexadecimal para depuración
  console.log(`Datos crudos (ASCII): "${data}"`);
  console.log(`Datos crudos (HEX): ${buffer.toString('hex')}`);

  try {
    // ✅ Expresión regular ajustada para la báscula Gemini
    // La trama completa en ASCII del HyperTerminal es "☻+p`0001390000"
    // - \x02: Coincide con el carácter STX (0x02).
    // - \+: Coincide con el signo más literalmente.
    // - p`: Coincide con la cadena literal "p`".
    // - (\d{6}): Captura los primeros 6 dígitos (el peso).
    // - (\d{4}): Captura los siguientes 4 dígitos (el resto de la cadena, "0000").
    const match = data.match(/\x02\+p`(\d{6})(\d{4})/);

    if (match) {
      let rawWeightString = match[1]; // Captura la secuencia de 6 dígitos, ej: "000139"

      // Parsear el peso: el último dígito es el primer decimal
      let integerPart = rawWeightString.substring(0, rawWeightString.length - 1); // "00013"
      let decimalPart = rawWeightString.substring(rawWeightString.length - 1);   // "9"

      // Eliminar ceros iniciales de la parte entera, pero asegurarse de que no quede vacío si es "0"
      integerPart = integerPart.replace(/^0+/, '') || '0';

      const weightString = `${integerPart}.${decimalPart}`; // "13.9"
      const weight = parseFloat(weightString);

      if (!isNaN(weight)) {
        currentWeight = weight;
        console.log(`Peso detectado: ${currentWeight} kg`);
      } else {
        console.warn(`⚠️ No se pudo convertir a número el peso: "${weightString}" de la cadena: "${data}"`);
      }
    } else {
      console.warn(`⚠️ No se encontró el patrón de peso esperado (ej: ☻+p\`XXXXXXYYYY) en la cadena: "${data}"`);
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
