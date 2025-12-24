const { app } = require('electron');
const path = require('path');
const { createMainWindow, PIN_CODE } = require('./src/window');
const { createTray } = require('./src/tray');

// Referensi global ke window utama dan tray
let mainWindow;
let trayObj;          // { tray, refreshMenu }
let isQuiting = false;

// State konfigurasi privacy (digunakan oleh window & tray)
let privacyState = {
  enabled: true,
  blurMessages: true,
  blurMedia: true,
  blurNames: true,
};

// Pastikan hanya satu instance app yang berjalan
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Jika sudah ada instance lain → langsung exit
  app.quit();
} else {
  // Jika user mencoba membuka app lagi (double click launcher),
  // fokuskan instance yang sudah ada
  app.on('second-instance', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });

  /**
   * Callback perubahan visibility window dari src/window.js
   * event:
   *  - 'closing' → user klik X (kita hide ke tray, bukan destroy)
   *  - 'show'    → window di-show lagi
   *  - 'quit'    → app benar-benar mau keluar
   */
  function handleVisibilityChange(event) {
    if (!mainWindow) return;

    if (event === 'closing' && !isQuiting) {
      // Mode normal: hide ke tray, hilang dari taskbar
      mainWindow.hide();
      mainWindow.setSkipTaskbar(true);
    }

    if (event === 'show') {
      // Saat window dimunculkan lagi, tampilkan juga di taskbar
      mainWindow.setSkipTaskbar(false);
    }

    // Sinkronkan label menu tray (Hide/Show Window dll)
    if (trayObj && trayObj.refreshMenu) {
      trayObj.refreshMenu();
    }
  }

  // Dipanggil ketika Electron siap membuat window
  app.whenReady().then(() => {
    // Buat window utama (load WhatsApp Web + apply privacy CSS)
    mainWindow = createMainWindow(
      privacyState,
      handleVisibilityChange,
      { isQuiting: () => isQuiting }
    );

    // Buat tray + menu (privacy toggles, lock, show/hide, quit)
    trayObj = createTray(mainWindow, privacyState, {
      pinCode: PIN_CODE,
      iconPath: path.join(__dirname, 'assets', 'tray.png'),
      onQuit: () => {
        // Dipanggil ketika user klik "Quit" di menu tray
        isQuiting = true;
        app.quit(); // trigger event close → window benar-benar ditutup
      },
    });
  });

  // Flag bahwa app sedang dalam proses quit (agar handler close tidak preventDefault)
  app.on('before-quit', () => {
    isQuiting = true;
  });

  // Di Linux, jangan keluar ketika semua window tertutup,
  // selama belum benar-benar diminta quit (biar tetap hidup di tray)
  app.on('window-all-closed', (e) => {
    if (!isQuiting) {
      e.preventDefault();
    }
  });
}
