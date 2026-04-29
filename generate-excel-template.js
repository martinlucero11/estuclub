const ExcelJS = require('exceljs');

async function generateTemplate() {
  const workbook = new ExcelJS.Workbook();
  
  // Hoja de Comercios (Clubers)
  const sheetComercios = workbook.addWorksheet('Comercios');
  sheetComercios.columns = [
    { header: 'Nombre del Comercio', key: 'name', width: 30 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Categoría (Ej: Comercio, Salud)', key: 'type', width: 20 },
    { header: 'Habilitar Turnos (SI/NO)', key: 'appointmentsEnabled', width: 25 },
    { header: 'Habilitar Delivery (SI/NO)', key: 'deliveryEnabled', width: 25 },
    { header: 'Descripción', key: 'description', width: 40 },
    { header: 'Dirección', key: 'address', width: 30 },
    { header: 'WhatsApp', key: 'whatsapp', width: 20 },
    { header: 'URL de Logo', key: 'logoUrl', width: 30 },
    { header: 'URL de Portada (Cover)', key: 'coverUrl', width: 30 },
  ];

  // Hoja de Productos
  const sheetProductos = workbook.addWorksheet('Productos');
  sheetProductos.columns = [
    { header: 'Nombre del Comercio (Debe coincidir)', key: 'supplierName', width: 35 },
    { header: 'Nombre del Producto', key: 'name', width: 30 },
    { header: 'Descripción', key: 'description', width: 40 },
    { header: 'Precio ($)', key: 'price', width: 15 },
    { header: 'Categoría (Ej: Comida Rápida)', key: 'category', width: 25 },
    { header: 'Subcategoría del menú', key: 'menuSection', width: 25 },
    { header: 'URL de Imagen', key: 'imageUrl', width: 30 },
  ];

  // Hoja de Servicios (Turnos)
  const sheetServicios = workbook.addWorksheet('Servicios (Turnos)');
  sheetServicios.columns = [
    { header: 'Nombre del Comercio (Debe coincidir)', key: 'supplierName', width: 35 },
    { header: 'Nombre del Servicio', key: 'name', width: 30 },
    { header: 'Descripción', key: 'description', width: 40 },
    { header: 'Duración (Minutos)', key: 'duration', width: 20 },
    { header: 'Precio ($)', key: 'price', width: 15 },
    { header: 'URL de Imagen', key: 'imageUrl', width: 30 },
  ];

  // Hoja de Beneficios
  const sheetBeneficios = workbook.addWorksheet('Beneficios');
  sheetBeneficios.columns = [
    { header: 'Nombre del Comercio (Debe coincidir)', key: 'supplierName', width: 35 },
    { header: 'Título del Beneficio', key: 'title', width: 30 },
    { header: 'Descripción', key: 'description', width: 40 },
    { header: 'Texto Resaltado (Ej: 30% OFF)', key: 'highlight', width: 30 },
    { header: 'Categoría', key: 'category', width: 20 },
    { header: 'URL de Imagen', key: 'imageUrl', width: 30 },
    { header: 'Es exclusivo estudiantes? (SI/NO)', key: 'isStudentOnly', width: 30 },
  ];

  // Guardar archivo
  await workbook.xlsx.writeFile('Estuclub_Plantilla_Datos_Masivos.xlsx');
  console.log('Archivo Excel generado exitosamente: Estuclub_Plantilla_Datos_Masivos.xlsx');
}

generateTemplate();
