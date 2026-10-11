/* Arsip semester (RENCANA_MASA_SIMPAN.md, 11 Okt 2026).
   Berkas arsip = satu berkas SQLite per aplikasi per semester, dibuat di browser admin dengan sql.js
   (MIT, salinan di assets/vendor — tanpa internet pun bisa dibaca oleh arsip.html "Buka Arsip").
   Dipakai halaman guru (membuat) dan arsip.html (membaca). Format standar SQLite, bukan khusus Supabase:
   bisa dibuka juga dengan DB Browser for SQLite atau dipulihkan dengan ./db.sh pulihkan.
   Berkas ini SAMA di Matematika_Dasar/assets, English_Reading/assets, dan Tryout_Guru/assets — ubah ketiganya bersamaan. */
"use strict";

let _SQLJS = null;
const ARSIP_SKRIP = document.currentScript ? document.currentScript.src : "";   // alamat berkas ini (saat dimuat)
async function muatSqlJs() {
  if (_SQLJS) return _SQLJS;
  if (!window.initSqlJs) await new Promise((ok, gagal) => {
    const s = document.createElement("script");
    s.src = new URL("vendor/sql-asm-1.10.3.js", ARSIP_SKRIP || location.href.replace(/[^/]*$/, "assets/")).href;
    s.onload = ok; s.onerror = () => gagal(new Error("Pustaka SQLite gagal dimuat. Periksa internet lalu muat ulang halaman."));
    document.head.appendChild(s);
  });
  _SQLJS = await window.initSqlJs();
  return _SQLJS;
}

const jsonTeks = (v) => v == null ? null : typeof v === "string" ? v : JSON.stringify(v);
const bool01 = (v) => v == null ? null : v ? 1 : 0;

/* Susunan berkas per aplikasi (versi 1). Tabel info: aplikasi, versi, periode, nama, dari, sampai, dibuat,
   oleh, sekolah, berkas, dan jumlah baris tiap tabel bertahap (n_<tabel>). */
const ARSIP_APLIKASI = {
  matdas: {
    rpc: "mtd_arsip_ambil", awalan: "arsip_matdas",
    skema: `
create table info (kunci text primary key, nilai text);
create table siswa (nisn text primary key, nis text, nama text, kelas text, kelompok text);
create table tingkat (kode text, modul integer, urut integer, nama text, level integer, ket text);
create table rekap (periode text, nisn text, mode text, n_jawab integer, n_benar integer, detik integer, hari integer,
  n_sesi integer, keluar integer, n_tuntas integer, salah text, tingkat text, akhir text, pertama text, terakhir text,
  primary key (nisn, mode));
create table jawaban (id integer primary key, nisn text, sesi text, tingkat text, level integer, nomor integer, soal text,
  kunci text, jawaban text, benar integer, jenis_salah text, detik integer, waktu text);
create table sesi (token text primary key, nisn text, mode text, dibuat text, berakhir text, selesai text, nomor integer,
  keluar integer, keluar_log text, terkunci integer, pilihan text);
create index jawaban_nisn on jawaban (nisn, waktu);
create index sesi_nisn on sesi (nisn, dibuat);`,
    sekali: [
      { jenis: "siswa", sql: "insert or replace into siswa values (?,?,?,?,?)" },
      { jenis: "tingkat", sql: "insert into tingkat values (?,?,?,?,?,?)" },
      { jenis: "rekap", sql: "insert into rekap values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        ubah: (r) => [r.periode, r.nisn, r.mode, r.n_jawab, r.n_benar, r.detik, r.hari, r.n_sesi, r.keluar, r.n_tuntas,
          jsonTeks(r.salah), jsonTeks(r.tingkat), jsonTeks(r.akhir), r.pertama, r.terakhir] },
    ],
    bertahap: [
      { jenis: "jawaban", tabel: "jawaban", total: "n_jawaban", label: "rincian jawaban", sql: "insert into jawaban values (?,?,?,?,?,?,?,?,?,?,?,?,?)",
        ubah: (b) => { b[9] = bool01(b[9]); return b; } },
      { jenis: "sesi", tabel: "sesi", total: "n_sesi", label: "sesi latihan", sql: "insert or replace into sesi values (?,?,?,?,?,?,?,?,?,?,?)",
        ubah: (b) => { b[8] = jsonTeks(b[8]); b[9] = bool01(b[9]); b[10] = jsonTeks(b[10]); return b; } },
    ],
  },
  english_reading: {
    rpc: "er_arsip_ambil", awalan: "arsip_english_reading",
    skema: `
create table info (kunci text primary key, nilai text);
create table siswa (nisn text primary key, nis text, nama text, kelas text);
create table rekap (periode text, nisn text, mode text, n_hasil integer, n_sub integer, n_lulus integer, jumlah_sub integer,
  n_baca integer, jumlah_baca integer, n_paham integer, jumlah_paham integer, n_dengar integer, hari integer, detik integer,
  n_sesi integer, keluar integer, per_level text, pertama text, terakhir text, sesi_terakhir text, primary key (nisn, mode));
create table hasil (id integer primary key, nisn text, sesi text, mode text, level text, sub integer, jenis text, nilai integer,
  rincian text, waktu text);
create table sesi (token text primary key, nisn text, kelas text, mode text, dibuat text, berakhir text, selesai text, terakhir text,
  keluar integer, keluar_log text, terkunci integer);
create index hasil_nisn on hasil (nisn, waktu);
create index sesi_nisn on sesi (nisn, dibuat);`,
    sekali: [
      { jenis: "siswa", sql: "insert or replace into siswa values (?,?,?,?)" },
      { jenis: "rekap", sql: "insert into rekap values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        ubah: (r) => [r.periode, r.nisn, r.mode, r.n_hasil, r.n_sub, r.n_lulus, r.jumlah_sub, r.n_baca, r.jumlah_baca, r.n_paham,
          r.jumlah_paham, r.n_dengar, r.hari, r.detik, r.n_sesi, r.keluar, jsonTeks(r.per_level), r.pertama, r.terakhir, r.sesi_terakhir] },
    ],
    bertahap: [
      { jenis: "hasil", tabel: "hasil", total: "n_hasil", label: "hasil latihan", sql: "insert into hasil values (?,?,?,?,?,?,?,?,?,?)",
        ubah: (b) => { b[8] = jsonTeks(b[8]); return b; } },
      { jenis: "sesi", tabel: "sesi", total: "n_sesi", label: "sesi latihan", sql: "insert or replace into sesi values (?,?,?,?,?,?,?,?,?,?,?)",
        ubah: (b) => { b[9] = jsonTeks(b[9]); b[10] = bool01(b[10]); return b; } },
    ],
  },
  tryout: {
    rpc: "tka_arsip_ambil", awalan: "arsip_tryout",
    skema: `
create table info (kunci text primary key, nilai text);
create table paket (kode text primary key, judul text, mapel text, kelas text, n_soal integer, publik text);
create table hasil (id text primary key, waktu text, nisn text, nama text, kelas text, ujian text, nilai integer, benar integer,
  durasi integer, mulai text, selesai text, varian text, items text, level text, jawaban text, keluar integer, log_keluar text,
  tamu integer, sesi_id integer);
create table sesi (token text primary key, ujian text, nisn text, nama text, kelas text, tamu integer, dibuat text, ujicoba integer,
  sesi_id integer, aktif_pada text, selesai text, dilepas text);
create index hasil_nisn on hasil (nisn, waktu);
create index sesi_nisn on sesi (nisn, dibuat);`,
    sekali: [
      { jenis: "paket", sql: "insert or replace into paket values (?,?,?,?,?,?)", ubah: (b) => { b[5] = jsonTeks(b[5]); return b; } },
    ],
    bertahap: [
      { jenis: "hasil", tabel: "hasil", total: "n_hasil", label: "hasil ujian", batas: 2000, sql: "insert or replace into hasil values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        ubah: (b) => { b[13] = jsonTeks(b[13]); b[14] = jsonTeks(b[14]); b[16] = jsonTeks(b[16]); b[17] = bool01(b[17]); return b; } },
      { jenis: "sesi", tabel: "sesi", total: "n_sesi", label: "sesi ujian", batas: 2000, sql: "insert or replace into sesi values (?,?,?,?,?,?,?,?,?,?,?,?)",
        ubah: (b) => { b[5] = bool01(b[5]); b[7] = bool01(b[7]); return b; } },
    ],
  },
};

/* Susun berkas arsip dari server, bertahap. lapor(teks, persen) untuk kemajuan.
   Hasil: { bytes, nama, jumlah: { n_jawaban | n_hasil, n_sesi } } — jumlah dihitung ulang dari isi berkas. */
async function buatBerkasArsip(aplikasi, { rpcFn, pin, arsip, sekolah, lapor }) {
  const A = ARSIP_APLIKASI[aplikasi]; if (!A) throw new Error("Aplikasi arsip tidak dikenal: " + aplikasi);
  const SQL = await muatSqlJs();
  const db = new SQL.Database();
  try {
    db.run(A.skema);
    const ambil = (jenis, setelah, batas) => rpcFn(A.rpc, { p_pin: pin, p_arsip: arsip.id, p_jenis: jenis, p_setelah: setelah || 0, p_batas: batas || 5000 }, 60000);
    const isi = (sql, baris) => { const st = db.prepare(sql); db.run("begin"); try { baris.forEach((b) => st.run(b)); db.run("commit"); } catch (e) { db.run("rollback"); throw e; } finally { st.free(); } };
    lapor("Mengambil daftar siswa dan rekap…", 2);
    const sekali = await Promise.all(A.sekali.map((x) => ambil(x.jenis)));
    A.sekali.forEach((x, i) => isi(x.sql, x.ubah ? sekali[i].baris.map(x.ubah) : sekali[i].baris));
    const jumlah = {}, totalSemua = A.bertahap.reduce((t, x) => t + Number(arsip[x.total] || 0), 0);
    let sudah = 0;
    for (const x of A.bertahap) {
      let n = 0, setelah = 0;
      for (;;) {
        const h = await ambil(x.jenis, setelah, x.batas || 5000);
        if (!h.baris.length) break;
        isi(x.sql, h.baris.map(x.ubah));
        n += h.baris.length; sudah += h.baris.length; setelah = h.akhir;
        lapor(`Mengambil ${x.label}: ${n.toLocaleString("id-ID")} dari ${Number(arsip[x.total] || 0).toLocaleString("id-ID")}`, 5 + 88 * sudah / Math.max(1, totalSemua));
      }
      jumlah[x.total] = db.exec(`select count(*) from ${x.tabel}`)[0].values[0][0];
    }
    const nama = `${A.awalan}_${arsip.periode}.sqlite`;
    isi("insert into info values (?,?)", [["aplikasi", aplikasi], ["versi", "1"], ["periode", arsip.periode], ["nama", arsip.nama],
      ["dari", arsip.dari], ["sampai", arsip.sampai], ["dibuat", new Date().toISOString()], ["oleh", arsip.oleh || ""],
      ["sekolah", sekolah || ""], ["berkas", nama], ...Object.entries(jumlah).map(([k, v]) => [k, String(v)])]);
    lapor("Menyusun berkas…", 97);
    return { bytes: db.export(), nama, jumlah, n_jawaban: jumlah.n_jawaban, n_sesi: jumlah.n_sesi };
  } finally { db.close(); }
}
// Nama lama (Matematika Dasar, 11 Okt 2026)
const buatBerkasArsipMatdas = (o) => buatBerkasArsip("matdas", o);
