import { app, BrowserWindow, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';

import { validateFilePath } from '../lib/generated/validators/special-validators'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webSecurity: false, // Needed to authorize file:// protocol
    },
  })

  // Open the DevTools.
  // win.webContents.openDevTools();

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  // Send the worker path to the renderer process
  ipcMain.handle('get-monaco-worker-path', () => {
    return path.join(app.getAppPath(), 'public', 'monaco-editor-wrapper/dist/workers/editorWorker-es.js');
  });
  ipcMain.handle('get-video-ml-worker-path', () => {
    return path.join(app.getAppPath(), 'public', 'video-ml-server-worker.js');
  });

  // Handle file validation requests
  ipcMain.handle('validate-file', async (_, videoFilePath) => {
    return await validateFilePath(videoFilePath);
  });
  // Get NodeJS process
  ipcMain.handle('get-process-platform', () => {
    return process.platform;
  });

  // Resolve path (relative to absolute)
  ipcMain.handle('resolve-path', (_, filePath) => {
    return path.resolve(filePath);
  });

  ipcMain.handle('get-pwd', async () => {
    const pwd = spawn("pwd");

    const result = await new Promise((resolve, reject) => {
      pwd.stdout.on("data", (result) => {
        resolve(result.toString());
      });
      pwd.stderr.on("data", (err) => {
        console.log(err.toString());
        reject(err.toString());
      });
    });

    return result;
  });

  ipcMain.handle('generate-python-file', async (_, code, path) => {
    const fullPath = path.replace(/\n$/, '') + '/video.py';
    const quotedCode = `'''${code}'''`;
    const pythonFile = spawn("echo", [quotedCode, ">", fullPath], { shell: true });

    const result = await new Promise((resolve, reject) => {
      pythonFile.stdout.on("data", (result) => {
        resolve(result.toString());
      });
      pythonFile.stderr.on("data", (err) => {
        console.log(err.toString());
        reject(err.toString());
      });
      pythonFile.on("close", (code) => {
        if (code === 0) {
            resolve(`File created at ${fullPath}`);
        } else {
            reject(`Process exited with code ${code}`);
        }
    });
    });

    return result;
  });

  let pythonProcess: ChildProcessWithoutNullStreams | undefined;
  ipcMain.handle('generate-video', (_, path) => {
    const fullPath = path.replace(/\n$/, '') + '/video.py';
    pythonProcess = spawn("python", [fullPath]);

    // Setup data listeners
    pythonProcess.stderr.on("data", (err) => {
      // frame_index:  10%|▉         | 134/1354 [00:01<00:16, 73.30it/s, now=None]
      // Extract progess, processed frame, total frame, elapsed time, eta time, its

      // Regex to capture the desired components
      const regex = /frame_index:\s+(\d+)%\|.*?\|\s+(\d+)\/(\d+)\s+\[(\d{2}:\d{2})<(\d{2}:\d{2}),\s+([\d.]+)it\/s/;

      const match = err.toString().match(regex);

      if (match) {
        const progress = parseInt(match[1], 10);       // Progress in percentage
        const processedFrames = parseInt(match[2], 10); // Number of frames processed
        const totalFrames = parseInt(match[3], 10);    // Total number of frames
        const elapsedTime = match[4];                  // Elapsed time (hh:mm)
        const etaTime = match[5];                      // Estimated time remaining (hh:mm)
        const itPerSecond = parseFloat(match[6]);      // Iterations per second (it/s)

        if (win) {
            win.webContents.send('video-generation-progress', {
              progress,
              processedFrames,
              totalFrames,
              elapsedTime,
              etaTime,
              itPerSecond
            });
        }
      }
    });

    // Setup close listener
    pythonProcess.on("close", (code) => {
      if (win) {
        win.webContents.send('video-generation-finished', code);
      }
    });
  });

  ipcMain.handle('cancel-video-generation', () => {
    if (pythonProcess) {
      pythonProcess.kill('SIGINT');
    }
  }); 

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
