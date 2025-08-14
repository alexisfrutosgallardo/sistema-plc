import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { API_BASE_URL } from '../../../config/config';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, CheckCircle2, Printer } from 'lucide-react'; // Import Printer icon
import JsBarcode from 'jsbarcode'; // Import JsBarcode for printing tickets
import AuthModal from '../../auth/components/AuthModal'; // Import AuthModal for deletion confirmation

// URL del middleware de la báscula
const WEIGHT_MIDDLEWARE_URL = 'http://localhost:3001/weight'; // Add weight middleware URL

// Función para obtener fecha local en formato YYYY-MM-DD
function getFechaLocal(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Función de utilidad para formatear la fecha a YYYY-MM-DD HH:mm:ss o DD-MM-YYYY HH:mm:ss
// Ahora es más robusta para aceptar Date objects o strings
const formatDateToDDMMYYYYHHMMSS  = (inputDate, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!inputDate) return '–';

  let date;
  if (inputDate instanceof Date) {
    date = inputDate;
  } else if (typeof inputDate === 'string') {
    // Intentar parsear la cadena. Si incluye tiempo, reemplazar ' ' con 'T' para ISO.
    if (inputDate.includes(' ')) {
      date = new Date(inputDate.replace(' ', 'T'));
    } else {
      // Si es solo una fecha (YYYY-MM-DD), interpretarla como local a las 00:00:00
      date = new Date(`${inputDate}T00:00:00`);
    }
  } else {
    return 'Fecha inválida';
  }

  if (isNaN(date.getTime())) {
    return 'Fecha inválida';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  if (format === 'DD-MM-YYYY HH:mm:ss') {
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Función para sumar horas a una fecha (objeto Date) y devolver un string YYYY-MM-DD HH:mm:ss
function addHoursToDateTimeString(baseDate, hoursToAdd) {
  if (!(baseDate instanceof Date) || hoursToAdd === undefined || hoursToAdd === null || isNaN(hoursToAdd)) {
    return ''; // Retorna cadena vacía para entrada inválida
  }
  const newDate = new Date(baseDate.getTime()); // Clonar la fecha base para no modificar la original
  newDate.setHours(newDate.getHours() + hoursToAdd);

  // Devolver en el formato YYYY-MM-DD HH:mm:ss para guardar en la DB
  const year = newDate.getFullYear();
  const month = String(newDate.getMonth() + 1).padStart(2, '0');
  const day = String(newDate.getDate()).padStart(2, '0');
  const hours = String(newDate.getHours()).padStart(2, '0');
  const minutes = String(newDate.getMinutes()).padStart(2, '0');
  const seconds = String(newDate.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export default function Registro_Entrada_Admin({ usuario, entNumeroParam }) {
  const navigate = useNavigate();

  const [formCabecera, setFormCabecera] = useState({
    Fecha: getFechaLocal(), // Esto sigue siendo solo la fecha (YYYY-MM-DD)
    NroCorte: '',
    Estado: 'Abierto',
    Comentario: '',
    FechaCat: formatDateToDDMMYYYYHHMMSS(new Date()), // Fecha de carga con hora exacta
    ProdCodigo: '',
    FechaCura: '', // Se inicializa vacía y se calcula con hora exacta
  });

  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [nroCorteError, setNroCorteError] = useState('');
  const [editando, setEditando] = useState(false);
  const [nextGlobalSerie, setNextGlobalSerie] = useState(0);
  const [tieneDetalles, setTieneDetalles] = useState(0); // Para saber si tiene detalles cargados
  // ✅ Nuevo estado para controlar si ya existe una entrada abierta
  const [hasOpenEntryExists, setHasOpenEntryExists] = useState(false);

  // Estados de Operador copiados:
  const [pesoBascule, setPesoBascule] = useState(null);
  const [errorPesoBascule, setErrorPesoBascule] = useState(null);
  const [lastSavedDetailForPrint, setLastSavedDetailForPrint] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [detailToDeletePendingAuth, setDetailToDeletePendingAuth] = useState(null);


  // Fetch detalles registrados (copiado de Operador, adaptado)
  const fetchDetallesRegistrados = useCallback(async (entNum) => {
    if (!entNum) return [];
    try {
      const res = await fetch(`${API_BASE_URL}/entrada/${entNum}/detalle`);
      const data = await res.json();
      if (res.ok) {
        const detalles = data.map(det => ({
          ...det,
          Cantidad: String(det.Cantidad),
          Fecha: getFechaLocal(new Date(det.Fecha)),
          FechaIngr: det.FechaIngr ? getFechaLocal(new Date(det.FechaIngr)) : '',
        }));
        setProductosSeleccionados(detalles); // Admin usa productosSeleccionados para los detalles
        return detalles;
      }
    } catch (err) {
      console.error("Error al obtener detalles registrados:", err);
    }
    return [];
  }, []);

  // Efecto para obtener el peso de la báscula continuamente (copiado de Operador)
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
    // Cargar productos disponibles
    fetch(`${API_BASE_URL}/producto`, {
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(setProductosDisponibles)
      .catch(() => {
        setTipoMensaje('error');
        setMensaje('❌ Error al cargar productos disponibles.');
      });

    // Obtener la última serie global (para nuevos detalles)
    const fetchGlobalSerie = async () => {
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
    fetchGlobalSerie();

    // ✅ Verificar si ya existe una entrada abierta (solo si no estamos editando)
    const checkOpenEntryStatus = async () => {
      if (!entNumeroParam) { // Solo si estamos en modo creación
        try {
          const res = await fetch(`${API_BASE_URL}/entrada/check-open-entry`);
          const data = await res.json();
          if (res.ok) {
            setHasOpenEntryExists(data.exists);
            if (data.exists) {
              setTipoMensaje('info');
              setMensaje('⚠️ Ya existe una entrada con estado "Abierto". No se puede crear una nueva hasta que la existente sea cerrada o anulada.');
              // Si hay una entrada abierta, cargarla para que el admin pueda interactuar con ella
              if (data.EntNumero) {
                const fetchOpenEntryForAdmin = async (entNum) => {
                  try {
                    const resCabecera = await fetch(`${API_BASE_URL}/entrada/${entNum}`);
                    if (!resCabecera.ok) throw new Error('Error al cargar la cabecera de la entrada abierta.');
                    const dataCabecera = await resCabecera.json();

                    setFormCabecera({
                      EntNumero: dataCabecera.EntNumero,
                      Fecha: getFechaLocal(new Date(dataCabecera.Fecha)),
                      NroCorte: dataCabecera.NroCorte,
                      Estado: dataCabecera.Estado,
                      Comentario: dataCabecera.Comentario,
                      FechaCat: dataCabecera.FechaCat,
                      ProdCodigo: dataCabecera.ProdCodigo,
                      FechaCura: dataCabecera.FechaCura,
                      Usuario: dataCabecera.Usuario,
                    });
                    setTieneDetalles(dataCabecera.TieneDetalles || 0);
                    await fetchDetallesRegistrados(dataCabecera.EntNumero); // Cargar los detalles existentes
                  } catch (err) {
                    console.error("❌ Error al cargar la entrada abierta para Admin:", err);
                    setTipoMensaje('error');
                    setMensaje(`❌ ${err.message || 'Ocurrió un error al cargar la entrada abierta para edición.'}`);
                  }
                };
                fetchOpenEntryForAdmin(data.EntNumero);
              }
            } else {
              setMensaje(''); // Limpiar mensaje si no hay entradas abiertas
              // Si no hay entrada abierta, asegurar que el formulario esté en estado de creación
              setFormCabecera({
                Fecha: getFechaLocal(),
                NroCorte: '',
                Estado: 'Abierto',
                Comentario: '',
                FechaCat: formatDateToDDMMYYYYHHMMSS(new Date()),
                ProdCodigo: '',
                FechaCura: '',
              });
              setProductosSeleccionados([]);
            }
          } else {
            console.error("Error al verificar entrada abierta:", data.error);
            setTipoMensaje('error');
            setMensaje('❌ Error al verificar el estado de entradas abiertas.');
          }
        } catch (err) {
          console.error("Error de conexión al verificar entrada abierta:", err);
          setTipoMensaje('error');
          setMensaje('❌ No se pudo conectar al servidor para verificar entradas abiertas.');
        }
      }
    };
    checkOpenEntryStatus();


    // Lógica para cargar datos si estamos editando (directamente por URL entNumeroParam)
    if (entNumeroParam) {
      setEditando(true);
      const fetchEntradaParaEditar = async () => {
        try {
          const resCabecera = await fetch(`${API_BASE_URL}/entrada/${entNumeroParam}`);
          if (!resCabecera.ok) throw new Error('Error al cargar la cabecera de la entrada.');
          const dataCabecera = await resCabecera.json();

          setFormCabecera({
            EntNumero: dataCabecera.EntNumero, // Asegurar que EntNumero se carga para edición
            Fecha: getFechaLocal(new Date(dataCabecera.Fecha)),
            NroCorte: dataCabecera.NroCorte,
            Estado: dataCabecera.Estado,
            Comentario: dataCabecera.Comentario,
            FechaCat: dataCabecera.FechaCat, // Mantener la fecha de carga original
            ProdCodigo: dataCabecera.ProdCodigo,
            FechaCura: dataCabecera.FechaCura, // Mantener la fecha de cura original (ya viene de la DB)
            Usuario: dataCabecera.Usuario, // Asegurar que el usuario de la cabecera se carga
          });
          setTieneDetalles(dataCabecera.TieneDetalles || 0);
          await fetchDetallesRegistrados(entNumeroParam); // Cargar detalles para edición

        } catch (err) {
          console.error("❌ Error al cargar entrada para edición (Admin):", err);
          setTipoMensaje('error');
          setMensaje(`❌ ${err.message || 'Ocurrió un error al cargar la entrada para edición.'}`);
        }
      };
      fetchEntradaParaEditar();
    }
  }, [entNumeroParam, fetchDetallesRegistrados]); // Add fetchDetallesRegistrados to dependencies

  // Efecto para calcular FechaCura cuando cambia ProdCodigo
  // Ahora usa new Date() para obtener la hora exacta del momento
  useEffect(() => {
    if (formCabecera.ProdCodigo) {
      const selectedProduct = productosDisponibles.find(p => p.ProdCodigo === formCabecera.ProdCodigo);
      if (selectedProduct && selectedProduct.HorasCura !== undefined && selectedProduct.HorasCura !== null) {
        const now = new Date(); // Obtener la fecha y hora exacta actual
        const calculatedFechaCura = addHoursToDateTimeString(now, selectedProduct.HorasCura);
        setFormCabecera(prev => ({ ...prev, FechaCura: calculatedFechaCura }));
      } else {
        setFormCabecera(prev => ({ ...prev, FechaCura: '' })); // Reset if no HorasCura
      }
    } else {
      setFormCabecera(prev => ({ ...prev, FechaCura: '' })); // Clear if no product
    }
  }, [formCabecera.ProdCodigo, productosDisponibles]);

  const productoPrincipalSeleccionado = useMemo(() => {
    return productosDisponibles.find(p => p.ProdCodigo === formCabecera.ProdCodigo);
  }, [formCabecera.ProdCodigo, productosDisponibles]);

  useEffect(() => {
    // Si el producto principal cambia, actualiza el ProdCodigo en todos los detalles
    // Esto es útil si el admin cambia el producto principal después de agregar detalles
    if (formCabecera.ProdCodigo) {
      setProductosSeleccionados(prevProductos =>
        prevProductos.map(prod => ({
          ...prod,
          ProdCodigo: formCabecera.ProdCodigo
        }))
      );
    }
  }, [formCabecera.ProdCodigo]);

  const handleCabeceraChange = async e => {
    const { name, value } = e.target;
    setFormCabecera(prev => ({ ...prev, [name]: value }));

    if (name === 'NroCorte' && value.trim() !== '') {
      if (!editando || (editando && value.trim() !== formCabecera.NroCorte)) {
        try {
          const res = await fetch(`${API_BASE_URL}/entrada/check-nrocorte/${value.trim()}`, {
            headers: { 'Content-Type': 'application/json' },
          });
          const data = await res.json();
          if (data.exists) {
            setNroCorteError(`⚠️ El Número de Corte '${value.trim()}' ya existe.`);
          } else {
            setNroCorteError('');
          }
        } catch (err) {
          console.error("Error al verificar NroCorte:", err);
          setNroCorteError('Error al verificar el número de corte.');
        }
      } else {
        setNroCorteError('');
      }
    } else if (name === 'NroCorte' && value.trim() === '') {
      setNroCorteError('');
    }
  };

  // Función para agregar un producto de detalle (ahora adaptado para la lógica de Operador)
  const handleAgregarProducto = useCallback(async () => {
    if (!usuario?.legajo) {
      setTipoMensaje('error');
      setMensaje('❌ No se detectó el usuario autenticado. Por favor, inicie sesión.');
      return;
    }
    if (!formCabecera.EntNumero || formCabecera.Estado !== 'Abierto') {
      setTipoMensaje('error');
      setMensaje('❌ No hay una entrada abierta o no está en estado "Abierto" para agregar productos. La entrada debe estar en estado "Abierto".');
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
      FechaCat: formatDateToDDMMYYYYHHMMSS(new Date()),
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
      setMensaje(`✅ Detalle registrado correctamente. Ahora presiona F9 o el botón de imprimir ticket.`);
  
      // Recargar la lista de detalles desde el backend para mostrar la serie real
      const nuevosDetalles = await fetchDetallesRegistrados(formCabecera.EntNumero);
      if (data.Serie && nuevosDetalles) {
        setLastSavedDetailForPrint(
          nuevosDetalles.find(det => parseInt(det.Serie) === parseInt(data.Serie)) || null // Use parseInt for comparison
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
    setMensaje,
    setTipoMensaje,
    setNextGlobalSerie,
    setLastSavedDetailForPrint,
    fetchDetallesRegistrados
  ]);


  const handleProductoChange = (index, field, value) => {
    const nuevosProductos = [...productosSeleccionados];
    nuevosProductos[index][field] = value;
    setProductosSeleccionados(nuevosProductos);
  };

  const handleEliminarProducto = useCallback(async (detail) => {
    setMensaje('');
    setTipoMensaje('');

    if (!formCabecera.EntNumero || formCabecera.Estado !== 'Abierto') {
      setTipoMensaje('error');
      setMensaje('❌ La entrada no está en estado "Abierto". No se pueden eliminar detalles.');
      return;
    }

    try {
      // Direcciones sin /api/
      const res = await fetch(`${API_BASE_URL}/entrada/${formCabecera.EntNumero}/detalle/${detail.Serie}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Error al eliminar el detalle con serie ${detail.Serie}.`);
      }

      setTipoMensaje('success');
      setMensaje(`✅ Detalle con serie ${parseInt(detail.Serie)} eliminado correctamente y stock revertido.`);
      
      // Actualizar el estado local eliminando el detalle de la lista
      setProductosSeleccionados(prev => prev.filter(det => parseInt(det.Serie) !== parseInt(detail.Serie)));

    } catch (err) {
      console.error('❌ Error al eliminar detalle de entrada:', err);
      setTipoMensaje('error');
      setMensaje(`❌ ${err.message || 'Ocurrió un error inesperado al eliminar el detalle.'}`);
    } finally {
      setTimeout(() => setMensaje(''), 5000);
    }
  }, [formCabecera, setMensaje, setTipoMensaje, setProductosSeleccionados]);


  // Función para abrir el modal de autenticación antes de eliminar (copiado de Operador)
  const requestDeleteAuth = useCallback((detail) => {
    setDetailToDeletePendingAuth(detail); // Guardar el detalle a eliminar
    setIsAuthModalOpen(true); // Abrir el modal
  }, []);

  // Callback que se ejecuta si la autenticación es exitosa (copiado de Operador)
  const handleAuthSuccessForDeletion = useCallback(async () => {
    if (!detailToDeletePendingAuth) return; // No hay detalle pendiente

    console.log(`Autenticación exitosa para eliminar detalle con Serie: ${detailToDeletePendingAuth.Serie}`);
    // Llamar directamente a handleEliminarProducto con el detalle pendiente
    await handleEliminarProducto(detailToDeletePendingAuth); 
    setDetailToDeletePendingAuth(null); // Limpiar el detalle pendiente
  }, [detailToDeletePendingAuth, handleEliminarProducto]);


  // printTicket function (copied from Operador, adapted for Admin)
  const printTicket = useCallback((ticketData) => {
    const { ProdNombre, NroCorte, Cantidad, FechaCat, Serie } = ticketData;
    
    // Abrir ventana de impresión
    const printWindow = window.open('', '_blank', 'height=900,width=1200');
    
    // Verificar si el pop-up fue bloqueado
    if (!printWindow) {
      setMensaje('⚠️ El bloqueador de pop-ups impidió la impresión del ticket. Por favor, deshabilítalo para este sitio.');
      setTipoMensaje('info');
      return;
    }

    // Generar contenido HTML del ticket
    printWindow.document.open();
    printWindow.document.write('<!DOCTYPE html><html><head><title>Ticket</title>');
    
    // Estilos CSS
    printWindow.document.write(`
      <style>
        /* Fuente global para todo el ticket */
        body, .header-text, .op-text, .series-text, .quantity-text, .date-text {
          font-family: "Arial Unicode MS", Arial, sans-serif !important;
        }

        @page { 
          size: 105mm 75mm; /* Ancho x Alto del ticket */
          margin: 0; 
          padding: 0; 
        }
        
        html, body {
          width: 100%;
          height: 90%;
          margin: 0;
          padding: 0;
        }
        
        .ticket-container { 
          margin-top: 15mm; 
          margin-right: -9mm; 
          display: flex; 
          flex-direction: row; 
          justify-content: center; 
          align-items: center; 
          gap: 5mm; 
          width: 100%; 
          height: 100%; 
          box-sizing: border-box; 
        }
        
        .ticket-outer { 
          width: 49mm; 
          height: 100%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          box-sizing: border-box; 
        }
        
        .ticket-inner { 
          width: 100%; 
          height: 100%; 
          display: flex; 
          flex-direction: column; 
          justify-content: flex-start; 
          align-items: center; 
          padding: 0; 
          box-sizing: border-box; 
          text-align: center; 
        }
        
        .header-text { 
          font-size: 28px; 
          font-weight: bold; 
          margin-bottom: 0mm; 
          line-height: 1.2; 
        }
        
        .op-text { 
          font-size: 24px; 
          margin-bottom: 2mm; 
        }
        
        svg { 
          width: 90%; 
          height: 28mm; 
          margin-bottom: 0mm; 
        }
        
        .series-text { 
          font-size: 14px; 
          font-weight: bold; 
          margin-top: 0mm; 
        }
        
        .quantity-text { 
          font-size: 28px; 
          font-weight: bold; 
          margin-top: 2mm; 
          margin-bottom: 1mm; 
        }
        
        .date-text { 
          font-size: 18px; 
          margin-top: 0mm; 
        }
        
        @media print { 
          html, body { 
            page-break-before: avoid !important; 
            page-break-after: avoid !important; 
            page-break-inside: avoid !important; 
            break-before: avoid !important; 
            break-after: avoid !important; 
            break-inside: avoid !important; 
          } 
        }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    `);
    
    printWindow.document.write('</head><body>');

    // Función para generar el contenido de un ticket individual
    const singleTicketHtmlContent = (idSuffix) => `
      <div class="ticket-inner">
        <div class="header-text">${ProdNombre}</div>
        <div class="op-text">OP ${NroCorte}</div>
        <svg id="barcode-${Serie}-${idSuffix}"></svg>
        <div class="series-text">${parseInt(Serie)}</div>
        <div class="quantity-text">${Cantidad} kg</div>
        <div class="date-text">${formatDateToDDMMYYYYHHMMSS(FechaCat)}</div>
      </div>
    `;

    // Contenedor principal del ticket
    printWindow.document.write(`
      <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
        <div class="ticket-container">
          <div class="ticket-outer">
            ${singleTicketHtmlContent('left')}
          </div>
          <div class="ticket-outer">
            ${singleTicketHtmlContent('right')}
          </div>
        </div>
      </div>
    `);

    printWindow.document.write('</body></html>');
    printWindow.document.close();

    // Configurar la impresión después de cargar la ventana
    printWindow.onload = () => {
      setTimeout(() => {
        try {
          // Generar código de barras izquierdo
          const barcodeElementLeft = printWindow.document.getElementById(`barcode-${Serie}-left`);
          if (barcodeElementLeft) {
            JsBarcode(barcodeElementLeft, parseInt(Serie), {
              format: "CODE128",
              displayValue: false,
              height: 70,
              width: 1,
              margin: 0,
            });
          }

          // Generar código de barras derecho
          const barcodeElementRight = printWindow.document.getElementById(`barcode-${Serie}-right`);
          if (barcodeElementRight) {
            JsBarcode(barcodeElementRight, parseInt(Serie), {
              format: "CODE128",
              displayValue: false,
              height: 70,
              width: 1,
              margin: 0,
            });
          } else {
            console.error(`Error: No se encontró el elemento SVG con ID barcode-${Serie}-right.`);
          }

          // Imprimir y cerrar la ventana
          printWindow.print();
          printWindow.close();
        } catch (e) {
          // Manejar errores y cerrar la ventana si es necesario
          if (printWindow && !printWindow.closed) {
            printWindow.close();
          }
        }
      }, 100);
    };
  }, [setMensaje, setTipoMensaje]);

  // Función: Imprimir el ticket del último detalle guardado (para F9) (copiado de Operador)
  const handlePrintLastSavedTicket = useCallback(() => {
    console.log("F9/Botón 'Imprimir Último Ticket' presionado.");
    setMensaje('');
    setTipoMensaje('');
  
    // Busca el último detalle registrado si no hay uno pendiente
    const detalleParaImprimir = lastSavedDetailForPrint || (productosSeleccionados.length > 0 ? productosSeleccionados[productosSeleccionados.length - 1] : null);
  
    if (!detalleParaImprimir) {
      setTipoMensaje('info');
      setMensaje('⚠️ No hay ningún detalle guardado recientemente para imprimir. Presiona el botón de "Capturar Peso y Guardar Línea" primero.');
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
    // Se llama a printTicket una sola vez, la función se encarga de duplicar
    printTicket(ticketData); 
  
    setMensaje('✅ Tickets impresos correctamente para el último detalle.');
    setTipoMensaje('success');
    setLastSavedDetailForPrint(null);
  
    setTimeout(() => setMensaje(''), 5000);
  }, [
    lastSavedDetailForPrint,
    productosSeleccionados, // Changed from detallesRegistrados to productosSeleccionados
    productoPrincipalSeleccionado,
    formCabecera,
    printTicket,
    setMensaje,
    setTipoMensaje,
    setLastSavedDetailForPrint
  ]);

  // Función: Re-imprimir un ticket de un detalle ya registrado (copiado de Operador)
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
    console.log(`Imprimiendo tickets para serie ${detailToPrint.Serie}...`);
    // Se llama a printTicket una sola vez, la función se encarga de duplicar
    printTicket(ticketData); 

    setMensaje(`✅ Tickets reimpresos correctamente para la serie ${parseInt(detailToPrint.Serie)}.`);
    setTipoMensaje('success');
    setTimeout(() => setMensaje(''), 5000);
  }, [formCabecera, productoPrincipalSeleccionado, printTicket, setMensaje, setTipoMensaje]);

  // Función: Finalizar la entrada (ahora solo como confirmación, NO cierra la entrada)
  // Admin puede cerrar la entrada, por lo que esta función es diferente a la del operador
  const handleFinalizeEntry = useCallback(async () => {
    console.log("Botón 'Finalizar Proceso' presionado (Admin).");
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
    if (productosSeleccionados.length === 0) { // Check productosSeleccionados
      setTipoMensaje('info');
      setMensaje('⚠️ No se han registrado detalles para esta entrada. Considera agregar productos antes de finalizar el proceso.');
      return;
    }

    // Aquí, en el admin, puedes dar la opción de CERRAR la entrada de verdad si quieres.
    // Por ahora, mantendré el comportamiento de "finalizar sesión" como el operador.
    // Si quieres cerrar la entrada, necesitarías un endpoint adicional y una confirmación.
    setTipoMensaje('success');
    setMensaje('✅ Proceso de entrada finalizado para esta sesión. La entrada permanece abierta para futuras adiciones.');
    
    setTimeout(() => {
      setMensaje('');
      navigate('/registro/lista-entradas'); // Redirige después de 1 segundo
    }, 1000);

  }, [
    formCabecera, 
    productosSeleccionados, 
    setMensaje, 
    setTipoMensaje,
    navigate
  ]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setTipoMensaje('');

    if (!usuario?.legajo) {
      setTipoMensaje('error');
      setMensaje('❌ No se detectó el usuario autenticado. Por favor, inicie sesión.');
      return;
    }

    // ✅ Control adicional para no permitir crear si ya existe una entrada abierta
    if (!editando && hasOpenEntryExists) {
      setTipoMensaje('error');
      setMensaje('❌ No se puede crear una nueva entrada porque ya existe una con estado "Abierto".');
      return;
    }

    const { Fecha, NroCorte, ProdCodigo, Comentario, Estado } = formCabecera; // Add Estado
    if (!Fecha || !NroCorte || !ProdCodigo) { // FechaCura is auto-calculated and always present if ProdCodigo is
        setTipoMensaje('error');
        setMensaje('⚠️ Por favor, complete todos los campos obligatorios de la cabecera (Fecha, Número de Corte, Producto Principal).');
        return;
    }

    if (nroCorteError) {
      setTipoMensaje('error');
      setMensaje('⚠️ El Número de Corte ingresado ya existe. Por favor, corrija el error.');
      return;
    }

    // Validación para cerrar la operación
    if (Estado === 'Cerrado' && productosSeleccionados.length === 0) {
      setTipoMensaje('error');
      setMensaje('❌ No se puede cerrar la operación sin tener productos de detalle cargados.');
      return;
    }

    // Validar detalles si existen
    if (productosSeleccionados.length > 0) {
      for (const prod of productosSeleccionados) {
          // Changed to check if it's an empty string for quantity
          if (!prod.Serie || prod.Cantidad === '' || !prod.Fecha || !prod.FechaCura || !prod.Estado) {
              setTipoMensaje('error');
              setMensaje('⚠️ Por favor, complete todos los campos obligatorios de cada producto de entrada (Serie, Cantidad, Fecha, Fecha Cura, Estado).');
              return;
          }
      }
    }

    const payload = {
      ...formCabecera,
      Usuario: usuario.legajo,
      FechaCat: formatDateToDDMMYYYYHHMMSS(new Date()), // Fecha de carga siempre al momento del submit
      TieneDetalles: productosSeleccionados.length > 0 ? 1 : 0, // Update TieneDetalles based on current list
      productosSeleccionados: productosSeleccionados.map(p => ({
        ...p,
        Cantidad: parseFloat(p.Cantidad),
        // Asegurarse de que el usuario y la fecha de carga del detalle sean los del admin
        Usuario: usuario.legajo, 
        FechaCat: formatDateToDDMMYYYYHHMMSS(new Date()),
        FechaCura: p.FechaCura // Use FechaCura from detail, which should be from cabecera
      }))
    };

    try {
      let res;
      let data;

      if (editando) {
        res = await fetch(`${API_BASE_URL}/entrada/${formCabecera.EntNumero}`, { // Use formCabecera.EntNumero for PUT
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error desconocido al actualizar la entrada.');
        setTipoMensaje('success');
        setMensaje(data.message);
      } else {
        res = await fetch(`${API_BASE_URL}/entrada`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error desconocido al registrar la entrada.');
        setTipoMensaje('success');
        setMensaje(data.message);
        // After successful creation, set EntNumero from response for further operations
        setFormCabecera(prev => ({ ...prev, EntNumero: data.EntNumero }));
      }
      
      // Limpiar formulario y reiniciar estados si es una nueva entrada y el estado no es "Abierto"
      // Si estamos editando y el estado cambia a "Cerrado" o "Anulado", también navegamos.
      if (!editando || (editando && formCabecera.Estado !== 'Abierto')) {
        setFormCabecera({
          Fecha: getFechaLocal(),
          NroCorte: '',
          Estado: 'Abierto',
          Comentario: '',
          FechaCat: formatDateToDDMMYYYYHHMMSS(new Date()),
          ProdCodigo: '',
          FechaCura: '', // Resetear FechaCura
          EntNumero: null, // Reset EntNumero for new entry mode
        });
        setProductosSeleccionados([]);
        // Volver a cargar la serie global para la próxima nueva entrada
        const resSerie = await fetch(`${API_BASE_URL}/entrada/series-counters`);
        const dataSerie = await resSerie.json();
        if (resSerie.ok) {
          setNextGlobalSerie(dataSerie.globalSerie + 1);
        }
        // ✅ Volver a verificar el estado de entradas abiertas después de una creación exitosa
        setHasOpenEntryExists(true); // Asumimos que la recién creada está abierta
        setTimeout(() => {
          setMensaje('');
          navigate('/registro/lista-entradas'); // Redirección final
        }, 1500);
      } else { // If editing and still "Abierto", just update message
        setTimeout(() => setMensaje(''), 4000);
      }
      

    } catch (err) {
      console.error('❌ Error al procesar entrada (Admin):', err);
      setTipoMensaje('error');
      setMensaje(`❌ ${err.message || 'Ocurrió un error inesperado al procesar la entrada.'}`);
      setTimeout(() => setMensaje(''), 4000);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Allow F8 and F9 only if the entry is in "Abierto" state
      if (formCabecera.Estado === 'Abierto') {
        if (event.key === 'F8') {
          event.preventDefault();
          handleAgregarProducto(); // Admin's "Capturar Peso y Guardar Línea"
        } else if (event.key === 'F9') {
          event.preventDefault();
          handlePrintLastSavedTicket(); // Admin's "Imprimir Último Ticket"
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleAgregarProducto, handlePrintLastSavedTicket, formCabecera.Estado]); // Add formCabecera.Estado as dependency


  if (!usuario) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-600 text-lg">Cargando información de usuario...</p>
      </div>
    );
  }

  // Admin's view has a distinct loading and message when no open entry is found
  if (entNumeroParam === undefined && hasOpenEntryExists && !formCabecera.EntNumero) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-yellow-100 text-yellow-700 rounded-lg shadow-lg mt-10 text-center">
        <p className="text-xl font-semibold mb-4">¡Atención!</p>
        <p className="text-lg">Ya existe una entrada con estado "Abierto". Solo puedes editarla o esperar a que se cierre para crear una nueva.</p>
        <p className="mt-4">Entrada Abierta cargada automáticamente.</p>
      </div>
    );
  }

  // If loading and not in a specific "no open entry" state
  if ((entNumeroParam && !formCabecera.EntNumero) || (entNumeroParam === undefined && !hasOpenEntryExists && !formCabecera.Fecha)) {
     return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-600 text-lg">Cargando información de entrada...</p>
      </div>
    );
  }

  const isEditable = formCabecera.Estado === 'Abierto'; // Admin can also operate on "Abierto" entries

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 shadow-lg rounded-lg mt-1">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
        {editando ? `Editar Entrada N° ${formCabecera.EntNumero} (Administrador)` : 'Registro de Nueva Entrada (Administrador)'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        {/* Mensaje de advertencia si ya existe una entrada abierta (solo en modo creación) */}
        {!editando && hasOpenEntryExists && (
          <div className="p-3 mb-4 rounded-md bg-yellow-100 text-yellow-700 flex items-center gap-2">
            <span className="text-lg font-bold">!</span>
            {mensaje} {/* Muestra el mensaje de advertencia */}
          </div>
        )}

        {/* Nuevo contenedor padre para la cabecera y el peso */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Div original de Cabecera de Entrada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md bg-blue-50 border-blue-200 lg:col-span-2">
            <h3 className="md:col-span-2 text-xl font-semibold text-blue-800 mb-3">Cabecera de Entrada (Solo Lectura)</h3>
            <div>
              <label htmlFor="Fecha" className="block text-sm font-medium text-gray-700">Fecha:</label>
              <input
                type="date"
                id="Fecha"
                name="Fecha"
                value={formCabecera.Fecha}
                onChange={handleCabeceraChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={editando || hasOpenEntryExists} // Deshabilitado si estamos editando o si ya hay una abierta
              />
            </div>
            <div>
              <label htmlFor="NroCorte" className="block text-sm font-medium text-gray-700">Número de Corte/Operación:</label>
              <input
                type="text"
                id="NroCorte"
                name="NroCorte"
                placeholder="Ej: C-001"
                value={formCabecera.NroCorte}
                onChange={handleCabeceraChange}
                className={`mt-1 block w-full p-2 border rounded-md shadow-sm ${editando || hasOpenEntryExists ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-blue-500 focus:border-blue-500'} ${nroCorteError ? 'border-red-500' : 'border-gray-300'}`}
                required
                readOnly={editando || hasOpenEntryExists} // NroCorte no editable en edición o si ya hay una abierta
              />
              {nroCorteError && <p className="text-red-500 text-xs mt-1">{nroCorteError}</p>}
            </div>
            {/* Campo Estado solo visible en modo edición */}
            {editando && (
              <div>
                <label htmlFor="Estado" className="block text-sm font-medium text-gray-700">Estado:</label>
                <select
                  id="Estado"
                  name="Estado"
                  value={formCabecera.Estado}
                  onChange={handleCabeceraChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="Abierto">Abierto</option>
                  <option value="Cerrado">Cerrado</option>
                  <option value="Anulado">Anulado</option>
                </select>
              </div>
            )}
            <div className="md:col-span-2">
              <label htmlFor="ProdCodigo" className="block text-sm font-medium text-gray-700">Producto Principal:</label>
              <select
                id="ProdCodigo"
                name="ProdCodigo"
                value={formCabecera.ProdCodigo}
                onChange={handleCabeceraChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={editando || hasOpenEntryExists} // Deshabilita el selector visualmente en edición o si ya hay una abierta
              >
                <option value="">Seleccione un producto principal</option>
                {productosDisponibles.map(p => (
                  <option key={p.ProdCodigo} value={p.ProdCodigo}>
                    {p.ProdNombre} ({p.TipProdNombre})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="FechaCura" className="block text-sm font-medium text-gray-700">Fecha Cura:</label>
              <input
                type="text" // Cambiado a type="text"
                id="FechaCura"
                name="FechaCura"
                value={formatDateToDDMMYYYYHHMMSS(formCabecera.FechaCura, 'DD-MM-YYYY HH:mm:ss')} // Formateado para mostrar
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                required
                readOnly // Siempre de solo lectura para el admin
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="Comentario" className="block text-sm font-medium text-gray-700">Comentario:</label>
              <textarea
                id="Comentario"
                name="Comentario"
                placeholder="Comentarios adicionales sobre la entrada"
                value={formCabecera.Comentario}
                onChange={handleCabeceraChange}
                rows="2"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                disabled={hasOpenEntryExists && !editando} // Deshabilitado en creación si ya hay una abierta
              ></textarea>
            </div>
          </div>

          {/* Sección para mostrar el peso actual de la báscula */}
          <div className="bg-blue-50 p-4 rounded-lg shadow-inner flex flex-col justify-center items-center"> {/* Contenedor para la columna derecha */}
            {/* Título del peso, fuera del cuadro principal del peso */}
            <h4 className="text-lg font-semibold text-blue-800 text-center mb-2">Peso Actual de la Báscula:</h4>
            
            {/* Sección para mostrar SÓLO el peso actual de la báscula */}
            <div className="bg-blue-50 p-4 rounded-lg shadow-inner flex flex-col justify-center items-center w-full h-40">
                {errorPesoBascule ? (
                    <p className="text-red-600 font-medium text-xl">{errorPesoBascule}</p>
                ) : (
                    <p className="text-blue-900 font-bold text-4xl">
                        {pesoBascule !== null ? `${pesoBascule.toFixed(2)} kg` : 'Conectando...'}
                    </p>
                )}
            </div>
          </div> {/* CIERRE DEL CONTENEDOR DE LA COLUMNA DERECHA */}
        </div> {/* CIERRE DEL CONTENEDOR PADRE PRINCIPAL */}

        {/* Sección de Productos de Entrada (Detalles) */}
        <h3 className="font-semibold mt-6 text-xl text-gray-700 mb-4">Productos Ingresados (Detalle)</h3>
        {productosSeleccionados.length === 0 && (
          <p className="text-center text-gray-500">No hay detalles registrados para esta entrada.</p>
        )}
        {productosSeleccionados.length > 0 && ( // Only show table if there are details
          <div className="overflow-x-auto overflow-y-auto max-h-56 bg-white shadow-md rounded-lg mb-4"> {/* Added mb-4 for spacing */}
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
                  {Array.isArray(productosSeleccionados) && productosSeleccionados.length > 0 ? (
                    productosSeleccionados
                      .sort((a, b) => Number(b.Serie) - Number(a.Serie)) // Ordena descendente por Serie
                      .map((det, index) => (
                      <tr key={det.Serie || index} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm">{det.Iten}</td>
                        <td className="px-5 py-3 text-sm">{productoPrincipalSeleccionado ? `${productoPrincipalSeleccionado.ProdNombre} (${productoPrincipalSeleccionado.TipProdNombre})` : 'N/A'}</td>
                        <td className="px-5 py-3 text-sm text-right">{parseInt(det.Serie)}</td>
                        <td className="px-5 py-3 text-sm text-right">{det.Cantidad}</td>
                        <td className="px-5 py-3 text-sm">{formatDateToDDMMYYYYHHMMSS(det.Fecha)}</td>
                        <td className="px-5 py-3 text-sm">{formatDateToDDMMYYYYHHMMSS(det.FechaCura)}</td>
                        <td className="px-5 py-3 text-sm">{det.FechaIngr ? formatDateToDDMMYYYYHHMMSS(det.FechaIngr) : '-'}</td>
                        <td className="px-5 py-3 text-sm">{det.Estado}</td>
                        <td className="px-2 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRePrintTicket(det)}
                            className="text-blue-600 hover:text-blue-900 transition-colors mr-2"
                            title="Reimprimir ticket"
                            disabled={!isEditable || formCabecera.EntNumero === null} // Disable if no entry number
                          >
                            <Printer size={20} />
                          </button>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => requestDeleteAuth(det)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Eliminar detalle"
                            disabled={!isEditable || formCabecera.EntNumero === null} // Disable if no entry number
                          >
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="px-5 py-3 text-sm text-center text-gray-500">No hay detalles registrados para esta entrada.</td>
                    </tr>
                  )}
                </tbody>
            </table>
          </div>
        )}

        {/* Botones de acción para operador (para admin) */}
        <div className="flex justify-start gap-4 mt-4">
          <button
            type="button"
            onClick={handleAgregarProducto}
            className="bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 transition-colors shadow-md text-base font-medium flex items-center gap-2"
            disabled={!isEditable || formCabecera.EntNumero === null || pesoBascule === null || parseFloat(pesoBascule) <= 0} // Disable if no open entry or no valid weight
          >
            <Plus size={20} /> Capturar Peso y Guardar Línea (F8)
          </button>
          <button
            type="button"
            onClick={handlePrintLastSavedTicket}
            className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition-colors shadow-md text-base font-medium flex items-center gap-2"
            disabled={!isEditable || lastSavedDetailForPrint === null} // Disable if no last saved detail or not editable
          >
            <Printer size={20} /> Imprimir Último Ticket (F9)
          </button>
          <button
            type="button"
            onClick={() => setProductosSeleccionados([])} // Keep this for admin to clear client-side list if needed
            className="bg-gray-400 text-white px-5 py-2 rounded-md hover:bg-gray-600 transition-colors shadow-md text-base font-medium"
            disabled={!isEditable || productosSeleccionados.length === 0} // Disable if no products or not editable
          >
            Limpiar Lista de Detalles (Solo en Memoria)
          </button>
        </div>


        {/* Botón de Envío del Formulario Principal (para actualizar cabecera y detalles) */}
        <div className="flex justify-center mt-6">
          <button
            type="submit"
            className="w-full max-w-xs bg-blue-600 text-white py-3 px-6 rounded-md shadow-lg text-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={!formCabecera.EntNumero && hasOpenEntryExists} // Disable creation if an open entry exists
          >
            {editando ? 'Actualizar Entrada' : 'Registrar Nueva Entrada'}
          </button>
        </div>

        {/* Mensaje de feedback */}
        {mensaje && (
          <p className={`text-base text-center mt-4 ${tipoMensaje === 'success' ? 'text-green-600' : tipoMensaje === 'info' ? 'text-yellow-700' : 'text-red-500'}`}>
            {mensaje}
          </p>
        )}
      </form>

      {/* Modal de Autenticación */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccessForDeletion} // Callback para cuando la autenticación es exitosa
        requiredRoles={['Supervisor', 'Admin']} // Roles que tienen permiso para eliminar
        errorMessage="Credenciales de Supervisor o Admin requeridas para eliminar."
      />
    </div>
  );
};