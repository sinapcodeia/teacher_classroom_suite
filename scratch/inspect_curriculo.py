file_path = r"c:\COLEGIO\teacher_classroom_suite\src\app\curriculo\page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "id: 'lesson'" in line:
        print(f"Line {i+1}: {repr(line)}")
        # Print surrounding 5 lines
        for j in range(max(0, i-3), min(len(lines), i+6)):
            print(f"  [{j+1}] {repr(lines[j])}")
