/* Matdas — pembahasan langkah demi langkah (19 Okt 2026).
   Disusun di peramban dari teks soal + kunci yang SUDAH dikirim server sesudah siswa menjawab
   (tidak ada kunci baru yang bocor). Hanya ditampilkan di latihan mandiri dan "Tinjau kesalahanku";
   sesi kelompok tidak menampilkannya.

   bahasSoal({ soal, kunci, jenis }) → { langkah: [{ h, p }], susun } atau null.
     h = HTML satu langkah, p = langkah yang berkaitan dengan jenis kesalahan siswa (disorot),
     susun = HTML cara bersusun (boleh kosong).
   Hasil hitungan pembahasan selalu dicocokkan dengan kunci server; bila berbeda (atau bentuk soal
   belum dikenali, mis. MD11/MD12) hasilnya null dan tidak ada pembahasan yang tampil.
   Cakupan saat ini: MD10 — bilangan bulat (+ − × ÷, positif-negatif), pembagian bersisa,
   operasi gabungan, pecahan, dan gabungan pecahan.
   Butuh umum.js (bil, pecHtml, kunciHtml). */
"use strict";

const BahasMatdas = (() => {
  const TEMPAT = ["satuan", "puluhan", "ratusan", "ribuan", "puluh ribuan", "ratus ribuan", "jutaan", "puluh jutaan", "ratus jutaan"];
  const fpb = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const kpk = (a, b) => a / fpb(a, b) * b;
  const N = (v) => `<span class="nm">${bil(String(v))}</span>`;
  const Nk = (v) => v < 0 ? `(${N(v)})` : N(v);                      // negatif dalam kurung
  const op = (o) => ` <span class="op">${o}</span> `;
  const sama = op("=");

  /* ------------------------------------------------------------ pecahan */
  const Q = (p, q) => { if (q < 0) { p = -p; q = -q; } const g = fpb(p, q) || 1; return { p: p / g, q: q / g }; };
  const P = (p, q) => q === 1 ? N(p) : pecHtml("", Math.abs(p), q, p < 0);
  function Pcamp(p, q) {                                            // pecahan tak wajar → campuran
    if (q === 1 || Math.abs(p) < q) return P(p, q);
    const a = Math.abs(p);
    return a % q ? pecHtml(Math.floor(a / q), a % q, q, p < 0) : N(p / q);
  }
  // "2_1/3" atau "4/5" → {p, q, w, n, d}
  function bacaPec(t) {
    let m = t.match(/^(\d+)_(\d+)\/(\d+)$/);
    if (m) { const w = +m[1], n = +m[2], d = +m[3]; return { p: w * d + n, q: d, w, n, d }; }
    m = t.match(/^(\d+)\/(\d+)$/);
    if (m) return { p: +m[1], q: +m[2], w: 0, n: +m[1], d: +m[2] };
    return null;
  }
  const campHtml = (x) => x.w ? pecHtml(x.w, x.n, x.d) : P(x.p, x.q);

  /* Sederhanakan p/q bila perlu → langkah. */
  function langkahSederhana(p, q, L, sorot) {
    const g = fpb(p, q);
    if (g > 1) L.push({ h: `Sederhanakan ${P(p, q)}: pembilang dan penyebut dibagi FPB-nya, yaitu ${N(g)} → ${P(p / g, q / g)}`, p: sorot });
    return Q(p, q);
  }

  /* Satu operasi dua pecahan (sudah pecahan biasa) → {p, q, langkah: [..]} */
  function operasiPecahan(a, o, b, jenis, ringkas) {
    const L = [];
    let p, q;
    if (o === "+" || o === "−") {
      const s = o === "+" ? 1 : -1;
      if (a.q === b.q) {
        p = a.p + s * b.p; q = a.q;
        L.push({ h: `Penyebutnya sudah sama, jadi pembilangnya langsung ${o === "+" ? "dijumlahkan" : "dikurangkan"}: ${P(a.p, a.q)}${op(o)}${P(b.p, b.q)}${sama}${pecHtml("", `${a.p} ${o} ${b.p}`, q)}${sama}${P(p, q)}` });
      } else {
        const k = kpk(a.q, b.q), fa = k / a.q, fb = k / b.q;
        L.push({ h: `Samakan penyebutnya dulu. KPK dari ${N(a.q)} dan ${N(b.q)} adalah ${N(k)}.`, p: jenis === "langsung" });
        const ubah = (x, f) => f === 1 ? `${P(x.p, x.q)} tetap` : `${P(x.p, x.q)}${sama}${pecHtml("", `${x.p} × ${f}`, `${x.q} × ${f}`)}${sama}${P(x.p * f, k)}`;
        if (ringkas) L.push({ h: `${ubah(a, fa)}; ${ubah(b, fb)}` });
        else { L.push({ h: ubah(a, fa) }); L.push({ h: ubah(b, fb) }); }
        p = a.p * fa + s * b.p * fb; q = k;
        L.push({ h: `${o === "+" ? "Jumlahkan" : "Kurangkan"} pembilangnya, penyebut tetap ${N(k)}: ${P(a.p * fa, k)}${op(o)}${P(b.p * fb, k)}${sama}${P(p, q)}` });
      }
    } else if (o === "×") {
      p = a.p * b.p; q = a.q * b.q;
      L.push({ h: `Kalikan pembilang dengan pembilang, penyebut dengan penyebut: ${P(a.p, a.q)}${op("×")}${P(b.p, b.q)}${sama}${pecHtml("", `${a.p} × ${b.p}`, `${a.q} × ${b.q}`)}${sama}${P(p, q)}` });
    } else {
      L.push({ h: `Membagi dengan pecahan sama dengan mengalikan dengan kebalikannya (pembilang dan penyebut ditukar): ${P(a.p, a.q)}${op("÷")}${P(b.p, b.q)}${sama}${P(a.p, a.q)}${op("×")}${P(b.q, b.p)}`, p: jenis === "balik" });
      p = a.p * b.q; q = a.q * b.p;
      L.push({ h: `${P(a.p, a.q)}${op("×")}${P(b.q, b.p)}${sama}${pecHtml("", `${a.p} × ${b.q}`, `${a.q} × ${b.p}`)}${sama}${P(p, q)}` });
    }
    const h = langkahSederhana(p, q, L, jenis === "sederhana");
    return { p: h.p, q: h.q, langkah: L };
  }

  /* Ungkapan pecahan "2_1/3 + 3/4 × 1/2" → token: [{p,q}, "+", {p,q}, ...] */
  function bacaUngkapan(teks, bacaBil) {
    const t = String(teks || "").trim().split(/\s+/);
    if (t.length < 3 || t.length % 2 === 0) return null;
    const out = [];
    for (let i = 0; i < t.length; i++) {
      if (i % 2) { if (!/^[+−×÷]$/.test(t[i])) return null; out.push(t[i]); }
      else { const x = bacaBil(t[i]); if (!x) return null; out.push(x); }
    }
    return out;
  }

  /* ------------------------------------------------------------ bilangan bulat */
  const digit = (v) => String(Math.abs(v)).split("").reverse().map(Number);

  /* Cara bersusun: baris berisi teks (angka rata kanan); garis di bawah baris ke-g. */
  function susunHtml(baris, garis, simpan) {
    const lebar = Math.max(...baris.map((b) => b[1].length + (b[0] ? 1 : 0)), simpan ? simpan.length : 0);
    const sel = (s, o) => {
      const isi = (o ? o : "") + s, kosong = lebar - isi.length;
      return Array.from({ length: kosong }, () => "<td></td>").join("") + isi.split("").map((c, i) => `<td${o && i === 0 ? ' class="op"' : ""}>${c === " " ? "" : c}</td>`).join("");
    };
    let h = '<table class="bh-tabel" aria-label="cara bersusun">';
    if (simpan) h += `<tr class="simpan">${sel(simpan)}</tr>`;
    baris.forEach((b, i) => { h += `<tr${garis.includes(i) ? ' class="garis"' : ""}>${sel(b[1], b[0])}</tr>`; });
    return h + "</table>";
  }

  function tambahBersusun(x, y, jenis) {
    const a = digit(x), b = digit(y), n = Math.max(a.length, b.length), L = [];
    let c = 0, simpan = "";
    for (let i = 0; i < n; i++) {
      const ada = [a[i], b[i]].filter((v) => v !== undefined), s = ada.reduce((t, v) => t + v, 0) + c;
      const suku = ada.map(String).concat(c ? ["1 (simpanan)"] : []);
      const akhir = i === n - 1;
      let h = `${cap(TEMPAT[i])}: ${suku.length === 1 ? `turunkan ${suku[0]}` : `${suku.join(" + ")} = ${s}`}`;
      if (s >= 10 && !akhir) h += ` → tulis ${s % 10}, simpan 1`;
      else if (suku.length > 1) h += ` → tulis ${s}`;
      L.push({ h, p: jenis === "simpan" && (c > 0 || s >= 10) });
      simpan = (s >= 10 && !akhir ? "1" : " ") + simpan;
      c = s >= 10 ? 1 : 0;
    }
    const z = x + y;
    return { langkah: L, susun: susunHtml([["", String(x)], ["+", String(y)], ["", String(z)]], [1], /1/.test(simpan) ? simpan.replace(/^ /, "") + " " : "") };
  }

  function kurangBersusun(x, y, jenis) {
    const a = digit(x), b = digit(y), L = [];
    let pinjam = 0;
    for (let i = 0; i < a.length; i++) {
      let d = a[i] - pinjam; const k = b[i] || 0, adaB = b[i] !== undefined;
      let h = `${cap(TEMPAT[i])}: `, p = false;
      if (pinjam && a[i] === 0) { h += `angkanya 0, tidak bisa dipinjami, jadi pinjam 1 dari ${TEMPAT[i + 1]}: 0 menjadi 10, lalu dikurangi 1 yang dipinjam tadi = 9 → `; d = 9; p = true; }
      else if (pinjam) { h += `${a[i]} sudah dipinjam 1, tinggal ${d} → `; p = true; }
      if (i === a.length - 1 && !adaB) {
        h += d > 0 ? `${p ? "tulis" : "turunkan"} ${d}` : "0 di depan tidak perlu ditulis";
        L.push({ h, p: jenis === "simpan" && p });
        break;
      }
      if (pinjam && a[i] === 0) {
        h += adaB ? `${d} − ${k} = ${d - k}` : `tulis ${d}`;
        pinjam = 1;
      } else if (d < k) {
        h += `${d} kurang dari ${k}, pinjam 1 dari ${TEMPAT[i + 1]}: ${d + 10} − ${k} = ${d + 10 - k}`;
        pinjam = 1; p = true;
      } else {
        h += adaB ? `${d} − ${k} = ${d - k}` : `turunkan ${d}`;
        pinjam = 0;
      }
      L.push({ h, p: jenis === "simpan" && p });
    }
    return { langkah: L, susun: susunHtml([["", String(x)], ["−", String(y)], ["", String(x - y)]], [1]) };
  }

  function kaliBersusun(x, y, jenis) {
    const a = digit(x), b = digit(y), L = [];
    if (b.length === 1) {
      let c = 0, simpan = "";
      for (let i = 0; i < a.length; i++) {
        const s = a[i] * b[0] + c, akhir = i === a.length - 1;
        let h = `${a[i]} × ${b[0]}${c ? ` = ${a[i] * b[0]}, ditambah simpanan ${c} = ${s}` : ` = ${s}`}`;
        h += !akhir && s >= 10 ? ` → tulis ${s % 10}, simpan ${Math.floor(s / 10)}` : ` → tulis ${s}`;
        L.push({ h: `${cap(TEMPAT[i])}: ${h}`, p: jenis === "simpan" && (c > 0 || s >= 10) });
        simpan = (!akhir && s >= 10 ? String(Math.floor(s / 10)) : " ") + simpan;
        c = akhir ? 0 : Math.floor(s / 10);
      }
      return { langkah: L, susun: susunHtml([["", String(x)], ["×", String(y)], ["", String(x * y)]], [1], /\d/.test(simpan) ? simpan.replace(/^ /, "") + " " : "") };
    }
    // Pengali lebih dari satu angka: kalikan dengan tiap angka pengali, geser satu tempat ke kiri, lalu jumlahkan.
    const baris = [["", String(x)], ["×", String(y)]];
    for (let i = 0; i < b.length; i++) {
      const hs = x * b[i];
      L.push({ h: `Kalikan dengan angka ${TEMPAT[i]} pengali (${b[i]}): ${N(x)} × ${b[i]} = ${N(hs)}${i ? `, ditulis bergeser ${i} tempat ke kiri (sama dengan ${N(hs * 10 ** i)})` : ""}` });
      baris.push([i === b.length - 1 ? "+" : "", String(hs) + " ".repeat(i)]);
    }
    L.push({ h: `Jumlahkan semua hasil kali tadi: ${b.map((v, i) => N(x * v * 10 ** i)).join(" + ")} = ${N(x * y)}`, p: jenis === "simpan" });
    baris.push(["", String(x * y)]);
    return { langkah: L, susun: susunHtml(baris, [1, baris.length - 2]) };
  }

  /* Pembagian bersusun (porogapit), dari angka paling kiri. */
  function bagiBersusun(x, y, jenis) {
    const L = [], ds = String(x).split("").map(Number);
    if (x < 10 && y < 10) {
      const q = Math.floor(x / y);
      L.push({ h: `Cari bilangan yang bila dikali ${N(y)} hasilnya ${N(x)}${x % y ? " atau paling dekat di bawahnya" : ""}: ${q} × ${y} = ${q * y}` });
      return { langkah: L, q, r: x % y };
    }
    let cur = 0, mulai = false, hasil = "", ambil = "";
    ds.forEach((d, i) => {
      cur = cur * 10 + d; ambil += d;
      if (!mulai && cur < y && i < ds.length - 1) return;      // belum cukup: ambil angka berikutnya
      const q = Math.floor(cur / y), r = cur - q * y;
      const awal = !mulai ? `Ambil ${N(ambil)}${ambil.length > 1 ? ` (${ambil.slice(0, -1)} saja lebih kecil dari ${y})` : ""}` : `Turunkan ${d} → ${N(cur)}`;
      L.push({ h: `${awal}: ${N(cur)} ÷ ${N(y)} = ${q}${q ? `, karena ${q} × ${N(y)} = ${N(q * y)}` : ` (${cur} lebih kecil dari ${y}, tulis 0)`}; sisa ${N(cur)} − ${N(q * y)} = ${N(r)}`, p: (jenis === "sisa" || jenis === "sisa_besar") && i === ds.length - 1 });
      hasil += q; mulai = true; cur = r;
    });
    return { langkah: L, q: Math.floor(x / y), r: x % y, angka: hasil };
  }

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* Bilangan bulat "47", "(−7)" → nilai */
  function bacaBulat(t) {
    const m = t.match(/^\((−)(\d+)\)$|^(\d+)$/);
    if (!m) return null;
    return m[3] !== undefined ? +m[3] : -(+m[2]);
  }

  function bulatDua(x, o, y, jenis) {
    const L = [];
    let susun = "", hasil;
    const campur = x < 0 || y < 0;
    const ax = Math.abs(x), ay = Math.abs(y);
    if (!campur && x < 10 && y < 10 && o !== "÷") {                  // satu angka: tanpa cara bersusun
      if (o === "+") {
        const k = 10 - x;
        hasil = x + y;
        L.push({ h: hasil > 10 && k > 0 && y > k
          ? `Lengkapi 10 dulu: ${N(x)} + ${N(y)} = ${N(x)} + ${k} + ${y - k} = 10 + ${y - k} = ${N(hasil)}`
          : `${N(x)} + ${N(y)} = ${N(hasil)}` });
      } else if (o === "−") {
        if (x < y) return null;
        hasil = x - y;
        L.push({ h: `${N(x)} − ${N(y)} = ${N(hasil)}, karena ${N(hasil)} + ${N(y)} = ${N(x)}` });
      } else {
        hasil = x * y;
        L.push({ h: x > 1 ? `${N(x)} × ${N(y)} artinya ${N(y)} dijumlahkan sebanyak ${x} kali: ${Array(x).fill(y).join(" + ")} = ${N(hasil)}` : `${N(x)} × ${N(y)} = ${N(hasil)}` });
      }
      L.push({ h: `Jadi ${N(x)}${op(o)}${N(y)}${sama}${N(hasil)}` });
      return { langkah: L, susun: "", hasil };
    }
    if (!campur) {
      if (o === "+") { const r = tambahBersusun(x, y, jenis); L.push({ h: "Susun bilangan rata kanan, lalu jumlahkan dari satuan." }, ...r.langkah); susun = r.susun; hasil = x + y; }
      else if (o === "−") {
        if (x < y) return null;
        const r = kurangBersusun(x, y, jenis); L.push({ h: "Susun bilangan rata kanan, lalu kurangkan dari satuan." }, ...r.langkah); susun = r.susun; hasil = x - y;
      } else if (o === "×") { const r = kaliBersusun(x, y, jenis); L.push({ h: y >= 10 ? "Kalikan dengan tiap angka pengali, mulai dari satuan." : "Kalikan dari angka satuan ke kiri." }, ...r.langkah); susun = r.susun; hasil = x * y; }
      else {
        if (!y) return null;
        const r = bagiBersusun(x, y, jenis);
        if (r.r) return null;                                      // pembagian dasar selalu habis
        if (x >= 10 || y >= 10) L.push({ h: "Bagi dari angka paling kiri (cara porogapit)." });
        L.push(...r.langkah); hasil = r.q;
        L.push({ h: `Periksa: ${N(hasil)} × ${N(y)} = ${N(x)} ✓` });
      }
      L.push({ h: `Jadi ${N(x)}${op(o)}${N(y)}${sama}${N(hasil)}` });
      return { langkah: L, susun, hasil };
    }
    // Positif-negatif: tanda dulu, lalu angkanya (seperti tahap sebelumnya).
    if (o === "+" || o === "−") {
      let b = y;
      if (o === "−") {
        b = -y;
        L.push({ h: `Mengurangi sama dengan menambah lawannya: ${Nk(x)}${op("−")}${Nk(y)}${sama}${Nk(x)}${op("+")}${Nk(b)}`, p: jenis === "tanda" });
      }
      const s = x + b;
      if (x >= 0 && b >= 0) L.push({ h: `Keduanya positif: ${N(x)} + ${N(b)} = ${N(s)}` });
      else if (x < 0 && b < 0) L.push({ h: `Keduanya negatif: jumlahkan angkanya (${N(-x)} + ${N(-b)} = ${N(-s)}), hasilnya tetap negatif → ${N(s)}`, p: jenis === "tanda" });
      else {
        const bx = Math.abs(x), bb = Math.abs(b), besar = bx >= bb ? x : b;
        if (bx === bb) L.push({ h: `Angkanya sama, tandanya berlawanan: hasilnya ${N(0)}` });
        else {
          L.push({ h: `Tandanya berbeda: kurangkan angka yang besar dengan yang kecil: ${N(Math.max(bx, bb))} − ${N(Math.min(bx, bb))} = ${N(Math.abs(s))}`, p: jenis === "simpan" || jenis === "lain" });
          L.push({ h: `Tanda hasil mengikuti bilangan yang angkanya lebih besar (${Nk(besar)}), jadi hasilnya ${s < 0 ? "negatif" : "positif"} → ${N(s)}`, p: jenis === "tanda" });
        }
      }
      hasil = s;
    } else {
      const neg = (x < 0) !== (y < 0);
      if (o === "÷" && (!y || ax % ay)) return null;
      const angka = o === "×" ? ax * ay : ax / ay;
      L.push({ h: `Hitung angkanya dulu tanpa tanda: ${N(ax)}${op(o)}${N(ay)}${sama}${N(angka)}` });
      L.push({ h: `Tentukan tandanya: ${x < 0 ? "negatif" : "positif"} ${o === "×" ? "×" : "÷"} ${y < 0 ? "negatif" : "positif"} = ${neg ? "negatif" : "positif"} (tanda ${neg ? "berbeda → negatif" : "sama → positif"})`, p: jenis === "tanda" });
      hasil = neg ? -angka : angka;
    }
    L.push({ h: `Jadi ${Nk(x)}${op(o)}${Nk(y)}${sama}${N(hasil)}` });
    return { langkah: L, susun: "", hasil };
  }

  /* Operasi gabungan bilangan bulat: × ÷ dulu dari kiri, lalu + − dari kiri. */
  function gabungan(tok, jenis) {
    const L = [{ h: "Kerjakan × dan ÷ lebih dulu dari kiri ke kanan, baru + dan − dari kiri ke kanan.", p: jenis === "urutan" }];
    const tulis = (t) => t.map((x) => typeof x === "number" ? N(x) : op(x).trim()).join(" ");
    let t = tok.slice();
    for (const tahap of [["×", "÷"], ["+", "−"]]) {
      for (;;) {
        const i = t.findIndex((x, k) => k % 2 === 1 && tahap.includes(x));
        if (i < 0) break;
        const a = t[i - 1], o = t[i], b = t[i + 1];
        if (o === "÷" && (!b || a % b)) return null;
        const r = o === "×" ? a * b : o === "÷" ? a / b : o === "+" ? a + b : a - b;
        t = t.slice(0, i - 1).concat([r], t.slice(i + 2));
        L.push({ h: `${N(a)}${op(o)}${N(b)}${sama}${N(r)}${t.length > 1 ? ` → ${tulis(t)}` : ""}` });
      }
    }
    L.push({ h: `Jadi hasilnya ${N(t[0])}` });
    return { langkah: L, susun: "", hasil: t[0] };
  }

  /* Gabungan pecahan: ubah campuran dulu, × ÷ dulu, lalu + −. */
  function gabunganPecahan(tok, jenis) {
    const L = [];
    const camp = tok.filter((x, i) => i % 2 === 0 && x.w);
    if (camp.length) L.push({ h: `Ubah pecahan campuran menjadi pecahan biasa: ${camp.map((x) => `${campHtml(x)}${sama}${pecHtml("", `${x.w} × ${x.d} + ${x.n}`, x.d)}${sama}${P(x.p, x.q)}`).join("; ")}` });
    const satu = tok.length === 3;
    if (!satu) L.push({ h: "Kerjakan × dan ÷ lebih dulu dari kiri ke kanan, baru + dan − dari kiri ke kanan.", p: jenis === "urutan" });
    const tulis = (t) => t.map((x) => typeof x === "string" ? op(x).trim() : P(x.p, x.q)).join(" ");
    let t = tok.map((x) => typeof x === "string" ? x : Q(x.p, x.q));
    for (const tahap of [["×", "÷"], ["+", "−"]]) {
      for (;;) {
        const i = t.findIndex((x, k) => k % 2 === 1 && tahap.includes(x));
        if (i < 0) break;
        const a = t[i - 1], o = t[i], b = t[i + 1];
        if (o === "÷" && !b.p) return null;
        const r = operasiPecahan(a, o, b, jenis, !satu);
        if (!satu) L.push({ h: `<b>${P(a.p, a.q)}${op(o)}${P(b.p, b.q)}</b>` });
        r.langkah.forEach((x) => L.push(satu ? x : { h: x.h, p: x.p, anak: true }));
        t = t.slice(0, i - 1).concat([{ p: r.p, q: r.q }], t.slice(i + 2));
        if (!satu && t.length > 3) L.push({ h: `Sekarang soalnya menjadi ${tulis(t)}` });
      }
    }
    const h = t[0];
    L.push({ h: `Jadi hasilnya ${P(h.p, h.q)}${h.q > 1 && Math.abs(h.p) > h.q ? `${sama}${Pcamp(h.p, h.q)}` : ""}` });
    return { langkah: L, susun: "", hasil: h };
  }

  /* Bilangan yang hilang: "□ + 4 = 12", "565 − □ = 534", "□ × 8 = 72", "42 ÷ □ = 6" → operasi kebalikan. */
  function hilang(soal, jenis) {
    const m = soal.match(/^(□|\d+) ([+−×÷]) (□|\d+) = (\d+)$/);
    if (!m || (m[1] === "□") === (m[3] === "□")) return null;
    const o = m[2], kiri = m[1] === "□", a = +(kiri ? m[3] : m[1]), c = +m[4];
    const K = '<span class="kotak-soal">□</span>';
    let x, o2, y, alasan;
    if (o === "+") { x = c; o2 = "−"; y = a; alasan = "Lawan dari penjumlahan adalah pengurangan"; }
    else if (o === "×") { x = c; o2 = "÷"; y = a; alasan = "Lawan dari perkalian adalah pembagian"; }
    else if (o === "−" && kiri) { x = c; o2 = "+"; y = a; alasan = "Lawan dari pengurangan adalah penjumlahan"; }
    else if (o === "−") { x = a; o2 = "−"; y = c; alasan = `${N(a)} dikurangi ${K} hasilnya ${N(c)}, berarti ${K} adalah selisih ${N(a)} dan ${N(c)}`; }
    else if (kiri) { x = c; o2 = "×"; y = a; alasan = "Lawan dari pembagian adalah perkalian"; }
    else { x = a; o2 = "÷"; y = c; alasan = `${N(a)} dibagi ${K} hasilnya ${N(c)}, berarti ${K} didapat dari ${N(a)} ÷ ${N(c)}`; }
    const L = [{ h: `${alasan}: ${K}${sama}${N(x)}${op(o2)}${N(y)}`, p: jenis === "balik_op" }];
    const r = bulatDua(x, o2, y, jenis);
    if (!r) return null;
    L.push(...r.langkah.slice(0, -1).filter((x) => !x.h.startsWith("Periksa")));   // tanpa "Jadi …"/"Periksa" hitungan dalam
    L.push({ h: `Jadi ${K}${sama}${N(r.hasil)}` });
    L.push({ h: `Periksa: ${kiri ? N(r.hasil) : N(a)}${op(o)}${kiri ? N(a) : N(r.hasil)}${sama}${N(c)} ✓` });
    return { langkah: L, susun: r.susun, hasil: r.hasil };
  }

  function bagiSisa(x, y, jenis) {
    const r = bagiBersusun(x, y, jenis), L = [];
    if (x >= 10 || y >= 10) L.push({ h: "Bagi dari angka paling kiri (cara porogapit)." });
    L.push(...r.langkah);
    L.push({ h: `Hasil bagi ${N(r.q)}, sisa ${N(r.r)}. Sisa harus lebih kecil dari pembagi (${N(r.r)} &lt; ${N(y)} ✓).`, p: jenis === "sisa_besar" });
    L.push({ h: `Periksa: ${N(r.q)} × ${N(y)} + ${N(r.r)} = ${N(r.q * y)} + ${N(r.r)} = ${N(x)} ✓`, p: jenis === "sisa" });
    return { langkah: L, susun: "", q: r.q, r: r.r };
  }

  /* ------------------------------------------------------------ pintu masuk */
  function bahasSoal(o) {
    try { return susun(o); } catch (e) { return null; }
  }
  function susun(o) {
    const soal = String(o.soal || "").trim(), kunci = String(o.kunci == null ? "" : o.kunci).trim(), jenis = o.jenis || "";
    if (!soal || !kunci) return null;
    // Pembagian bersisa: "47 ÷ 5", kunci "9 sisa 2"
    let m = kunci.match(/^(\d+) sisa (\d+)$/);
    if (m) {
      const s = soal.match(/^(\d+) ÷ (\d+)$/);
      if (!s) return null;
      const r = bagiSisa(+s[1], +s[2], jenis);
      return r.q === +m[1] && r.r === +m[2] ? r : null;
    }
    if (/^-?\d+\/\d+$/.test(kunci)) {                                 // pecahan
      const tok = bacaUngkapan(soal, bacaPec);
      if (!tok) return null;
      const [kp, kq] = kunci.split("/").map(Number), k = Q(kp, kq);
      const r = gabunganPecahan(tok, jenis);
      return r && r.hasil.p === k.p && r.hasil.q === k.q ? r : null;
    }
    if (soal.includes("□")) {                                         // bilangan yang hilang (K10-15, K10-16)
      if (!/^-?\d+$/.test(kunci)) return null;
      const r = hilang(soal, jenis);
      return r && r.hasil === +kunci ? r : null;
    }
    if (/^-?\d+$/.test(kunci)) {                                      // bilangan bulat
      const tok = bacaUngkapan(soal, (t) => { const v = bacaBulat(t); return v === null ? null : { v }; });
      if (!tok) return null;
      const t = tok.map((x) => typeof x === "string" ? x : x.v);
      const r = t.length === 3 ? bulatDua(t[0], t[1], t[2], jenis) : gabungan(t, jenis);
      return r && r.hasil === +kunci ? r : null;
    }
    return null;
  }

  /* HTML pembahasan: daftar langkah + cara bersusun. */
  function bahasHtml(b) {
    if (!b) return "";
    let no = 0;
    const li = b.langkah.map((x) => {
      if (x.anak) return `<li class="bh-anak${x.p ? " bh-sorot" : ""}">${x.h}${x.p ? ' <span class="bh-tanda">← perhatikan</span>' : ""}</li>`;
      no++;
      return `<li${x.p ? ' class="bh-sorot"' : ""}><span class="bh-no">${no}</span><span class="bh-isi">${x.h}${x.p ? ' <span class="bh-tanda">← perhatikan</span>' : ""}</span></li>`;
    }).join("");
    return `<div class="bahas">${b.susun ? `<div class="bh-susun">${b.susun}</div>` : ""}<ol class="bh-langkah">${li}</ol></div>`;
  }

  return { bahasSoal, bahasHtml };
})();
const bahasSoal = BahasMatdas.bahasSoal, bahasHtml = BahasMatdas.bahasHtml;
if (typeof module !== "undefined") module.exports = BahasMatdas;
