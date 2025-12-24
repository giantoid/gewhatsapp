const { Tray, Menu } = require('electron');
const path = require('path');
const { injectPrivacyAndLockUI } = require('./privacy');

function createTray(mainWindow, privacyState, options = {}) {
  const iconPath = options.iconPath || path.join(__dirname, '..', 'assets', 'tray.png');
  const tray = new Tray(iconPath);

  // Build menu context tray berdasarkan state saat ini
  function buildMenu() {
    return Menu.buildFromTemplate([
      {
        label: privacyState.enabled ? 'Disable Privacy' : 'Enable Privacy',
        type: 'checkbox',
        checked: privacyState.enabled,
        click: async (item) => {
          privacyState.enabled = item.checked;
          await injectPrivacyAndLockUI(mainWindow, privacyState, options.pinCode);
          refreshMenu();
        },
      },
      {
        label: 'Lock Screen',
        click: async () => {
          // Memanggil fungsi global di halaman WA untuk memunculkan overlay lock
          try {
            await mainWindow.webContents.executeJavaScript(
              'window.__wa_forceLock && window.__wa_forceLock();'
            );
          } catch (e) {
            console.error('Lock menu error:', e);
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Blur Messages',
        type: 'checkbox',
        checked: privacyState.blurMessages,
        click: async (item) => {
          privacyState.blurMessages = item.checked;
          await injectPrivacyAndLockUI(mainWindow, privacyState, options.pinCode);
          refreshMenu();
        },
      },
      {
        label: 'Blur Media',
        type: 'checkbox',
        checked: privacyState.blurMedia,
        click: async (item) => {
          privacyState.blurMedia = item.checked;
          await injectPrivacyAndLockUI(mainWindow, privacyState, options.pinCode);
          refreshMenu();
        },
      },
      {
        label: 'Blur Names',
        type: 'checkbox',
        checked: privacyState.blurNames,
        click: async (item) => {
          privacyState.blurNames = item.checked;
          await injectPrivacyAndLockUI(mainWindow, privacyState, options.pinCode);
          refreshMenu();
        },
      },
      { type: 'separator' },
      {
        label: mainWindow && mainWindow.isVisible() ? 'Hide Window' : 'Show Window',
        click: () => {
          toggleWindowVisibility();
        },
      },
      {
        label: 'Quit',
        click: () => {
          // Delegate ke callback yang diberikan dari main.js
          if (options.onQuit) options.onQuit();
        },
      },
    ]);
  }

  // Terapkan menu yang baru
  function refreshMenu() {
    tray.setContextMenu(buildMenu());
  }

  // Show/hide window utama dari tray
  function toggleWindowVisibility() {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
      mainWindow.setSkipTaskbar(true);
    } else {
      mainWindow.show();
      mainWindow.setSkipTaskbar(false);
      mainWindow.focus();
    }
    refreshMenu();
  }

  tray.setToolTip('GeWhatsapp');
  refreshMenu();

  // Klik kiri icon tray = show/hide window
  tray.on('click', () => {
    toggleWindowVisibility();
  });

  // Dipakai di main.js untuk akses tray & refreshMenu
  return { tray, refreshMenu };
}

module.exports = {
  createTray,
};
