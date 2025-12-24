const { BrowserWindow } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { injectPrivacyAndLockUI } = require('./privacy');

const PIN_CODE = '1234'; // PIN default lock screen

// Atur folder download ke ~/Downloads/GeWhatsapp
function setDownloadDir(win) {
  const downloadsDir = path.join(os.homedir(), 'Downloads', 'GeWhatsapp');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }
  const ses = win.webContents.session;

  // Default path untuk download
  ses.setDownloadPath(downloadsDir);

  // Paksa semua download ke folder di atas tanpa dialog
  ses.on('will-download', (event, item) => {
    const filePath = path.join(downloadsDir, item.getFilename());
    item.setSavePath(filePath);
  });
}

/**
 * Membuat BrowserWindow utama yang memuat https://web.whatsapp.com
 * @param {object}  privacyState         State blur (messages/media/names, enabled)
 * @param {function} onVisibilityChange  Callback ke main.js ('closing', 'show', 'quit')
 * @param {object}  options              { isQuiting: () => boolean }
 */
function createMainWindow(privacyState, onVisibilityChange, options = {}) {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    autoHideMenuBar: true, // hilangkan menubar default
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  });

  // User Agent Chrome modern di Linux (supaya WA tidak blokir)
  const desktopUA =
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  mainWindow.webContents.setUserAgent(desktopUA);
  setDownloadDir(mainWindow);

  // Load WhatsApp Web
  mainWindow.loadURL('https://web.whatsapp.com', { userAgent: desktopUA });

  // Ketika user klik X:
  mainWindow.on('close', (event) => {
    // Jika sedang proses quit (via menu tray) → biarkan window benar-benar ditutup
    if (options.isQuiting && options.isQuiting()) {
      if (onVisibilityChange) onVisibilityChange('quit');
      return;
    }

    // Kalau tidak sedang quit → hide to tray (jangan destroy window)
    event.preventDefault();
    if (onVisibilityChange) onVisibilityChange('closing');
  });

  // Saat window show (baik dari tray atau second-instance), beritahu main.js
  mainWindow.on('show', () => {
    if (onVisibilityChange) onVisibilityChange('show');
  });

  // Setelah WA Web selesai load → inject CSS privacy + overlay lock
  mainWindow.webContents.on('did-finish-load', () => {
    injectPrivacyAndLockUI(mainWindow, privacyState, PIN_CODE).catch(console.error);
  });

  return mainWindow;
}

module.exports = {
  createMainWindow,
  PIN_CODE,
};
