import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export async function seedCurriculum() {
  const calculus11 = {
    subjectId: "Cálculo",
    grade: "11°",
    units: [
      {
        id: "unit-1",
        title: "Unidad 1: Límites y Continuidad",
        order: 1,
        topics: [
          { id: "1.1", title: "Concepto de Límite", status: "covered", date: "Feb 10, 2024", objectives: ["Entender el límite intuitivamente", "Calcular límites laterales"] },
          { id: "1.2", title: "Límites Infinitos", status: "active", date: "Hoy, 08:00 AM", objectives: ["Identificar asíntotas verticales", "Calcular límites al infinito"] },
          { id: "1.3", title: "Teorema del Valor Intermedio", status: "not_started", objectives: ["Demostrar existencia de raíces"] }
        ]
      },
      {
        id: "unit-2",
        title: "Unidad 2: La Derivada",
        order: 2,
        topics: [
          { id: "2.1", title: "Definición de Derivada", status: "not_started", objectives: ["Calcular razón de cambio"] },
          { id: "2.2", title: "Reglas de Derivación", status: "not_started", objectives: ["Aplicar regla de la potencia", "Regla de la cadena"] }
        ]
      }
    ]
  };

  try {
    await setDoc(doc(db, "curriculum", "calculo-11"), calculus11);
    console.log("Curriculum seeded successfully!");
  } catch (err) {
    console.error("Error seeding curriculum:", err);
  }
}
