import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function runCommand(cmd, args, extraEnv = {}) {
  const result = spawnSync(cmd, args, {
    cwd: projectRoot,
    stdio: "inherit",
    shell: process.platform === "win32" && cmd.endsWith(".cmd"),
    env: { ...process.env, ...extraEnv },
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function findFileRecursive(dir, filename) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findFileRecursive(fullPath, filename);
      if (found) return found;
    } else if (entry.name === filename) {
      return fullPath;
    }
  }
  return null;
}

console.log("1/2 Ejecutando pruebas del motor académico SIEEE...");
runCommand(process.execPath, [
  "--experimental-strip-types",
  path.join("scripts", "test-grade-engine.mts"),
]);

console.log("\n2/2 Compilando y ejecutando pruebas del conector SAPRED...");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "edumanager-sapred-test-"));

try {
  const tscBin = path.join(
    projectRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "tsc.cmd" : "tsc"
  );

  // Copiar a .ts temporal para que TypeScript compile todo el árbol como CommonJS válido en Node
  const rawTest = fs.readFileSync(
    path.join(projectRoot, "scripts", "test-sapred-connector.mts"),
    "utf8"
  );
  const relSrcDir = path
    .relative(tempDir, path.join(projectRoot, "src"))
    .replace(/\\/g, "/");
  const absScratchXls = path
    .join(projectRoot, "scratch", "ING_NOTAS.XLS")
    .replace(/\\/g, "/");
  const rewrittenTest = rawTest
    .replace(/from\s+["']\.\.\/src\/([^"']+)["']/g, `from "${relSrcDir}/$1"`)
    .replace(/["']scratch\/ING_NOTAS\.XLS["']/g, JSON.stringify(absScratchXls));

  const tempTestTs = path.join(tempDir, "test-sapred-connector.ts");
  fs.writeFileSync(tempTestTs, rewrittenTest, "utf8");

  const tempTsConfigPath = path.join(tempDir, "tsconfig.test.json");
  const testOutDir = path.join(tempDir, "out");
  fs.writeFileSync(
    tempTsConfigPath,
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2020",
          module: "commonjs",
          moduleResolution: "node",
          jsx: "react-jsx",
          esModuleInterop: true,
          resolveJsonModule: true,
          skipLibCheck: true,
          strict: false,
          outDir: testOutDir,
          baseUrl: projectRoot,
          paths: {
            "@/*": ["src/*"],
            "*": ["node_modules/*", "node_modules/@types/*"],
          },
        },
        files: [tempTestTs],
      },
      null,
      2
    ),
    "utf8"
  );

  runCommand(tscBin, ["-p", tempTsConfigPath]);

  const compiledTestPath = findFileRecursive(
    testOutDir,
    "test-sapred-connector.js"
  );
  if (!compiledTestPath) {
    throw new Error("No se encontró el archivo compilado test-sapred-connector.js");
  }

  runCommand(process.execPath, [compiledTestPath], {
    NODE_PATH: path.join(projectRoot, "node_modules"),
  });
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log("\nTodas las suites automatizadas pasaron correctamente.");
