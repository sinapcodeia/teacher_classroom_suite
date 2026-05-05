import os

file_path = r'c:\COLEGIO\teacher_classroom_suite\src\components\admin\StatisticsDashboard.tsx'
with open(file_path, 'rb') as f:
    data = f.read()

# Try to decode from multiple encodings
try:
    text = data.decode('utf-16')
except:
    text = data.decode('utf-8', errors='ignore')

lines = text.splitlines()
new_lines = []
for line in lines:
    # Check for spaced out export
    if 'e x p o r t' in line:
        continue
    if 'export default StatisticsDashboard;' in line:
        continue
    new_lines.append(line)

new_lines.append('export default StatisticsDashboard;')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))
