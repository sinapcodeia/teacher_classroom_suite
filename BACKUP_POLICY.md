# 🛡️ Política de Respaldo y Recuperación ante Desastres (BACKUP_POLICY.md)

Este documento establece la **Directiva de Respaldo y Plan de Recuperación ante Desastres (DRP)** para el **IETABA Teacher Classroom Suite**. Sigue las directrices normativas de seguridad de la información (**ISO/IEC 27001:2022**), los estándares de protección de datos personales de menores (Ley 1581 de 2012 de Colombia) y la metodología de ingeniería de confiabilidad de startups globales (**Regla 3-2-1**).

---

## 🏛️ 1. Marco Normativo y Cumplimiento Legal

Debido a que el sistema gestiona información de asistencia, valoraciones y perfiles de menores de edad del resguardo Awá, la política se rige bajo:
- **Ley 1581 de 2012 (Protección de Datos Personales en Colombia)**: Exige medidas técnicas, humanas y administrativas estrictas para garantizar la seguridad de los registros, evitando su adulteración, pérdida o acceso no autorizado.
- **Artículo 7 de la Ley 1581**: Prohibición general de tratamiento de datos de niños y adolescentes, salvo aquellos que respondan y respeten el interés superior de los menores y aseguren sus derechos fundamentales.
- **ISO 27001 (Dominio A.12.3.1 - Respaldos de Información)**: Demanda el mantenimiento de copias de seguridad de la información, el software y los sistemas, verificando su integridad de manera periódica.

---

## ⚙️ 2. Estrategia de Respaldo "3-2-1"

Para garantizar la disponibilidad continua del servicio escolar frente a cualquier desastre físico o lógico en el resguardo o los servidores, aplicamos la regla estándar de startups de alto nivel:

```
[Datos Originales (Local/Vercel)]
       │
       ├──► 1. Copia Local (backups/ local comprimido y firmado con SHA-256)
       │
       ├──► 2. Copia Git (Repositorio seguro distribuido en GitHub)
       │
       └──► 3. Copia en la Nube (Base de datos persistente e inmutable en Firestore)
```

1. **3 Copias de Seguridad**: Mantener tres conjuntos de datos (Original, Git y Copia de Seguridad local/nube).
2. **2 Medios Diferentes**: Almacenar en dos soportes físicos independientes (Disco del servidor local + Repositorio remoto en la nube).
3. **1 Ubicación Fuera de Línea/Offsite**: Conservar una copia en la nube segura (Firebase Firestore persistentemente respaldado y el control de versiones en GitHub).

---

## 💻 3. Ejecución del Respaldo Automatizado

Se ha desarrollado un script industrial de respaldo en PowerShell (`backup-system.ps1`) que empaqueta únicamente los archivos fuente críticos, ignorando dependencias temporales y módulos pesados para optimizar el almacenamiento.

### Comando de Ejecución
Para iniciar un respaldo físico y lógico firmado digitalmente:
```powershell
.\backup-system.ps1
```

### Resultados Esperados
1. Generación de un archivo zip comprimido en la carpeta de gobernanza: `backups/backup_v[VERSION]_[TIMESTAMP].zip`.
2. Generación del reporte de integridad `backups/integrity_report.txt` que calcula el hash criptográfico **SHA-256** del backup para validar que la copia no sufra alteración alguna en tránsito o reposo.

---

## 🔄 4. Política de Retención y Auditoría

- **Frecuencia**: Se recomienda ejecutar el respaldo local al finalizar cada corte evaluativo (periodo académico).
- **Retención**: Los backups locales se conservarán por un periodo de **1 año escolar**.
- **Pruebas de Recuperación (Auditoría de DR)**: Cada seis meses, el administrador del sistema deberá simular una restauración completa del último backup en un entorno de desarrollo para validar la efectividad de la recuperación.
