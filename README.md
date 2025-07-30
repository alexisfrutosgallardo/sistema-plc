# Sistema Integrado con PLC

Este proyecto es una aplicación completa de control, monitoreo y gestión de procesos industriales conectados a un PLC (Controlador Lógico Programable). La solución incluye funcionalidades de entrada, salida, usuarios, productos y control de series, con frontend en React y backend en Node.js con base de datos SQLite.

## 🚀 Tecnologías utilizadas

- React (Frontend)
- Node.js con Express (Backend)
- SQLite (Base de datos local)
- Git y GitHub (Control de versiones)
- TailwindCSS (Estilos del frontend)

## 📦 Instalación y uso

### Clonar el repositorio

```bash
git clone https://github.com/alexisfrutosgallardo/sistema-plc.git
```

### Backend

```bash
cd sistema-plc/backend
node server.js
```

### Frontend

```bash
cd sistema-plc/frontend
npm install
npm start
```

Asegurate de que el archivo `plc.db` esté en su ruta correspondiente dentro de `src/database` o donde el proyecto lo requiera.

## 🗂️ Estructura general del proyecto

```
sistema-plc/
│
├── backend/
│   ├── controllers/
│   │   ├── approverController.js
│   │   ├── blendTypeController.js
│   │   ├── cargoController.js
│   │   ├── cigaretteFactoryController.js
│   │   ├── dashboardController.js
│   │   ├── detalleMaquinaController.js
│   │   ├── entryController.js
│   │   ├── exitController.js
│   │   ├── machineController.js
│   │   ├── miniSiloController.js
│   │   ├── movementController.js
│   │   ├── productController.js
│   │   ├── relSiloBlendController.js
│   │   ├── siloController.js
│   │   ├── typeProductController.js
│   │   └── userController.js
│
│   ├── routes/
│   │   ├── approverRoutes.js
│   │   ├── blendTypeRoutes.js
│   │   ├── cargoRoutes.js
│   │   ├── cigaretteFactoryRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── detalleMaquinaRoutes.js
│   │   ├── entryRoutes.js
│   │   ├── exitRoutes.js
│   │   ├── machineRoutes.js
│   │   ├── maintenanceRoutes.js
│   │   ├── miniSiloRoutes.js
│   │   ├── movementRoutes.js
│   │   ├── productRoutes.js
│   │   ├── relSiloBlendRoutes.js
│   │   ├── siloRoutes.js
│   │   ├── typeProductRoutes.js
│   │   └── userRoutes.js
│
│   ├── database/
│   │   └── index.js
│
│   └── repository/
│   │   ├── approverRepository.js
│   │   ├── blendTypeRepository.js
│   │   ├── cargoRepository.js
│   │   ├── cigaretteFactoryRepository.js
│   │   ├── detalleMaquinaRepository.js
│   │   ├── entryRepository.js
│   │   ├── exitRepository.js
│   │   ├── machineRepository.js
│   │   ├── maintenanceRepository.js
│   │   ├── miniSiloRepository.js
│   │   ├── productRepository.js
│   │   ├── relSiloBlendRepository.js
│   │   ├── siloRepository.js
│   │   ├── typeProductRepository.js
│   │   └── userRepository.js
│   ├── package.json
│   ├── package-lock.json
│   ├── plc.db
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   │   ├── bg-login.jpg
│   │   │   ├── bg-login2.jpg
│   │   │   └── bg-login3.jpg
|
│   │   ├── common/
│   │   │   │   ├── components/
│   │   │   │   │   ├── DashboardLayout.jsx
│   │   │   │   │   ├── ProtectedRoute.jsx
│   │   │   │   │   └── Sidebar.jsx
│   │   │   │   └── utils/
│   │   │   │   │   └── permisos.js
|
│   │   ├── config/
│   │   │   └── config.js
|
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   └── Login.jsx
|
│   │   │   ├── dashboard/
│   │   │   │   └───components/
│   │   │   │   │   └── DashboardHome.jsx
|
│   │   │   ├── entries/
│   │   │   │   └───components/
│   │   │   │   │   ├── Lista_Entradas.jsx
│   │   │   │   │   ├── Registro_Entrada.jsx
│   │   │   │   │   ├── Registro_Entrada_Cabecera.jsx
│   │   │   │   │   └── Registro_Entrada_Detalle.jsx
│
│   │   │   ├── exits/
│   │   │   │   └───components/
│   │   │   │   │   ├── Lista_Salidas.jsx
│   │   │   │   │   └── Registro_Salida.jsx
|
│   │   │   ├── history/
│   │   │   │   └───components/
│   │   │   │   │   ├── Historial_BlendMinisilo.jsx
│   │   │   │   │   ├── Historial_BlendXCigarrillera.jsx
│   │   │   │   │   ├── Historial_DashDeposito.jsx
│   │   │   │   │   ├── Historial_DashGrafico.jsx
│   │   │   │   │   ├── Historial_DashSilo.jsx
│   │   │   │   │   ├── Historial_MovimientoTabaco.jsx
│   │   │   │   │   └── Historial_Operacion.jsx
|
│   │   │   ├── machines/
│   │   │   │   └───components/
│   │   │   │   │   ├── Lista_Maquinas.jsx
│   │   │   │   │   └── Registro_Maquina.jsx
|
├───maintenance
│   └───components
│           Mantenimiento_EstadoMovimiento.jsx
│           Mantenimiento_Repesaje.jsx
│
│   │   │   ├── misc-registers
│   │   │   │   └───components/
│   │   │   │   │   ├── Registro_Aprobador.jsx
│   │   │   │   │   ├── Registro_Cargo.jsx
│   │   │   │   │   ├── Registro_Cigarrillera.jsx
│   │   │   │   │   ├── Registro_Minisilo.jsx
│   │   │   │   │   └── Registro_TipoBlend.jsx
│
│   │   │   ├── movimientos
│   │   │   │   └───components/
│   │   │   │   │   ├── Movimiento_Movim.jsx
│   │   │   │   │   └── Movimiento_Pesaje.jsx
|
│   │   │   ├── products/
│   │   │   │   └───components/
│   │   │   │   │   ├── Lista_Productos.jsx
│   │   │   │   │   ├── Lista_TipoProducto.jsx
│   │   │   │   │   ├── Registro_Producto.jsx
│   │   │   │   │   └── Registro_TipoProducto.jsx
│
│   │   │   ├── relsilo-blend/
│   │   │   │   └───components/
│   │   │   │   │   ├── Detalle_Maquinas.jsx
│   │   │   │   │   ├── Lista_RelSiloBlend.jsx
│   │   │   │   │   └── Registro_RelSiloBlend.jsx
│
│   │   │   ├── silos
│   │   │   │   └───components/
│   │   │   │   │   ├── Lista_Silos.jsx
│   │   │   │   │   └── Registro_Silo.jsx
|
│   │   │   └── users/
│   │   │   │   └───components/
│   │   │   │   │   ├── Lista_Usuarios.jsx
│   │   │   │   │   ├── Registro_Usuario.jsx
│   │   │   │   │   └── Utilidad_CambiarContrasena.js
|
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── index.js
│   │   └── logo_1.svg
│
├── .gitignore
└── README.md
```

## 🛠️ Funcionalidades

- ✅ Registro de entradas y salidas de productos
- ✅ Cálculo automático de fechas de curado según las horas del producto
- ✅ Generación automática y control de series incrementales
- ✅ Registro y autenticación por legajo y contraseña
- ✅ Control de permisos por usuario
- ✅ CRUD completo de productos, tipos, silos, máquinas, y relaciones
- 🔄 En desarrollo: módulo de reportes y dashboard analítico

## 👤 Usuario de prueba

```text
Legajo: 1222
Contraseña: 123456
```

## 🧠 Consideraciones especiales

- El sistema calcula automáticamente la `Fecha Cura` sumando la `HorasCura` del producto seleccionado a la fecha actual.
- La generación de la serie se realiza desde la tabla `Parametro`, asegurando que cada ítem tenga un número único e incremental.
- Los permisos del usuario están guardados en formato JSON y validados tanto en el frontend como en el backend.

## 📅 Última actualización

23 de July de 2025
