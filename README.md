# Matdas — Matematika Dasar

Latihan hitung berjenjang untuk siswa SMA Plus Merdeka Soreang. Siswa naik
**Tingkat → Level** satu per satu: 10 soal benar di satu level, naik ke level
berikutnya. Setelah semua level di satu tingkat tuntas, siswa pindah ke tingkat
berikutnya.

| Berkas | Untuk siapa | Isi |
|---|---|---|
| `index.html` | Siswa | Masuk cukup dengan NISN, mengerjakan soal |
| `guru.html` | Guru, pengawas | Kemajuan per kelompok, daftar & analisis siswa, tingkat dan level soal, pengaturan |
| `config.js` | — | Alamat Supabase. **Sama dengan Tryout** (project `Tryout_Guru`) |
| `assets/dasar.css` | — | Salinan tampilan bersama (harus sama dengan aplikasi lain) |
| `assets/matdas.css`, `assets/umum.js` | — | Komponen dan fungsi bersama kedua halaman |

Database: tabel dan fungsi berawalan `mtd_` di project Supabase Tryout. Semua
perubahan lewat [`../database_tryout/`](../database_tryout/README.md)
(migrasi `…_matdas_tahap_1_kelas_10.sql`, kontrak `kontrak/matdas.sql`).

## Cara kerja untuk siswa

1. Masuk cukup dengan **NISN** (tanpa tanggal lahir). Data siswanya sama dengan Tryout,
   jadi tidak perlu diunggah lagi. **Hanya anggota kelompok Matematika Dasar**
   (MD10-1, MD11-2, … di Data Induk → Kelompok Belajar) yang boleh masuk;
   siswa lain mendapat pesan "belum terdaftar di kelompok Matematika Dasar".
   Kelompok ikut terbawa saat operator menekan **Tarik dari data induk** di
   admin Tryout (tab Data siswa). Sebelum kelompok pernah ditarik, semua siswa
   aktif tetap boleh masuk.
2. Soal muncul satu per satu. Jawaban diketik lewat papan angka di layar.
   Untuk soal pecahan ada kotak bilangan bulat, pembilang, dan penyebut.
   Untuk pembagian bersisa ada kotak **hasil bagi** dan **sisa** (47 ÷ 5 = 9 sisa 2).
3. **Benar**: lanjut ke nomor berikutnya.
   **Salah**: siswa diberi tahu jawabannya, beserta saran bila kesalahannya
   dikenali (tanda negatif, urutan operasi, belum paling sederhana, dll.).
   Soalnya diganti yang baru, nomornya tetap sama.
4. Salah **lebih dari 3 kali** di satu level (bisa diubah): level diulang dari
   nomor 1.
5. Satu sesi **30 menit** (bisa diubah). Setelah waktu habis atau siswa keluar,
   tingkat dan level tetap tersimpan. Saat masuk lagi, siswa mulai dari
   nomor 1 di level itu. Memuat ulang halaman di tengah sesi **tidak**
   mengulang nomor.
6. Sinyal tersendat saat mengirim jawaban: halaman mengirim ulang sendiri (sampai 3 kali,
   jeda acak; permintaan yang menggantung dibatalkan setelah 15 detik). Jawaban yang
   ternyata sudah tercatat **tidak dinilai dua kali**: halaman mengirim ID soal yang
   dijawab (`p_soal`), dan bila soalnya sudah berganti server hanya membalas keadaan
   terkini. Siswa melihat "Jawabanmu tadi sudah tercatat" lalu lanjut ke soal berikutnya.

## Soal dibuat otomatis

Soal tidak diketik guru. Server membuatnya acak dari aturan tiap level, yang
mengikuti pola kotak di *Modul Matdas Kelas 10*. Contoh Penjumlahan Dasar:
level 1 = 1 angka + 1 angka, level 2 = 2 angka + 1 angka, …, level 10 =
4 angka + 4 angka. Pembagian Dasar level 10 adalah pembagian bersisa
(3 angka ÷ 1 angka); sisa yang tidak lebih kecil dari pembagi dikenali sebagai
jenis kesalahan tersendiri. Soal yang pernah dijawab siswa tidak diberikan lagi
kepadanya di level itu. Pengecualian: level yang kemungkinan soalnya memang
sedikit, misalnya 1 angka ÷ 1 angka yang hanya punya 23 pasangan.

Kunci jawaban diperiksa di server dan **tidak pernah dikirim ke peramban
sebelum siswa menjawab**.

Isi saat ini:

- **MD10** (Modul Kelas 10): 16 tingkat, 126 level (bilangan bulat, positif-negatif,
  operasi gabungan, pecahan). Dua tingkat melatih mencari bilangan yang hilang,
  masing-masing 10 level dari 1 angka & 1 angka sampai 3 angka & 3 angka, tanpa
  bilangan negatif maupun koma:
  - ke-3 *Kombinasi Penjumlahan dan Pengurangan* (setelah Penjumlahan dan
    Pengurangan Dasar): □ + 3 = 8, 54 − □ = 29, …
  - ke-6 *Kombinasi Perkalian dan Pembagian* (setelah Perkalian dan Pembagian
    Dasar): □ × 6 = 42, 42 ÷ □ = 6, □ ÷ 6 = 7, … (pembagian selalu habis).
- **MD11** (Modul Kelas 11), tahap A: 6 tingkat, 46 level: penjumlahan, pengurangan,
  perkalian, pembagian desimal (satuan … ribuan), gabungan desimal, dan operasi
  campuran pecahan, desimal, persen. Pembagian selalu menghasilkan desimal yang
  berhenti. Jawaban dinilai dari nilainya: 0,75 = 3/4 = 75% sama-sama benar
  (papan angka soal desimal punya tombol **,** **/** **%**). Kesalahan letak koma
  dan persen yang belum diubah dikenali.
- **MD12** (Modul Kelas 12), tahap A: 3 tingkat, 19 level: Persamaan Linear Satu
  Variabel (8 level, dari x + a = b sampai pecahan dan kurung di kedua ruas),
  Sistem Persamaan Linear Dua Variabel (5 level; jawaban dua kotak x dan y), dan
  Pola Bilangan (6 level: aritmetika, geometri, selisih bertingkat, ×m + c, operasi
  bergantian, dua pola berselang/Fibonacci; 1–2 kotak suku yang hilang). Soal
  disusun mundur dari jawaban bulat acak, jadi tiap level punya ratusan sampai
  ribuan kemungkinan. Kesalahan x/y tertukar dan sebagian benar dikenali.
- **MD12**, tahap B: Soal Cerita Sistem Persamaan Linear (4 level: harga satu barang,
  harga gabungan, umur, umur dengan "… tahun yang lalu/lagi"; dirangkai dari kumpulan
  barang, nama, harga, dan umur acak) dan Penarikan Kesimpulan (4 level, pilihan ganda
  A–E: modus ponens/tollens, silogisme & kontraposisi, kuantor semua/sebagian,
  kesetaraan & ingkaran). Pengecoh dibuat dari kesalahan logika umum (membalik
  implikasi, menyangkal tanpa membalik, kuantor keliru) dan dikenali sebagai jenis
  kesalahan; urutan pilihan diacak.
- **MD11**, tahap B: Mengurutkan Bilangan (3 level; campuran bulat, desimal, pecahan,
  dan persen; siswa mengetuk bilangan sesuai urutan), Persentase dalam Kehidupan
  (6 level: diskon, diskon bertingkat, untung/rugi, pajak & tip, nilai & kehadiran,
  produksi & tabungan; kotak jawaban otomatis Rp atau %), dan Notasi Baku &
  Eksponen (5 level: a × 10ⁿ bilangan besar dan kecil, × ÷ 10ⁿ, sifat eksponen,
  pangkat nol/negatif/pecahan). Kesalahan urutan terbalik, belum notasi baku, dan
  pangkat 10 salah dikenali.

Ketiga modul (MD10, MD11, MD12) sudah lengkap.
Di tab yang sama, tombol **Coba** membuka level itu di tab baru sebagai **uji coba guru**:
guru mengerjakan soal seperti siswa tanpa akun siswa (akun sementara `UJI-…`, tidak
masuk rekap, terhapus sendiri setelah sehari), tetap bisa walau Halaman Latihan ditutup.

Tab **Tahapan Level** di `guru.html` menampilkan 10 soal acak (tombol **Contoh**)
untuk setiap level, supaya guru bisa memeriksa kesesuaiannya dengan modul. Soal
tampil tanpa jawaban; centang **Tampilkan Jawaban** untuk kuncinya (beserta
pembahasan bila server mengirim kolom `pembahasan`), dan **Mode Layar Penuh** untuk
memproyeksikannya: kisi simetris yang ukuran hurufnya menyesuaikan layar, dengan
tombol ✕ / ← Kembali (atau Esc, atau tombol Kembali peramban) untuk kembali ke
halaman sebelumnya.

## Untuk guru

Siswa dan guru memakai **satu alamat** yang sama. Guru mengetuk tautan
**Guru / pengawas** di bawah kotak masuk siswa (seperti di Tryout), lalu masuk dengan PIN:

- **PIN pribadi guru** (8 angka): **sama dengan PIN guru Asesmen Merdeka (Tryout)**, dibuat admin
  Matdas (menu Admin → Guru dan PIN masuk) atau operator Tryout (admin.html → tab Guru & PIN).
  Guru hanya melihat kelompok MD yang diampunya; guru yang tidak mengampu kelompok MD ditolak di
  halaman ini. Sebelum PIN pribadi dibuat, guru bisa masuk Matdas dengan ID gurunya (mis. G161),
  tetapi ID itu tidak berlaku di Tryout.
- **PIN admin Matdas** atau **PIN operator Tryout**: semua kelompok, pengaturan umum, guru & PIN.

**Kartu PIN (PNG)** di menu Admin → Guru dan PIN masuk (satu tabel): kolom **Kartu PIN** di tiap baris —
*Lihat*, **Bagikan** (HP → WhatsApp → chat pribadi guru), **Salin** (tempel di WhatsApp Web), **Unduh** PNG.
Centang satu atau beberapa guru untuk *Bagikan kartu terpilih*, *Unduh kartu PNG terpilih*, dan **Unduh XLSX**
(guru terpilih, atau semua guru aktif bila tidak ada yang dicentang). PIN yang baru dibuat langsung tercentang.
Kartu dibuat di peramban, tidak dikirim ke server.
Kartu yang sama tersedia di admin Tryout (tab Guru & PIN).

Daftar guru ditarik dari Data Induk lewat `guru_ekspor` (semua guru aktif + kelompok MD + kelas yang
diampu), sama dengan yang dipakai Tryout.

- **Kemajuan kelompok**: dipilih per kelompok MD (MD10-1, …), *Semua
  kelompok*, atau *Tanpa kelompok MD* (siswa yang pernah berlatih lalu keluar
  dari kelompok). Pindah kelompok di Data Induk tidak mengubah posisi latihan
  siswa; setelah ditarik ulang ia tampil di kelompok barunya. Isinya: posisi setiap siswa, kemajuan (level terlewati dari
  seluruh level), akurasi, waktu latihan, dan terakhir aktif. Siswa ditandai
  *Macet* (3 kali atau lebih memulai ulang level yang sama, atau 8 kali salah
  di level itu), *Tidak aktif* (7 hari tidak berlatih), *Akurasi rendah*, atau
  *Belum mulai*. Tersedia **Unduh rekap** (.xlsx berkop: rekap kemajuan + sebaran per tingkat).
- **Daftar siswa**: semua anggota kelompok MD dengan NISN, NIS, rombel, dan
  status (*Sedang berlatih*, *Terkunci*, *Belum pernah masuk*), jumlah keluar
  halaman 7 hari terakhir, pencarian, **Unduh daftar** (.xlsx; *Semua kelompok* = satu lembar per kelompok), dan tombol **Buka kunci**.
  Diperbarui otomatis tiap 30 detik.
  Centang siswa (atau semua yang tampil, mis. satu tingkat/kelompok) untuk
  **Atur posisi** (tingkat & level awal berbeda per tingkat/kelompok/siswa; opsi
  *hanya yang belum pernah masuk*) atau **Hapus data latihan**.
- **Analisis siswa**: catatan otomatis, grafik level tuntas, jenis kesalahan
  yang paling sering, akurasi per tingkat, daftar kesalahan terakhir (soal,
  jawaban siswa, kunci), dan riwayat level tuntas. Di sini juga ada
  **Pindahkan posisi**, misalnya untuk siswa yang sudah lancar agar bisa
  melompat ke depan. Juga **Hapus data latihan** satu siswa (mis. setelah uji coba).
- **Pengaturan Umum (Bawaan)** berlaku untuk semua siswa, **kecuali** yang diatur di
  **Aturan & Jalur Khusus**. Prioritas: **siswa → jalur → kelompok → umum**.
- **Aturan & Jalur Khusus**:
  1. *Profil aturan*: kumpulan aturan bernama yang bisa dipakai ulang (strategi guru,
     dengan catatan). Bisa dibedakan: halaman dibuka/ditutup, kode akses, tampilkan
     jawaban benar, soal benar per level, batas salah, pecahan sederhana, lama sesi,
     batas waktu per soal, pengawasan keluar halaman (batas, toleransi, kode buka).
     Isian kosong mengikuti lapisan di bawahnya; kode "-" = sengaja tanpa kode.
     Yang boleh masuk dan titik awal siswa baru tetap umum.
  2. *Aturan per kelompok*: profil dipasang ke kelompok MD.
  3. *Aturan beberapa siswa*: Daftar siswa → centang → Pasang aturan.
  4. *Jalur latihan khusus* (remedial/pengayaan): langkah-langkah tingkat + rentang
     level, ujung *berhenti* atau *lanjut ke urutan biasa*, boleh memakai profil
     aturan. Dipasang lewat Daftar siswa → Pasang jalur. Pindahkan posisi manual
     melepas jalur.
  Analisis siswa menampilkan *Aturan yang berlaku* beserta asal tiap aturan.
- **Pengaturan Umum**, dikelompokkan seperti *Pengaturan ujian* di Dasbor Hasil Tryout:
  - *Halaman Latihan*: dibuka/ditutup, yang boleh masuk (anggota kelompok MD
    saja / semua siswa aktif), tampilkan jawaban benar saat salah, kode akses.
  - *Pengawasan keluar halaman* (sama dengan Tryout: alarm bunyi + getar,
    layar peringatan, klik kanan dan salin dicegah): batas keluar (tercapai → latihan dikunci),
    toleransi detik (lebih singkat hanya dicatat), kode buka untuk pengawas
    (kosong = PIN guru atau PIN admin). Kunci bertahan walau
    siswa keluar lalu masuk lagi, sampai dibuka atau waktu sesinya habis.
  - *Aturan naik level*: soal benar per level, batas salah, batas waktu per
    soal, pecahan wajib paling sederhana.
  - *Sesi & titik awal*: lama sesi dan titik awal siswa baru (Penjumlahan
    Dasar, atau tingkat pertama sesuai kelompoknya: MD11 → MD11).
  - *Kosongkan data latihan*: hapus data latihan **semua** siswa, hanya dengan
    **PIN kepala sekolah** (`tka_privat.pin_kepsek_matdas`, bukan PIN guru) dan
    mengetik KOSONGKAN. Data siswa, pengaturan, tingkat & level tetap.

## Ujian bersama (ratusan siswa sekaligus)

Diukur 4 Okt 2026 di server Supabase Tryout (paket gratis, Tokyo) dengan 800 siswa tiruan
dalam 24 kelompok:

| Panggilan | Waktu di server |
|---|---|
| Masuk (`mtd_masuk`) | ±3,5 ms |
| Menjawab (`mtd_jawab`) | ±2,5 ms |
| Lapor keluar halaman | ±0,3 ms |
| Rekap 1 kelompok (riwayat ±1.500 jawaban/siswa) | ±45 ms |

- 800 siswa yang menjawab rata-rata tiap 8 detik ≈ 100 jawaban/detik, kira-kira seperempat
  satu inti CPU. Kunci data hanya per siswa, jadi siswa tidak saling menunggu. Siswa tidak
  melakukan polling; server dipanggil hanya saat masuk, menjawab, dan kembali ke halaman.
- Rekap (Kemajuan dan Daftar siswa, diperbarui tiap 30 detik oleh setiap guru/pengawas)
  membaca ringkasan per siswa `mtd_ringkas`, yang diperbarui trigger di `mtd_jawaban`
  (termasuk saat data latihan dihapus), jadi tidak melambat seiring riwayat bertambah.
- Hambatan yang lebih mungkin: **Wi-Fi sekolah**. Satu access point praktis melayani
  30–50 perangkat. Siswa yang memakai kuota HP sendiri tidak terpengaruh.
- **Membuka per tingkat dengan jeda 3–5 menit** tidak diperlukan oleh server, tetapi
  membantu jaringan (lonjakan memuat halaman dan tersambung ke Wi-Fi tersebar) dan pengawas
  (sempat membuka sesi, membagikan kode akses, menolong yang gagal masuk). Pakai kode akses
  berbeda per kelompok/ruang: masuk hanya dengan NISN, jadi kode itulah yang mencegah siswa
  masuk atas nama teman (yang akan menutup sesi temannya).
- Menguji beban: jangan memasukkan ratusan ribu baris dalam **satu** transaksi ke project
  ini (trigger ringkasan memperbarui baris yang sama berulang kali tanpa sempat dibersihkan).
  Pada 4 Okt 2026 uji seperti itu membuat project tidak merespons ±12 menit. Pakai data
  kecil dan `set local statement_timeout = '60s'`.

## Memasang

Halaman statis, tanpa proses build. Unggah seluruh isi folder ke repository
GitHub sendiri (GitHub Pages), sama seperti aplikasi lain. `config.js` sudah
berisi alamat Supabase Tryout.
