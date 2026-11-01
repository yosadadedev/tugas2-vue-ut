/* ==========================================================
   tracking-app.js - Logika Vue untuk halaman Tracking DO
   Data awal mengacu pada template dummy data dataBahanAjar.js
   ========================================================== */

var KUNCI_STORAGE_TRACKING = 'sitta-tracking';

// Data awal tracking DO (dari dataBahanAjar.js)
var TRACKING_AWAL = {
  "DO2025-0001": {
    nim: "123456789",
    nama: "Rina Wulandari",
    status: "Dalam Perjalanan",
    ekspedisi: "JNE",
    tanggalKirim: "2025-08-25",
    paket: "PAKET-UT-001",
    total: 120000,
    perjalanan: [
      { waktu: "2025-08-25 10:12:20", keterangan: "Penerimaan di Loket: TANGSEL" },
      { waktu: "2025-08-25 14:07:56", keterangan: "Tiba di Hub: JAKSEL" },
      { waktu: "2025-08-26 08:44:01", keterangan: "Diteruskan ke Kantor Tujuan" }
    ]
  }
};

function muatTracking() {
  try {
    var tersimpan = localStorage.getItem(KUNCI_STORAGE_TRACKING);
    if (tersimpan) return JSON.parse(tersimpan);
  } catch (e) { /* abaikan, pakai data awal */ }
  return JSON.parse(JSON.stringify(TRACKING_AWAL));
}

function duaDigit(n) {
  return String(n).padStart(2, '0');
}

// Tanggal lokal (bukan UTC) dalam format YYYY-MM-DD untuk input type="date"
function tanggalHariIni() {
  var d = new Date();
  return d.getFullYear() + '-' + duaDigit(d.getMonth() + 1) + '-' + duaDigit(d.getDate());
}

function waktuSekarang() {
  var d = new Date();
  return tanggalHariIni() + ' ' + duaDigit(d.getHours()) + ':' + duaDigit(d.getMinutes()) + ':' + duaDigit(d.getSeconds());
}

function formDOKosong() {
  return { nim: '', nama: '', ekspedisi: '', paket: '', tanggalKirim: tanggalHariIni() };
}

var app = new Vue({
  el: '#app',
  data: {
    upbjjList: ["Jakarta", "Surabaya", "Makassar", "Padang", "Denpasar"],
    pengirimanList: [
      { kode: "REG", nama: "Reguler (3-5 hari)" },
      { kode: "EXP", nama: "Ekspres (1-2 hari)" }
    ],
    paket: [
      { kode: "PAKET-UT-001", nama: "PAKET IPS Dasar", isi: ["EKMA4116", "EKMA4115"], harga: 120000 },
      { kode: "PAKET-UT-002", nama: "PAKET IPA Dasar", isi: ["BIOL4201", "FISIP4001"], harga: 140000 }
    ],
    // Hanya kode & judul yang dibutuhkan untuk menampilkan isi paket
    stok: [
      { kode: "EKMA4116", judul: "Pengantar Manajemen" },
      { kode: "EKMA4115", judul: "Pengantar Akuntansi" },
      { kode: "BIOL4201", judul: "Biologi Umum (Praktikum)" },
      { kode: "FISIP4001", judul: "Dasar-Dasar Sosiologi" }
    ],
    tracking: muatTracking(),
    statusList: ["Diproses", "Dalam Perjalanan", "Terkirim"],

    // Pencarian / detail DO
    nomorCari: '',
    nomorTerpilih: '',
    pesanCari: '',

    // Form tambah riwayat perjalanan
    riwayat: { status: '', keterangan: '' },
    errorRiwayat: '',

    // Form DO baru
    form: formDOKosong(),
    errorDO: {},

    notifikasi: { pesan: '', gagal: false },
    timerNotifikasi: null
  },

  computed: {
    // Nomor DO otomatis: DO + tahun berjalan + nomor urut 3 digit.
    // Nomor urut = nomor terbesar pada tahun yang sama + 1.
    nomorDOBaru: function () {
      var tahun = new Date().getFullYear();
      var pola = new RegExp('^DO' + tahun + '-(\\d+)$');
      var terbesar = 0;
      Object.keys(this.tracking).forEach(function (nomor) {
        var cocok = nomor.match(pola);
        if (cocok) terbesar = Math.max(terbesar, parseInt(cocok[1], 10));
      });
      return 'DO' + tahun + '-' + String(terbesar + 1).padStart(3, '0');
    },

    paketTerpilih: function () {
      var kode = this.form.paket;
      return this.paket.find(function (p) { return p.kode === kode; }) || null;
    },

    isiPaketTerpilih: function () {
      if (!this.paketTerpilih) return [];
      var stok = this.stok;
      return this.paketTerpilih.isi.map(function (kode) {
        var bahan = stok.find(function (s) { return s.kode === kode; });
        return { kode: kode, judul: bahan ? bahan.judul : '(judul tidak ditemukan)' };
      });
    },

    totalHarga: function () {
      return this.paketTerpilih ? this.paketTerpilih.harga : 0;
    },

    // Objek tracking diubah menjadi array agar mudah ditampilkan dengan v-for
    daftarDO: function () {
      var tracking = this.tracking;
      return Object.keys(tracking).sort().reverse().map(function (nomor) {
        return Object.assign({ nomor: nomor }, tracking[nomor]);
      });
    },

    doTerpilih: function () {
      return this.nomorTerpilih ? this.tracking[this.nomorTerpilih] : null;
    },

    // Riwayat perjalanan dengan urutan terbaru di atas
    riwayatTerbaru: function () {
      if (!this.doTerpilih) return [];
      return this.doTerpilih.perjalanan.slice().reverse();
    }
  },

  watch: {
    // Watcher 1: setiap perubahan data DO disimpan ke localStorage
    tracking: {
      deep: true,
      handler: function (nilai) {
        try {
          localStorage.setItem(KUNCI_STORAGE_TRACKING, JSON.stringify(nilai));
        } catch (e) { /* localStorage tidak tersedia */ }
      }
    },

    // Watcher 2: nomor DO yang diketik otomatis kapital; pesan error dihapus saat mengetik ulang
    nomorCari: function (nilai) {
      var kapital = nilai.toUpperCase();
      if (kapital !== nilai) this.nomorCari = kapital;
      this.pesanCari = '';
    },

    // Watcher 3: NIM hanya boleh angka, karakter lain langsung dibuang
    'form.nim': function (nilai) {
      var angka = nilai.replace(/\D/g, '');
      if (angka !== nilai) this.form.nim = angka;
    },

    // Watcher 4: saat DO lain dipilih, form riwayat disiapkan dengan status DO tersebut
    nomorTerpilih: function () {
      this.riwayat = { status: this.doTerpilih ? this.doTerpilih.status : '', keterangan: '' };
      this.errorRiwayat = '';
    },

    // Watcher 5: validasi ulang secara langsung setelah form pernah disubmit
    form: {
      deep: true,
      handler: function () {
        if (Object.keys(this.errorDO).length) this.errorDO = this.validasiDO();
      }
    }
  },

  methods: {
    formatRupiah: function (angka) {
      return 'Rp ' + Number(angka).toLocaleString('id-ID');
    },

    formatTanggal: function (iso) {
      if (!iso) return '-';
      var d = new Date(iso + 'T00:00:00');
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    },

    labelEkspedisi: function (kode) {
      return kode === 'EXP' ? 'JNE Express' : 'JNE Regular';
    },

    namaPaket: function (kode) {
      var p = this.paket.find(function (x) { return x.kode === kode; });
      return p ? p.nama : '';
    },

    cariDO: function () {
      if (this.tracking[this.nomorCari]) {
        this.nomorTerpilih = this.nomorCari;
        this.pesanCari = '';
      } else {
        this.nomorTerpilih = '';
        this.pesanCari = 'Nomor DO "' + this.nomorCari + '" tidak ditemukan.';
      }
    },

    pilihDO: function (nomor) {
      this.nomorCari = nomor;
      this.nomorTerpilih = nomor;
      this.pesanCari = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    tambahRiwayat: function () {
      if (this.riwayat.keterangan.length < 5) {
        this.errorRiwayat = 'Keterangan minimal 5 karakter.';
        return;
      }
      this.errorRiwayat = '';
      this.doTerpilih.perjalanan.push({ waktu: waktuSekarang(), keterangan: this.riwayat.keterangan });
      this.doTerpilih.status = this.riwayat.status;
      this.riwayat.keterangan = '';
      this.tampilkanNotifikasi('Riwayat ' + this.nomorTerpilih + ' diperbarui.');
    },

    validasiDO: function () {
      var f = this.form;
      var error = {};
      if (!f.nim) error.nim = 'NIM wajib diisi.';
      else if (!/^\d{9}$/.test(f.nim)) error.nim = 'NIM harus terdiri dari 9 digit angka.';

      var nama = f.nama.trim();
      if (!nama) error.nama = 'Nama wajib diisi.';
      else if (nama.length < 3) error.nama = 'Nama minimal 3 karakter.';
      else if (!/^[A-Za-z .,']+$/.test(nama)) error.nama = 'Nama hanya boleh berisi huruf.';

      if (!f.ekspedisi) error.ekspedisi = 'Pilih jasa ekspedisi.';
      if (!f.paket) error.paket = 'Pilih paket bahan ajar.';
      if (!f.tanggalKirim) error.tanggalKirim = 'Tanggal kirim wajib diisi.';
      return error;
    },

    simpanDO: function () {
      this.errorDO = this.validasiDO();
      if (Object.keys(this.errorDO).length) {
        this.tampilkanNotifikasi('Periksa kembali isian formulir DO.', true);
        return;
      }
      var nomor = this.nomorDOBaru;
      // $set dipakai karena menambah properti baru pada objek reaktif
      this.$set(this.tracking, nomor, {
        nim: this.form.nim,
        nama: this.form.nama.trim(),
        status: 'Diproses',
        ekspedisi: this.labelEkspedisi(this.form.ekspedisi),
        tanggalKirim: this.form.tanggalKirim,
        paket: this.form.paket,
        total: this.totalHarga,
        perjalanan: [
          { waktu: waktuSekarang(), keterangan: 'DO dibuat, menunggu penjemputan ekspedisi' }
        ]
      });
      this.resetFormDO();
      this.pilihDO(nomor);
      this.tampilkanNotifikasi('DO ' + nomor + ' berhasil disimpan.');
    },

    resetFormDO: function () {
      this.errorDO = {};
      this.form = formDOKosong();
    },

    pulihkanData: function () {
      if (!confirm('Kembalikan data DO ke data awal? Semua DO baru akan hilang.')) return;
      this.tracking = JSON.parse(JSON.stringify(TRACKING_AWAL));
      this.nomorCari = '';
      this.nomorTerpilih = '';
      this.tampilkanNotifikasi('Data DO dikembalikan ke data awal.');
    },

    tampilkanNotifikasi: function (pesan, gagal) {
      var vm = this;
      vm.notifikasi = { pesan: pesan, gagal: !!gagal };
      clearTimeout(vm.timerNotifikasi);
      vm.timerNotifikasi = setTimeout(function () {
        vm.notifikasi.pesan = '';
      }, 3000);
    }
  }
});
