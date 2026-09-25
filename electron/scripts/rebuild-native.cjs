/**
 * Rebuilds all native Node.js modules for Electron 44.2.0 (Windows x64 / ABI 149).
 * 
 * Target native modules:
 * - backend/node_modules/@prisma/adapter-better-sqlite3/node_modules/better-sqlite3
 * - backend/node_modules/argon2
 * - backend/node_modules/better-sqlite3 (if actually present as a native module)
 * 
 * Never considers @types/* packages.
 * Only validates modules that actually exist on disk as native modules.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ELECTRON_VERSION = '44.2.0';
const TARGET_ARCH = 'x64';

const projectRoot = path.resolve(__dirname, '..', '..');
const backendDir = path.resolve(projectRoot, 'backend');
const electronDir = path.resolve(__dirname, '..');

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

function runRebuild(rebuildBin, moduleDir, whichModules) {
  console.log(`\n==================================================`);
  console.log(`Reconstruindo módulos: ${whichModules}`);
  console.log(`Diretório pai (module-dir): ${moduleDir}`);
  console.log(`==================================================`);

  if (!fs.existsSync(path.join(moduleDir, 'package.json'))) {
    throw new Error(`Diretório inválido para rebuild (sem package.json): ${moduleDir}`);
  }

  const platformFlag = process.platform === 'win32' ? '--platform win32' : '';
  const cmd = `"${rebuildBin}" --version ${ELECTRON_VERSION} --arch ${TARGET_ARCH} ${platformFlag} --force --module-dir "${moduleDir}" --which-module ${whichModules}`;

  console.log(`Executando: ${cmd}\n`);

  execSync(cmd, {
    stdio: 'inherit',
    cwd: moduleDir,
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

function verifyBinary(label, expectedPaths) {
  for (const p of expectedPaths) {
    if (fs.existsSync(p)) {
      console.log(`✓ [${label}] Binário validado: ${p}`);
      return true;
    }
  }

  console.error(`✗ [${label}] Binário .node não encontrado em nenhum dos caminhos esperados:`);
  expectedPaths.forEach(p => console.error(`    - ${p}`));
  return false;
}

function isRealNativePackage(dirPath) {
  if (!fs.existsSync(dirPath)) return false;
  const hasPkg = fs.existsSync(path.join(dirPath, 'package.json'));
  const hasGyp = fs.existsSync(path.join(dirPath, 'binding.gyp'));
  return hasPkg && hasGyp;
}

function main() {
  console.log('--------------------------------------------------');
  console.log(`Iniciando Rebuild de Módulos Nativos para Electron ${ELECTRON_VERSION} (${TARGET_ARCH})`);
  console.log('--------------------------------------------------');

  const rebuildBin = getElectronRebuildBin();
  console.log(`Ferramenta: ${rebuildBin}`);

  // Paths
  const nestedPrismaAdapterDir = path.resolve(
    backendDir,
    'node_modules',
    '@prisma',
    'adapter-better-sqlite3'
  );
  const nestedBetterSqlite3Dir = path.resolve(
    nestedPrismaAdapterDir,
    'node_modules',
    'better-sqlite3'
  );

  const rootBetterSqlite3Dir = path.resolve(backendDir, 'node_modules', 'better-sqlite3');
  const rootArgon2Dir = path.resolve(backendDir, 'node_modules', 'argon2');

  let hasErrors = false;

  // 1. Rebuild nested better-sqlite3 in @prisma/adapter-better-sqlite3
  if (fs.existsSync(nestedBetterSqlite3Dir)) {
    try {
      runRebuild(rebuildBin, nestedPrismaAdapterDir, 'better-sqlite3');
    } catch (err) {
      console.error(`✗ Falha no rebuild de better-sqlite3 aninhado:`, err.message);
      hasErrors = true;
    }
  } else {
    console.log(`[Info] better-sqlite3 aninhado em @prisma/adapter-better-sqlite3 não encontrado.`);
  }

  // 2. Rebuild backend modules (better-sqlite3, argon2)
  try {
    runRebuild(rebuildBin, backendDir, 'better-sqlite3,argon2');
  } catch (err) {
    console.error(`✗ Falha no rebuild dos módulos na raiz do backend:`, err.message);
    hasErrors = true;
  }

  // 3. Validation of real existing binaries
  console.log('\n==================================================');
  console.log('Validando binários .node gerados');
  console.log('==================================================');

  let sqliteValidated = false;
  let argonValidated = false;

  // Validate nested better-sqlite3
  if (fs.existsSync(nestedBetterSqlite3Dir)) {
    const nestedOk = verifyBinary('better-sqlite3 (Prisma aninhado)', [
      path.join(nestedBetterSqlite3Dir, 'build', 'Release', 'better_sqlite3.node'),
      path.join(nestedBetterSqlite3Dir, 'Release', 'better_sqlite3.node'),
    ]);
    if (nestedOk) {
      sqliteValidated = true;
    }
  }

  // Validate root better-sqlite3 ONLY if it really exists as a native package (has package.json & binding.gyp)
  if (isRealNativePackage(rootBetterSqlite3Dir)) {
    const rootSqliteOk = verifyBinary('better-sqlite3 (raiz backend)', [
      path.join(rootBetterSqlite3Dir, 'build', 'Release', 'better_sqlite3.node'),
      path.join(rootBetterSqlite3Dir, 'Release', 'better_sqlite3.node'),
    ]);
    if (rootSqliteOk) {
      sqliteValidated = true;
    }
  }

  // Validate argon2
  if (fs.existsSync(rootArgon2Dir)) {
    argonValidated = verifyBinary('argon2 (raiz backend)', [
      path.join(rootArgon2Dir, 'build', 'Release', 'argon2.node'),
      path.join(rootArgon2Dir, 'lib', 'binding', 'argon2.node'),
      path.join(rootArgon2Dir, 'lib', 'binding', 'napi-v3', 'argon2.node'),
      path.join(rootArgon2Dir, 'Release', 'argon2.node'),
    ]);
  }

  console.log('==================================================\n');

  if (hasErrors || !sqliteValidated || !argonValidated) {
    console.error('✗ Rebuild finalizado com erros: os binários essenciais (better-sqlite3 e argon2) não foram validados.');
    process.exit(1);
  }

  console.log('==================================================');
  console.log('✓ Rebuild finalizado com sucesso.');
  console.log('==================================================\n');
}

main();
