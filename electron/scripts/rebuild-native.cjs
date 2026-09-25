/**
 * Rebuilds all native Node.js modules for Electron 44.2.0 (Windows x64 / ABI 149).
 * 
 * Specifically handles both top-level and nested native modules, such as:
 * - backend/node_modules/better-sqlite3
 * - backend/node_modules/@prisma/adapter-better-sqlite3/node_modules/better-sqlite3
 * - backend/node_modules/argon2
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ELECTRON_VERSION = '44.2.0';
const TARGET_ARCH = 'x64';

const projectRoot = path.resolve(__dirname, '..', '..');
const backendDir = path.resolve(projectRoot, 'backend');
const backendNodeModules = path.resolve(backendDir, 'node_modules');
const electronDir = path.resolve(__dirname, '..');

// Find electron-rebuild executable
function getElectronRebuildBin() {
  const possiblePaths = [
    path.join(electronDir, 'node_modules', '.bin', 'electron-rebuild.cmd'),
    path.join(electronDir, 'node_modules', '.bin', 'electron-rebuild'),
    path.join(projectRoot, 'node_modules', '.bin', 'electron-rebuild.cmd'),
    path.join(projectRoot, 'node_modules', '.bin', 'electron-rebuild'),
  ];

  for (const binPath of possiblePaths) {
    if (fs.existsSync(binPath)) {
      return binPath;
    }
  }

  return 'npx electron-rebuild';
}

/**
 * Recursively find directories for native modules (better-sqlite3, argon2)
 */
function findNativeModules(startDir, moduleNames) {
  const found = [];

  function scan(currentDir, depth = 0) {
    if (depth > 8 || !fs.existsSync(currentDir)) return;

    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const fullPath = path.join(currentDir, entry.name);

      if (moduleNames.includes(entry.name)) {
        const pkgJson = path.join(fullPath, 'package.json');
        const bindingGyp = path.join(fullPath, 'binding.gyp');

        if (fs.existsSync(pkgJson) || fs.existsSync(bindingGyp)) {
          const parentDir = path.dirname(currentDir);
          found.push({
            name: entry.name,
            modulePath: fullPath,
            parentDir: parentDir,
          });
        }
      }

      // Descend into node_modules, scopes, or packages that might contain nested node_modules
      if (
        entry.name === 'node_modules' ||
        entry.name.startsWith('@') ||
        currentDir.endsWith('node_modules') ||
        entry.name === 'adapter-better-sqlite3'
      ) {
        scan(fullPath, depth + 1);
      }
    }
  }

  scan(startDir);
  return found;
}

function runRebuildForModule(rebuildBin, parentDir, moduleName) {
  console.log(`\n==================================================`);
  console.log(`Reconstruindo [${moduleName}]`);
  console.log(`Diretório pai: ${parentDir}`);
  console.log(`==================================================`);

  const platformFlag = process.platform === 'win32' ? '--platform win32' : '';
  const cmd = `"${rebuildBin}" --version ${ELECTRON_VERSION} --arch ${TARGET_ARCH} ${platformFlag} --force --module-dir "${parentDir}" --which-module ${moduleName}`;

  console.log(`Executando: ${cmd}\n`);

  execSync(cmd, {
    stdio: 'inherit',
    cwd: parentDir,
    env: {
      ...process.env,
      npm_config_target: ELECTRON_VERSION,
      npm_config_arch: TARGET_ARCH,
      npm_config_target_arch: TARGET_ARCH,
      npm_config_disturl: 'https://electronjs.org/headers',
      npm_config_runtime: 'electron',
      npm_config_build_from_source: 'true',
    },
  });
}

function verifyModuleNodeBinary(modulePath, moduleName) {
  const possibleNodePaths = [
    path.join(modulePath, 'build', 'Release', `${moduleName.replace('-', '_')}.node`),
    path.join(modulePath, 'build', 'Release', `${moduleName}.node`),
  ];

  if (moduleName === 'argon2') {
    possibleNodePaths.push(
      path.join(modulePath, 'lib', 'binding', 'argon2.node'),
      path.join(modulePath, 'build', 'Release', 'argon2.node')
    );
  }

  for (const p of possibleNodePaths) {
    if (fs.existsSync(p)) {
      console.log(`✓ Verificado: ${p}`);
      return true;
    }
  }

  console.warn(`! Atenção: Binário .node não encontrado nos caminhos padrão para ${modulePath}`);
  return false;
}

function main() {
  console.log('--------------------------------------------------');
  console.log(`Iniciando Rebuild de Módulos Nativos para Electron ${ELECTRON_VERSION} (${TARGET_ARCH})`);
  console.log('--------------------------------------------------');

  const rebuildBin = getElectronRebuildBin();
  console.log(`Ferramenta: ${rebuildBin}`);

  if (!fs.existsSync(backendNodeModules)) {
    console.error(`Erro: Diretório não encontrado: ${backendNodeModules}`);
    process.exit(1);
  }

  const nativeModules = findNativeModules(backendNodeModules, ['better-sqlite3', 'argon2']);

  console.log(`\nEncontradas ${nativeModules.length} instâncias de módulos nativos no backend:`);
  nativeModules.forEach((m, idx) => {
    console.log(`  ${idx + 1}. [${m.name}] em: ${m.modulePath}`);
  });

  if (nativeModules.length === 0) {
    console.warn('Aviso: Nenhuma instância de better-sqlite3 ou argon2 foi encontrada para rebuild.');
    return;
  }

  // Deduplicate by parentDir + moduleName
  const tasks = [];
  const seen = new Set();

  for (const m of nativeModules) {
    const key = `${m.parentDir}::${m.name}`;
    if (!seen.has(key)) {
      seen.add(key);
      tasks.push(m);
    }
  }

  let errorCount = 0;

  for (const task of tasks) {
    try {
      runRebuildForModule(rebuildBin, task.parentDir, task.name);
      verifyModuleNodeBinary(task.modulePath, task.name);
    } catch (err) {
      console.error(`\n✗ Falha ao reconstruir ${task.name} em ${task.parentDir}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n==================================================');
  if (errorCount === 0) {
    console.log(`✓ Rebuild de todas as instâncias de módulos nativos finalizado com sucesso!`);
  } else {
    console.error(`✗ Rebuild finalizado com ${errorCount} erro(s).`);
    process.exit(1);
  }
  console.log('==================================================\n');
}

main();
