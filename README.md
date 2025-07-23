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
│   ├── routes/
│   ├── database/
│   └── entryRepository.js
│
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── entries/
│   │   │   ├── products/
│   │   │   ├── relsilo-blend/
│   │   │   └── usuarios/
│   │   ├── App.jsx
│   │   └── DashboardLayout.jsx
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
