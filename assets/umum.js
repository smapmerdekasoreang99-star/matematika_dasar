/* Matdas — fungsi bersama halaman siswa (index.html) dan guru (guru.html).
   Server: project Supabase Tryout_Guru (config.js sama dengan Tryout). Semua
   data lewat fungsi RPC mtd_*; kunci soal tidak pernah dikirim sebelum siswa
   menjawab. */
"use strict";

const SB = (() => {
  const q = new URLSearchParams(location.search);
  if (q.get("sb") && q.get("key")) return { url: q.get("sb"), key: q.get("key") };
  const c = window.TKA_SUPABASE;
  return c && c.url && c.key ? c : null;
})();

async function rpc(fn, args) {
  if (!SB) throw new Error("Server belum diatur (config.js belum ada).");
  let r;
  try {
    r = await fetch(`${SB.url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SB.key, Authorization: "Bearer " + SB.key },
      body: JSON.stringify(args || {}),
    });
  } catch (e) {
    throw new Error("Tidak tersambung ke server. Periksa internet lalu coba lagi.");
  }
  const t = await r.text();
  let j = null;
  try { j = t ? JSON.parse(t) : null; } catch (e) { /* bukan JSON */ }
  if (!r.ok) throw new Error((j && (j.message || j.hint)) || t || ("Galat " + r.status));
  return j;
}

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function toast(m) {
  const t = $("toast");
  t.textContent = m;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2600);
}

function ssGet(k, d) { try { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function ssSet(k, v) { try { if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* mode privat */ } }

/* Bilangan dengan titik ribuan: 12345678 → 12.345.678 (4 angka dibiarkan, seperti modul). */
function bil(v) {
  const s = String(v).replace("-", "−");
  const neg = s.startsWith("−");
  const d = neg ? s.slice(1) : s;
  const f = d.length > 4 ? d.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : d;
  return (neg ? "−" : "") + f;
}

/* HTML pecahan bersusun. w = bilangan bulat (boleh kosong). */
function pecHtml(w, n, d, neg) {
  return `<span class="pc">${neg ? '<span class="pc-neg">−</span>' : ""}${w ? `<span class="pc-w">${w}</span>` : ""}` +
    `<span class="pc-f"><span class="pc-n">${n}</span><span class="pc-d">${d}</span></span></span>`;
}

/* Teks soal dari server → HTML. Pecahan "3/4", campuran "1_1/2", negatif "(−7)". */
function soalHtml(teks) {
  return esc(teks).split(" ").map((tok) => {
    let m = tok.match(/^(\d+)_(\d+)\/(\d+)$/);
    if (m) return pecHtml(m[1], m[2], m[3]);
    m = tok.match(/^(\d+)\/(\d+)$/);
    if (m) return pecHtml("", m[1], m[2]);
    if (/^[+−×÷]$/.test(tok)) return `<span class="op">${tok}</span>`;
    m = tok.match(/^(\(?)(−?)(\d+)(\)?)$/);
    if (m) return `<span class="nm">${m[1]}${m[2]}${bil(m[3])}${m[4]}</span>`;
    return tok;
  }).join(" ");
}

/* Teks soal tanpa HTML (unduhan CSV): garis bawah campuran jadi spasi. */
const soalPolos = (teks) => String(teks || "").replace(/_/g, " ");

/* Kunci "p/q" (pecahan) atau "n" (bilangan) → HTML, bentuk paling sederhana;
   pecahan tak wajar ditampilkan juga sebagai pecahan campuran. */
function kunciHtml(k, bentuk) {
  k = String(k);
  if (k.includes(" sisa ")) return sisaHtml(k);
  if (!k.includes("/")) return `<span class="nm">${bil(k)}</span>`;
  let [p, q] = k.split("/").map(Number);
  if (q === 1) return `<span class="nm">${bil(p)}</span>`;
  const neg = p < 0; p = Math.abs(p);
  const biasa = pecHtml("", p, q, neg);
  if (p < q) return biasa;
  return `${biasa} <span class="op">=</span> ${pecHtml(Math.floor(p / q), p % q, q, neg)}`;
}

const kunciPolos = (k) => {
  k = String(k);
  if (!k.includes("/")) return k;
  let [p, q] = k.split("/").map(Number);
  if (q === 1) return String(p);
  const neg = p < 0 ? "-" : ""; p = Math.abs(p);
  return p < q ? `${neg}${p}/${q}` : `${neg}${Math.floor(p / q)}${p % q ? " " + (p % q) + "/" + q : ""}`;
};

/* Pembagian bersisa "12 sisa 3" → HTML. */
function sisaHtml(t) {
  const [q, r] = String(t).split(/\s*sisa\s*/);
  return `<span class="nm">${esc(bil(q))}</span> <span class="op sisa-kata">sisa</span> <span class="nm">${esc(bil(r || "0"))}</span>`;
}

/* Jawaban siswa ("1 3/4", "-12", "12 sisa 3") → HTML. */
function jawabHtml(j) {
  j = String(j == null ? "" : j).trim();
  if (!j) return '<span class="redup">(kosong)</span>';
  if (/^\d+ sisa \d+$/.test(j)) return sisaHtml(j);
  let m = j.match(/^(-)?(\d+) (\d+)\/(\d+)$/);
  if (m) return pecHtml(m[2], m[3], m[4], !!m[1]);
  m = j.match(/^(-)?(\d+)\/(\d+)$/);
  if (m) return pecHtml("", m[2], m[3], !!m[1]);
  return `<span class="nm">${esc(bil(j))}</span>`;
}

/* Jenis kesalahan: label singkat untuk guru, saran untuk siswa. */
const JENIS = {
  lain:      { label: "Salah hitung",               saran: "" },
  simpan:    { label: "Salah menyimpan/meminjam",   saran: "Selisihnya pas 10, 100, atau 1000. Periksa lagi saat menyimpan atau meminjam." },
  tanda:     { label: "Tanda negatif terbalik",     saran: "Angkanya sudah tepat, tetapi tandanya terbalik. Perhatikan aturan tanda positif-negatif." },
  urutan:    { label: "Urutan operasi",             saran: "Kerjakan × dan ÷ lebih dulu, baru + dan −." },
  langsung:  { label: "Pembilang & penyebut langsung dijumlah", saran: "Samakan penyebutnya dulu, jangan menjumlah/mengurangi penyebut dengan penyebut." },
  balik:     { label: "Pembagian tidak dibalik",    saran: "Membagi dengan pecahan = mengalikan dengan kebalikannya." },
  sederhana: { label: "Belum paling sederhana",     saran: "Nilainya sudah benar, tetapi belum paling sederhana. Bagi pembilang dan penyebut dengan FPB-nya." },
  waktu:     { label: "Kehabisan waktu",            saran: "Waktu untuk soal ini sudah habis." },
  kosong:    { label: "Tidak menjawab",             saran: "" },
  format:    { label: "Tulisan tidak terbaca",      saran: "Tulis jawaban berupa angka, misalnya 12, −5, 3/4, atau 1 1/2." },
  sisa:      { label: "Sisa pembagian salah",       saran: "Hasil baginya sudah tepat. Sisa = yang dibagi − (hasil bagi × pembagi)." },
  sisa_besar:{ label: "Sisa tidak lebih kecil dari pembagi", saran: "Sisa harus lebih kecil dari pembagi. Bila belum, hasil baginya masih bisa ditambah." },
};
const jenisLabel = (j) => (JENIS[j] || JENIS.lain).label;

function lamaTeks(detik) {
  detik = Math.round(detik || 0);
  if (detik < 60) return detik + " dtk";
  const m = Math.round(detik / 60);
  if (m < 60) return m + " mnt";
  return Math.floor(m / 60) + " j " + (m % 60) + " mnt";
}

function tglTeks(iso, jam) {
  if (!iso) return "–";
  const d = new Date(iso);
  const o = { day: "numeric", month: "short", year: "numeric" };
  if (jam) { o.hour = "2-digit"; o.minute = "2-digit"; }
  return d.toLocaleString("id-ID", o).replace(/\./g, ":");
}

function sejakTeks(iso) {
  if (!iso) return "belum pernah";
  const h = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (h <= 0) return "hari ini";
  if (h === 1) return "kemarin";
  return h + " hari lalu";
}
