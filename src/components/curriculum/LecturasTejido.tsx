"use client";

import { useState } from "react";
import { BookOpen, FileText, Printer, CheckCircle, Sparkles } from "lucide-react";

interface LecturasTejidoProps {
  onPrint: (adaptedPlan: any, type: string) => void;
  grade: string;
  subject: string;
}

const READINGS_DATA = [
  {
    period: "p1",
    title: "El Tejido como Lenguaje Cósmico y Espacial Awá",
    topic: "Cosmología y Conexión Espacial",
    summary: "Estudio sobre cómo los hilos y los colores del tejido representan la relación con Katsa Su y el tránsito entre el mundo espiritual y el mundo físico en el resguardo.",
    text: `GUÍA DIDÁCTICA Y DE TRANSCRIPCIÓN: EL TEJIDO COMO LENGUAJE CÓSMICO AWÁ
----------------------------------------------------------------------
Estimado Estudiante del IETABA:
Copia con letra muy clara y ordenada los siguientes apuntes en tu cuaderno. Recuerda respetar los títulos con color rojo y usar regla para separar las secciones. Este ejercicio te ayudará a conservar la memoria de nuestros mayores y afianzar tu ortografía.

======================================================================
1. EL TEJIDO: EL CORAZÓN DE NUESTRA IDENTIDAD
======================================================================
Para nosotros, los Hijos del Saber y de la Gran Tierra (Katsa Su), tejer no es solo cruzar hilos o fibras vegetales de la selva. Tejer es escribir nuestra historia. En nuestra comunidad indígena Awá, el tejido es un lenguaje sagrado que nuestros ancestros utilizaron para comunicarse con la naturaleza, registrar los ciclos del bosque y plasmar el Plan de Vida de nuestra reserva.

Cuando una tejedora se sienta a fabricar una shingra o un sombrero tradicional, está conectando tres mundos en un solo plano:
• El Mundo de Arriba (el plano espiritual de las nubes y los mayores que nos cuidan).
• El Mundo de En Medio (nuestro territorio físico, las parcelas de cultivo y los ríos).
• El Mundo de Abajo (las raíces del bosque, los saberes profundos y los nutrientes de la Madre Tierra).

======================================================================
2. EL SIMBOLISMO DE LOS COLORES EN EL TEJIDO AWÁ
======================================================================
Cada color utilizado en el hilado tiene un significado preciso y está alineado con la armonización de nuestro resguardo. Al transcribir esto, analiza cómo los colores representan tu entorno diario:

A. El Color Verde (Katsa Su):
Representa la selva húmeda del piedemonte costero, las parcelas agroecológicas del IETABA y la esperanza de mantener nuestra autonomía territorial. Simboliza la vida y la nutrición que nos da la tierra.

B. El Color Amarillo (Sat):
Simboliza el sol que calienta nuestros cultivos, el fuego sagrado de la tulpa (el fogón tradicional) y la sabiduría de nuestros mayores que ilumina el camino de los jóvenes.

C. El Color Rojo (Higra):
Representa la sangre de nuestros ancestros, la fuerza de resistencia de la nación Awá y el calor del fuego comunitario en las asambleas y la minga del conocimiento.

======================================================================
3. EL TEJIDO EN TU VIDA DIARIA Y EL PLAN DE VIDA
======================================================================
El tejido se observa en cada rincón del IETABA. Se encuentra en los sombreros de paja que usan nuestros padres para protegerse en la labranza, en las mochilas que cargamos con semillas para sembrar, y en el tejido social que nos une como compañeros en el aula de clase. Al cuidar el territorio y aprender las materias académicas con respeto, estamos tejiendo un futuro fuerte y próspero para toda nuestra reserva indígena.

----------------------------------------------------------------------
✍️ CUESTIONARIO EVALUATIVO (RESPONDE EN TU CUADERNO)
----------------------------------------------------------------------
Instrucción: Después de transcribir la lectura anterior, responde en tu cuaderno las siguientes 5 preguntas con tus propias palabras y justificaciones:

1. ¿Por qué se afirma en la lectura que el tejido es un lenguaje y no solamente una artesanía? Explica la relación que tiene con la historia Awá.
2. Describe de forma detallada qué representan los tres mundos que conecta la tejedora tradicional cuando fabrica una prenda.
3. Elabora un cuadro ilustrado donde dibujes y expliques el significado de los colores Verde, Amarillo y Rojo desde la visión del resguardo.
4. ¿En qué actividades cotidianas del colegio o de tu hogar observas que se aplica el valor del 'tejido social'? Explica un ejemplo real.
5. Redacta una reflexión corta (mínimo 5 líneas) sobre por qué es importante que los jóvenes del IETABA sigan aprendiendo los saberes de los mayores.`
  },
  {
    period: "p2",
    title: "El Tejido de Shingras y Canastos como Organización Matemática",
    topic: "Geometría y Progresiones Aritméticas",
    summary: "Análisis técnico de los patrones geométricos, simetría y secuencias numéricas presentes en el diseño y fabricación de mochilas y canastos tradicionales.",
    text: `GUÍA DIDÁCTICA Y DE TRANSCRIPCIÓN: MATEMÁTICAS EN LAS SHINGRAS Y CANASTOS
----------------------------------------------------------------------
Estimado Estudiante del IETABA:
Copia con letra muy clara y ordenada los siguientes apuntes en tu cuaderno. Recuerda respetar los títulos con color rojo y usar regla para separar las secciones. Este ejercicio te ayudará a conservar la memoria de nuestros mayores y afianzar tu ortografía.

======================================================================
1. LAS SHINGRAS Y EL CÁLCULO TRADICIONAL
======================================================================
La "Shingra" es la mochila tradicional Awá, fabricada pacientemente a partir de la fibra natural de la planta de "chambira". Aunque a simple vista parece un bolso sencillo, su fabricación requiere un conocimiento matemático de alta precisión. Las tejedoras tradicionales, aun sin usar papel ni lápiz, calculan de forma exacta la cantidad de fibra, los patrones de los nudos y la progresión de los anillos geométricos.

Al tejer una shingra, la tejedora realiza operaciones de:
• Progresión Geométrica: Cada anillo de la mochila se expande sumando una cantidad regular de puntos o lazadas a medida que crece el bolso.
• Simetría Radial: Los patrones estéticos se repiten alrededor de un eje central, garantizando que el bolso sea perfectamente circular y equilibrado.
• Tensión Dinámica: El balance de fuerzas entre los nudos asegura que el bolso aguante grandes pesos de maíz, yuca o plátano sin romperse.

======================================================================
2. LA GEOMETRÍA SAGRADA DE LOS CANASTOS
======================================================================
Los canastos de carga, tejidos con bejuco, muestran patrones de cuadrículas y rombos. Al transcribir esto, analiza los siguientes conceptos que aplicamos en el aula:

A. El Rombo Tradicional:
Representa el ojo de los animales protectores de la selva y el equilibrio espacial del territorio. A nivel geométrico, es un polígono de cuatro lados iguales donde las diagonales se cruzan en ángulos rectos de 90 grados.

B. La Red Cuadrícula:
Se fabrica cruzando fibras verticales (urdimbre) y horizontales (trama). Esta intersección de líneas paralelas y perpendiculares genera una malla de alta estabilidad estructural que distribuye las fuerzas uniformemente.

======================================================================
3. LA TECNOLOGÍA ANCESTRAL AL SERVICIO DEL FUTURO
======================================================================
Dominar la geometría del tejido no solo nos permite hacer hermosos bolsos; nos enseña a pensar de forma lógica, a organizar el espacio de forma eficiente y a diseñar herramientas tecnológicas respetuosas con Katsa Su. La matemática occidental y la matemática Awá se unen en el tejido para darnos herramientas con las que administrar mejor nuestro resguardo y resolver retos técnicos reales.

----------------------------------------------------------------------
✍️ CUESTIONARIO EVALUATIVO (RESPONDE EN TU CUADERNO)
----------------------------------------------------------------------
Instrucción: Después de transcribir la lectura anterior, responde en tu cuaderno las siguientes 5 preguntas con tus propias palabras y justificaciones:

1. ¿Qué es una Shingra y a partir de qué planta natural se fabrica tradicionalmente en el resguardo?
2. Explica cómo se aplica la 'progresión geométrica' al expandir el tejido de la mochila desde el centro hacia afuera.
3. Define geométricamente qué es un rombo tradicional y describe qué representa su forma simbólica desde la visión de la naturaleza.
4. ¿Por qué es fundamental la 'distribución uniforme de fuerzas' en la cuadrícula de un canasto de carga? Explica su utilidad práctica.
5. ¿De qué manera la unión de las matemáticas occidentales y la matemática ancestral Awá puede ayudar a mejorar los proyectos agroambientales del IETABA?`
  },
  {
    period: "p3",
    title: "El Tejido de Katsa Su (La Gran Tierra): Ecosistemas y Biodiversidad",
    topic: "Ecología y Preservación Agroambiental",
    summary: "Estudio ecológico sobre la biodiversidad, la cadena alimentaria y los flujos biológicos entendidos bajo la metáfora tradicional del gran tejido vivo del territorio.",
    text: `GUÍA DIDÁCTICA Y DE TRANSCRIPCIÓN: EL TEJIDO DE KATSA SU (LA MADRE TIERRA)
----------------------------------------------------------------------
Estimado Estudiante del IETABA:
Copia con letra muy clara y ordenada los siguientes apuntes en tu cuaderno. Recuerda respetar los títulos con color rojo y usar regla para separar las secciones. Este ejercicio te ayudará a conservar la memoria de nuestros mayores y afianzar tu ortografía.

======================================================================
1. EL GRAN TEJIDO DE LA BIODIVERSIDAD
======================================================================
Nuestros mayores siempre nos enseñan que el territorio (Katsa Su) es un gran tejido vivo. Ningún ser en la naturaleza vive solo o aislado; todos estamos unidos por "hilos invisibles" que conectan el agua, el suelo, las plantas, los insectos, las aves y a nosotros como seres humanos. En la ciencia universal, a este gran tejido de conexiones vivas lo llamamos **Ecosistema**.

Si cortamos un solo hilo del tejido, toda la red se debilita. Por ejemplo:
• Si contaminamos las quebradas del piedemonte costero, mueren los peces y las plantas acuáticas.
• Si mueren los peces, las aves y animales terrestres pierden su sustento y abandonan el resguardo.
• Sin plantas ni agua limpia, las familias del resguardo pierden sus cultivos y se rompe la armonía y la seguridad alimentaria.

======================================================================
2. LA PARCELA TRADICIONAL Y EL CUIDADO DE LOS HILOS ECOLÓGICOS
======================================================================
En el IETABA promovemos la agricultura técnica agroambiental bilingüe. Al transcribir esto, analiza los siguientes componentes de la conservación:

A. El Uso de Abonos Orgánicos:
En lugar de utilizar químicos occidentales dañinos, alimentamos el suelo con compostaje, estiércol de especies menores y hojas en descomposición. Esto nutre el suelo de forma natural y protege los pequeños insectos que mantienen la tierra fértil.

B. La Rotación y Diversificación de Cultivos:
Sembrar maíz, yuca, plátano y plantas medicinales en la misma parcela fortalece los hilos del ecosistema. Cada planta aporta un nutriente diferente al suelo y evita que las plagas ataquen un solo cultivo de forma destructiva.

======================================================================
3. LA RESPONSABILIDAD DE LOS GUARDIANES DEL TERRITORIO
======================================================================
Nosotros, los estudiantes del IETABA, somos los llamados a ser los guardianes permanentes del gran tejido de Katsa Su. Aprender sobre el medio ambiente, dominar las técnicas de agroforestería y estudiar con rigurosidad académica nos da la fuerza necesaria para defender la biodiversidad y garantizar que las futuras generaciones Awá sigan conviviendo en paz con la selva.

----------------------------------------------------------------------
✍️ CUESTIONARIO EVALUATIVO (RESPONDE EN TU CUADERNO)
----------------------------------------------------------------------
Instrucción: Después de transcribir la lectura anterior, responde en tu cuaderno las siguientes 5 preguntas con tus propias palabras y justificaciones:

1. ¿Qué es un 'Ecosistema' y por qué la cosmovisión Awá lo define simbólicamente como un 'gran tejido vivo'?
2. Describe de forma clara qué ocurre en el territorio cuando cortamos o dañamos un 'hilo invisible' de la red ecológica. Da un ejemplo de la lectura.
3. Explica por qué el IETABA promueve el uso de abonos orgánicos en lugar de agroquímicos industriales dañinos para el suelo.
4. ¿Qué es la diversificación de cultivos y de qué manera beneficia la nutrición del suelo y la protección contra plagas en la vereda?
5. ¿Cuál es tu compromiso personal como estudiante del IETABA para cuidar los recursos naturales y fortalecer la biodiversidad de Katsa Su?`
  }
];

export default function LecturasTejido({ onPrint, grade, subject }: LecturasTejidoProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("p1");

  const currentReading = READINGS_DATA.find(r => r.period === selectedPeriod) || READINGS_DATA[0];

  const handlePrint = () => {
    onPrint({
      summary: `Lectura Didáctica de Periodo: ${currentReading.title}`,
      grade,
      subject,
      lecturaTejido: currentReading.text,
      lesson: "",
      workshop: "",
      activity: "",
      exam: ""
    }, "lecturaTejido");
  };

  return (
    <div className="bg-white border border-outline-variant/30 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-outline-variant/30 pb-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center shadow-inner">
            <BookOpen size={24} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Lecturas de Transcripción del Tejido</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Cuaderno de Saberes Indígenas Awá</p>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-2xl border border-slate-200">
          {READINGS_DATA.map(r => (
            <button
              key={r.period}
              onClick={() => setSelectedPeriod(r.period)}
              className={`px-4 py-2.5 rounded-xl text-[9px] font-black transition-all uppercase tracking-widest ${
                selectedPeriod === r.period
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Periodo {r.period === "p1" ? "1" : r.period === "p2" ? "2" : "3"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Info & Print Column */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <Sparkles size={16} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Enfoque Didáctico</span>
            </div>
            <h4 className="text-sm font-black text-slate-800 uppercase leading-snug">
              {currentReading.title}
            </h4>
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
              {currentReading.summary}
            </p>
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-[9px] font-black text-emerald-800 uppercase leading-relaxed tracking-wider">
              📝 Diseñado con márgenes óptimas de escritura para que el estudiante transcriba a mano en su cuaderno, finalizando con un cuestionario de 5 preguntas de comprensión lectora.
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="w-full mt-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-2xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-emerald-100"
          >
            <Printer size={14} />
            Imprimir Guía Didáctica
          </button>
        </div>

        {/* Text Area Column */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-slate-500 px-1 text-[9px] font-black uppercase tracking-widest">
            <CheckCircle size={14} className="text-emerald-500" /> Vista previa del texto de clase
          </div>
          <div className="w-full bg-slate-900 text-slate-200 rounded-[2.5rem] p-8 font-sans text-xs leading-relaxed overflow-y-auto h-[400px] border border-slate-800 shadow-inner custom-scrollbar relative">
            <div className="whitespace-pre-wrap font-sans text-[11px] leading-relaxed text-slate-300">
              {currentReading.text}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
