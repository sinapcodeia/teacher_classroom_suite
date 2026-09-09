const fs = require('fs');

// Fix page.tsx TS errors with a Node script (safe, avoids editor corruption)
let file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix 1: add type to "updates" object in runCleanup
content = content.replace(
  'const updates = {};',
  'const updates: Record<string, any> = {};'
);

// Fix 2: cast 'e' to Error when accessing .message
content = content.replace(
  'alert("❌ Error: " + e.message);',
  'alert("❌ Error: " + (e as Error).message);'
);

// Fix 3: EduAISentinel 'subject' prop — remove if it's extra
// Find the pattern and remove subject prop
content = content.replace(
  /<EduAISentinel grado=\{([^}]+)\} curso=\{([^}]+)\} subject=\{([^}]+)\} \/>/g,
  '<EduAISentinel grado={$1} curso={$2} />'
);

fs.writeFileSync(file, content);
console.log("page.tsx TS fixes applied cleanly.");
