import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { API_BASE_URL } from '../../../config/config';
import { Plus, Trash2, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import JsBarcode from 'jsbarcode';
import AuthModal from '../../auth/components/AuthModal'; // ✅ Importar el nuevo modal de autenticación

// URL del middleware de la báscula
const WEIGHT_MIDDLEWARE_URL = 'http://localhost:3001/weight';

// Función para obtener fecha local en formato YYYY-MM-DD
function getFechaLocal(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Función para obtener fecha y hora local en formato ISO completo (con TZ corregida)
function getFechaHoraLocal(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Función de utilidad para formatear la fecha a DD/MM/YYYY HH:mm:ss
const formatDateToDDMMYYYYHHMMSS = (inputDate) => {
  if (!inputDate) return '–';

  let date;
  if (inputDate instanceof Date) {
    date = inputDate;
  } else if (typeof inputDate === 'string') {
    if (inputDate.includes(' ')) {
      date = new Date(inputDate.replace(' ', 'T'));
    } else {
      date = new Date(`${inputDate}T00:00:00`);
    }
  } else {
    return 'Fecha inválida';
  }

  if (isNaN(date.getTime())) {
    return 'Fecha inválida';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

export default function Registro_Entrada_Operador({ usuario }) {
  const navigate = useNavigate();

  const [formCabecera, setFormCabecera] = useState({
    EntNumero: null,
    Fecha: '',
    NroCorte: '',
    Estado: '',
    Comentario: '',
    FechaCat: '',
    ProdCodigo: '',
    FechaCura: '',
    Usuario: '',
  });

  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [nextGlobalSerie, setNextGlobalSerie] = useState(0);
  const [loading, setLoading] = useState(true);

  // Estado para almacenar los detalles YA REGISTRADOS y mostrados en la tabla
  const [detallesRegistrados, setDetallesRegistrados] = useState([]);

  // Nuevo estado para el peso de la báscula
  const [pesoBascule, setPesoBascule] = useState(null);
  const [errorPesoBascule, setErrorPesoBascule] = useState(null);

  // Nuevo estado para almacenar el último detalle guardado, listo para imprimir con F9
  const [lastSavedDetailForPrint, setLastSavedDetailForPrint] = useState(null);

  // ✅ Estados para el modal de autenticación
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [detailToDeletePendingAuth, setDetailToDeletePendingAuth] = useState(null);


  const fetchDetallesRegistrados = useCallback(async () => {
    if (!formCabecera.EntNumero) return [];
    try {
      const res = await fetch(`${API_BASE_URL}/entrada/${formCabecera.EntNumero}/detalle`);
      const data = await res.json();
      if (res.ok) {
        const detalles = data.map(det => ({
          ...det,
          Cantidad: String(det.Cantidad),
          Fecha: getFechaLocal(new Date(det.Fecha)),
          FechaIngr: det.FechaIngr ? getFechaLocal(new Date(det.FechaIngr)) : '',
        }));
        setDetallesRegistrados(detalles);
        return detalles;
      }
    } catch (err) {
      // Manejo de error opcional
    }
    return [];
  }, [formCabecera.EntNumero]);


  // Efecto para obtener el peso de la báscula continuamente
  useEffect(() => {
    let intervalId;
    const fetchWeight = async () => {
      try {
        const response = await fetch(WEIGHT_MIDDLEWARE_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPesoBascule(data.weight);
        setErrorPesoBascule(null);
      } catch (error) {
        console.error("Error al obtener peso de la báscula:", error);
        setPesoBascule(null);
        setErrorPesoBascule('No se pudo conectar con la báscula o leer el peso.');
        setMensaje('❌ Error: No se pudo conectar con la báscula o leer el peso.');
        setTipoMensaje('error');
      }
    };

    fetchWeight();
    intervalId = setInterval(fetchWeight, 1000);

    return () => clearInterval(intervalId);
  }, []);


  useEffect(() => {
    const fetchOpenEntryAndDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/entrada/abierta`, {
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();

        if (res.ok) {
          setFormCabecera({
            EntNumero: data.EntNumero,
            Fecha: getFechaLocal(new Date(data.Fecha)),
            NroCorte: data.NroCorte,
            Estado: data.Estado,
            Comentario: data.Comentario,
            FechaCat: data.FechaCat,
            ProdCodigo: data.ProdCodigo,
            FechaCura: data.FechaCura,
            Usuario: data.Usuario,
          });

          const resDetalles = await fetch(`${API_BASE_URL}/entrada/${data.EntNumero}/detalle`);
          const dataDetalles = await resDetalles.json();
          if (resDetalles.ok) {
            setDetallesRegistrados(dataDetalles.map(det => ({
              ...det,
              Cantidad: String(det.Cantidad),
              Fecha: getFechaLocal(new Date(det.Fecha)),
              FechaIngr: det.FechaIngr ? getFechaLocal(new Date(det.FechaIngr)) : '',
            })));
          } else {
            console.error('Error al cargar detalles de la entrada abierta:', dataDetalles.error);
            setMensaje('❌ Error al cargar detalles de la entrada abierta.');
            setTipoMensaje('error');
          }

        } else {
          setTipoMensaje('info');
          setMensaje(data.error || 'No hay ninguna entrada con estado "Abierto" para cargar detalles. El supervisor debe crear una primero.');
          setFormCabecera(prev => ({ ...prev, EntNumero: null }));
        }
      } catch (err) {
        console.error("❌ Error al cargar la entrada abierta:", err);
        setTipoMensaje('error');
        setMensaje('❌ No se pudo conectar al servidor para cargar la entrada abierta.');
        setFormCabecera(prev => ({ ...prev, EntNumero: null }));
      } finally {
        setLoading(false);
      }
    };

    const fetchProductosYSerie = async () => {
      try {
        const resProductos = await fetch(`${API_BASE_URL}/producto`);
        const dataProductos = await resProductos.json();
        if (resProductos.ok) {
          setProductosDisponibles(dataProductos);
        } else {
          throw new Error(dataProductos.error || 'Error al cargar productos disponibles.');
        }
      } catch (err) {
        console.error("❌ Error al cargar productos:", err);
        setTipoMensaje('error');
        setMensaje(`❌ ${err.message || 'Error al cargar productos disponibles.'}`);
      }
      
      try {
        const resSerie = await fetch(`${API_BASE_URL}/entrada/series-counters`);
        const dataSerie = await resSerie.json();
        if (resSerie.ok) {
          setNextGlobalSerie(dataSerie.globalSerie + 1);
        } else {
          console.error("Error al obtener serie global:", dataSerie.error);
        }
      } catch (err) {
        console.error("Error de conexión al obtener serie global:", err);
      }
    };

    fetchOpenEntryAndDetails();
    fetchProductosYSerie();
  }, []);

  const productoPrincipalSeleccionado = useMemo(() => {
    return productosDisponibles.find(p => p.ProdCodigo === formCabecera?.ProdCodigo);
  }, [formCabecera?.ProdCodigo, productosDisponibles]);

  const printTicket = useCallback((ticketData, copyNumber) => {
    const { ProdNombre, NroCorte, Cantidad, FechaCat, Serie } = ticketData;

    const printWindow = window.open('', '_blank', 'height=400,width=300');
    
    if (!printWindow) {
      setMensaje('⚠️ El bloqueador de pop-ups impidió la impresión del ticket. Por favor, deshabilítalo para este sitio.');
      setTipoMensaje('info');
      console.error("Error: La ventana de impresión fue bloqueada por el navegador.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write('<!DOCTYPE html><html><head><title>Ticket de Entrada</title>');
    printWindow.document.write(`
      <style>
        body { font-family: monospace; font-size: 12px; margin: 0; padding: 0; }
        .ticket-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5mm;
          border: 1px solid black;
          margin: 2mm;
          box-sizing: border-box;
          width: 70mm;
          text-align: center;
        }
        svg { 
          width: 100%; 
          height: 80px; 
          display: block; 
          margin: 0 auto; 
        }
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .ticket-container { page-break-after: always; }
        }
      </style>
    `);
    printWindow.document.write('</head><body>');

    const ticketHtml = `
      <div class="ticket-container">
        <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">${ProdNombre}</div>
        <div style="margin-bottom: 10px;">OP ${NroCorte}</div>
        <svg id="barcode-${Serie}-${copyNumber}"></svg>
        <div style="margin-top: 5px;">${Serie}</div>
        <div style="margin-top: 10px; font-size: 14px;">${Cantidad} kg</div>
        <div style="margin-top: 5px;">${formatDateToDDMMYYYYHHMMSS(FechaCat)}</div>
      </div>
    `;
    printWindow.document.write(ticketHtml);

    printWindow.document.write('</body></html>');
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        try {
          const barcodeElement = printWindow.document.getElementById(`barcode-${Serie}-${copyNumber}`);
          if (barcodeElement) {
            JsBarcode(barcodeElement, Serie, {
              format: "CODE128",
              displayValue: false,
              height: 80,
              width: 1,
              margin: 0,
            });
            printWindow.print();
            printWindow.close();
          } else {
            console.error(`Error: No se encontró el elemento SVG con ID barcode-${Serie}-${copyNumber} en la ventana de impresión.`);
            printWindow.print();
            printWindow.close();
          }
        } catch (e) {
          console.error("Error al generar el código de barras o imprimir:", e);
          if (printWindow && !printWindow.closed) {
            printWindow.close();
          }
        }
      }, 100);
    };
  }, [setMensaje, setTipoMensaje]);

  // Función: Capturar peso y guardar un solo detalle (para F8)
  const handleCaptureAndSaveWeight = useCallback(async () => {
    console.log("F8/Botón 'Capturar y Guardar' presionado.");
    setMensaje('');
    setTipoMensaje('');
    setLastSavedDetailForPrint(null);
  
    if (!usuario?.legajo) {
      setTipoMensaje('error');
      setMensaje('❌ No se detectó el usuario autenticado. Por favor, inicie sesión.');
      return;
    }
    if (!formCabecera.EntNumero || formCabecera.Estado !== 'Abierto') {
      setTipoMensaje('error');
      setMensaje('❌ No hay una entrada abierta o no está en estado "Abierto" para agregar productos. El supervisor debe crear una o cambiar su estado.');
      return;
    }
    if (!formCabecera.ProdCodigo) {
      setTipoMensaje('error');
      setMensaje('⚠️ La cabecera de la entrada abierta no tiene un Producto Principal definido.');
      return;
    }
    if (pesoBascule === null || parseFloat(pesoBascule) <= 0) {
      setTipoMensaje('error');
      setMensaje('⚠️ No se ha detectado un peso válido de la báscula (debe ser > 0). Por favor, asegúrate de que esté conectada y funcionando.');
      return;
    }
  
    const newSerie = String(nextGlobalSerie);
    const detailPayload = {
      ProdCodigo: formCabecera.ProdCodigo,
      Serie: newSerie,
      Cantidad: parseFloat(pesoBascule),
      Fecha: getFechaLocal(),
      FechaCura: formCabecera.FechaCura,
      FechaIngr: getFechaLocal(),
      Estado: 'Activo',
      Usuario: usuario.legajo,
      FechaCat: getFechaHoraLocal(),
    };
  
    try {
      console.log(`Enviando POST a ${API_BASE_URL}/entrada/${formCabecera.EntNumero}/detalle con payload:`, detailPayload);
      const res = await fetch(`${API_BASE_URL}/entrada/${formCabecera.EntNumero}/detalle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(detailPayload)
      });
      const data = await res.json();
      console.log("Respuesta del backend:", data);
  
      if (!res.ok) {
        throw new Error(data.error || `Error al guardar el detalle con serie ${newSerie}.`);
      }
  
      setTipoMensaje('success');
      setMensaje(`✅ Detalle registrado correctamente. Ahora presiona F9 para imprimir el ticket.`);
  
      // Recargar la lista de detalles desde el backend para mostrar la serie real
      const nuevosDetalles = await fetchDetallesRegistrados();
      if (data.Serie && nuevosDetalles) {
        setLastSavedDetailForPrint(
          nuevosDetalles.find(det => det.Serie === data.Serie) || null
        );
      } else {
        setLastSavedDetailForPrint(null);
      }
      setNextGlobalSerie(prev => prev + 1);
  
    } catch (err) {
      console.error('❌ Error al procesar detalle de entrada:', err);
      setTipoMensaje('error');
      setMensaje(`❌ ${err.message || 'Ocurrió un error inesperado al guardar el detalle.'}`);
    }
    setTimeout(() => setMensaje(''), 5000);
  }, [
    usuario,
    formCabecera,
    pesoBascule,
    nextGlobalSerie,
    detallesRegistrados,
    setMensaje,
    setTipoMensaje,
    setNextGlobalSerie,
    setDetallesRegistrados,
    setLastSavedDetailForPrint,
    fetchDetallesRegistrados
  ]);

  // Función: Imprimir el ticket del último detalle guardado (para F9)
  const handlePrintLastSavedTicket = useCallback(() => {
    console.log("F9/Botón 'Imprimir Último Ticket' presionado.");
    setMensaje('');
    setTipoMensaje('');
  
    // Busca el último detalle registrado si no hay uno pendiente
    const detalleParaImprimir = lastSavedDetailForPrint || (detallesRegistrados.length > 0 ? detallesRegistrados[detallesRegistrados.length - 1] : null);
  
    if (!detalleParaImprimir) {
      setTipoMensaje('info');
      setMensaje('⚠️ No hay ningún detalle guardado recientemente para imprimir. Presiona F8 primero.');
      return;
    }
  
    const ticketData = {
      ProdNombre: productoPrincipalSeleccionado?.ProdNombre || 'N/A',
      NroCorte: formCabecera.NroCorte,
      Cantidad: detalleParaImprimir.Cantidad,
      FechaCat: detalleParaImprimir.FechaCat,
      Serie: detalleParaImprimir.Serie,
    };
    console.log(`Imprimiendo tickets para serie ${detalleParaImprimir.Serie}...`);
    printTicket(ticketData, 1); // Primera copia
    printTicket(ticketData, 2); // Segunda copia
  
    setMensaje('✅ Tickets impresos correctamente para el último detalle.');
    setTipoMensaje('success');
    setLastSavedDetailForPrint(null);
  
    setTimeout(() => setMensaje(''), 5000);
  }, [
    lastSavedDetailForPrint,
    detallesRegistrados,
    productoPrincipalSeleccionado,
    formCabecera,
    printTicket,
    setMensaje,
    setTipoMensaje,
    setLastSavedDetailForPrint
  ]);

  // ✅ Función para abrir el modal de autenticación antes de eliminar
  const requestDeleteAuth = useCallback((detail) => {
    setDetailToDeletePendingAuth(detail); // Guardar el detalle a eliminar
    setIsAuthModalOpen(true); // Abrir el modal
  }, []);

  // ✅ Callback que se ejecuta si la autenticación es exitosa
  const handleAuthSuccessForDeletion = useCallback(async () => {
    if (!detailToDeletePendingAuth) return; // No hay detalle pendiente

    console.log(`Autenticación exitosa para eliminar detalle con Serie: ${detailToDeletePendingAuth.Serie}`);
    setMensaje('');
    setTipoMensaje('');

    if (!formCabecera.EntNumero || formCabecera.Estado !== 'Abierto') {
      setTipoMensaje('error');
      setMensaje('❌ La entrada no está en estado "Abierto". No se pueden eliminar detalles.');
      setDetailToDeletePendingAuth(null); // Limpiar
      return;
    }

    try {
      // Llamada al backend para eliminar el detalle
      const res = await fetch(`${API_BASE_URL}/entrada/${formCabecera.EntNumero}/detalle/${detailToDeletePendingAuth.Serie}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Error al eliminar el detalle con serie ${detailToDeletePendingAuth.Serie}.`);
      }

      setTipoMensaje('success');
      setMensaje(`✅ Detalle con serie ${detailToDeletePendingAuth.Serie} eliminado correctamente y stock revertido.`);
      
      // Actualizar el estado local eliminando el detalle de la lista
      setDetallesRegistrados(prev => prev.filter(det => det.Serie !== detailToDeletePendingAuth.Serie));

    } catch (err) {
      console.error('❌ Error al eliminar detalle de entrada:', err);
      setTipoMensaje('error');
      setMensaje(`❌ ${err.message || 'Ocurrió un error inesperado al eliminar el detalle.'}`);
    } finally {
      setDetailToDeletePendingAuth(null); // Limpiar el detalle pendiente
      setTimeout(() => setMensaje(''), 5000);
    }
  }, [formCabecera, detailToDeletePendingAuth, setMensaje, setTipoMensaje, setDetallesRegistrados]);


  // Función: Re-imprimir un ticket de un detalle ya registrado
  const handleRePrintTicket = useCallback((detailToPrint) => {
    console.log(`Intentando reimprimir ticket para Serie: ${detailToPrint.Serie}`);
    setMensaje('');
    setTipoMensaje('');

    if (!formCabecera.EntNumero) {
      setTipoMensaje('error');
      setMensaje('❌ No hay una entrada activa para imprimir tickets.');
      return;
    }

    const ticketData = {
      ProdNombre: productoPrincipalSeleccionado?.ProdNombre || 'N/A',
      NroCorte: formCabecera.NroCorte,
      Cantidad: detailToPrint.Cantidad,
      FechaCat: detailToPrint.FechaCat,
      Serie: detailToPrint.Serie,
    };
    console.log(`Reimprimiendo tickets para serie ${detailToPrint.Serie}...`);
    printTicket(ticketData, 1); // Primera copia
    printTicket(ticketData, 2); // Segunda copia

    setMensaje(`✅ Tickets reimpresos correctamente para la serie ${detailToPrint.Serie}.`);
    setTipoMensaje('success');
    setTimeout(() => setMensaje(''), 5000);
  }, [formCabecera, productoPrincipalSeleccionado, printTicket, setMensaje, setTipoMensaje]);


  // Función: Finalizar la entrada (ahora solo como confirmación, NO cierra la entrada)
  const handleFinalizeEntry = useCallback(async () => {
    console.log("Botón 'Finalizar Proceso' presionado.");
    setMensaje('');
    setTipoMensaje('');

    if (!formCabecera.EntNumero) {
      setTipoMensaje('error');
      setMensaje('❌ No hay una entrada activa para finalizar.');
      return;
    }
    if (formCabecera.Estado !== 'Abierto') {
      setTipoMensaje('info');
      setMensaje('⚠️ La entrada ya está cerrada o en otro estado. No es necesario finalizarla.');
      return;
    }
    if (detallesRegistrados.length === 0) {
      setTipoMensaje('info');
      setMensaje('⚠️ No se han registrado detalles para esta entrada. Considera agregar productos antes de finalizar el proceso.');
    }

    setTipoMensaje('success');
    setMensaje('✅ Proceso de entrada finalizado para esta sesión. La entrada permanece abierta para futuras adiciones.');
    
    setTimeout(() => {
      setMensaje('');
      navigate('/registro/lista-entradas'); // Redirige después de 1 segundo
    }, 1000);

  }, [
    formCabecera, 
    detallesRegistrados, 
    setMensaje, 
    setTipoMensaje,
    navigate
  ]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'F8') {
        event.preventDefault();
        handleCaptureAndSaveWeight();
      } else if (event.key === 'F9') {
        event.preventDefault();
        handlePrintLastSavedTicket();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleCaptureAndSaveWeight, handlePrintLastSavedTicket]);


  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-600 text-lg">Cargando información de entrada...</p>
      </div>
    );
  }

  if (formCabecera.EntNumero === null && tipoMensaje === 'info') {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-yellow-100 text-yellow-700 rounded-lg shadow-lg mt-10 text-center">
        <p className="text-xl font-semibold mb-4">¡Atención!</p>
        <p className="text-lg">{mensaje}</p>
        <p className="mt-4">Por favor, espera a que un supervisor registre una nueva cabecera de entrada.</p>
      </div>
    );
  }

  const isEditable = formCabecera.Estado === 'Abierto';

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 shadow-lg rounded-lg mt-1">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
        Cargar Detalles de Entrada (Operador) - Entrada N° {formCabecera.EntNumero}
      </h2>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Información de la Cabecera</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md bg-blue-50 border-blue-200">
          <h3 className="md:col-span-2 text-xl font-semibold text-blue-800 mb-3">Cabecera de Entrada (Solo Lectura)</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nro. Entrada:</label>
            <p className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-blue-100 text-blue-900 font-bold">{formCabecera.EntNumero}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha:</label>
            <p className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-blue-100 text-blue-900">{formatDateToDDMMYYYYHHMMSS(formCabecera.Fecha, 'DD-MM-YYYY HH:mm:ss')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Número de Corte:</label>
            <p className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-blue-100 text-blue-900">{formCabecera.NroCorte}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Estado:</label>
            <p className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-blue-100 text-blue-900">{formCabecera.Estado}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Producto Principal:</label>
            <p className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-blue-100 text-blue-900">
              {productoPrincipalSeleccionado ? 
               `${productoPrincipalSeleccionado.ProdNombre} (${productoPrincipalSeleccionado.TipProdNombre})` : 
               'Cargando...'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha Cura (Cabecera):</label>
            <p className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-blue-100 text-blue-900">{formatDateToDDMMYYYYHHMMSS(formCabecera.FechaCura, 'DD-MM-YYYY HH:mm:ss')}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Comentario:</label>
            <p className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-blue-100 text-blue-900">{formCabecera.Comentario || 'N/A'}</p>
          </div>
        </div>

        {/* Sección para mostrar el peso actual de la báscula */}
        <div className="bg-blue-50 p-4 rounded-lg shadow-inner mt-6 text-center">
            <h4 className="text-lg font-semibold text-blue-800">Peso Actual de la Báscula:</h4>
            {errorPesoBascule ? (
                <p className="text-red-600 font-medium text-xl">{errorPesoBascule}</p>
            ) : (
                <p className="text-blue-900 font-bold text-4xl mt-2">
                    {pesoBascule !== null ? `${pesoBascule.toFixed(2)} kg` : 'Conectando...'}
                </p>
            )}
        </div>

        {/* Tabla de Detalles YA REGISTRADOS */}
        {detallesRegistrados.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold text-xl text-gray-700 mb-4">Detalles Ya Registrados</h3>
            <div className="overflow-x-auto bg-white shadow-md rounded-lg">
              <table className="min-w-full leading-normal">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-200">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ítem</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Producto</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Serie</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Peso</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha Cura</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha Ingreso</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider" colSpan="2">Acciones</th> {/* Columna para ambos botones */}
                  </tr>
                </thead>
                <tbody>
                  {[...detallesRegistrados]
                    .sort((a, b) => Number(b.Serie) - Number(a.Serie)) // Ordena descendente por Serie (puedes usar Iten si prefieres)
                    .map((det, index) => (
                    <tr key={det.Serie || index} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm">{det.Iten}</td>
                      <td className="px-5 py-3 text-sm">{productoPrincipalSeleccionado?.ProdNombre || 'N/A'} ({productoPrincipalSeleccionado?.TipProdNombre || 'N/A'})</td>
                      <td className="px-5 py-3 text-sm text-right">{det.Serie}</td>
                      <td className="px-5 py-3 text-sm text-right">{det.Cantidad}</td>
                      <td className="px-5 py-3 text-sm">{formatDateToDDMMYYYYHHMMSS(det.Fecha)}</td>
                      <td className="px-5 py-3 text-sm">{formatDateToDDMMYYYYHHMMSS(det.FechaCura)}</td>
                      <td className="px-5 py-3 text-sm">{det.FechaIngr ? formatDateToDDMMYYYYHHMMSS(det.FechaIngr) : '-'}</td>
                      <td className="px-5 py-3 text-sm">{det.Estado}</td>
                      <td className="px-2 py-3 text-center"> {/* Celda para el botón de imprimir */}
                        <button
                          type="button"
                          onClick={() => handleRePrintTicket(det)}
                          className="text-blue-600 hover:text-blue-900 transition-colors mr-2"
                          title="Reimprimir ticket"
                          disabled={!isEditable}
                        >
                          <Printer size={20} />
                        </button>
                      </td>
                      <td className="px-2 py-3 text-center"> {/* Celda para el botón de eliminar */}
                        <button
                          type="button"
                          onClick={() => requestDeleteAuth(det)} /* ✅ Llama a la función para abrir el modal */
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Eliminar detalle"
                          disabled={!isEditable}
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sección de Acciones para el Operador */}
        <div className="space-y-6 bg-white p-6 rounded-lg shadow-md mt-6">
          <h3 className="font-semibold text-xl text-gray-700 mb-4">Acciones del Operador</h3>
          {!isEditable && (
            <div className="p-3 mb-4 rounded-md bg-yellow-100 text-yellow-700 flex items-center gap-2">
              <span className="text-lg font-bold">!</span>
              La entrada está en estado "{formCabecera.Estado}". No se pueden agregar ni modificar detalles.
            </div>
          )}
        
          <div className="flex flex-row justify-between items-center gap-8 mt-4 w-full max-w-2xl mx-auto">
            <div className="w-full max-w-xs">
              <button
                type="button"
                onClick={handleCaptureAndSaveWeight}
                className="w-full bg-green-600 text-white px-5 py-7 rounded-md hover:bg-green-700 transition-colors shadow-md text-base font-medium flex items-center justify-center gap-2"
                disabled={!isEditable || pesoBascule === null || parseFloat(pesoBascule) <= 0}
              >
                <Plus size={20} /> Capturar Peso y Guardar Línea (F8)
              </button>
            </div>
            <div className="w-full max-w-xs">
              <button
                type="button"
                onClick={handleFinalizeEntry}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-md shadow-lg text-lg font-semibold hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                disabled={!isEditable}
              >
                Finalizar Proceso (Mantiene la Entrada Abierta)
              </button>
            </div>
          </div>
        </div> {/* CIERRE DE SECCIÓN DE ACCIONES */}

      </div> {/* CIERRE DEL DIV PRINCIPAL DE LA PÁGINA */}

      {/* Mensaje de feedback (fuera del formulario, pero dentro del div principal de la página) */}
      {mensaje && (
        <p className={`text-base text-center mt-4 ${tipoMensaje === 'success' ? 'text-green-600' : tipoMensaje === 'info' ? 'text-yellow-700' : 'text-red-500'}`}>
          {mensaje}
        </p>
      )}

      {/* ✅ Modal de Autenticación */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccessForDeletion} // Callback para cuando la autenticación es exitosa
        requiredRoles={['Supervisor', 'Admin']} // Roles que tienen permiso para eliminar
        errorMessage="Credenciales de Supervisor o Admin requeridas para eliminar."
      />
    </div>
  );
}
