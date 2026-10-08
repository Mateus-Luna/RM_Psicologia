const { app, BrowserWindow, safeStorage, ipcMain, dialog, } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');
const crypto = require('crypto');

const {
  getMachineId,
  getLicenseStatus,
  verifyLicenseToken,
  saveLicense,
} = require('./license.cjs');

let backendProcess = null;
let mainWindow = null;

const PUBLIC_KEY_PATH = path.join(
  __dirname,
  'license',
  'public.pem',
);

let publicLicenseKey = null;

function loadPublicLicenseKey() {
  if (!fs.existsSync(PUBLIC_KEY_PATH)) {
    throw new Error(
      `Chave pública da licença não encontrada: ${PUBLIC_KEY_PATH}`,
    );
  }

  publicLicenseKey = fs.readFileSync(
    PUBLIC_KEY_PATH,
    'utf8',
  );
}

// Define um diretório próprio para os dados persistentes da aplicação.
// Deve ser configurado antes de qualquer uso de app.getPath('userData').
app.setPath(
  'userData',
  path.join(app.getPath('appData'), 'PsiFicha'),
);

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

function getBrandingDirectory() {
  const brandingDirectory = path.join(
    app.getPath('userData'),
    'branding',
  );

  fs.mkdirSync(brandingDirectory, {
    recursive: true,
  });

  return brandingDirectory;
}

function getBrandingDirectory() {
  const brandingDirectory = path.join(
    app.getPath('userData'),
    'branding',
  );

  fs.mkdirSync(brandingDirectory, {
    recursive: true,
  });

  return brandingDirectory;
}

function getLogoPath() {
  const brandingDirectory = getBrandingDirectory();

  const extensions = [
    '.png',
    '.jpg',
    '.jpeg',
    '.webp',
  ];

  for (const extension of extensions) {
    const candidate = path.join(
      brandingDirectory,
      `logo${extension}`,
    );

    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function getLogoMimeType(filePath) {
  const extension = path
    .extname(filePath)
    .toLowerCase();

  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
  };

  return mimeTypes[extension] ?? null;
}

function getLogoExtension(filePath) {
  const extension = path
    .extname(filePath)
    .toLowerCase();

  const allowedExtensions = [
    '.png',
    '.jpg',
    '.jpeg',
    '.webp',
  ];

  return allowedExtensions.includes(extension)
    ? extension
    : null;
}

function getLogoExtension(filePath) {
  const extension = path
    .extname(filePath)
    .toLowerCase();

  const allowedExtensions = [
    '.png',
    '.jpg',
    '.jpeg',
    '.webp',
  ];

  return allowedExtensions.includes(extension)
    ? extension
    : null;
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
    title: 'PsiFicha',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(
    __dirname,
    'preload.cjs',
  ),
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

let licenseWindow = null;

function createLicenseWindow() {
  licenseWindow = new BrowserWindow({
    width: 620,
    height: 520,
    resizable: false,
    maximizable: false,
    minimizable: false,
    title: 'Ativação - PsiFicha',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(
        __dirname,
        'license-preload.cjs',
      ),
    },
  });

  const machineId = getMachineId();

  const html = `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
  <meta charset="UTF-8">
  <title>Ativação - PsiFicha</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 40px;
      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      background: #f5f7fa;
      color: #1f2937;
    }

    .container {
      max-width: 520px;
      margin: 0 auto;
    }

    h1 {
      margin: 0 0 8px;
      font-size: 28px;
    }

    .subtitle {
      color: #6b7280;
      margin-bottom: 30px;
    }

    label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .machine {
      padding: 14px;
      background: #e5e7eb;
      border-radius: 8px;
      font-family: monospace;
      font-size: 16px;
      letter-spacing: 1px;
      margin-bottom: 24px;
      user-select: text;
    }

    textarea {
      width: 100%;
      height: 130px;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      resize: none;
      font-family: monospace;
      font-size: 13px;
    }

    button {
      width: 100%;
      margin-top: 16px;
      padding: 13px;
      border: none;
      border-radius: 8px;
      background: #2563eb;
      color: white;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
    }

    button:hover {
      background: #1d4ed8;
    }

    button:disabled {
      opacity: .6;
      cursor: default;
    }

    .error {
      margin-top: 15px;
      color: #dc2626;
      min-height: 20px;
    }

    .info {
      margin-top: 20px;
      font-size: 13px;
      color: #6b7280;
      line-height: 1.5;
    }
  </style>
  </head>

  <body>

  <div class="container">

    <h1>Ativar PsiFicha</h1>

    <div class="subtitle">
      Este computador ainda não possui uma licença ativada.
    </div>

    <label>Identificador deste computador</label>

    <div class="machine" id="machineId">
      ${machineId}
    </div>

    <label for="license">
      Chave de licença
    </label>

    <textarea
      id="license"
      placeholder="Cole aqui a chave de licença fornecida pelo administrador."
    ></textarea>

    <button id="activate">
      Ativar aplicativo
    </button>

    <div
      class="error"
      id="error"
    ></div>

    <div class="info">
      Envie o identificador do computador ao responsável
      pela licença para receber uma chave de ativação.
    </div>

  </div>

  <script>
    const button = document.getElementById('activate');
    const textarea = document.getElementById('license');
    const error = document.getElementById('error');

    button.addEventListener('click', async () => {
      error.textContent = '';

      const license = textarea.value.trim();

      if (!license) {
        error.textContent = 'Informe a chave de licença.';
        return;
      }

      button.disabled = true;
      button.textContent = 'Ativando...';

      try {
        const result =
          await window.licenseAPI.activate(license);

        if (!result.valid) {
          error.textContent =
            result.reason || 'Licença inválida.';
          return;
        }

        window.location.reload();

      } catch (err) {
        error.textContent =
          'Não foi possível ativar o aplicativo.';
      } finally {
        button.disabled = false;
        button.textContent = 'Ativar aplicativo';
      }
    });
  </script>

  </body>
  </html>
  `;

  licenseWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
  );

  licenseWindow.on('closed', () => {
    licenseWindow = null;
  });
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
  try {
    loadPublicLicenseKey();
  } catch (error) {
    console.error(
      '[License] Erro ao carregar licença:',
      error,
    );

    app.quit();
    return;
  }

  const licenseStatus = getLicenseStatus(
    app.getPath('userData'),
    publicLicenseKey,
  );

  if (!licenseStatus.valid) {
    createLicenseWindow();
    return;
  }

  startBackend();

  try {
    await waitForBackend();
    createWindow();
  } catch (error) {
    console.error(
      'Erro ao aguardar o backend:',
      error,
    );

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

ipcMain.handle('backup:save', async (_event, { buffer, filename }) => {
  try {
    if (!buffer) {
      return {
        success: false,
        canceled: false,
        error: 'Nenhum arquivo de backup foi recebido.',
      };
    }

    const result = await dialog.showSaveDialog({
      title: 'Salvar backup do PsiFicha',
      defaultPath: filename || 'PsiFicha-Backup.db',
      filters: [
        {
          name: 'Banco de dados SQLite',
          extensions: ['db'],
        },
      ],
    });

    if (result.canceled || !result.filePath) {
      return {
        success: false,
        canceled: true,
      };
    }

    const fileBuffer = Buffer.from(buffer);

    await fs.promises.writeFile(
      result.filePath,
      fileBuffer,
    );

    return {
      success: true,
      canceled: false,
      filePath: result.filePath,
    };
  } catch (error) {
    console.error(
      '[Backup] Erro ao salvar backup:',
      error,
    );

    return {
      success: false,
      canceled: false,
      error: 'Não foi possível salvar o backup no local escolhido.',
    };
  }
});

app.on('before-quit', stopBackend);
app.on('will-quit', stopBackend);

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', stopBackend);
app.on('will-quit', stopBackend);

app.on('window-all-closed', () => {
  stopBackend();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle(
  'license:activate',
  (_event, licenseToken) => {
    try {
      fs.appendFileSync(
        path.join(app.getPath('userData'), 'license-debug.log'),
        `[${new Date().toISOString()}] license:activate chamado\n`,
      );

      const normalizedLicenseToken = String(
        licenseToken || '',
      )
        .trim()
        .replace(/\r?\n/g, '');

      fs.appendFileSync(
        path.join(app.getPath('userData'), 'license-debug.log'),
        `[${new Date().toISOString()}] token recebido: ${normalizedLicenseToken ? 'SIM' : 'NAO'}\n`,
      );

      const result = verifyLicenseToken(
        normalizedLicenseToken,
        publicLicenseKey,
      );

      fs.appendFileSync(
        path.join(app.getPath('userData'), 'license-debug.log'),
        `[${new Date().toISOString()}] resultado: ${JSON.stringify(result)}\n`,
      );

      if (!result.valid) {
        return result;
      }

      saveLicense(
        app.getPath('userData'),
        normalizedLicenseToken,
      );

      fs.appendFileSync(
        path.join(app.getPath('userData'), 'license-debug.log'),
        `[${new Date().toISOString()}] licença salva com sucesso\n`,
      );

      return {
        valid: true,
        payload: result.payload,
      };
    } catch (error) {
      fs.appendFileSync(
        path.join(app.getPath('userData'), 'license-debug.log'),
        `[${new Date().toISOString()}] ERRO: ${error?.stack || error}\n`,
      );

      throw error;
    }
  },
);
ipcMain.handle(
  'logo:select',
  async () => {
    const result = await dialog.showOpenDialog(
      mainWindow,
      {
        title: 'Selecionar logomarca',
        properties: ['openFile'],
        filters: [
          {
            name: 'Imagens',
            extensions: [
              'png',
              'jpg',
              'jpeg',
              'webp',
            ],
          },
        ],
      },
    );

    if (
      result.canceled ||
      !result.filePaths.length
    ) {
      return {
        success: false,
        canceled: true,
      };
    }

    const sourcePath = result.filePaths[0];

    const extension =
      getLogoExtension(sourcePath);

    if (!extension) {
      return {
        success: false,
        message:
          'Formato de imagem não permitido.',
      };
    }

    try {
      const stats = fs.statSync(sourcePath);

      const maxSize =
        5 * 1024 * 1024;

      if (stats.size > maxSize) {
        return {
          success: false,
          message:
            'A logomarca deve ter no máximo 5 MB.',
        };
      }

      const brandingDirectory =
        getBrandingDirectory();

      const temporaryPath = path.join(
        brandingDirectory,
        `logo-temp${extension}`,
      );

      const finalPath = path.join(
        brandingDirectory,
        `logo${extension}`,
      );

      /*
       * Remove eventuais logos antigas antes
       * de concluir a substituição.
       */
      const existingExtensions = [
        '.png',
        '.jpg',
        '.jpeg',
        '.webp',
      ];

      /*
       * Primeiro copiamos para um arquivo
       * temporário. Assim, se a cópia falhar,
       * a logo atual continua intacta.
       */
      fs.copyFileSync(
        sourcePath,
        temporaryPath,
      );

      /*
       * Depois que a nova imagem foi copiada
       * com sucesso, removemos a logo anterior.
       */
      for (const existingExtension of existingExtensions) {
        const existingPath = path.join(
          brandingDirectory,
          `logo${existingExtension}`,
        );

        if (
          existingPath !== finalPath &&
          fs.existsSync(existingPath)
        ) {
          fs.unlinkSync(existingPath);
        }
      }

      /*
       * Remove eventual arquivo final do
       * mesmo formato antes de renomear.
       */
      if (fs.existsSync(finalPath)) {
        fs.unlinkSync(finalPath);
      }

      fs.renameSync(
        temporaryPath,
        finalPath,
      );

      return {
        success: true,
      };
    } catch (error) {
      console.error(
        '[Logo] Erro ao salvar logomarca:',
        error,
      );

      return {
        success: false,
        message:
          'Não foi possível salvar a logomarca.',
      };
    }
  },
);

ipcMain.handle(
  'logo:get',
  async () => {
    const logoPath = getLogoPath();

    if (!logoPath) {
      return {
        exists: false,
      };
    }

    try {
      const buffer =
        fs.readFileSync(logoPath);

      const mimeType =
        getLogoMimeType(logoPath);

      if (!mimeType) {
        return {
          exists: false,
        };
      }

      return {
        exists: true,
        data: buffer.toString('base64'),
        mimeType,
      };
    } catch (error) {
      console.error(
        '[Logo] Erro ao carregar logomarca:',
        error,
      );

      return {
        exists: false,
      };
    }
  },
);

ipcMain.handle(
  'logo:remove',
  async () => {
    try {
      const brandingDirectory =
        getBrandingDirectory();

      const extensions = [
        '.png',
        '.jpg',
        '.jpeg',
        '.webp',
      ];

      for (const extension of extensions) {
        const logoPath = path.join(
          brandingDirectory,
          `logo${extension}`,
        );

        if (fs.existsSync(logoPath)) {
          fs.unlinkSync(logoPath);
        }
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error(
        '[Logo] Erro ao remover logomarca:',
        error,
      );

      return {
        success: false,
        message:
          'Não foi possível remover a logomarca.',
      };
    }
  },


);