# GeWhatsApp Privacy (Electron)

**GeWhatsApp Privacy** adalah aplikasi desktop Ubuntu berbasis **Electron** yang membungkus **WhatsApp Web**, dengan fitur privacy tambahan seperti **blur pesan/media/nama**, **hover reveal**, **PIN lock**, dan **tray mode** (berjalan di background).

## Fitur

### Wrapper WhatsApp Web

- Memuat `https://web.whatsapp.com` dengan user agent Chrome modern sehingga QR tampil normal.

### Privacy blur

- Blur pesan (bubble + teks).
- Blur gambar & video.
- Blur nama kontak / nama chat.
- Hover di bubble / media / nama → konten sementara terlihat.

### Lock screen dengan PIN

- Menu tray **Lock Screen** memunculkan overlay gelap dengan form PIN.
- Default PIN: `1234` (bisa diubah di `window.js`).
- Salah PIN → overlay tetap terkunci.

### Tray mode

- Close (tombol X) tidak menutup app, hanya hide ke tray.
- Ikon tray di panel atas Ubuntu, dengan menu:

  - Enable/Disable Privacy
  - Blur Messages / Media / Names
  - Lock Screen
  - Hide/Show Window
  - Quit

- Klik kiri icon tray → toggling Show/Hide window.

### Download manager sederhana

- Semua file yang di‑download dari WhatsApp disimpan otomatis ke:

  ```
  ~/Downloads/GeWhatsapp
  ```

## Teknologi

- **Electron** (runtime desktop, Chromium + Node.js)
- **JavaScript** (CommonJS, tanpa framework tambahan)
- Target utama: **Ubuntu / Linux (.deb)**

## Struktur Project

```text
.
├─ assets/
│  └─ tray.png           # icon tray
├─ build/
│  └─ icons/             # icon launcher (.deb)
├─ src/
│  ├─ window.js          # BrowserWindow WhatsApp Web + download dir
│  ├─ privacy.js         # CSS blur + lock overlay
│  └─ tray.js            # Tray icon & menu (privacy, lock, show/hide)
├─ main.js               # entry point Electron
├─ preload.js            # preload (saat ini kosong)
├─ package.json          # metadata & electron-builder config
├─ LICENSE               # MIT License
└─ README.md
```

## Menjalankan di Development

### Install dependency

```bash
npm install
```

### Jalankan app

```bash
npm start
```

Login ke WhatsApp Web dengan scan QR seperti di browser biasa.

## Build `.deb` (Ubuntu)

Project memakai **electron-builder** untuk build paket `.deb`.

### Install dependency build

```bash
sudo apt update
sudo apt install dpkg fakeroot
```

### Build

```bash
npm run dist

# atau:
# npx electron-builder --linux deb
```

File `.deb` akan muncul di folder `dist/`, misalnya:

```bash
dist/GeWhatsApp Privacy_1.0.0_amd64.deb
```

### Install

```bash
sudo dpkg -i dist/*_amd64.deb
sudo apt -f install
```

Setelah itu aplikasi muncul di launcher dengan icon dan nama **GeWhatsApp Privacy**.

## Konfigurasi Penting

### PIN Lock

Default PIN ada di `src/window.js`:

```js
const PIN_CODE = "1234";
```

Ubah nilainya untuk mengganti PIN global aplikasi.

### Folder Download

Ditentukan di `setDownloadDir` (`src/window.js`):

```js
const downloadsDir = path.join(os.homedir(), "Downloads", "GeWhatsapp");
```

Semua file yang di‑download WhatsApp akan disimpan ke folder ini tanpa dialog.

### State Privacy Awal

Ada di `main.js`:

```js
let privacyState = {
  enabled: true,
  blurMessages: true,
  blurMedia: true,
  blurNames: true,
};
```

Nilai ini akan menjadi default saat aplikasi pertama kali dijalankan; user bisa mengubahnya dari menu tray.

## Catatan Arsitektur

- Ukuran `.deb` relatif besar (puluhan hingga ratusan MB) karena Electron membundel Chromium + Node.js di dalam paket, meskipun aplikasi hanya menampilkan satu halaman web.
- Agar satu instance saja yang berjalan, `main.js` menggunakan `app.requestSingleInstanceLock()`.
- Tombol **X** tidak menutup app; untuk benar‑benar keluar gunakan menu **Quit** di tray.

## Lisensi

Project ini dirilis dengan lisensi **MIT** (lihat file `LICENSE`) sehingga bebas digunakan, dimodifikasi, dan didistribusikan untuk kebutuhan pribadi, komunitas, maupun komersial.
