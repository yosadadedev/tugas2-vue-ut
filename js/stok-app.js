/* ==========================================================
   stok-app.js - Logika Vue untuk halaman Stok Bahan Ajar
   Data awal mengacu pada template dummy data dataBahanAjar.js
   ========================================================== */

var KUNCI_STORAGE_STOK = 'sitta-stok';

// Data awal stok (dari dataBahanAjar.js)
var STOK_AWAL = [
  {
    kode: "EKMA4116",
    judul: "Pengantar Manajemen",
    kategori: "MK Wajib",
    upbjj: "Jakarta",
    lokasiRak: "R1-A3",
    harga: 65000,
    qty: 28,
    safety: 20,
    catatanHTML: "<em>Edisi 2024, cetak ulang</em>"
  },
  {
    kode: "EKMA4115",
    judul: "Pengantar Akuntansi",
    kategori: "MK Wajib",
    upbjj: "Jakarta",
    lokasiRak: "R1-A4",
    harga: 60000,
    qty: 7,
    safety: 15,
    catatanHTML: "<strong>Cover baru</strong>"
  },
  {
    kode: "BIOL4201",
    judul: "Biologi Umum (Praktikum)",
    kategori: "Praktikum",
    upbjj: "Surabaya",
    lokasiRak: "R3-B2",
    harga: 80000,
    qty: 12,
    safety: 10,
    catatanHTML: "Butuh <u>pendingin</u> untuk kit basah"
  },
  {
    kode: "FISIP4001",
    judul: "Dasar-Dasar Sosiologi",
    kategori: "MK Pilihan",
    upbjj: "Makassar",
    lokasiRak: "R2-C1",
    harga: 55000,
    qty: 2,
    safety: 8,
    catatanHTML: "Stok <i>menipis</i>, prioritaskan reorder"
  }
];

// Membaca stok dari localStorage; jika belum ada / gagal, pakai data awal
function muatStok() {
  try {
    var tersimpan = localStorage.getItem(KUNCI_STORAGE_STOK);
    if (tersimpan) return JSON.parse(tersimpan);
  } catch (e) { /* abaikan, pakai data awal */ }
  return JSON.parse(JSON.stringify(STOK_AWAL));
}

function formKosong() {
  return {
    kode: '',
    judul: '',
    kategori: '',
    upbjj: '',
    lokasiRak: '',
    harga: '',
    qty: '',
    safety: '',
    catatanHTML: ''
  };
}

function filterAwal() {
  return { kataKunci: '', upbjj: '', kategori: '', reorder: false };
}

var app = new Vue({
  el: '#app',
  data: {
    upbjjList: ["Jakarta", "Surabaya", "Makassar", "Padang", "Denpasar"],
    kategoriList: ["MK Wajib", "MK Pilihan", "Praktikum", "Problem-Based"],
    pengirimanList: [
      { kode: "REG", nama: "Reguler (3-5 hari)" },
      { kode: "EXP", nama: "Ekspres (1-2 hari)" }
    ],
    paket: [
      { kode: "PAKET-UT-001", nama: "PAKET IPS Dasar", isi: ["EKMA4116", "EKMA4115"], harga: 120000 },
      { kode: "PAKET-UT-002", nama: "PAKET IPA Dasar", isi: ["BIOL4201", "FISIP4001"], harga: 140000 }
    ],
    stok: muatStok(),

    // State filter & sort
    filter: filterAwal(),
    sort: { kolom: 'judul', arah: 'asc' },

    // Formulir tambah
    tampilForm: false,
    form: formKosong(),
    errorTambah: {},

    // Formulir edit (salinan item yang sedang diedit)
    edit: null,
    errorEdit: {},

    notifikasi: { pesan: '', gagal: false },
    timerNotifikasi: null
  },

  /* Computed property di-cache oleh Vue: daftar hasil filter/sort hanya
     dihitung ulang bila data yang menjadi dependensinya berubah, sehingga
     filter tidak perlu di-recompute setiap kali halaman di-render ulang. */
  computed: {
    // Opsi kategori bergantung pada UT-Daerah yang dipilih (dependent options)
    opsiKategori: function () {
      var daerah = this.filter.upbjj;
      var stok = this.stok;
      return this.kategoriList.map(function (nama) {
        var jumlah = stok.filter(function (s) {
          return s.upbjj === daerah && s.kategori === nama;
        }).length;
        return { nama: nama, jumlah: jumlah };
      });
    },

    stokTerfilter: function () {
      var f = this.filter;
      var kunci = f.kataKunci.toLowerCase();
      return this.stok.filter(function (item) {
        if (kunci && item.kode.toLowerCase().indexOf(kunci) === -1 &&
            item.judul.toLowerCase().indexOf(kunci) === -1) return false;
        if (f.upbjj && item.upbjj !== f.upbjj) return false;
        if (f.kategori && item.kategori !== f.kategori) return false;
        if (f.reorder && !(item.qty < item.safety || item.qty === 0)) return false;
        return true;
      });
    },

    stokTampil: function () {
      var kolom = this.sort.kolom;
      var arah = this.sort.arah === 'asc' ? 1 : -1;
      // slice() agar array asli (stokTerfilter) tidak ikut terurut
      return this.stokTerfilter.slice().sort(function (a, b) {
        if (kolom === 'judul') return a.judul.localeCompare(b.judul, 'id') * arah;
        return (a[kolom] - b[kolom]) * arah;
      });
    },

    ringkasan: function () {
      var hasil = { aman: 0, menipis: 0, kosong: 0 };
      for (var i = 0; i < this.stok.length; i++) {
        hasil[this.statusStok(this.stok[i])]++;
      }
      return hasil;
    },

    filterAktif: function () {
      var f = this.filter;
      return !!(f.kataKunci || f.upbjj || f.kategori || f.reorder);
    }
  },

  watch: {
    // Watcher 1: saat UT-Daerah berganti, kategori yang dipilih sebelumnya
    // belum tentu ada di daerah baru, jadi filter kategori di-reset.
    'filter.upbjj': function () {
      this.filter.kategori = '';
    },

    // Watcher 2: setiap perubahan data stok (tambah/edit) disimpan ke localStorage
    stok: {
      deep: true,
      handler: function (stokBaru) {
        try {
          localStorage.setItem(KUNCI_STORAGE_STOK, JSON.stringify(stokBaru));
        } catch (e) { /* localStorage tidak tersedia */ }
      }
    },

    // Watcher 3: kode mata kuliah otomatis huruf kapital
    'form.kode': function (nilai) {
      var kapital = nilai.toUpperCase();
      if (kapital !== nilai) this.form.kode = kapital;
    },

    // Watcher 4: lokasi rak otomatis huruf kapital
    'form.lokasiRak': function (nilai) {
      var kapital = nilai.toUpperCase();
      if (kapital !== nilai) this.form.lokasiRak = kapital;
    },

    // Watcher 5: validasi ulang secara langsung setelah form pernah disubmit,
    // sehingga pesan error hilang begitu input diperbaiki.
    form: {
      deep: true,
      handler: function () {
        if (Object.keys(this.errorTambah).length) {
          this.errorTambah = this.validasi(this.form, true);
        }
      }
    }
  },

  methods: {
    statusStok: function (item) {
      if (item.qty === 0) return 'kosong';
      if (item.qty < item.safety) return 'menipis';
      return 'aman';
    },

    formatRupiah: function (angka) {
      return 'Rp ' + Number(angka).toLocaleString('id-ID');
    },

    balikArahSort: function () {
      this.sort.arah = this.sort.arah === 'asc' ? 'desc' : 'asc';
    },

    resetFilter: function () {
      this.filter = filterAwal();
      this.sort = { kolom: 'judul', arah: 'asc' };
    },

    // Validasi sederhana; mengembalikan objek { namaField: pesanError }
    validasi: function (data, dataBaru) {
      var error = {};
      var stok = this.stok;

      function cekAngka(field, label) {
        var nilai = data[field];
        if (nilai === '' || nilai === null || nilai === undefined) {
          error[field] = label + ' wajib diisi.';
        } else if (!Number.isInteger(nilai) || nilai < 0) {
          error[field] = label + ' harus bilangan bulat 0 atau lebih.';
        }
      }

      if (dataBaru) {
        if (!data.kode) {
          error.kode = 'Kode mata kuliah wajib diisi.';
        } else if (!/^[A-Z]{4,5}\d{4}$/.test(data.kode)) {
          error.kode = 'Format kode tidak valid (contoh: EKMA4116).';
        } else if (data.upbjj && stok.some(function (s) {
          return s.kode === data.kode && s.upbjj === data.upbjj;
        })) {
          error.kode = 'Kode ini sudah terdaftar di UT-Daerah ' + data.upbjj + '.';
        }

        if (!data.judul) error.judul = 'Nama mata kuliah wajib diisi.';
        else if (data.judul.length < 3) error.judul = 'Nama mata kuliah minimal 3 karakter.';

        if (!data.kategori) error.kategori = 'Pilih kategori mata kuliah.';
        if (!data.upbjj) error.upbjj = 'Pilih UT-Daerah.';
      }

      if (!data.lokasiRak) error.lokasiRak = 'Lokasi rak wajib diisi.';
      else if (!/^R\d+-[A-Z]\d+$/i.test(data.lokasiRak)) error.lokasiRak = 'Format lokasi rak tidak valid (contoh: R1-A3).';

      cekAngka('harga', 'Harga');
      if (!error.harga && data.harga === 0) error.harga = 'Harga harus lebih dari 0.';
      cekAngka('qty', 'Jumlah stok');
      cekAngka('safety', 'Safety stock');

      return error;
    },

    tambahBahanAjar: function () {
      this.errorTambah = this.validasi(this.form, true);
      if (Object.keys(this.errorTambah).length) {
        this.tampilkanNotifikasi('Periksa kembali isian formulir.', true);
        return;
      }
      var baru = Object.assign({}, this.form);
      baru.lokasiRak = baru.lokasiRak.toUpperCase();
      this.stok.push(baru);
      this.tampilkanNotifikasi('Bahan ajar ' + baru.kode + ' berhasil ditambahkan.');
      this.resetFormTambah();
      this.tampilForm = false;
    },

    resetFormTambah: function () {
      this.errorTambah = {};
      this.form = formKosong();
    },

    bukaEdit: function (item) {
      // Simpan referensi item asli dan edit salinannya, agar perubahan
      // baru diterapkan ketika tombol Simpan ditekan.
      this.itemDiedit = item;
      this.edit = Object.assign({}, item);
      this.errorEdit = {};
    },

    tutupEdit: function () {
      this.edit = null;
      this.itemDiedit = null;
    },

    simpanEdit: function () {
      this.errorEdit = this.validasi(this.edit, false);
      if (Object.keys(this.errorEdit).length) return;
      this.edit.lokasiRak = this.edit.lokasiRak.toUpperCase();
      Object.assign(this.itemDiedit, this.edit);
      this.tampilkanNotifikasi('Stok ' + this.edit.kode + ' (' + this.edit.upbjj + ') berhasil diperbarui.');
      this.tutupEdit();
    },

    pulihkanData: function () {
      if (!confirm('Kembalikan data stok ke data awal? Semua perubahan akan hilang.')) return;
      this.stok = JSON.parse(JSON.stringify(STOK_AWAL));
      this.resetFilter();
      this.tampilkanNotifikasi('Data stok dikembalikan ke data awal.');
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
