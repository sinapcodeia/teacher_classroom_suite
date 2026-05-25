import os

file_path = r"c:\COLEGIO\teacher_classroom_suite\src\app\curriculo\page.tsx"

# Read with universal newline support
with open(file_path, "r", encoding="utf-8", newline=None) as f:
    content = f.read()

# 1. Update State Hook
old_state = """  const [analysisResult, setAnalysisResult] = useState<{
    id?: string,
    summary: string,
    lesson: string,
    workshop: string,
    activity: string,
    exam: string,
    createdAt?: any
  } | null>(null);"""

new_state = """  const [analysisResult, setAnalysisResult] = useState<{
    id?: string,
    summary: string,
    lesson: string,
    workshop: string,
    activity: string,
    exam: string,
    teacherGuide?: string,
    createdAt?: any
  } | null>(null);"""

old_state_clean = old_state.replace("\r\n", "\n")
new_state_clean = new_state.replace("\r\n", "\n")

if old_state_clean in content:
    content = content.replace(old_state_clean, new_state_clean)
    print("State hook updated successfully!")
else:
    print("Error: State hook pattern not found")

# 2. Update print callback signature
old_print = "const handlePrintModule = (plan: any, type: 'full' | 'lesson' | 'workshop' | 'activity' | 'exam') => {"
new_print = "const handlePrintModule = (plan: any, type: 'full' | 'lesson' | 'workshop' | 'activity' | 'exam' | 'teacherGuide') => {"

if old_print in content:
    content = content.replace(old_print, new_print)
    print("Print callback signature updated!")
else:
    print("Error: Print callback signature pattern not found")

# 3. Update lessonStr & workshopStr generators and inject teacherGuideStr
old_generators = """      const lessonStr = `${contextPrefix}📅 PARÁMETROS CURRICULARES DEL PERIODO
• Institución: INSTITUCIÓN EDUCATIVA INDÍGENA TÉCNICA AGROAMBIENTAL BILINGÜE AWÁ - IETABA
• Duración Académica: 3 Meses (Trimestre Reglado)
• Intensidad Horaria: 1 hora diaria de Lunes a Viernes (Total: 5 horas semanales / 60 horas por periodo)
• Modelo Pedagógico: Tejiendo Saberes (Awá) — Enfoque Crítico, Activo y Comunitario

${hilosContext}

======================================================================
I. FASE DE EXPLORACIÓN: CONTEXTUALIZACIÓN Y SABERES PREVIOS (Sesión 1)
======================================================================
🎯 Objetivo de la Fase: Despertar el interés del estudiante vinculando su realidad territorial, familiar y cultural en el IETABA con las estructuras de pensamiento de ${selectedSubject}.

🗣️ Actividad de Motivación Inicial: "La Minga del Conocimiento"
Iniciamos la semana de clase organizando el aula en un círculo tradicional. El docente introduce el tema [ ${topicName} ] (${topicHigra}) mediante un diálogo participativo sobre cómo nuestras autoridades indígenas abordan este aspecto de la vida.
• Pregunta Generadora 1: Desde la visión de nuestra comunidad, ¿cómo se relaciona este tema con las prácticas agroambientales diarias?
• Pregunta Generadora 2: ¿Por qué el dominio de los conceptos de ${selectedSubject} es fundamental para defender la soberanía de nuestra reserva indígena?

======================================================================
II. FASE DE ESTRUCTURACIÓN: CONCEPTUALIZACIÓN EXHAUSTIVA Y ANÁLISIS (Sesiones 2 y 3)
======================================================================
📖 Desarrollo Teórico de Alto Rigor (Para Dictar y Consignar en el Cuaderno):
CONCEPTO FUNDAMENTAL: ${topicDefinition}

Para dominar este concepto, el estudiante debe interiorizar las siguientes pautas:
1. Identificación de Contexto: Separar claramente los elementos teóricos de su aplicación práctica.
2. Estructura Lógica: Entender la causalidad y relación de los elementos estudiados.
3. Consistencia Territorial: Todo saber debe tener coherencia y utilidad para el cuidado de Katsa Su (la Gran Tierra).

💡 Ejemplos Resueltos y Explicados al Detalle:

• EJEMPLO MODELO 1: APLICACIÓN CONCEPTUAL
${example1Text}

• EJEMPLO MODELO 2: CONTEXTUALIZACIÓN AGROAMBIENTAL TERRITORIAL
Enunciado: Una familia Awá desea aplicar los saberes de ${selectedSubject} en la administración de un cultivo tradicional. ¿Qué pasos deben seguir para asegurar que su acción esté alineada con el Plan de Vida institucional?
PASO A PASO DE RESOLUCIÓN:
- Paso 1 (Diagnóstico): Evaluar el estado actual de la parcela.
- Paso 2 (Aplicación Teórica): Utilizar las metodologías propias de la materia para optimizar el recurso.
- Paso 3 (Cierre Comunitario): Compartir el conocimiento con el cabildo escolar.
- Conclusión Didáctica: Este ejercicio conecta la teoría académica con la vida cotidiana y el tejido social.

======================================================================
III. FASE DE TRANSFERENCIA: APLICACIÓN PRÁCTICA EN AULA (Sesiones 4 y 5)
======================================================================
✍️ Taller Guiado en Clase:
Los estudiantes se organizan en mesas de trabajo cooperativo. El docente entrega una guía donde cada grupo debe mapear un problema real de su vereda aplicando los saberes de ${selectedSubject}.
Cada equipo plasmará su propuesta en un papelógrafo, utilizando diagramas claros y sustentando sus ideas ante el grupo.`;

      const workshopStr = `${contextPrefix}📝 TALLER DE APLICACIÓN DIDÁCTICA INTENSIVA
Institución: IETABA — Territorio Awá
Grado: ${selectedGrade} | Materia: ${selectedSubject}
Tema: ${topicName}
${hilosContext}
Tiempo Estimado de Resolución: 2 Horas de Trabajo Autónomo/Grupal

======================================================================
SECCIÓN A: DESARROLLO ANALÍTICO Y PROCEDIMIENTOS (40%)
======================================================================
Instrucción: Desarrolla en tu cuaderno las siguientes actividades paso a paso, justificando cada respuesta a partir de los apuntes de la clase.
1. 📖 Describe con tus propias palabras cómo el concepto de ${topicName} puede observarse en la naturaleza o en la organización comunitaria de tu vereda.
2. ✍️ Aplica la metodología de ${selectedSubject} para estructurar una solución a un problema simulado en el aula.
3. 📊 Compara las prácticas ancestrales con los conocimientos occidentales sobre este tema y establece dos similitudes y dos diferencias.

======================================================================
SECCIÓN B: RESOLUCIÓN DE CASOS AGROAMBIENTALES Y COMUNITARIOS (40%)
======================================================================
Lee con detenimiento la siguiente situación contextualizada en nuestra comunidad y responde:

🌱 Caso Práctico: "Proyecto Integrador en la Reserva"
El cabildo escolar del IETABA debe ejecutar un proyecto formativo utilizando las bases de ${selectedSubject}. 
• Reto 1: Identifica los elementos principales necesarios para llevar a cabo la iniciativa.
• Reto 2: ¿De qué manera la temática de ${topicName} influye directamente en el éxito de este proyecto?
• Reto 3: Formula una recomendación técnica fundamentada en la materia para mejorar las prácticas actuales.

======================================================================
SECCIÓN C: PRODUCCIÓN ARGUMENTATIVA E INTERCULTURALIDAD (20%)
======================================================================
✍️ Redacta un ensayo corto (mínimo 3 párrafos bien estructurados) donde respondas a la siguiente reflexión:
"¿De qué manera el aprendizaje de ${selectedSubject} nos permite cuidar a la Madre Tierra (Katsa Su) y fortalecer los planes de vida de la nación Awá?"`;"""

new_generators = """      const lessonStr = `${contextPrefix}📅 GUÍA CURRICULAR EXHAUSTIVA DE CLASE (PARA DICTADO Y ESTUDIO)
======================================================================
• Institución: INSTITUCIÓN EDUCATIVA INDÍGENA TÉCNICA AGROAMBIENTAL BILINGÜE AWÁ - IETABA
• Duración Académica: Trimestre Reglado (3 Meses)
• Intensidad Horaria Semanal: 5 Horas de Clase (60 horas totales por periodo)
• Eje Integrador: Armonización territorial con Katsa Su (La Gran Tierra)
======================================================================
${hilosContext}

📖 CONTENIDO CONCEPTUAL CLAVE: [ ${topicName.toUpperCase()} ]
Pedagogía de Base: Modelo Tradicional Awá "Tejiendo Saberes" integrado con Ciencias Universales contemporáneas.

======================================================================
I. FASE DE EXPLORACIÓN Y DIÁLOGOS COMUNITARIOS (Sesión 1)
======================================================================
🎯 PROPÓSITO PEDAGÓGICO:
Conectar los conocimientos ancestrales del estudiante con el estudio científico formal de ${selectedSubject}.

🗣️ MINGA DE CONOCIMIENTOS (DIÁLOGO CON EL ENTORNO):
El docente invita a la clase a sentarse en un círculo tradicional. Se utiliza un objeto simbólico de la comunidad (un canasto o tejido propio) para regular los turnos de habla. El docente expone la relación de la temática [ ${topicName} ] con el territorio.

💬 Preguntas Clave para el Dictado en Cuadernos:
1. Desde los saberes de nuestros mayores, ¿cómo se manifiesta la regularidad y estructura de ${topicName} en los ciclos naturales del bosque y las fuentes hídricas?
2. ¿De qué manera la falta de control técnico o el desconocimiento de las herramientas de ${selectedSubject} puede debilitar la autonomía agroambiental de nuestro resguardo?

======================================================================
II. FASE DE ESTRUCTURACIÓN: CONCEPTUALIZACIÓN TEÓRICA EXHAUSTIVA (Sesiones 2 y 3)
======================================================================
📖 DESARROLLO TEÓRICO RIGUROSO (Apto para dictar y copiar textualmente):

• MARCO TEÓRICO CENTRAL:
${topicDefinition}

• CONCEPTOS AUXILIARES Y VOCABULARIO CLAVE:
1. **Tejido de Aprendizaje (Tuh Putkamna)**: Corresponde a la interrelación armónica entre la teoría matemática, tecnológica u agroambiental y las vivencias de la comunidad en la reserva.
2. **Aplicación en el Territorio (Panapain)**: La metodología mediante la cual los conceptos abstractos y teóricos se traducen en beneficio inmediato para el cabildo, la vereda y la conservación ambiental.
3. **Saberes Universales (Nanpaskas)**: Los conocimientos científicos y metodologías académicas estándar que el estudiante debe dominar para interactuar exitosamente con el entorno global.

💡 EJEMPLOS DE APLICACIÓN TOTALMENTE RESUELTOS PASO A PASO:

• EJEMPLO MODELO 1: APLICACIÓN PROCEDIMENTAL INTERNA
${example1Text}

• EJEMPLO MODELO 2: CASO AGROAMBIENTAL CONTEXTUALIZADO
Enunciado: En el predio escolar del IETABA, se desea diseñar una infraestructura o plan de cálculo basado en ${topicName} para optimizar el riego y distribución de abono orgánico en la parcela escolar. ¿Cómo debe proceder la comunidad docente y estudiantil?
RESOLUCIÓN COMPLETA PASO A PASO:
- Paso 1 (Evaluación Territorial): Identificamos las dimensiones geográficas de la parcela y la disponibilidad de recursos naturales locales.
- Paso 2 (Abstracción Técnica): Modelamos matemáticamente o a nivel de flujo tecnológico los parámetros utilizando las leyes de ${selectedSubject}.
- Paso 3 (Socialización Cooperativa): Se definen las cuadrillas de trabajo de los alumnos para ejecutar el monitoreo y mantenimiento técnico.
- Conclusión Pedagógica: La aplicación exitosa de este conocimiento protege a Katsa Su (La Gran Tierra) y consolida la autosostenibilidad.

======================================================================
III. FASE DE TRANSFERENCIA: APLICACIÓN PRÁCTICA EN EL AULA (Sesiones 4 y 5)
======================================================================
✍️ TRABAJO INDEPENDIENTE / COOPERATIVO:
Los estudiantes realizarán simulaciones prácticas y talleres grupales basados en problemáticas reales. Utilizarán carteles, papelógrafos, y representaciones de mapas territoriales para plasmar sus soluciones aplicando los conceptos aprendidos, preparándose de forma rigurosa para el Taller Evaluativo Integral.`;

      const workshopStr = `${contextPrefix}📝 TALLER INTEGRAL DE APLICACIÓN DIDÁCTICA Y PRÁCTICA (MÍNIMO 10 PREGUNTAS)
----------------------------------------------------------------------
Institución: IETABA (Territorio Awá)
Materia: ${selectedSubject} | Grado: ${selectedGrade}
Eje Temático: ${topicName}
======================================================================

--- [ HOJA 1: APROPIACIÓN CONCEPTUAL Y COMPRENSIÓN VISUAL ] ---

📌 INSTRUCCIÓN GENERAL: Resuelve cada pregunta en tu cuaderno de forma clara y ordenada. Presenta los diagramas y respuestas completamente argumentados.

----------------------------------------------------------------------
🎨 ANÁLISIS COMPRENSIVO BASADO EN LA SIGUIENTE INFOGRAFÍA:
----------------------------------------------------------------------
🖼️ [INFOGRAFÍA COLORIDA: "EL TEJIDO DE SABERES Y EL CUIDADO DEL MEDIO AMBIENTE"]
Esta infografía muestra la relación entre los Saberes Ancestrales (representados en un tejido verde circular) y el Conocimiento Académico de ${selectedSubject} (representado como un engranaje azul central). El flujo de flechas amarillas demuestra cómo la teoría apoya la toma de decisiones ecológicas en Katsa Su (La Madre Tierra).

1. 📖 [Pregunta 1 - Vocabulario]: Define con tus propias palabras el concepto central de "${topicName}" e identifica dos términos técnicos clave de la materia explicados en la infografía.
2. 📊 [Pregunta 2 - Análisis de Infografía]: Observa la relación entre el tejido ancestral y el engranaje de ${selectedSubject} en la infografía anterior. Explica por qué el trabajo interdisciplinar ayuda a la comunidad.
3. 🗺️ [Pregunta 3 - Observación Territorial]: Dibuja un mapa conceptual de tu vereda e identifica tres áreas específicas donde la temática de [ ${topicName} ] se aplique para mejorar la producción agropecuaria o el cuidado del agua.

----------------------------------------------------------------------
📐 SECCIÓN A: DESARROLLO ANALÍTICO Y PROCEDIMIENTOS
----------------------------------------------------------------------
🗺️ [MAPA CONCEPTUAL COLORIDO: "ESTRUCTURA Y SISTEMAS DE ${selectedSubject.toUpperCase()}"]
Este mapa conceptual describe el árbol de procesos, ramificando las variables fundamentales y mostrando los caminos lógicos para la resolución de problemas teóricos en la asignatura.

4. ✍️ [Pregunta 4 - Resolución de Caso Teórico]: Utilizando el mapa conceptual como guía, resuelve el siguiente ejercicio procedimental: Aplica la estructura de ${selectedSubject} para calcular o planificar un escenario hipotético donde se necesiten administrar recursos escolares. Muestra todo tu procedimiento.
5. 🔍 [Pregunta 5 - Comparativa Crítica]: Establece en un cuadro comparativo tres similitudes y tres diferencias entre la manera en que los mayores de la reserva analizan el tema de [ ${topicName} ] y la metodología científica occidental.

--- [ HOJA 2: APLICACIÓN PRÁCTICA Y PRODUCCIÓN INTERCULTURAL ] ---

----------------------------------------------------------------------
🌱 SECCIÓN B: RESOLUCIÓN DE CASOS AGROAMBIENTALES Y COMUNITARIOS
----------------------------------------------------------------------
📈 [DIAGRAMA DE FLUJO: "MONITOREO DE RECURSOS EN LA PARCELA DE LA RESERVA"]
Un flujograma didáctico y a color que detalla las fases de toma de datos: Fase 1 (Toma de datos en campo) -> Fase 2 (Procesamiento analítico en aula con ${selectedSubject}) -> Fase 3 (Presentación del plan al cabildo para aprobación).

6. 🌾 [Pregunta 6 - Caso Práctico - El Proyecto del Cabildo]: El cabildo escolar del IETABA requiere ejecutar una iniciativa agroambiental basada en la temática [ ${topicName} ]. Analiza el diagrama de flujo anterior y describe qué decisiones debería tomar el equipo si los datos de la Fase 1 presentan un error o anomalía.
7. 📈 [Pregunta 7 - Análisis de Tendencias]: Imagina que el proyecto de la parcela sufre un retraso debido a factores climáticos extremos. ¿De qué manera la precisión teórica de ${selectedSubject} puede ayudar al docente y a los estudiantes a reestructurar el cronograma y los insumos de forma exacta?
8. 🎨 [Pregunta 8 - Diseño y Propuesta]: Dibuja un afiche o diagrama ilustrado (en media página de tu cuaderno) que promueva el uso de [ ${topicName} ] para concienciar a los jóvenes del IETABA sobre la importancia de la educación técnica.

----------------------------------------------------------------------
✍️ SECCIÓN C: ARGUMENTACIÓN CRÍTICA Y SÍNTESIS PEDAGÓGICA
----------------------------------------------------------------------
9. 🧠 [Pregunta 9 - Pensamiento Crítico]: Lee el siguiente argumento: "Los saberes de las ciencias exactas y tecnológicas son ajenos al plan de vida Awá y no deberían ser dictados de forma obligatoria en la reserva". Sustenta tu posición personal, argumentando a favor o en contra con un mínimo de dos párrafos sólidos.
10. 📝 [Pregunta 10 - Ensayo de Síntesis Intercultural]: Redacta un ensayo estructurado (Introducción, Desarrollo y Conclusión - mínimo 300 palabras) que responda a la pregunta rectora:
"¿Cómo el dominio técnico e intercultural de ${selectedSubject} nos empodera como guardianes del territorio y líderes de nuestra comunidad?"`;

      const teacherGuideStr = `${contextPrefix}🎓 GUÍA EXCLUSIVA PARA EL DOCENTE (PLANIFICACIÓN Y SOLUCIONARIO DEL TALLER)
======================================================================
Institución: IETABA (Territorio Awá)
Grado: ${selectedGrade} | Materia: ${selectedSubject}
Guía de Orientación Pedagógica para el Tema: ${topicName}
======================================================================

🎯 OBJETIVOS PEDAGÓGICOS CENTRALES:
1. Lograr que el 90% de los estudiantes comprendan los fundamentos teóricos de ${topicName}.
2. Promover la articulación del conocimiento científico occidental (Nanpaskas) con la identidad Awá (Tuh Putkamna).

⏱️ CRONOGRAMA DE TIEMPOS SUGERIDO (5 Horas a la Semana):
• Sesión 1 (1h) - Exploración y Minga de Saberes previos.
• Sesiones 2 y 3 (2h) - Dictado de teoría fundamental, explicación y resolución de ejemplos prácticos en el tablero.
• Sesión 4 (1h) - Trabajo cooperativo y resolución guiada de las primeras 5 preguntas del Taller Integral.
• Sesión 5 (1h) - Resolución de preguntas prácticas y argumentativas del Taller y retroalimentación grupal.

======================================================================
🔑 SOLUCIONARIO EXHAUSTIVO DEL TALLER INTEGRAL (PARA EL DOCENTE)
======================================================================

💡 Pregunta 1: Criterio de Respuesta Correcta: El estudiante debe citar la definición exacta dada en la guía y asociarla a términos técnicos como el "Tejido de Aprendizaje" o la "Metodología Analítica".

💡 Pregunta 2: Criterio de Respuesta Correcta: El alumno debe explicar la complementariedad entre los saberes ancestrales (protección ambiental) y la rigurosidad de ${selectedSubject} (medición, cálculo o diseño digital) para optimizar recursos.

💡 Pregunta 3: Criterio de Respuesta Correcta: Se califica la creatividad del mapa conceptual de la vereda. Debe identificar al menos 3 áreas (ej. huerta, acueducto veredal, registro del cabildo) donde se aplique el tema.

💡 Pregunta 4: Solución Técnica Esperada: El estudiante debe seguir los 3 pasos de resolución matemática o tecnológica planteados en el Ejemplo Modelo 1, logrando un procedimiento claro y fundamentado paso a paso.

💡 Pregunta 5: Solución Esperada: Cuadro comparativo completo. Tres similitudes (ambos buscan organizar, entender patrones y cuidar recursos) y tres diferencias (uso de tradición oral vs. fórmulas escritas; validación comunitaria vs. experimental académica).

💡 Pregunta 6: Criterio de Respuesta Correcta: En caso de error en la Fase 1, el estudiante debe proponer el retorno al campo a verificar los parámetros geográficos, de acuerdo con las flechas de retroalimentación del flujograma.

💡 Pregunta 7: Criterio de Respuesta Correcta: El alumno debe justificar que las ciencias exactas permiten recalcular y reprogramar insumos de forma precisa, evitando el desperdicio.

💡 Pregunta 8: Criterio de Calificación: Se evalúa el afiche a color, el mensaje didáctico de concientización y la creatividad al integrar elementos culturales Awá con tecnología/matemática.

💡 Pregunta 9: Criterio de Calificación: Ensayo argumentativo. El estudiante debe defender una postura madura, reconociendo que las ciencias universales son herramientas necesarias para la gobernanza interna del resguardo.

💡 Pregunta 10: Rúbrica de Ensayo de Síntesis (300 palabras):
- Excelente (4.5 - 5.0): Integra de forma brillante la cosmovisión Awá, el dominio de la materia y el liderazgo comunitario, con excelente ortografía y conectores lógicos.
- Aceptable (3.0 - 4.4): Presenta ideas claras sobre la interculturalidad pero la estructura formal del ensayo es incompleta.
- Insuficiente (0.0 - 2.9): No cumple con la extensión mínima o no demuestra comprensión de la articulación territorial de la materia.`;"""

old_gen_clean = old_generators.replace("\r\n", "\n")
new_gen_clean = new_generators.replace("\r\n", "\n")

if old_gen_clean in content:
    content = content.replace(old_gen_clean, new_gen_clean)
    print("Generators and teacher guide injected successfully!")
else:
    print("Error: Generators pattern not found")

# 4. Update newPlan instantiation to include teacherGuide
old_inst = """      const newPlan = {
        summary: `Planeación Integral: ${selectedSubject} (${selectedGrade})`,
        lesson: lessonStr,
        workshop: workshopStr,
        activity: activityStr,
        exam: examStr,
        grade: selectedGrade,
        subject: selectedSubject,
        topic: topicName,
        teacherId: user?.uid || "anonymous",
        createdAt: serverTimestamp()
      };"""

new_inst = """      const newPlan = {
        summary: `Planeación Integral: ${selectedSubject} (${selectedGrade})`,
        lesson: lessonStr,
        workshop: workshopStr,
        activity: activityStr,
        exam: examStr,
        teacherGuide: teacherGuideStr,
        grade: selectedGrade,
        subject: selectedSubject,
        topic: topicName,
        teacherId: user?.uid || "anonymous",
        createdAt: serverTimestamp()
      };"""

old_inst_clean = old_inst.replace("\r\n", "\n")
new_inst_clean = new_inst.replace("\r\n", "\n")

if old_inst_clean in content:
    content = content.replace(old_inst_clean, new_inst_clean)
    print("newPlan instantiation updated successfully!")
else:
    print("Error: newPlan instantiation pattern not found")

# 5. Update Curriculo Cards array mapping
old_grid = """                           <div className="grid grid-cols-1 gap-2">
                              {[
                                { id: 'lesson', label: "Desarrollo", content: analysisResult.lesson, icon: <BookOpen size={14}/> },
                                { id: 'workshop', label: "Taller", content: analysisResult.workshop, icon: <FileText size={14}/> },
                                { id: 'activity', label: "Actividad", content: analysisResult.activity, icon: <Sparkles size={14}/> },
                                { id: 'exam', label: "Examen", content: analysisResult.exam, icon: <CheckCircle2 size={14}/> }
                              ].map((item, idx) => ("""

new_grid = """                           <div className="grid grid-cols-1 gap-2">
                              {[
                                { id: 'lesson', label: "Desarrollo", content: analysisResult.lesson, icon: <BookOpen size={14}/> },
                                { id: 'workshop', label: "Taller", content: analysisResult.workshop, icon: <FileText size={14}/> },
                                { id: 'activity', label: "Actividad", content: analysisResult.activity, icon: <Sparkles size={14}/> },
                                { id: 'exam', label: "Examen", content: analysisResult.exam, icon: <CheckCircle2 size={14}/> },
                                { id: 'teacherGuide', label: "Guía Docente", content: analysisResult.teacherGuide || "Guía exclusiva para el docente con respuestas del taller.", icon: <Presentation size={14}/> }
                              ].map((item, idx) => ("""

old_grid_clean = old_grid.replace("\r\n", "\n")
new_grid_clean = new_grid.replace("\r\n", "\n")

if old_grid_clean in content:
    content = content.replace(old_grid_clean, new_grid_clean)
    print("Curriculo cards grid updated successfully!")
else:
    print("Error: Curriculo cards grid pattern not found")

# Write with native CRLF conversion for Windows
with open(file_path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(content)
print("Script execution completed!")
