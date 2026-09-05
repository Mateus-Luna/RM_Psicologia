const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');
let backendProcess;

function startBackend() {
  const backendEntry = path.join(
    __dirname,
    '..',
    'backend',
    'dist',
    'src',
    'main.js',
  );

  const databaseDirectory = path.join(
  app.getPath('userData'),
  'database',
    );

    fs.mkdirSync(databaseDirectory, { recursive: true });

    const databasePath = path.join(
    databaseDirectory,
    'database.db',
    );

  backendProcess = spawn(process.execPath, [backendEntry], {
    cwd: path.join(__dirname, '..', 'backend'),
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: 'production',
      PORT: '3000',
      DATABASE_URL: `file:${databasePath}`,
    },
    stdio: 'inherit',
  });

  backendProcess.on('error', (error) => {
    console.error('Erro ao iniciar o backend:', error);
  });
}

function waitForBackend() {
  return new Promise((resolve, reject) => {
    const maxAttempts = 30;
    let attempts = 0;

    function check() {
      attempts++;

      const request = http.get(
        'http://localhost:3000/auth/setup-status',
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

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL('http://localhost:5173');
}

app.whenReady().then(async () => {
  startBackend();

  try {
    await waitForBackend();
    createWindow();
  } catch (error) {
    console.error('Erro ao aguardar o backend:', error);
    app.quit();
    return;
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});