const xlsx = require('xlsx');
const path = require('path');

const wb = xlsx.utils.book_new();

// Sheet 1: Clubers
const clubersData = [
  {
    Email_Login: 'comercio1@ejemplo.com',
    Password_Login: 'Pass123!@#',
    Nombre_Comercial: 'SuperBurger',
    Nombre_Propietario: 'Juan Perez',
    Categoria: 'Comida y Bebida',
    Whatsapp_Ventas: '3755123456',
    Direccion_Fisica: 'San Martin 123',
    Latitud: -27.5000,
    Longitud: -55.0000,
    URL_Logo: 'https://ejemplo.com/logo1.jpg',
    URL_Fachada: 'https://ejemplo.com/fachada1.jpg'
  },
  {
    Email_Login: 'pizzeria@ejemplo.com',
    Password_Login: 'Pizza!2024',
    Nombre_Comercial: 'Pizza Mania',
    Nombre_Propietario: 'Maria Lopez',
    Categoria: 'Comida y Bebida',
    Whatsapp_Ventas: '3755987654',
    Direccion_Fisica: 'Avenida Mitre 456',
    Latitud: -27.5100,
    Longitud: -55.1000,
    URL_Logo: '',
    URL_Fachada: ''
  }
];
const clubersSheet = xlsx.utils.json_to_sheet(clubersData);

// Sheet 2: Products
const productsData = [
  {
    Email_Comercio_Relacionado: 'comercio1@ejemplo.com',
    Nombre_Producto: 'Doble Queso',
    Descripcion: 'Doble carne, doble queso cheddar',
    Precio: 5000,
    Seccion_Menu: 'Hamburguesas',
    URL_Imagen: 'https://ejemplo.com/burger.jpg',
    Activo: 'SI'
  },
  {
    Email_Comercio_Relacionado: 'pizzeria@ejemplo.com',
    Nombre_Producto: 'Pizza Muzzarella',
    Descripcion: 'Clásica muzzarella con aceitunas',
    Precio: 7500,
    Seccion_Menu: 'Pizzas',
    URL_Imagen: '',
    Activo: 'SI'
  }
];
const productsSheet = xlsx.utils.json_to_sheet(productsData);

// Sheet 3: Variantes_y_Extras
const variantsData = [
  {
    Email_Comercio: 'comercio1@ejemplo.com',
    Nombre_Producto: 'Doble Queso',
    Tipo: 'Adicional', // Variante o Adicional
    Nombre_Grupo: 'Extras',
    Opciones_con_Precios: 'Bacon:500 | Huevo:300 | Cebolla Caramelizada:0'
  },
  {
    Email_Comercio: 'pizzeria@ejemplo.com',
    Nombre_Producto: 'Pizza Muzzarella',
    Tipo: 'Variante',
    Nombre_Grupo: 'Tamaño',
    Opciones_con_Precios: 'Chica:0 | Mediana:1500 | Grande:3000' // Precio extra a sumar
  }
];
const variantsSheet = xlsx.utils.json_to_sheet(variantsData);

// Sheet 4: Turnos_Servicios
const servicesData = [
  {
    Email_Comercio: 'comercio1@ejemplo.com',
    Nombre_Servicio: 'Mesa VIP 4 personas',
    Duracion_Minutos: 120,
    Precio: 10000,
    Cupo_Diario: 5,
    Descripcion_Turno: 'Reserva de mesa con vista exclusiva'
  }
];
const servicesSheet = xlsx.utils.json_to_sheet(servicesData);

// Sheet 5: Beneficios
const benefitsData = [
  {
    Email_Comercio: 'comercio1@ejemplo.com',
    Titulo_Beneficio: '10% Off Estudiantes',
    Descripcion: 'Presentando carnet universitario',
    Porcentaje_Descuento: 10,
    Rol_Requerido: 'student',
    Condiciones_Legales: 'Lunes a Jueves únicamente'
  }
];
const benefitsSheet = xlsx.utils.json_to_sheet(benefitsData);

// Configure the widths
clubersSheet['!cols'] = Object.keys(clubersData[0]).map(() => ({ wch: 25 }));
productsSheet['!cols'] = Object.keys(productsData[0]).map(() => ({ wch: 25 }));
variantsSheet['!cols'] = Object.keys(variantsData[0]).map(() => ({ wch: 30 }));
servicesSheet['!cols'] = Object.keys(servicesData[0]).map(() => ({ wch: 25 }));
benefitsSheet['!cols'] = Object.keys(benefitsData[0]).map(() => ({ wch: 25 }));

// Append the sheets
xlsx.utils.book_append_sheet(wb, clubersSheet, '1_Comercios');
xlsx.utils.book_append_sheet(wb, productsSheet, '2_Productos');
xlsx.utils.book_append_sheet(wb, variantsSheet, '3_Variantes_Adicionales');
xlsx.utils.book_append_sheet(wb, servicesSheet, '4_Turnos');
xlsx.utils.book_append_sheet(wb, benefitsSheet, '5_Beneficios');

const filePath = path.join(__dirname, 'Plantilla_Carga_Masiva_Estuclub.xlsx');
xlsx.writeFile(wb, filePath);
console.log(`Excel file created at: ${filePath}`);
