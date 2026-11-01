# SITTA UT – Aplikasi Pemesanan Bahan Ajar (Vue.js)

Tugas Praktik 2 mata kuliah **STSI4209 Pemrograman Berbasis Web** – Universitas Terbuka.

## Identitas Mahasiswa

| | |
|---|---|
| **Nama** | Yosada Dede Aressa |
| **NIM** | 052984188 |
| **Program Studi** | Sistem Informasi |
| **Fakultas** | Fakultas Sains dan Teknologi (FST) |
| **UPBJJ** | UT Surakarta |

---

Aplikasi web sederhana berbasis **Vue.js 2** untuk membantu proses pemesanan dan distribusi bahan ajar di UT. Aplikasi terdiri dari dua halaman utama:

1. **Stok Bahan Ajar**: memantau stok bahan ajar di seluruh UT-Daerah.
2. **Tracking Delivery Order (DO)**: melacak pengiriman bahan ajar dan mencatat DO baru.

Data tidak diambil dari database. Data berasal dari *dummy data* `dataBahanAjar.js` yang disalin ke masing-masing file logika Vue.

---

## Cara Menjalankan

1. Pastikan komputer terhubung ke internet karena Vue.js dimuat dari CDN.
2. Buka file `index.html` langsung di browser (Chrome, Firefox, Edge, atau Safari).
3. Pilih menu **Stok Bahan Ajar** atau **Tracking DO**.

Tidak perlu instalasi, `npm`, atau server. Jika ingin memakai server lokal, gunakan misalnya ekstensi *Live Server* di VS Code.

> **Catatan:** Perubahan data (tambah/edit stok, DO baru, riwayat perjalanan) disimpan di **localStorage** browser, sehingga tetap ada setelah halaman di-refresh. Klik tautan **"Pulihkan data awal"** di bagian bawah setiap halaman untuk mengembalikan data ke kondisi semula.

---

## Struktur Proyek

```
tugas2-vue-ut/
├─ index.html          ← Beranda: navigasi ke stok.html dan tracking.html
├─ stok.html           ← Halaman 1: Stok Bahan Ajar
├─ tracking.html       ← Halaman 2: Tracking Delivery Order
├─ css/
│  └─ style.css        ← Gaya tampilan untuk semua halaman
├─ js/
│  ├─ stok-app.js      ← Logika Vue untuk stok.html
│  └─ tracking-app.js  ← Logika Vue untuk tracking.html
├─ dataBahanAjar.js    ← Template dummy data asli dari soal (acuan, tidak dimuat)
└─ README.md
```

Setiap halaman memiliki satu instance `new Vue({ el: '#app', ... })` di file JS-nya sendiri, sehingga tampilan (HTML), gaya (CSS), dan logika (JS) terpisah dengan rapi. Sesuai petunjuk soal, aplikasi **tidak menggunakan Template Component**.

---

## Fitur

### 1. Halaman Stok Bahan Ajar (`stok.html`)

**Daftar stok** dalam bentuk tabel dengan kolom berikut:

| Kolom | Field data |
|---|---|
| Kode / Nama Mata Kuliah | `kode`, `judul` |
| Kategori | `kategori` |
| UT-Daerah | `upbjj` |
| Lokasi Rak | `lokasiRak` |
| Harga | `harga` |
| Stok | `qty` |
| Safety Stock | `safety` |
| Status | dihitung dari `qty` dan `safety` |
| Catatan | `catatanHTML` (dirender sebagai HTML) |

**Status stok:**

| Status | Kondisi | Tampilan |
|---|---|---|
| ✔ Aman | `qty >= safety` | Hijau |
| ⚠ Menipis | `qty < safety` | Oranye |
| ✖ Kosong | `qty === 0` | Merah |

**Filter dan sort:**
- Pencarian berdasarkan kode atau judul mata kuliah.
- Filter **UT-Daerah**, berisi pilihan "Semua UT-Daerah" dan setiap daerah dari `upbjjList`.
- Filter **Kategori Mata Kuliah** sebagai *dependent option*. Filter ini baru muncul setelah UT-Daerah dipilih, dan setiap opsi menampilkan jumlah bahan ajar di daerah tersebut.
- Checkbox **re-order** untuk menampilkan hanya bahan ajar dengan stok < safety atau stok = 0.
- **Sort** berdasarkan judul, stok, atau harga, dengan arah naik atau turun.
- Tombol **Reset Filter** untuk mengembalikan semua filter dan sort ke kondisi awal.

**Kelola data:**
- **Tambah bahan ajar** melalui formulir dengan validasi untuk setiap field.
- **Edit stok** melalui jendela pop-up untuk mengubah stok, safety, harga, lokasi rak, dan catatan. Pop-up menampilkan pratinjau status sebelum perubahan disimpan.
- Kartu ringkasan berisi jumlah bahan ajar total, Aman, Menipis, dan Kosong.

### 2. Halaman Tracking DO (`tracking.html`)

**Lacak pengiriman:**
- Cari DO berdasarkan nomor, misalnya `DO2025-0001`. Huruf otomatis dijadikan kapital.
- Detail DO menampilkan NIM, nama, ekspedisi, tanggal kirim, paket, total, dan status.
- Riwayat perjalanan ditampilkan sebagai *timeline* dengan entri terbaru di atas.
- Status pengiriman dapat diperbarui dengan menambah riwayat perjalanan baru.
- Tabel daftar seluruh DO dilengkapi tombol **Lacak** di setiap baris.

**Input DO baru:**

| Field | Keterangan |
|---|---|
| Nomor DO | Dibuat otomatis: `DO` + tahun berjalan + nomor urut 3 digit, misalnya `DO2026-001`, lalu `DO2026-002`, dan seterusnya |
| NIM | Diisi manual, wajib 9 digit angka. Karakter selain angka langsung dibuang |
| Nama | Diisi manual, minimal 3 karakter dan hanya huruf |
| Ekspedisi | Dipilih dari `pengirimanList` (JNE Regular / JNE Express) |
| Paket Bahan Ajar | `<select>` dari data `paket` yang menampilkan kode dan nama paket. Setelah paket dipilih, **isi paket** muncul di bawahnya |
| Tanggal Kirim | Otomatis terisi tanggal hari ini (waktu lokal) dan dapat diubah manual |
| Total Harga | Otomatis diambil dari `paket.harga` |

---

## Penerapan Konsep Vue.js

### Menampilkan data
- **Mustache** `{{ }}`: sebagian besar teks di tabel dan detail, misalnya `{{ item.judul }}`.
- **`v-text`**: angka ringkasan (`v-text="ringkasan.aman"`), lokasi rak, serta NIM/nama di detail DO.
- **`v-html`**: kolom catatan (`v-html="item.catatanHTML"`) dan pratinjau catatan di formulir.

### Data binding
- **One-way (`v-bind` / `:`)**: `:class` untuk warna baris dan status, `:key` pada `v-for`, `:disabled` pada tombol reset, dan `:value` pada field readonly (nomor DO, total harga).
- **Two-way (`v-model`)**: semua input filter dan formulir, termasuk modifier `.number` untuk angka dan `.trim` untuk teks.

### Conditional
- **`v-if` / `v-else-if` / `v-else`**: badge status stok (Kosong → Menipis → Aman), badge status DO, dan pesan error validasi.
- **`v-if` / `v-else`**: filter kategori yang bergantung pada UT-Daerah, detail isi paket, modal edit, dan pesan "data kosong".
- **`v-show`**: formulir tambah bahan ajar, chip filter aktif, dan notifikasi.

### List rendering
- `v-for` digunakan untuk baris tabel, opsi `<select>`, isi paket, dan timeline perjalanan, selalu dengan `:key`.

### Computed property
| Halaman | Computed | Fungsi |
|---|---|---|
| Stok | `opsiKategori` | Opsi kategori sesuai UT-Daerah yang dipilih |
| Stok | `stokTerfilter` | Hasil filter pencarian, daerah, kategori, dan re-order |
| Stok | `stokTampil` | Hasil sort dari `stokTerfilter` |
| Stok | `ringkasan` | Jumlah stok Aman, Menipis, dan Kosong |
| Stok | `filterAktif` | Menentukan apakah ada filter yang aktif |
| Tracking | `nomorDOBaru` | Membuat nomor DO otomatis |
| Tracking | `paketTerpilih`, `isiPaketTerpilih`, `totalHarga` | Detail dan harga paket yang dipilih |
| Tracking | `daftarDO`, `doTerpilih`, `riwayatTerbaru` | Data untuk tabel dan detail DO |

Computed property **di-cache** oleh Vue. Hasil filter dan sort hanya dihitung ulang ketika data yang menjadi dependensinya berubah, tidak setiap kali halaman di-render. Inilah penerapan poin soal *"semua filter tidak perlu recompute kembali"*.

### Methods
`statusStok`, `formatRupiah`, `formatTanggal`, `validasi`, `validasiDO`, `tambahBahanAjar`, `bukaEdit`, `simpanEdit`, `resetFilter`, `cariDO`, `pilihDO`, `simpanDO`, `tambahRiwayat`, `pulihkanData`, `tampilkanNotifikasi`.

### Watchers
**`stok-app.js`**
1. `filter.upbjj`: saat UT-Daerah berganti, filter kategori di-reset (mendukung *dependent options*).
2. `stok` (deep): setiap perubahan data stok disimpan ke localStorage.
3. `form.kode`: kode mata kuliah otomatis menjadi huruf kapital.
4. `form.lokasiRak`: lokasi rak otomatis menjadi huruf kapital.
5. `form` (deep): validasi ulang secara langsung setelah form pernah disubmit, sehingga pesan error hilang begitu input diperbaiki.

**`tracking-app.js`**
1. `tracking` (deep): setiap perubahan data DO disimpan ke localStorage.
2. `nomorCari`: nomor DO otomatis menjadi kapital dan pesan "tidak ditemukan" dihapus saat mengetik ulang.
3. `form.nim`: karakter selain angka langsung dibuang.
4. `nomorTerpilih`: form riwayat disiapkan dengan status DO yang sedang dipilih.
5. `form` (deep): validasi ulang secara langsung setelah form pernah disubmit.

---

## Aturan Validasi

**Tambah / edit bahan ajar**
| Field | Aturan |
|---|---|
| Kode | Wajib, 4–5 huruf + 4 angka (mis. `EKMA4116`), tidak boleh duplikat di UT-Daerah yang sama |
| Nama mata kuliah | Wajib, minimal 3 karakter |
| Kategori, UT-Daerah | Wajib dipilih |
| Lokasi rak | Wajib, format `R<angka>-<huruf><angka>` (mis. `R1-A3`) |
| Harga | Wajib, bilangan bulat > 0 |
| Stok, Safety | Wajib, bilangan bulat ≥ 0 |

Saat edit, field kode, judul, kategori, dan UT-Daerah tidak dapat diubah. Ketiganya menjadi identitas data.

**Input DO**
| Field | Aturan |
|---|---|
| NIM | Wajib, tepat 9 digit angka |
| Nama | Wajib, minimal 3 karakter, hanya huruf, spasi, dan tanda `. , '` |
| Ekspedisi, Paket | Wajib dipilih |
| Tanggal kirim | Wajib diisi |

---

## Catatan Implementasi

- **Versi Vue:** Vue 2.7.16 (CDN jsDelivr), sesuai sintaks `new Vue({...})` pada template `dataBahanAjar.js`.
- **Dummy data:** isi `dataBahanAjar.js` disalin ke `stok-app.js` dan `tracking-app.js` sesuai petunjuk soal. File `dataBahanAjar.js` sendiri tidak dimuat oleh halaman mana pun dan hanya disimpan sebagai acuan.
- **Ekspedisi:** soal menyebut pilihan ekspedisi "berdasarkan `upbjjList`". Karena data ekspedisi sebenarnya ada di `pengirimanList`, pilihan diambil dari `pengirimanList` (REG → JNE Regular, EXP → JNE Express).
- **Nomor DO:** nomor urut dihitung per tahun berjalan. Data awal `DO2025-0001` tetap bisa dilacak, dan DO baru pada tahun 2026 dimulai dari `DO2026-001`.
- **Tampilan responsif:** tata letak menyesuaikan layar HP, dan tabel dapat digeser horizontal.

---

## Referensi

- Sufandi, U. U., Aprijani, D. A., & Pandiangan, P. (2021). Evaluasi dan hasil review desain user interface prototype aplikasi mobile SITTA Universitas Terbuka. *JANAPATI*, 10(3), 147–156. https://doi.org/10.23887/janapati.v10i3.40281
- Sufandi, U. U. (2022). Analisis Kebutuhan dan Dokumentasi Sistem Informasi Tiras dan Transaksi Bahan Ajar Universitas Terbuka. *JANAPATI*, 11(2), 112–122. https://doi.org/10.23887/janapati.v11i2.42966
- Dokumentasi Vue.js 2: https://v2.vuejs.org/
