# Teacher Classroom Suite (IETABA) 🎓

Sistema de gestión institucional de alto nivel diseñado para el ecosistema educativo de la **IETABA**. Esta aplicación es una solución **PWA (Progressive Web App)** diseñada bajo el paradigma **Offline-First**, permitiendo a los docentes gestionar el aula sin depender de una conexión a internet constante.

![Licencia](https://img.shields.io/badge/Licencia-IETABA%20Internal-blue)
![Next.js](https://img.shields.io/badge/Framework-Next.js%2015-black)
![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS%204-38B2AC)

## ✨ Características Principales

*   **⚡ Dashboard de Alto Rendimiento:** Visualización en tiempo real de la carga académica y alertas de clase activa.
*   **📶 Capacidad Offline-First:** Los datos se sincronizan automáticamente cuando hay conexión disponible. Todas las acciones se guardan en el almacenamiento local de forma persistente.
*   **📊 Analítica Avanzada:** Tablero de estadísticas con análisis demográfico, riesgo académico y distribución de género.
*   **📅 Horario Institucional:** Gestión visual de la malla horaria semanal con acceso directo a la asistencia.
*   **📝 Control de Asistencia:** Toma de asistencia rápida con alertas integradas para cumpleaños y excelencia académica.
*   **📁 Gestión de Datos:** Importación masiva de estudiantes y personal vía CSV con soporte para seriales de fecha de Excel.
*   **💼 Perfiles Estudiantiles:** Fichas detalladas con historial académico y contacto directo con acudientes.

## 🛠️ Tecnologías

- **Frontend:** Next.js 15 (App Router), React 19.
- **Estilos:** TailwindCSS 4, Lucide Icons.
- **Persistencia:** LocalStorage API + Firebase Firestore (Cache persistente).
- **Reportes:** jsPDF para generación de documentos institucionales.
- **Utilidades:** PapaParse para procesamiento de datos masivos.

## 🚀 Inicio Rápido

1. **Instalación de dependencias:**
   ```bash
   npm install
   ```

2. **Ejecución en desarrollo:**
   ```bash
   npm run dev
   ```

3. **Construcción para producción:**
   ```bash
   npm run build
   ```

## 📱 Instalación como PWA

Esta aplicación puede ser instalada en dispositivos móviles o escritorio:
1. Abre la aplicación en Chrome o Safari.
2. Selecciona "Agregar a la pantalla de inicio" o "Instalar aplicación".
3. ¡Listo! Accede instantáneamente desde tu menú de aplicaciones.

---

Desarrollado con ❤️ para la comunidad educativa de **IETABA**.
**EduManager — Gestión Docente de Nivel Superior**
