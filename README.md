# Teacher Classroom Suite (IETABA) 🎓

Sistema de gestión institucional de alto nivel diseñado para el ecosistema educativo de la **IETABA**. Esta aplicación es una solución **PWA (Progressive Web App)** diseñada bajo el paradigma **Offline-First**, permitiendo a los docentes gestionar el aula sin depender de una conexión a internet constante.

![Licencia](https://img.shields.io/badge/Licencia-IETABA%20Internal-blue)
![Next.js](https://img.shields.io/badge/Framework-Next.js%2015-black)
![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS%204-38B2AC)

## ✨ Características Principales

*   **⚡ Dashboard de Alto Rendimiento:** Visualización en tiempo real de la carga académica y alertas de clase activa.
*   **📶 Capacidad Offline-First:** Los datos se sincronizan automáticamente cuando hay conexión disponible. Todas las acciones se guardan en el almacenamiento local de forma persistente.
*   **📊 Analítica BI 360°:** Tablero de estadísticas con Recharts, extraedad por grado, ausentismo vs. pérdida académica, radar SIEEE y citación directa por WhatsApp.
*   **🔗 Conector SAPRED 360° (.XLS Multi-Hoja):** Llenado automático hasta `AUT` preservando el orden exacto de SAPRED, validación "Todo o Nada" y ordenamiento persistente por curso.
*   **📅 Horario Institucional:** Gestión visual de la malla horaria semanal con acceso directo a la asistencia.
*   **📝 Control de Asistencia:** Toma de asistencia rápida con alertas integradas para cumpleaños y excelencia académica.
*   **📁 Gestión de Datos:** Importación y exportación nativa Excel (`.xlsx`, `.xls`) y `.csv` con SheetJS y soporte para seriales de fecha.
*   **💼 Perfiles Estudiantiles:** Fichas detalladas con historial académico y contacto directo con acudientes.

## 🛠️ Tecnologías

- **Frontend:** Next.js 15 (App Router), React 19, Recharts.
- **Estilos:** TailwindCSS 4, Lucide Icons, Tipografías `Outfit` y `Plus Jakarta Sans`.
- **Persistencia:** LocalStorage API + Firebase Firestore (Offline-First).
- **Reportes:** jsPDF + reportes vectoriales SVG/HTML 100% offline.
- **Hojas de Cálculo:** SheetJS (`xlsx`) + PapaParse.

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

Desarrollado y licenciado por **[SinapCode](https://sinap-code.vercel.app/)** para IETABA.
**EduManager — Gestión Docente de Nivel Superior**

*© Todos los derechos reservados. El uso y distribución de este software está regido por los Términos de Servicio de SinapCode (https://sinap-code.vercel.app/).*
