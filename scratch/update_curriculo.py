import os

file_path = r"c:\COLEGIO\teacher_classroom_suite\src\app\curriculo\page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

target = """                              {[
                                { id: 'lesson', label: "Desarrollo", content: analysisResult.lesson, icon: <BookOpen size={14}/> },
                                { id: 'workshop', label: "Taller", content: analysisResult.workshop, icon: <FileText size={14}/> },
                                { id: 'activity', label: "Actividad", content: analysisResult.activity, icon: <Sparkles size={14}/> },
                                { id: 'exam', label: "Examen", content: analysisResult.exam, icon: <CheckCircle2 size={14}/> }
                              ].map((item, idx) => ("""

# Replace carriage return differences to normalize
target_lf = target.replace("\r\n", "\n")

replacement = """                              {[
                                { id: 'lesson', label: "Desarrollo", content: analysisResult.lesson, icon: <BookOpen size={14}/> },
                                { id: 'workshop', label: "Taller", content: analysisResult.workshop, icon: <FileText size={14}/> },
                                { id: 'activity', label: "Actividad", content: analysisResult.activity, icon: <Sparkles size={14}/> },
                                { id: 'exam', label: "Examen", content: analysisResult.exam, icon: <CheckCircle2 size={14}/> },
                                { id: 'teacherGuide', label: "Guía Docente", content: analysisResult.teacherGuide || "Guía exclusiva para el docente con respuestas del taller.", icon: <Presentation size={14}/> }
                              ].map((item, idx) => ("""

content_lf = content.replace("\r\n", "\n")
target_lf = target.replace("\r\n", "\n")
replacement_lf = replacement.replace("\r\n", "\n")

if target_lf in content_lf:
    content_lf = content_lf.replace(target_lf, replacement_lf)
    # Restore standard Windows CRLF since it's a Windows repo
    content = content_lf.replace("\n", "\r\n")
    print("Replaced successfully!")
else:
    print("Error: Target block not found in page.tsx")

with open(file_path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(content)
print("Finished!")
