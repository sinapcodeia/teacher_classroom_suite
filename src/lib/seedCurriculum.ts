import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export async function seedCurriculum() {
  const curricula = [
    {
      id: "tecnologia-propia-5",
      subjectId: "TECNOLOGÍA PROPIA E INFORMÁTICA",
      grade: "5°",
      objective: "Comprender el concepto de tecnología e informática, identificar las partes del computador y promover el uso adecuado y responsable de la tecnología en la vida diaria.",
      units: [
        {
          id: "1",
          title: "Primer Periodo",
          order: 1,
          topics: [
            { 
              id: "T1.1", 
              title: "Concepto de tecnología e informática / Partes del computador", 
              status: "active", 
              tuhPutkamna: "Tecnología y sociedad.\nApropiación y uso de la tecnología.",
              panapain: "Reconoce las tecnologías propias de la cultura Awá.",
              nanpaskas: "Establece diferencias entre los conceptos de tecnología e informática.\nReconoce las herramientas tecnológicas y su importancia en la vida cotidiana.\nComprende los beneficios que ofrece la informática en la sociedad.",
              katkinAizpa: "Tablero, marcadores.\nTextos Biblioteca.\nGuías de trabajo.\nVideo beam.\nComputadores.",
              satIshkit: "Trabajo, talleres y actividades grupales e individuales.\nSalidas de trabajo practico en el entorno de la institución.\nExposiciones individuales y en grupo (trabajo colaborativo)."
            }
          ]
        },
        {
          id: "2",
          title: "Segundo Periodo",
          order: 2,
          topics: [
            { 
              id: "T2.1", 
              title: "Uso adecuado de la tecnología en el entorno escolar y familiar", 
              status: "not_started",
              tuhPutkamna: "Apropiación y uso de la tecnología.",
              panapain: "Identifica prácticas ancestrales de comunicación vs tecnológicas.",
              nanpaskas: "Aplica normas básicas de seguridad en internet y uso de dispositivos.",
              katkinAizpa: "Computadores.\nSoftware educativo.\nCarteleras.",
              satIshkit: "Mesas de diálogo.\nTalleres prácticos de mecanografía y reconocimiento de hardware."
            }
          ]
        },
        {
          id: "3",
          title: "Tercer Periodo",
          order: 3,
          topics: [
            { 
              id: "T3.1", 
              title: "Herramientas de ofimática básicas (Procesador de texto)", 
              status: "not_started",
              tuhPutkamna: "Naturaleza y evolución de la tecnología.",
              panapain: "Redacta relatos propios de la cultura Awá usando herramientas digitales.",
              nanpaskas: "Conoce y aplica funciones básicas de formato en un procesador de texto.",
              katkinAizpa: "Computadores.\nProyector.\nPlantillas de texto.",
              satIshkit: "Creación de documentos escritos.\nExposiciones de los cuentos o relatos creados."
            }
          ]
        }
      ]
    }
  ];

  try {
    for (const item of curricula) {
      await setDoc(doc(db, "curriculum", item.id), item);
    }
    console.log("Curriculum seeded successfully!");
  } catch (err) {
    console.error("Error seeding curriculum:", err);
  }
}
