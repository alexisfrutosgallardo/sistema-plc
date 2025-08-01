import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { API_BASE_URL } from '../../../config/config';
import { Plus, Trash2 } from 'lucide-react';
import JsBarcode from 'jsbarcode';

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
  const [productosSeleccionados, setProductosSeleccionados] = useState([]); // Esto será para los detalles A AGREGAR
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [nextGlobalSerie, setNextGlobalSerie] = useState(0);
  const [loading, setLoading] = useState(true); // Nuevo estado para controlar la carga inicial

  // Estado para almacenar los detalles YA REGISTRADOS y mostrados en la tabla
  const [detallesRegistrados, setDetallesRegistrados] = useState([]);


  useEffect(() => {
    const fetchOpenEntryAndDetails = async () => {
      setLoading(true); // Iniciar carga
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
            FechaCura: data.FechaCura, // Mantener el formato original de la DB para FechaCura
            Usuario: data.Usuario,
          });

          // Cargar los detalles existentes para esta entrada
          const resDetalles = await fetch(`${API_BASE_URL}/entrada/${data.EntNumero}/detalle`);
          const dataDetalles = await resDetalles.json();
          if (resDetalles.ok) {
            setDetallesRegistrados(dataDetalles.map(det => ({
              ...det,
              Cantidad: String(det.Cantidad), // Asegurarse de que Cantidad sea string para el input type="number"
              Fecha: getFechaLocal(new Date(det.Fecha)), // Formatear fecha para el input type="date"
              FechaIngr: det.FechaIngr ? getFechaLocal(new Date(det.FechaIngr)) : '',
            })));
          } else {
            console.error('Error al cargar detalles de la entrada abierta:', dataDetalles.error);
            setMensaje('❌ Error al cargar detalles de la entrada abierta.');
            setTipoMensaje('error');
          }

        } else {
          // Si no hay entrada abierta, mostrar mensaje informativo y deshabilitar formulario
          setTipoMensaje('info');
          setMensaje(data.error || 'No hay ninguna entrada con estado "Abierto" para cargar detalles. El supervisor debe crear una primero.');
          setFormCabecera(prev => ({ ...prev, EntNumero: null })); // Indicar que no hay entrada abierta
        }
      } catch (err) {
        console.error("❌ Error al cargar la entrada abierta:", err);
        setTipoMensaje('error');
        setMensaje('❌ No se pudo conectar al servidor para cargar la entrada abierta.');
        setFormCabecera(prev => ({ ...prev, EntNumero: null })); // Indicar que no hay entrada abierta
      } finally {
        setLoading(false); // Finalizar carga
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

  // printTicket envuelto en useCallback
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
        body { font-family: monospace; font-size: 20px; margin: 0; padding: 0; }
        .ticket-container {
          display: flex; /* ✅ Cambiado a flex para mejor control de alineación */
          flex-direction: column; /* ✅ Cambiado a columna para mejor alineación */
          align-items: center; /* ✅ Alinea el contenido al centro */
          justify-content: center; /* ✅ Centra el contenido vertical y horizontalmente */
          padding: 5mm; /* ✅ Padding de 5mm alrededor del ticket */
          border: 1px solid black; /* border para el ticket */
          margin: 2mm; /* ✅ Margen de 2mm alrededor del ticket */
          box-sizing: border-box;
          width: 45mm; /* ✅ Ancho del ticket */
          text-align: center; /* ✅ Centra todo el texto dentro del contenedor */
        }
        svg { 
          width: 100%; /* ✅ Ancho del SVG */
          height: 80px;  /* ✅ Altura de 80px para el logo */
          display: block; /* ✅ Asegura que el SVG ocupe todo el ancho disponible */
          margin: 0 auto; /* ✅ Centra el SVG horizontalmente */
        }
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .ticket-container { page-break-after: always; }
        }
      </style>
    `);
    printWindow.document.write('</head><body>');

    const ticketHtml = `
      <div class="ticket-container"> <!-- Aplicar la clase al contenedor principal del ticket -->
        <div style="font-size: 20px; font-weight: bold; margin-bottom: 5px;">${ProdNombre}</div>
        <div style="margin-bottom: 10px;">OP ${NroCorte}</div>
        <svg id="barcode-${Serie}-${copyNumber}"></svg>
        <div style="margin-top: 5px; font-size: 12px; ">${Serie}</div>
        <div style="margin-top: 20px; font-size: 20px; font-weight: bold;">${Cantidad} kg</div>
        <div style="margin-top: 5px; font-size: 12px;">${formatDateToDDMMYYYYHHMMSS(FechaCat)}</div>
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
              format: "CODE128", /* ✅ Formato de código de barras */
              displayValue: false, /* ✅ No mostrar el valor del código de barras */
              height: 70, /* ✅ Altura del código de barras */
              width: 2.5, /* ✅ Grosor de las barras */
              margin: 0, /* ✅ Margen entre el código de barras y el contenedor */
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

  const handleAgregarProducto = () => {
    console.log("Intentando agregar producto...");
    if (!formCabecera.EntNumero || formCabecera.Estado !== 'Abierto') {
      setTipoMensaje('error');
      setMensaje('❌ No hay una entrada abierta o no está en estado "Abierto" para agregar productos. El supervisor debe crear una o cambiar su estado.');
      console.log("Error: No hay entrada abierta o no está en estado 'Abierto'.");
      return;
    }
    if (!formCabecera.ProdCodigo) {
      setTipoMensaje('error');
      setMensaje('⚠️ La cabecera de la entrada abierta no tiene un Producto Principal definido.');
      console.log("Error: Producto Principal no definido en la cabecera.");
      return;
    }

    const newSerie = String(nextGlobalSerie);
    setNextGlobalSerie(prev => prev + 1);

    setProductosSeleccionados(prev => {
      const newProducts = [
        ...prev,
        {
          ProdCodigo: formCabecera.ProdCodigo,
          Serie: newSerie,
          Cantidad: '',
          Fecha: getFechaLocal(),
          FechaCura: formCabecera.FechaCura,
          FechaIngr: getFechaLocal(),
          Estado: 'Activo',
          Usuario: usuario.legajo,
          FechaCat: getFechaHoraLocal(),
          Iten: detallesRegistrados.length + prev.length + 1 // Iten basado en detalles ya registrados + nuevos
        }
      ];
      console.log("Producto agregado a la lista de pendientes. Productos seleccionados (después de set):", newProducts);
      return newProducts;
    });
    setMensaje('');
    setTipoMensaje('');
  };

  const handleProductoChange = (index, field, value) => {
    const nuevosProductos = [...productosSeleccionados];
    nuevosProductos[index][field] = value;
    setProductosSeleccionados(nuevosProductos);
    console.log(`Producto en índice ${index} actualizado. Campo: ${field}, Valor: ${value}`);
  };

  const handleEliminarProducto = (index) => {
    setProductosSeleccionados(prev => prev.filter((_, i) => i !== index));
    console.log(`Producto en índice ${index} eliminado de la lista de pendientes.`);
  };

  const handleSubmitDetalles = useCallback(async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    console.log("Iniciando handleSubmitDetalles...");
    setMensaje('');
    setTipoMensaje('');

    if (!usuario?.legajo) {
      setTipoMensaje('error');
      setMensaje('❌ No se detectó el usuario autenticado. Por favor, inicie sesión.');
      console.log("Error: Usuario no autenticado.");
      return;
    }

    if (!formCabecera.EntNumero || formCabecera.Estado !== 'Abierto') {
      setTipoMensaje('error');
      setMensaje('❌ No se pueden guardar los detalles porque la entrada no está en estado "Abierto".');
      console.log("Error: Entrada no abierta.");
      return;
    }

    if (productosSeleccionados.length === 0) {
      setTipoMensaje('error');
      setMensaje('⚠️ Debe agregar al menos un producto a la entrada para registrarlo.');
      console.log("Error: No hay productos pendientes para registrar.");
      return;
    }

    for (const prod of productosSeleccionados) {
      if (!prod.Serie || prod.Cantidad === '' || parseFloat(prod.Cantidad) <= 0 || !prod.Fecha || !prod.FechaCura || !prod.Estado) {
        setTipoMensaje('error');
        setMensaje('⚠️ Por favor, complete todos los campos obligatorios de cada producto de entrada (Serie, Cantidad > 0, Fecha, Fecha Cura, Estado).');
        console.log("Error de validación en producto:", prod);
        return;
      }
    }

    const productosPendientesACopiar = [...productosSeleccionados];
    let allSuccessful = true;

    for (const prod of productosPendientesACopiar) {
      console.log("Procesando detalle para envío:", prod.Serie);
      const detailPayload = {
        ProdCodigo: prod.ProdCodigo,
        Serie: prod.Serie,
        Cantidad: parseFloat(prod.Cantidad),
        Fecha: prod.Fecha,
        FechaCura: formCabecera.FechaCura,
        FechaIngr: prod.FechaIngr,
        Estado: prod.Estado,
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
          throw new Error(data.error || `Error al guardar el detalle con serie ${prod.Serie}.`);
        }

        setTipoMensaje('success');
        setMensaje(`✅ Detalle con serie ${prod.Serie} registrado correctamente.`);
        console.log(`Detalle con serie ${prod.Serie} guardado exitosamente.`);

        const ticketData = {
          ProdNombre: productoPrincipalSeleccionado?.ProdNombre || 'N/A',
          NroCorte: formCabecera.NroCorte,
          Cantidad: prod.Cantidad,
          FechaCat: detailPayload.FechaCat,
          Serie: prod.Serie,
        };
        console.log(`Imprimiendo tickets para serie ${prod.Serie} (después de guardar)...`);
        printTicket(ticketData, 1);
        printTicket(ticketData, 2);

        setDetallesRegistrados(prev => [...prev, { ...prod, Iten: data.Iten }]);
        setNextGlobalSerie(prev => prev + 1);

        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err) {
        console.error('❌ Error al procesar detalle de entrada:', err);
        setTipoMensaje('error');
        setMensaje(`❌ ${err.message || 'Ocurrió un error inesperado al procesar un detalle.'}`);
        allSuccessful = false;
        break;
      }
    }

    if (allSuccessful) {
      setMensaje('✅ Todos los detalles pendientes han sido registrados e impresos.');
      setTipoMensaje('success');
      setProductosSeleccionados([]);
    }
    setTimeout(() => setMensaje(''), 5000);
    console.log("handleSubmitDetalles finalizado.");
  }, [
    usuario, 
    formCabecera, 
    productosSeleccionados, 
    productoPrincipalSeleccionado, 
    printTicket,
    setMensaje,
    setTipoMensaje,
    setProductosSeleccionados,
    setDetallesRegistrados,
    setNextGlobalSerie
  ]);

  const handlePrintAllRegisteredDetails = useCallback(() => {
    if (detallesRegistrados.length === 0) {
      setMensaje('⚠️ No hay detalles registrados para imprimir.');
      setTipoMensaje('info');
      return;
    }
    console.log("Iniciando impresión de todos los detalles registrados...");
    detallesRegistrados.forEach(det => {
      const ticketData = {
        ProdNombre: productoPrincipalSeleccionado?.ProdNombre || 'N/A',
        NroCorte: formCabecera.NroCorte,
        Cantidad: det.Cantidad,
        FechaCat: det.FechaCat,
        Serie: det.Serie,
      };
      console.log(`Imprimiendo tickets para serie ${det.Serie} (desde F9)...`);
      printTicket(ticketData, 1);
      printTicket(ticketData, 2);
    });
    setMensaje('✅ Se han enviado a imprimir todos los tickets de los detalles registrados.');
    setTipoMensaje('success');
    setTimeout(() => setMensaje(''), 5000);
  }, [detallesRegistrados, productoPrincipalSeleccionado, formCabecera, printTicket, setMensaje, setTipoMensaje]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'F8') {
        event.preventDefault();
        console.log("F8 presionado: Intentando registrar detalles.");
        handleSubmitDetalles(); 
      } else if (event.key === 'F9') {
        event.preventDefault();
        console.log("F9 presionado: Intentando imprimir todos los detalles registrados.");
        handlePrintAllRegisteredDetails();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSubmitDetalles, handlePrintAllRegisteredDetails]);


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

  console.log("Estado del botón - isEditable:", isEditable, "productosSeleccionados.length:", productosSeleccionados.length, "Disabled:", (!isEditable || productosSeleccionados.length === 0));


  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 shadow-lg rounded-lg mt-10">
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
          <div className="md:col-span-2">
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
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Serie</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Cantidad</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha Cura</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha Ingreso</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {detallesRegistrados.map((det, index) => (
                    <tr key={det.Serie || index} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm">{det.Iten}</td>
                      <td className="px-5 py-3 text-sm">{productoPrincipalSeleccionado?.ProdNombre || 'N/A'} ({productoPrincipalSeleccionado?.TipProdNombre || 'N/A'})</td>
                      <td className="px-5 py-3 text-sm">{det.Serie}</td>
                      <td className="px-5 py-3 text-sm text-right">{det.Cantidad}</td>
                      <td className="px-5 py-3 text-sm">{formatDateToDDMMYYYYHHMMSS(det.Fecha)}</td>
                      <td className="px-5 py-3 text-sm">{formatDateToDDMMYYYYHHMMSS(det.FechaCura)}</td>
                      <td className="px-5 py-3 text-sm">{det.FechaIngr ? formatDateToDDMMYYYYHHMMSS(det.FechaIngr) : '-'}</td>
                      <td className="px-5 py-3 text-sm">{det.Estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Formulario de Nuevos Detalles */}
        <form onSubmit={handleSubmitDetalles} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
          {/* Sección de Productos a Ingresar (Nuevos Detalles) */}
          <h3 className="font-semibold mt-6 text-xl text-gray-700 mb-4">Nuevos Productos a Ingresar</h3>
          {!isEditable && (
            <div className="p-3 mb-4 rounded-md bg-yellow-100 text-yellow-700 flex items-center gap-2">
              <span className="text-lg font-bold">!</span>
              La entrada está en estado "{formCabecera.Estado}". No se pueden agregar ni modificar detalles.
            </div>
          )}

          {productosSeleccionados.length === 0 && (
            <p className="text-center text-gray-500">Haz clic en "Agregar Producto" para añadir nuevas líneas de detalle.</p>
          )}
          {productosSeleccionados.map((item, index) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-4 p-4 border border-gray-200 rounded-md bg-gray-50">
              <div>
                <label className="block text-sm font-medium text-gray-700">Producto:</label>
                <p className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-800">
                  {productoPrincipalSeleccionado ? 
                   `${productoPrincipalSeleccionado.ProdNombre} (${productoPrincipalSeleccionado.TipProdNombre})` : 
                   'Producto no seleccionado'}
                </p>
                <input type="hidden" name="ProdCodigo" value={item.ProdCodigo} />
              </div>
              <div>
                <label htmlFor={`Serie-${index}`} className="block text-sm font-medium text-gray-700">Serie:</label>
                <input
                  type="text"
                  id={`Serie-${index}`}
                  value={item.Serie}
                  readOnly
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-800 cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor={`Cantidad-${index}`} className="block text-sm font-medium text-gray-700">Cantidad:</label>
                <input
                  type="number"
                  id={`Cantidad-${index}`}
                  placeholder="Cantidad"
                  min="0"
                  step="0.01"
                  value={item.Cantidad}
                  onChange={e => handleProductoChange(index, 'Cantidad', e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!isEditable}
                />
              </div>
              <div>
                <label htmlFor={`Fecha-${index}`} className="block text-sm font-medium text-gray-700">Fecha:</label>
                <input
                  type="date"
                  id={`Fecha-${index}`}
                  value={item.Fecha}
                  onChange={e => handleProductoChange(index, 'Fecha', e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!isEditable}
                />
              </div>
              <div>
                <label htmlFor={`FechaCura-${index}`} className="block text-sm font-medium text-gray-700">Fecha Cura:</label>
                <input
                  type="text"
                  id={`FechaCura-${index}`}
                  value={formatDateToDDMMYYYYHHMMSS(formCabecera.FechaCura)}
                  readOnly
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-800 cursor-not-allowed"
                  required
                />
              </div>
              <div>
                <label htmlFor={`FechaIngr-${index}`} className="block text-sm font-medium text-gray-700">Fecha Ingreso (Opcional):</label>
                <input
                  type="date"
                  id={`FechaIngr-${index}`}
                  value={item.FechaIngr}
                  onChange={e => handleProductoChange(index, 'FechaIngr', e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={!isEditable}
                />
              </div>
              <div>
                <label htmlFor={`EstadoProducto-${index}`} className="block text-sm font-medium text-gray-700">Estado Producto:</label>
                <select
                  id={`EstadoProducto-${index}`}
                  value={item.Estado}
                  onChange={e => handleProductoChange(index, 'Estado', e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!isEditable}
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => handleEliminarProducto(index)}
                  className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors shadow-sm text-sm flex items-center justify-center gap-1"
                  disabled={!isEditable}
                >
                  <Trash2 size={16} /> Eliminar
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-start gap-4 mt-4">
            <button
              type="button"
              onClick={handleAgregarProducto}
              className="bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 transition-colors shadow-md text-base font-medium flex items-center gap-2"
              disabled={!isEditable}
            >
              <Plus size={20} /> Agregar Producto
            </button>
            <button
              type="button"
              onClick={() => setProductosSeleccionados([])}
              className="bg-gray-400 text-white px-5 py-2 rounded-md hover:bg-gray-600 transition-colors shadow-md text-base font-medium"
              disabled={!isEditable}
            >
              Limpiar Productos Pendientes
            </button>
          </div>

          <div className="flex justify-center mt-6">
            <button
              type="submit"
              className="w-full max-w-xs bg-blue-600 text-white py-3 px-6 rounded-md shadow-lg text-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={!isEditable || productosSeleccionados.length === 0}
            >
              Registrar Detalles y Imprimir
            </button>
          </div>
        </form> {/* CIERRE DEL FORMULARIO */}

      </div> {/* CIERRE DEL DIV PRINCIPAL DE LA PÁGINA */}

      {/* Mensaje de feedback (fuera del formulario, pero dentro del div principal de la página) */}
      {mensaje && (
        <p className={`text-base text-center mt-4 ${tipoMensaje === 'success' ? 'text-green-600' : tipoMensaje === 'info' ? 'text-yellow-700' : 'text-red-500'}`}>
          {mensaje}
        </p>
      )}
    </div>
  );
}
