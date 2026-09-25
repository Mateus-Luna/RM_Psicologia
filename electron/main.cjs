const { app, BrowserWindow, safeStorage } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');
const crypto = require('crypto');

let backendProcess = null;
let mainWindow = null;

// Determine environment: development vs production
const isDev = process.env.NODE_ENV === 'development';

/**
 * Manages the ENCRYPTION_KEY securely:
 * 1. Checks process.env.ENCRYPTION_KEY (if explicitly provided, e.g. dev)
 * 2. If not, reads encrypted key from userData/encryption.key using safeStorage
 * 3. If missing, generates 32 bytes hex, encrypts via safeStorage and persists
 */
function getOrGenerateEncryptionKey() {
  if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.trim()) {
    return process.env.ENCRYPTION_KEY.trim();
  }

  const keyFilePath = path.join(app.getPath('userData'), 'encryption.key');

  if (fs.existsSync(keyFilePath)) {
    try {
      const fileBuffer = fs.readFileSync(keyFilePath);
      if (safeStorage && safeStorage.isEncryptionAvailable()) {
        const decrypted = safeStorage.decryptString(fileBuffer);
        if (decrypted && decrypted.length >= 16) {
          return decrypted;
        }
      } else {
        const key = fileBuffer.toString('utf8');
        if (key && key.length >= 16) {
          return key;
        }
      }
    } catch (err) {
      console.warn('Aviso: Não foi possível descriptografar chave existente, gerando uma nova:', err);
    }
  }

  const newKey = crypto.randomBytes(32).toString('hex');

  try {
    if (safeStorage && safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(newKey);
      fs.writeFileSync(keyFilePath, encrypted);
    } else {
      fs.writeFileSync(keyFilePath, Buffer.from(newKey, 'utf8'));
    }
  } catch (err) {
    console.error('Erro ao salvar chave de criptografia:', err);
  }

  return newKey;
}

function getBackendPaths() {
  if (app.isPackaged) {
    const packagedEntry = path.join(
      process.resourcesPath,
      'backend',
      'dist',
      'src',
      'main.js',
    );
    const packagedCwd = path.join(process.resourcesPath, 'backend');
    const packagedMigrations = path.join(
      process.resourcesPath,
      'backend',
      'prisma',
      'migrations',
    );

    return {
      entry: packagedEntry,
      cwd: packagedCwd,
      migrationsDir: packagedMigrations,
    };
  }

  return {
    entry: path.join(__dirname, '..', 'backend', 'dist', 'src', 'main.js'),
    cwd: path.join(__dirname, '..', 'backend'),
    migrationsDir: path.join(__dirname, '..', 'backend', 'prisma', 'migrations'),
  };
}

function startBackend() {
  const { entry: backendEntry, cwd: backendCwd, migrationsDir } = getBackendPaths();

  const userDataPath = app.getPath('userData');
  const databaseDirectory = path.join(userDataPath, 'database');
  const backupsDirectory = path.join(userDataPath, 'backups');

  fs.mkdirSync(databaseDirectory, { recursive: true });
  fs.mkdirSync(backupsDirectory, { recursive: true });

  const databasePath = path.join(databaseDirectory, 'database.db');
  // Normalize Windows backslashes for SQLite file URL
  const databaseUrl = `file:${databasePath.replace(/\\/g, '/')}`;

  const encryptionKey = getOrGenerateEncryptionKey();

  backendProcess = spawn(process.execPath, [backendEntry], {
    cwd: backendCwd,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: 'production',
      PORT: '3000',
      DATABASE_URL: databaseUrl,
      BACKUPS_DIR: backupsDirectory,
      MIGRATIONS_DIR: migrationsDir,
      ENCRYPTION_KEY: encryptionKey,
    },
    stdio: 'inherit',
  });

  backendProcess.on('error', (error) => {
    console.error('Erro ao iniciar o processo do backend:', error);
  });

  backendProcess.on('exit', (code, signal) => {
    console.log(`Processo do backend finalizado com código ${code} e sinal ${signal}`);
  });
}

function waitForBackend() {
  return new Promise((resolve, reject) => {
    const maxAttempts = 40;
    let attempts = 0;

    function check() {
      attempts++;

      const request = http.get(
        'http://127.0.0.1:3000/auth/setup-status',
        (response) => {
          response.resume();

          if (response.statusCode === 200) {
            resolve();
            return;
          }

          retry();
        },
      );

      request.on('error', retry);

      request.setTimeout(1000, () => {
        request.destroy();
        retry();
      });
    }

    function retry() {
      if (attempts >= maxAttempts) {
        reject(
          new Error(
            'O backend não ficou disponível dentro do tempo esperado.',
          ),
        );
        return;
      }

      setTimeout(check, 500);
    }

    check();
  });
}

function getFrontendIndexPath() {
  const possibleIndexPaths = [
    // 1. Packaged inside app.asar (with explicit 'frontend/dist' mapping)
    path.join(app.getAppPath(), 'frontend', 'dist', 'index.html'),
    // 2. Packaged relative to __dirname inside app.asar
    path.join(__dirname, 'frontend', 'dist', 'index.html'),
    // 3. Fallbacks inside app.asar if flattened
    path.join(app.getAppPath(), 'dist', 'index.html'),
    path.join(app.getAppPath(), 'index.html'),
    // 4. In resources directory (if unpacked)
    path.join(process.resourcesPath, 'frontend', 'dist', 'index.html'),
    path.join(process.resourcesPath, 'app', 'frontend', 'dist', 'index.html'),
    // 5. In development (monorepo root: electron/../frontend/dist/index.html)
    path.join(__dirname, '..', 'frontend', 'dist', 'index.html'),
    path.join(process.cwd(), 'frontend', 'dist', 'index.html'),
  ];

  for (const candidate of possibleIndexPaths) {
    try {
      if (fs.existsSync(candidate)) {
        console.log(`[Frontend] index.html localizado em: ${candidate}`);
        return candidate;
      }
    } catch {
      // ignore
    }
  }

  console.error('[Frontend] ERRO: index.html não foi localizado nos caminhos verificados:');
  possibleIndexPaths.forEach((p) => console.error(`  - ${p}`));
  return path.join(app.getAppPath(), 'frontend', 'dist', 'index.html');
}

function createWindow() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'RM Psicologia',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const indexPath = getFrontendIndexPath();
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function stopBackend() {
  if (backendProcess && !backendProcess.killed) {
    try {
      backendProcess.kill();
    } catch {
      // ignore
    }
    backendProcess = null;
  }
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    startBackend();

    try {
      await waitForBackend();
      createWindow();
    } catch (error) {
      console.error('Erro ao aguardar o backend:', error);
      stopBackend();
      app.quit();
      return;
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('before-quit', stopBackend);
app.on('will-quit', stopBackend);

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
