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

/* batas (ms, opsional): permintaan yang menggantung dibatalkan. Galat jaringan/gerbang (bukan penolakan
   dari fungsi) diberi tanda .jaringan supaya pemanggil yang aman diulang bisa mengirim ulang. */
async function rpc(fn, args, batas) {
  if (!SB) throw new Error("Server belum diatur (config.js belum ada).");
  const ac = batas ? new AbortController() : null, tm = ac && setTimeout(() => ac.abort(), batas);
  let r, t;
  try {
    r = await fetch(`${SB.url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SB.key, Authorization: "Bearer " + SB.key },
      body: JSON.stringify(args || {}),
      signal: ac ? ac.signal : undefined,
    });
    t = await r.text();
  } catch (e) {
    const g = new Error("Tidak tersambung ke server. Periksa internet lalu coba lagi.");
    g.jaringan = true;
    throw g;
  } finally { clearTimeout(tm); }
  let j = null;
  try { j = t ? JSON.parse(t) : null; } catch (e) { /* bukan JSON */ }
  if (!r.ok) {
    const g = new Error((j && (j.message || j.hint)) || t || ("Galat " + r.status));
    if (r.status >= 502 || (r.status >= 500 && !j)) g.jaringan = true;
    throw g;
  }
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
  // Desimal: titik ribuan hanya pada bagian bulat (2486,72 → 2486,72; 9034492,15 → 9.034.492,15).
  const [d, k] = (neg ? s.slice(1) : s).split(",");
  const f = d.length > 4 ? d.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : d;
  return (neg ? "−" : "") + f + (k !== undefined ? "," + k : "");
}

/* HTML pecahan bersusun. w = bilangan bulat (boleh kosong). */
function pecHtml(w, n, d, neg) {
  return `<span class="pc">${neg ? '<span class="pc-neg">−</span>' : ""}${w ? `<span class="pc-w">${w}</span>` : ""}` +
    `<span class="pc-f"><span class="pc-n">${n}</span><span class="pc-d">${d}</span></span></span>`;
}

/* Satu ruas aljabar → HTML: pecahan "2/3" bersusun, variabel miring, angka rapi. */
function aljabarHtml(teks) {
  return esc(teks).split(" ").map((tok) => {
    const m = tok.match(/^(\d+)\/(\d+)$/);
    if (m) return pecHtml("", m[1], m[2]);
    if (/^[+−×÷=]$/.test(tok)) return `<span class="op">${tok}</span>`;
    return tok.replace(/[a-z]/g, (v) => `<i class="var">${v}</i>`);
  }).join(" ");
}

/* Teks soal dari server → HTML. Pecahan "3/4", campuran "1_1/2", negatif "(−7)",
   desimal "2486,72", persen "185%", persamaan "3(x − 1) = 7", sistem "pers1 ; pers2",
   pola "3, 7, □, 15". */
/* Satu bilangan untuk soal mengurutkan: "2_1/4", "9/4", "235%", "2,18", "3" → HTML. */
function bilHtml(t) {
  t = String(t);
  let m = t.match(/^(\d+)_(\d+)\/(\d+)$/);
  if (m) return pecHtml(m[1], m[2], m[3]);
  m = t.match(/^(\d+)\/(\d+)$/);
  if (m) return pecHtml("", m[1], m[2]);
  m = t.match(/^(\d+(?:,\d+)?)%$/);
  if (m) return `<span class="nm">${bil(m[1])}%</span>`;
  return `<span class="nm">${esc(bil(t))}</span>`;
}
/* Soal mengurutkan "Urutkan dari yang terkecil: a | b | c" → {arah, items}. */
function uraiUrut(teks) {
  const m = String(teks || "").match(/^Urutkan dari yang (\w+): (.*)$/);
  return m ? { arah: m[1], items: m[2].split(" | ") } : { arah: "", items: [] };
}

/* Soal pilihan ganda "premis ¶ pertanyaan ¶ A) … ¶ B) …" → {premis, tanya, opsi: [[huruf, teks]]}. */
function uraiPilihan(teks) {
  const b = String(teks || "").split(" ¶ ");
  return { premis: b[0] || "", tanya: b[1] || "", opsi: b.slice(2).map((o) => [o.slice(0, 1), o.slice(3)]) };
}

function soalHtml(teks) {
  teks = String(teks || "");
  if (/^Urutkan dari yang /.test(teks)) {                       // mengurutkan (tampilan baca saja)
    const u = uraiUrut(teks);
    return `<span class="cerita-tanya">Urutkan dari yang ${esc(u.arah)}:</span><span class="urut-statis">${u.items.map(bilHtml).join('<span class="koma-deret">,</span> ')}</span>`;
  }
  if (teks.includes(" ¶ ")) {                                   // pilihan ganda (tampilan baca saja)
    const u = uraiPilihan(teks);
    return `<span class="cerita">${esc(u.premis)}</span><span class="cerita-tanya">${esc(u.tanya)}</span>` +
      `<span class="opsi-statis">${u.opsi.map(([h, t]) => `<span><b>${h}.</b> ${esc(t)}</span>`).join("")}</span>`;
  }
  if (/[A-Za-z]{3,}/.test(teks)) return `<span class="cerita">${esc(teks)}</span>`;   // soal cerita
  if (teks.includes(" ; ")) return `<span class="sistem">${teks.split(" ; ").map((p) => `<span>${aljabarHtml(p)}</span>`).join("")}</span>`;
  if (/^[−\d□]/.test(teks) && teks.includes(", "))
    return '<span class="deret">' + teks.split(", ").map((t) => t === "□" ? '<span class="kotak-soal" aria-label="suku yang dicari">□</span>'
      : `<span class="nm">${esc(t.startsWith("−") ? "−" + bil(t.slice(1)) : bil(t))}</span>`).join('<span class="koma-deret">,</span> ') + "</span>";
  if (/[a-z]/.test(teks)) return aljabarHtml(teks);
  return esc(teks).split(" ").map((tok) => {
    let m = tok.match(/^(\d+)_(\d+)\/(\d+)$/);
    if (m) return pecHtml(m[1], m[2], m[3]);
    m = tok.match(/^(\d+)\/(\d+)$/);
    if (m) return pecHtml("", m[1], m[2]);
    if (/^[+−×÷=]$/.test(tok)) return `<span class="op">${tok}</span>`;
    if (tok === "□") return '<span class="kotak-soal" aria-label="bilangan yang dicari">□</span>';
    m = tok.match(/^(\d+(?:,\d+)?)%$/);
    if (m) return `<span class="nm">${bil(m[1])}%</span>`;
    m = tok.match(/^(\(?)(−?)(\d+(?:,\d+)?)(\)?)$/);
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
  if (k.includes("|")) return k.split("|").map(bilHtml).join(' <span class="redup">;</span> ');            // urutan
  if (bentuk === "notasi" && k.includes(";")) { const [a, n] = k.split(";"); return `<span class="nm">${esc(a)} × 10<sup>${esc(n.replace("-", "−"))}</sup></span>`; }
  // Jawaban ganda: SPLDV "x;y", pola "a;b"
  if (k.includes(";")) {
    const b = k.split(";").map((x) => `<span class="nm">${x.startsWith("-") ? "−" + bil(x.slice(1)) : bil(x)}</span>`);
    return bentuk === "spldv" ? `<i class="var">x</i> = ${b[0]}, <i class="var">y</i> = ${b[1]}` : b.join(' <span class="redup">;</span> ');
  }
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
  if (j.includes("|")) return j.split("|").map(bilHtml).join(' <span class="redup">;</span> ');
  if (j.includes(";")) return j.split(";").map((x) => `<span class="nm">${esc(x.startsWith("-") ? "−" + bil(x.slice(1)) : bil(x))}</span>`).join(' <span class="redup">;</span> ');
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
  format:    { label: "Tulisan tidak terbaca",      saran: "Tulis jawaban berupa angka, misalnya 12, −5, 3/4, 1 1/2, 0,75, atau 75%." },
  balik_op:  { label: "Operasi tidak dibalik",      saran: "Untuk mencari □, pakai operasi kebalikannya. Contoh: □ + 14 = 29, maka □ = 29 − 14 = 15." },
  konvers:   { label: "Membalik implikasi",         saran: "\"Jika p, maka q\" tidak sama dengan \"Jika q, maka p\". Yang setara adalah kontraposisinya: \"Jika tidak q, maka tidak p\"." },
  invers:    { label: "Menyangkal tanpa membalik",   saran: "\"Jika tidak p, maka tidak q\" belum tentu benar. Ingat: yang setara adalah \"Jika tidak q, maka tidak p\"." },
  kuantor:   { label: "Kuantor tidak tepat",         saran: "Perhatikan kata \"semua\" dan \"sebagian\". Bila hanya sebagian yang termasuk, simpulannya pun hanya \"sebagian\"." },
  tidak_sah: { label: "Tidak dapat disimpulkan",     saran: "Pilihan itu tidak mengikuti dari premis. Cari pernyataan yang pasti benar bila semua premis benar." },
  ingkaran:  { label: "Ingkaran/kesetaraan keliru",  saran: "Ingkaran \"Jika p, maka q\" adalah \"p dan tidak q\"; kesetaraannya adalah \"tidak p atau q\"." },
  terbalik:  { label: "Urutan terbalik",            saran: "Urutanmu benar tetapi arahnya terbalik. Perhatikan: diminta dari yang terkecil atau terbesar?" },
  bukan_baku:{ label: "Belum notasi baku",          saran: "Nilainya sudah benar, tetapi bilangan di depan harus antara 1 dan 10 (1 ≤ a < 10). Geser komanya dan sesuaikan pangkatnya." },
  pangkat:   { label: "Pangkat 10 salah",           saran: "Bilangan di depan sudah benar. Hitung lagi berapa tempat koma digeser untuk menentukan pangkat 10." },
  tertukar:  { label: "Jawaban tertukar",           saran: "Nilainya sudah benar, tetapi urutannya tertukar. Periksa lagi kotak mana untuk apa." },
  sebagian:  { label: "Sebagian benar",             saran: "Sebagian jawabanmu sudah benar. Periksa lagi kotak yang lain." },
  koma:      { label: "Letak koma salah",           saran: "Angkanya sudah benar, tetapi letak komanya bergeser. Hitung lagi banyaknya angka di belakang koma." },
  persen:    { label: "Persen belum diubah",        saran: "Ubah persen dulu sebelum menghitung: 185% = 1,85 = 185/100." },
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

/* Freeze pane tabel data: <table data-beku="n"> → baris judul tetap di atas saat tabel digulir ke
   bawah, n kolom pertama tetap di kiri saat digulir ke samping. Dihitung ulang otomatis bila isi tabel
   berganti, tabel baru muncul, atau ukurannya berubah (mis. tab dibuka, layar diputar). */
(function () {
  if (!("ResizeObserver" in window)) return;
  const ukur = new ResizeObserver((es) => es.forEach((e) => bekukan(e.target)));
  const dikenal = new WeakSet();
  function bekukan(t) {
    const n = +t.dataset.beku || 0, baris = t.rows;
    if (t.parentElement) t.parentElement.classList.add("fz-wadah");
    if (!n || !baris.length) return;
    const kepala = baris[0].cells, kiri = [];
    let x = 0;
    for (let i = 0; i < Math.min(n, kepala.length); i++) { kiri.push(x); x += kepala[i].getBoundingClientRect().width; }
    if (!x) return;                                    // tabel tersembunyi: dihitung saat tampil
    for (const r of baris) {
      for (let i = 0; i < kiri.length && i < r.cells.length; i++) {
        const c = r.cells[i];
        if (c.colSpan > 1) break;                      // baris gabungan (mis. "Tidak ada data") tidak dibekukan
        c.classList.add("fz-kol"); c.style.left = kiri[i] + "px"; c.classList.toggle("fz-akhir", i === kiri.length - 1);
      }
    }
  }
  function pindai() {
    document.querySelectorAll("table[data-beku]").forEach((t) => { if (!dikenal.has(t)) { dikenal.add(t); ukur.observe(t); } bekukan(t); });
  }
  let jadwal = 0;
  new MutationObserver(() => { cancelAnimationFrame(jadwal); jadwal = requestAnimationFrame(pindai); })
    .observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", pindai); else pindai();
})();
