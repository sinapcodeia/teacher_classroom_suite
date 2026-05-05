import sys

file_path = r'c:\COLEGIO\teacher_classroom_suite\src\components\admin\StatisticsDashboard.tsx'
with open(file_path, 'r', encoding='utf-16' if 'e x p o r t' in open(file_path, 'rb').read().decode('utf-16', errors='ignore') else 'utf-8') as f:
    content = f.readlines()

# Clean up corrupted lines
new_content = [line for line in content if 'e x p o r t' not in line]
if not new_content[-1].strip().endswith('}'):
     # potentially remove more
     pass

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_content)
    f.write('\nexport default StatisticsDashboard;\n')
