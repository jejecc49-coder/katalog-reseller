# Katalog Online Reseller

Web app sederhana untuk menampilkan katalog reseller dari Google Sheets. Spreadsheet menjadi pusat kontrol: ubah harga, foto, minimal order, atau produk baru di Sheets, lalu katalog akan membaca data terbaru saat halaman dibuka.

## Kolom Google Sheets

Buat sheet dengan header seperti ini:

```csv
SKU,Nama Produk,Kategori,Foto,Harga,Minimal Order
```

Keterangan singkat:

- `SKU`: kode produk untuk order.
- `Nama Produk`: nama yang tampil di katalog.
- `Kategori`: dipakai untuk filter.
- `Foto`: link foto publik.
- `Harga`: harga yang tampil di katalog.
- `Minimal Order`: minimal order untuk reseller.

Keterangan `Harga grosir chat admin` otomatis tampil di setiap produk, jadi tidak perlu dibuat sebagai kolom khusus.

File contoh tersedia di `produk-template.csv`.

## Cara Menghubungkan Google Sheets

1. Buat Google Sheets baru.
2. Isi header dan data produk sesuai format di atas.
3. Klik `File` > `Share` > `Publish to web`.
4. Pilih sheet produk dan format `Comma-separated values (.csv)`.
5. Salin link yang berakhiran `output=csv`.
6. Buka `config.js`.
7. Isi `sheetCsvUrl` dengan link CSV Google Sheets.
8. Isi `whatsappNumber` dengan nomor WhatsApp admin.

Contoh `config.js`:

```js
window.CATALOG_CONFIG = {
  sheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/....../pub?output=csv",
  whatsappNumber: "6281234567890",
  storeName: "Katalog Reseller Toko Kamu",
};
```

## Link Publik dan Link Admin

- Link reseller: buka tanpa parameter, misalnya `https://domain-kamu.com/`
- Link admin: tambahkan `?admin=1`, misalnya `https://domain-kamu.com/?admin=1`

Tombol pengaturan, input Google Sheets, input WhatsApp, dan reset demo hanya tampil di link admin. Reseller yang membuka link publik hanya melihat katalog dan tombol order.

Catatan: untuk katalog publik, data utama sebaiknya diisi lewat `config.js`, bukan lewat tombol pengaturan. Dengan begitu semua reseller melihat data Google Sheets yang sama, bukan data demo dari browser masing-masing.

## Upload Website

Website ini bisa diupload ke hosting statis seperti:

- Netlify
- Vercel
- GitHub Pages
- Hosting biasa/cPanel
- Cloud Run, jika sudah punya container/deploy flow

File yang perlu diupload minimal:

- `index.html`
- `styles.css`
- `app.js`
- `config.js`

## Pakai di Google AI Studio

Google AI Studio bisa dipakai untuk membangun dan mengembangkan web app. Untuk menjalankan bisnisnya, data tetap paling praktis disimpan di Google Sheets, lalu aplikasi membaca link CSV publik dari Sheets.

Prompt yang bisa ditempel ke Google AI Studio:

```text
Buat web app katalog khusus reseller Indonesia yang membaca data produk dari Google Sheets CSV publik.

Fitur:
- Search nama produk dan SKU
- Filter kategori
- Kartu produk berisi foto, SKU, nama, kategori, harga, minimal order, dan keterangan "Harga grosir chat admin"
- Keranjang sederhana
- Checkout ke WhatsApp dengan pesan otomatis berisi SKU, nama produk, jumlah, subtotal, total estimasi, dan catatan harga grosir chat admin
- Halaman pengaturan untuk menyimpan link CSV Google Sheets dan nomor WhatsApp di localStorage

Kolom spreadsheet:
SKU, Nama Produk, Kategori, Foto, Harga, Minimal Order

Buat desain mobile-friendly, cepat dibaca oleh reseller, dan bisa berjalan sebagai static web app.
```

## Catatan Penting

- Link foto harus bisa diakses publik.
- Jangan masukkan data rahasia seperti margin supplier ke spreadsheet publik.
- Stok tidak perlu dimasukkan jika penjualan marketplace berjalan terus dan stok berubah cepat.
