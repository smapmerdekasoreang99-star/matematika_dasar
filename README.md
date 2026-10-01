# Matdas — Matematika Dasar

Latihan hitung berjenjang untuk siswa SMA Plus Merdeka Soreang. Siswa naik
**Tingkat → Level** satu per satu: 10 soal benar di satu level, naik ke level
berikutnya. Setelah semua level di satu tingkat tuntas, siswa pindah ke tingkat
berikutnya.

| Berkas | Untuk siapa | Isi |
|---|---|---|
| `index.html` | Siswa | Masuk dengan NISN + tanggal lahir, mengerjakan soal |
| `guru.html` | Guru, pengawas | Kemajuan per kelas, analisis per siswa, pengaturan, contoh soal |
| `config.js` | — | Alamat Supabase. **Sama dengan Tryout** (project `Tryout_Guru`) |
| `assets/dasar.css` | — | Salinan tampilan bersama (harus sama dengan aplikasi lain) |
| `assets/matdas.css`, `assets/umum.js` | — | Komponen dan fungsi bersama kedua halaman |

Database: tabel dan fungsi berawalan `mtd_` di project Supabase Tryout. Semua
perubahan lewat [`../database_tryout/`](../database_tryout/README.md)
(migrasi `…_matdas_tahap_1_kelas_10.sql`, kontrak `kontrak/matdas.sql`).

## Cara kerja untuk siswa

1. Masuk dengan NISN dan tanggal lahir. Data siswanya sama dengan Tryout,
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

Tahap 1 berisi Modul Kelas 10: 14 tingkat dengan 106 level (bilangan bulat,
positif-negatif, operasi gabungan, dan pecahan). Modul Kelas 11 dan 12 menyusul.
Tab **Tingkat & contoh soal** di `guru.html` menampilkan 10 soal acak beserta
kuncinya untuk setiap level, supaya guru bisa memeriksa kesesuaiannya dengan
modul.

## Untuk guru

Siswa dan guru memakai **satu alamat** yang sama. Guru mengetuk tautan
**Guru / pengawas** di bawah kotak masuk siswa (seperti di Tryout), lalu masuk dengan **PIN Tryout**. PIN guru/operator boleh mengubah pengaturan dan
memindahkan posisi siswa. PIN pengawas hanya bisa melihat.

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
- **Analisis siswa**: catatan otomatis, grafik level tuntas, jenis kesalahan
  yang paling sering, akurasi per tingkat, daftar kesalahan terakhir (soal,
  jawaban siswa, kunci), dan riwayat level tuntas. Di sini juga ada
  **Pindahkan posisi**, misalnya untuk siswa yang sudah lancar agar bisa
  melompat ke depan.
- **Pengaturan**, dikelompokkan seperti *Pengaturan ujian* di Dasbor Hasil Tryout:
  - *Halaman Latihan*: dibuka/ditutup, yang boleh masuk (anggota kelompok MD
    saja / semua siswa aktif), tampilkan jawaban benar saat salah, kode akses.
  - *Pengawasan keluar halaman* (sama dengan Tryout: alarm bunyi + getar,
    layar peringatan, klik kanan dan salin dicegah): batas keluar (tercapai → latihan dikunci),
    toleransi detik (lebih singkat hanya dicatat), kode buka untuk pengawas
    (kosong = kode akses; keduanya kosong = PIN Tryout). Kunci bertahan walau
    siswa keluar lalu masuk lagi, sampai dibuka atau waktu sesinya habis.
  - *Aturan naik level*: soal benar per level, batas salah, batas waktu per
    soal, pecahan wajib paling sederhana.
  - *Sesi & titik awal*: lama sesi dan titik awal siswa baru (Penjumlahan
    Dasar, atau modul sesuai tingkat kelompoknya: MD11 → Modul Kelas 11).

## Memasang

Halaman statis, tanpa proses build. Unggah seluruh isi folder ke repository
GitHub sendiri (GitHub Pages), sama seperti aplikasi lain. `config.js` sudah
berisi alamat Supabase Tryout.
