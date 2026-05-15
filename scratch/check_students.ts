
import { db } from "../src/lib/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";

async function checkStudents() {
  const q = query(collection(db, "students"), limit(10));
  const snap = await getDocs(q);
  console.log("Total students found (limit 10):", snap.size);
  snap.forEach(doc => {
    const d = doc.data();
    console.log(`ID: ${doc.id} | Grado: ${d.grado} | Curso: ${d.curso} | Nombre: ${d.primerNombre} ${d.primerApellido}`);
  });
}

checkStudents();
