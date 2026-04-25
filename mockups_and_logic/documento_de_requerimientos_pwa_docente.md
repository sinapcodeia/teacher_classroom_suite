# PRD: Aplicativo Web Progresivo (PWA) para Docentes

## Objetivo
Diseñar y desarrollar una PWA orientada a docentes para la gestión de horarios, asistencia, calificaciones y seguimiento curricular, con enfoque offline-first.

## Stack Tecnológico
- **Frontend:** React / Next.js (PWA con Service Workers).
- **Backend:** Firebase Auth & Firestore (Persistencia offline activa).
- **Reportes:** jsPDF, PapaParse (Lado del cliente).

## Funcionalidades Clave
1. **Gestión de Horarios:** Calendario interactivo (día/semana/mes).
2. **Panel de Clase en Vivo:**
   - Registro de asistencia rápido (Offline sync).
   - Selección de temas de la malla curricular.
3. **Gestión de Estudiantes:**
   - Perfiles individuales.
   - Calificaciones (1.0 - 5.0).
   - Promedios y porcentajes de asistencia automáticos.
4. **Malla Curricular:** Carga manual o masiva (CSV).
5. **Reportes:** Exportación PDF/CSV local.

## Requerimientos Técnicos Iniciales
- Estructura de carpetas optimizada.
- Configuración de Firebase con persistencia local.
- Manifest PWA y Service Worker.
- Autenticación mediante correo electrónico.