/* Arsip semester (RENCANA_MASA_SIMPAN.md, 11 Okt 2026).
   Berkas arsip = satu berkas SQLite per aplikasi per semester, dibuat di browser admin dengan sql.js
   (MIT, salinan di assets/vendor — tanpa internet pun bisa dibaca oleh arsip.html "Buka Arsip").
   Dipakai guru.html (membuat) dan arsip.html (membaca). Format standar SQLite, bukan khusus Supabase:
   bisa dibuka juga dengan DB Browser for SQLite atau dipulihkan dengan ./db.sh pulihkan. */
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

/* Susunan berkas arsip Matematika Dasar (versi 1). info: aplikasi, versi, periode, nama, dari, sampai,
   dibuat, oleh, sekolah, n_jawaban, n_sesi. */
const ARSIP_SKEMA_MATDAS = `
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
create index sesi_nisn on sesi (nisn, dibuat);`;

const jsonTeks = (v) => v == null ? null : typeof v === "string" ? v : JSON.stringify(v);
const bool01 = (v) => v == null ? null : v ? 1 : 0;

/* Susun berkas arsip Matdas dari server, bertahap. lapor(teks, persen) untuk kemajuan.
   Hasil: { bytes, nama, n_jawaban, n_sesi } — jumlah dihitung ulang dari isi berkas. */
async function buatBerkasArsipMatdas({ rpcFn, pin, arsip, sekolah, lapor }) {
  const SQL = await muatSqlJs();
  const db = new SQL.Database();
  try {
    db.run(ARSIP_SKEMA_MATDAS);
    const ambil = (jenis, setelah, batas) => rpcFn("mtd_arsip_ambil", { p_pin: pin, p_arsip: arsip.id, p_jenis: jenis, p_setelah: setelah || 0, p_batas: batas || 5000 }, 60000);
    const isi = (sql, baris) => { const st = db.prepare(sql); db.run("begin"); try { baris.forEach((b) => st.run(b)); db.run("commit"); } catch (e) { db.run("rollback"); throw e; } finally { st.free(); } };
    lapor("Mengambil daftar siswa, tingkat, dan rekap…", 2);
    const [S, T, R] = await Promise.all([ambil("siswa"), ambil("tingkat"), ambil("rekap")]);
    isi("insert or replace into siswa values (?,?,?,?,?)", S.baris);
    isi("insert into tingkat values (?,?,?,?,?,?)", T.baris);
    isi("insert into rekap values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", R.baris.map((r) => [r.periode, r.nisn, r.mode, r.n_jawab, r.n_benar, r.detik, r.hari,
      r.n_sesi, r.keluar, r.n_tuntas, jsonTeks(r.salah), jsonTeks(r.tingkat), jsonTeks(r.akhir), r.pertama, r.terakhir]));
    let nJ = 0, setelah = 0;
    for (;;) {
      const h = await ambil("jawaban", setelah, 5000);
      if (!h.baris.length) break;
      isi("insert into jawaban values (?,?,?,?,?,?,?,?,?,?,?,?,?)", h.baris.map((b) => { b[9] = bool01(b[9]); return b; }));
      nJ += h.baris.length; setelah = h.akhir;
      lapor(`Mengambil rincian jawaban: ${nJ.toLocaleString("id-ID")} dari ${Number(arsip.n_jawaban).toLocaleString("id-ID")}`, 5 + 85 * nJ / Math.max(1, arsip.n_jawaban));
    }
    let nS = 0; setelah = 0;
    for (;;) {
      const h = await ambil("sesi", setelah, 5000);
      if (!h.baris.length) break;
      isi("insert or replace into sesi values (?,?,?,?,?,?,?,?,?,?,?)", h.baris.map((b) => { b[8] = jsonTeks(b[8]); b[9] = bool01(b[9]); b[10] = jsonTeks(b[10]); return b; }));
      nS += h.baris.length; setelah = h.akhir;
      lapor(`Mengambil sesi latihan: ${nS.toLocaleString("id-ID")}`, 92);
    }
    const hitung = (t) => db.exec(`select count(*) from ${t}`)[0].values[0][0];
    const n_jawaban = hitung("jawaban"), n_sesi = hitung("sesi");
    const nama = `arsip_matdas_${arsip.periode}.sqlite`;
    isi("insert into info values (?,?)", [["aplikasi", "matdas"], ["versi", "1"], ["periode", arsip.periode], ["nama", arsip.nama],
      ["dari", arsip.dari], ["sampai", arsip.sampai], ["dibuat", new Date().toISOString()], ["oleh", arsip.oleh || ""],
      ["sekolah", sekolah || ""], ["n_jawaban", String(n_jawaban)], ["n_sesi", String(n_sesi)], ["berkas", nama]]);
    lapor("Menyusun berkas…", 97);
    return { bytes: db.export(), nama, n_jawaban, n_sesi };
  } finally { db.close(); }
}
