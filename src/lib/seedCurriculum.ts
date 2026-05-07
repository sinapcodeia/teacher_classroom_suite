import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export async function seedCurriculum() {
  const curricula = [
    {
      id: "calculo-11",
      subjectId: "MATEMÁTICAS",
      grade: "11°",
      units: [
        {
          id: "u1-mat-11",
          title: "Unidad 1: Límites y Continuidad",
          order: 1,
          topics: [
            { id: "1.1", title: "Concepto de Límite", status: "covered", date: "Feb 10, 2024", objectives: ["Entender el límite intuitivamente", "Calcular límites laterales"] },
            { id: "1.2", title: "Límites Infinitos", status: "active", date: "Hoy, 08:00 AM", objectives: ["Identificar asíntotas verticales", "Calcular límites al infinito"] },
            { id: "1.3", title: "Teorema del Valor Intermedio", status: "not_started", objectives: ["Demostrar existencia de raíces"] }
          ]
        },
        {
          id: "u2-mat-11",
          title: "Unidad 2: La Derivada",
          order: 2,
          topics: [
            { id: "2.1", title: "Definición de Derivada", status: "not_started", objectives: ["Calcular razón de cambio"] },
            { id: "2.2", title: "Reglas de Derivación", status: "not_started", objectives: ["Aplicar regla de la potencia", "Regla de la cadena"] }
          ]
        }
      ]
    },
    {
      id: "tecnologia-8",
      subjectId: "TECNOLOGÍA",
      grade: "8°",
      units: [
        {
          id: "u1-tec-8",
          title: "Unidad 1: Programación Básica",
          order: 1,
          topics: [
            { id: "T1.1", title: "Introducción a Algoritmos", status: "covered", objectives: ["Definir qué es un algoritmo", "Crear diagramas de flujo"] },
            { id: "T1.2", title: "Variables y Tipos de Datos", status: "covered", objectives: ["Declarar variables", "Entender tipos booleanos y numéricos"] },
            { id: "T1.3", title: "Estructuras de Control", status: "active", objectives: ["Implementar condicionales IF/ELSE", "Bucles básicos"] }
          ]
        },
        {
          id: "u2-tec-8",
          title: "Unidad 2: Robótica y Circuitos",
          order: 2,
          topics: [
            { id: "T2.1", title: "Componentes Electrónicos", status: "not_started", objectives: ["Identificar resistencias y LEDs", "Uso de la protoboard"] },
            { id: "T2.2", title: "Arduino Básico", status: "not_started", objectives: ["Instalar IDE", "Primer programa: Blink"] }
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
