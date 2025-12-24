function buildPrivacyCSS(state) {
  // Jika privacy dimatikan → hapus semua blur
  if (!state.enabled) {
    return `
      span.selectable-text,
      div.copyable-text,
      div.message-in,
      div.message-out,
      img,
      video,
      header span[title],
      div[role="gridcell"] span[title] {
        filter: none !important;
      }
    `;
  }

  // Blur untuk pesan (bubble + teks)
  const messageBlur = state.blurMessages ? `
    /* Bubble diberi sedikit backdrop blur & transparansi agar efek menyatu */
    div.message-in,
    div.message-out {
      background-color: rgba(0, 0, 0, 0.02) !important;
      backdrop-filter: blur(2px);
      transition: background-color 0.15s ease-in-out;
    }
    /* Teks pesan blur ringan */
    span.selectable-text,
    div.copyable-text {
      filter: blur(3px) !important;
      transition: filter 0.15s ease-in-out;
    }
    /* Saat hover bubble, teks di bubble menjadi jelas */
    div.message-in:hover span.selectable-text,
    div.message-out:hover span.selectable-text,
    div.message-in:hover div.copyable-text,
    div.message-out:hover div.copyable-text {
      filter: none !important;
    }
  ` : `
    div.message-in,
    div.message-out {
      background-color: inherit !important;
      backdrop-filter: none !important;
    }
    span.selectable-text,
    div.copyable-text {
      filter: none !important;
    }
  `;

  // Blur untuk gambar & video
  const mediaBlur = state.blurMedia ? `
    img,
    video {
      filter: blur(4px) !important;
      transition: filter 0.15s ease-in-out;
    }
    img:hover,
    video:hover {
      filter: none !important;
    }
  ` : `
    img, video { filter: none !important; }
  `;

  // Blur untuk nama kontak / chat
  const namesBlur = state.blurNames ? `
    header span[title],
    div[role="gridcell"] span[title] {
      filter: blur(3px) !important;
      transition: filter 0.15s ease-in-out;
    }
    header span[title]:hover,
    div[role="gridcell"]:hover span[title] {
      filter: none !important;
    }
  ` : `
    header span[title],
    div[role="gridcell"] span[title] { filter: none !important; }
  `;

  return `
    ${messageBlur}
    ${mediaBlur}
    ${namesBlur}
  `;
}

/**
 * Inject CSS privacy + overlay lock dengan PIN ke dalam WhatsApp Web.
 * - Memasang <style id="wa-privacy-style"> berisi CSS blur.
 * - Menambahkan #wa-lock-overlay yang menutup layar saat lock aktif.
 * - window.__wa_forceLock() → dipanggil dari tray untuk memunculkan overlay.
 */
async function injectPrivacyAndLockUI(mainWindow, state, pinCode) {
  if (!mainWindow) return;
  const css = buildPrivacyCSS(state);

  await mainWindow.webContents.executeJavaScript(`
    (function() {
      // Hapus style lama, lalu pasang CSS privacy baru
      const old = document.getElementById('wa-privacy-style');
      if (old) old.remove();
      const style = document.createElement('style');
      style.id = 'wa-privacy-style';
      style.innerHTML = ${JSON.stringify(css)};
      document.head.appendChild(style);

      // LOCK overlay + PIN: dibuat sekali saja
      if (!document.getElementById('wa-lock-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'wa-lock-overlay';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '999999';
        overlay.style.display = 'none'; // default: tidak tampil
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.background = 'rgba(0,0,0,0.75)';
        overlay.innerHTML = \`
          <div style="
            background: rgba(0,0,0,0.9);
            border-radius: 16px;
            padding: 24px 28px;
            color: #fff;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            box-shadow: 0 10px 40px rgba(0,0,0,0.6);
            min-width: 260px;
            text-align: center;
          ">
            <div style="font-size:32px;margin-bottom:12px;">🔒</div>
            <div style="font-size:18px;font-weight:600;margin-bottom:6px;">Screen Locked</div>
            <div style="font-size:13px;opacity:0.8;margin-bottom:12px;">Enter PIN to unlock</div>
            <input id="wa-pin-input" type="password"
              style="padding:6px 10px;border-radius:8px;border:none;outline:none;width:100%;margin-bottom:10px;font-size:14px;" />
            <div style="display:flex;gap:8px;justify-content:center;">
              <button id="wa-pin-submit" style="padding:6px 12px;border:none;border-radius:8px;background:#25d366;color:#000;font-weight:600;cursor:pointer;">Unlock</button>
            </div>
            <div id="wa-pin-error" style="margin-top:8px;font-size:12px;color:#ff6b6b;min-height:16px;"></div>
          </div>
        \`;
        document.body.appendChild(overlay);

        // Fungsi global untuk memunculkan overlay lock (dipanggil dari tray)
        window.__wa_forceLock = function() {
          const ov = document.getElementById('wa-lock-overlay');
          const input = document.getElementById('wa-pin-input');
          const error = document.getElementById('wa-pin-error');
          if (!ov) return;
          ov.style.display = 'flex';
          if (input) {
            input.value = '';
            input.focus();
          }
          if (error) error.textContent = '';
        };

        // Handler tombol Unlock: cek PIN lalu sembunyikan overlay
        document.addEventListener('click', function(e) {
          if (e.target && e.target.id === 'wa-pin-submit') {
            const input = document.getElementById('wa-pin-input');
            const error = document.getElementById('wa-pin-error');
            if (!input) return;
            const val = input.value || '';
            if (val === '${pinCode}') {
              const ov = document.getElementById('wa-lock-overlay');
              if (ov) ov.style.display = 'none';
            } else {
              if (error) error.textContent = 'Wrong PIN';
            }
          }
        }, false);
      }
    })();
  `);
}

module.exports = {
  buildPrivacyCSS,
  injectPrivacyAndLockUI,
};
