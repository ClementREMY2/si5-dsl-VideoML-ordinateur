import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
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

const PYTHON_PATH = process.platform === "win32" ? "py" : "python3";

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1600,
    height: 900,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webSecurity: false, // Needed to authorize file:// protocol
    },
  })

  // Open the DevTools.
  win.webContents.openDevTools();

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

  // START - HANDLERS FOR VALIDATOR
  // Handle file validation requests
  ipcMain.handle('validate-file', async (_, { path: videoFilePath }) => {
    return await validateFilePath(videoFilePath);
  });
  // END - HANDLERS FOR VALIDATOR

  // Get NodeJS process
  ipcMain.handle('get-process-platform', () => {
    return process.platform;
  });

  // Resolve path (relative to absolute)
  ipcMain.handle('resolve-path', (_, filePath) => {
    return path.resolve(filePath);
  });

  ipcMain.handle('get-pwd', async () => {
    return process.cwd();
  });

  ipcMain.handle('show-file-in-folder', async (_, fullPath) => {
    shell.showItemInFolder(fullPath);
  });

  ipcMain.handle('generate-python-file', async (_, code, dirPath) => {
    const fullPath = path.join(dirPath.replace(/\n$/, ''), 'video.py');

    try {
        await fs.promises.writeFile(fullPath, code);
        return `File created at ${fullPath}`;
    } catch (err) {
        console.error(err);
        if (err instanceof Error) {
            throw new Error(`Failed to create file: ${err.message}`);
        } else {
            throw new Error('Failed to create file: Unknown error');
        }
    }
});

  ipcMain.handle('is-python-installed', async () => {
    try {
      const pythonCheck = spawn(PYTHON_PATH, ["--version"]);
  
      const result = await new Promise((resolve) => {
        pythonCheck.stdout.on("data", () => {
          resolve(true);
        });
        pythonCheck.stderr.on("data", () => {
          resolve(false);
        });
        pythonCheck.on("close", (code) => {
          if (code === 0) {
              resolve(true);
          } else {
              resolve(false);
          }
        });
      });

      return result;
    } catch (e) {
      return false;
    }
  });

  ipcMain.handle('install-requirements', async () => {
    const requirements = spawn(PYTHON_PATH, ["-m", "pip", "install", "-r", "requirements.txt"]);

    const result = await new Promise((resolve, reject) => {
      requirements.stdout.on("data", (result) => {
        console.log(result.toString());
      });
      requirements.stderr.on("data", (err) => {
        console.log('ERROR', err.toString());
      });
      requirements.on("close", (code) => {
        if (code === 0) {
            resolve(true);
        } else {
            reject(false);
        }
      });
    });

    return result;
  });

  let pythonProcess: ChildProcessWithoutNullStreams | undefined;
  ipcMain.handle('generate-video', (_, path) => {
    const fullPath = path.replace(/\n$/, '') + '/video.py';
    pythonProcess = spawn(PYTHON_PATH, [fullPath]);

    // Setup data listeners
    pythonProcess.stderr.on("data", (err) => {
      const errorString = err.toString();
      console.error('Python process error:', errorString);
      // frame_index:  10%|▉         | 134/1354 [00:01<00:16, 73.30it/s, now=None]
      // Extract progess, processed frame, total frame, elapsed time, eta time, its

      // Regex to capture the desired components
      const frameIndexRegex = /frame_index:\s+(\d+)%\|.*?\|\s+(\d+)\/(\d+)\s+\[(\d{2}:\d{2})<(\d{2}:\d{2}),\s+([\d.]+)it\/s/;
      const chunkRegex = /chunk:\s+(\d+)%\|.*?\|\s+(\d+)\/(\d+)\s+\[(\d{2}:\d{2})<(\d{2}:\d{2}),\s+([\d.]+)it\/s/;

      const frameIndexMatch = errorString.match(frameIndexRegex);
      const chunkMatch = errorString.match(chunkRegex);

      if (frameIndexMatch) {
        const progress = parseInt(frameIndexMatch[1], 10);       // Progress in percentage
        const processedFrames = parseInt(frameIndexMatch[2], 10); // Number of frames processed
        const totalFrames = parseInt(frameIndexMatch[3], 10);    // Total number of frames
        const elapsedTime = frameIndexMatch[4];                  // Elapsed time (hh:mm)
        const etaTime = frameIndexMatch[5];                      // Estimated time remaining (hh:mm)
        const itPerSecond = parseFloat(frameIndexMatch[6]);      // Iterations per second (it/s)

        if (win) {
            win.webContents.send('video-generation-progress', {
              progress,
              processedFrames,
              totalFrames,
              elapsedTime,
              etaTime,
              itPerSecond,
              isFrameIndex: true,
            });
        }
      } else if (chunkMatch) {
        const progress = parseInt(chunkMatch[1], 10);       // Progress in percentage
        const processedFrames = parseInt(chunkMatch[2], 10); // Number of frames processed
        const totalFrames = parseInt(chunkMatch[3], 10);    // Total number of frames
        const elapsedTime = chunkMatch[4];                  // Elapsed time (hh:mm)
        const etaTime = chunkMatch[5];                      // Estimated time remaining (hh:mm)
        const itPerSecond = parseFloat(chunkMatch[6]);      // Iterations per second (it/s)

        if (win) {
            win.webContents.send('video-generation-progress', {
              progress,
              processedFrames,
              totalFrames,
              elapsedTime,
              etaTime,
              itPerSecond,
              isChunk: true,
            });
        }
      } else {
        // Send error to renderer process if it's not a progress update
        const ignoreRegex = /chunk|frame_index/;
        if (!ignoreRegex.test(errorString) && win) {
          win.webContents.send('video-generation-error', errorString);
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
