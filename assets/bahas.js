/* Matdas — pembahasan langkah demi langkah (19 Okt 2026).
   Disusun di peramban dari teks soal + kunci yang SUDAH dikirim server sesudah siswa menjawab
   (tidak ada kunci baru yang bocor). Hanya ditampilkan di latihan mandiri dan "Tinjau kesalahanku";
   sesi kelompok tidak menampilkannya.

   bahasSoal({ soal, kunci, jenis }) → { langkah: [{ h, p }], susun } atau null.
     h = HTML satu langkah, p = langkah yang berkaitan dengan jenis kesalahan siswa (disorot),
     susun = HTML cara bersusun (boleh kosong).
   Hasil hitungan pembahasan selalu dicocokkan dengan kunci server; bila berbeda (atau bentuk soal
   belum dikenali, mis. MD12) hasilnya null dan tidak ada pembahasan yang tampil.
   Cakupan saat ini: MD10 — bilangan bulat (+ − × ÷, positif-negatif), pembagian bersisa,
   operasi gabungan, pecahan, gabungan pecahan, bilangan yang hilang; MD11 — desimal, gabungan desimal,
   campuran desimal/pecahan/persen, mengurutkan, persentase dalam kehidupan, notasi baku & eksponen.
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

  /* ============================================================ MD11 (20 Okt 2026)
     Desimal (+ − × ÷), gabungan desimal, campuran desimal/pecahan/persen, mengurutkan bilangan,
     persentase dalam kehidupan, notasi baku & eksponen. Hitungan memakai pecahan p/q persis. */
  const aman = (...v) => v.every((x) => Number.isSafeInteger(x));
  const pangkat10 = (k) => 10 ** k;
  // "8251,56" / "275" / "-3,5" → {p, q, k} (k = banyak angka di belakang koma); "4.931.000" (titik ribuan) juga
  function bacaDes(t) {
    const m = String(t).replace(/−/g, "-").match(/^(-)?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?$/);
    if (!m) return null;
    const bulat = m[2].replace(/\./g, ""), ek = m[3] || "", k = ek.length;
    const p = (m[1] ? -1 : 1) * Number(bulat + ek);
    return aman(p) ? { p, q: pangkat10(k), k } : null;
  }
  // p/q → teks desimal "1,605" (null bila tidak berhenti atau > 8 angka di belakang koma)
  function desTeks(p, q, minK = 0) {
    const r = Q(p, q);
    let k = 0;
    while (k <= 8 && (r.p * pangkat10(k)) % r.q !== 0) k++;
    if (k > 8) return null;
    k = Math.max(k, minK);
    const n = Math.abs(r.p) * pangkat10(k) / r.q;
    if (!aman(n)) return null;
    let s = String(n);
    if (k > 0) { s = s.padStart(k + 1, "0"); s = s.slice(0, -k) + "," + s.slice(-k); }
    return (r.p < 0 && n !== 0 ? "-" : "") + s;
  }
  const D = (p, q, minK) => N(desTeks(p, q, minK));
  const sup = (e) => `<sup>${e < 0 ? "−" + -e : e}</sup>`;
  const angkaBelakang = (k) => `${k} angka di belakang koma`;
  // Kunci server → pecahan (desimal, bulat, atau p/q)
  function bacaKunci(k) {
    let m = String(k).match(/^(-?\d+)\/(\d+)$/);
    if (m) return Q(+m[1], +m[2]);
    const d = bacaDes(k);
    return d ? Q(d.p, d.q) : null;
  }
  const samaQ = (a, b) => a && b && a.p === b.p && a.q === b.q;
  // Operasi pecahan persis
  function hitungQ(a, o, b) {
    if (o === "+") return Q(a.p * b.q + b.p * a.q, a.q * b.q);
    if (o === "−") return Q(a.p * b.q - b.p * a.q, a.q * b.q);
    if (o === "×") return Q(a.p * b.p, a.q * b.q);
    if (!b.p) return null;
    return Q(a.p * b.q, a.q * b.p);
  }

  /* Desimal + dan −: samakan banyak angka di belakang koma, susun koma lurus. */
  function desimalTambahKurang(ta, o, tb, jenis) {
    const x = bacaDes(ta), y = bacaDes(tb);
    const k = Math.max(x.k, y.k), L = [];
    const isi = (t, d) => d.k === k ? t : (d.k ? t : t + ",") + "0".repeat(k - d.k);
    const sa = isi(ta, x), sb = isi(tb, y);
    if (x.k !== y.k) L.push({ h: `Samakan banyak angka di belakang koma dengan menambah 0 di ujung: ${[[ta, sa], [tb, sb]].filter(([a, b]) => a !== b).map(([a, b]) => `${N(a)} → ${N(b)}`).join("; ")}`, p: jenis === "koma" });
    L.push({ h: `Susun dengan koma lurus di bawah koma, lalu ${o === "+" ? "jumlahkan" : "kurangkan"} seperti bilangan bulat.`, p: jenis === "koma" });
    const A = x.p * pangkat10(k - x.k), B = y.p * pangkat10(k - y.k), R = o === "+" ? A + B : A - B;
    if (R < 0) return null;
    L.push({ h: `Tanpa koma: ${N(A)}${op(o)}${N(B)}${sama}${N(R)}` });
    const sr = desTeks(R, pangkat10(k), k);
    L.push({ h: `Pasang koma lurus dengan koma di atasnya (${angkaBelakang(k)}): ${N(sr)}`, p: jenis === "koma" });
    const hasil = Q(R, pangkat10(k));
    const akhir = desTeks(hasil.p, hasil.q);
    L.push({ h: `Jadi ${N(ta)}${op(o)}${N(tb)}${sama}${N(akhir)}${akhir !== sr ? " (angka 0 di ujung belakang koma boleh dihapus)" : ""}` });
    return { langkah: L, susun: susunHtml([["", sa], [o, sb], ["", sr]], [1]), hasil };
  }

  /* Desimal ×: kalikan tanpa koma, lalu pasang koma sebanyak jumlah angka di belakang koma. */
  function desimalKali(ta, tb, jenis) {
    const x = bacaDes(ta), y = bacaDes(tb), L = [];
    const A = Math.abs(x.p), B = Math.abs(y.p), R = A * B, k = x.k + y.k;
    if (!aman(R)) return null;
    L.push({ h: `Kalikan dulu tanpa koma: ${N(A)} × ${N(B)} = ${N(R)}` });
    L.push({ h: `Hitung angka di belakang koma: ${N(ta)} punya ${x.k}, ${N(tb)} punya ${y.k}, jumlahnya ${k}.`, p: jenis === "koma" });
    const sr = desTeks(R, pangkat10(k), k), hasil = Q(R, pangkat10(k)), akhir = desTeks(hasil.p, hasil.q);
    L.push({ h: `Pasang koma ${k} angka dari kanan: ${N(R)} → ${N(sr)}${akhir !== sr ? ` = ${N(akhir)}` : ""}`, p: jenis === "koma" });
    L.push({ h: `Jadi ${N(ta)} × ${N(tb)}${sama}${N(akhir)}` });
    const besar = Math.max(A, B), kecil = Math.min(A, B);             // bilangan yang lebih besar di atas
    const susun = String(besar).length <= 5 && String(kecil).length <= 3 ? kaliBersusun(besar, kecil, "").susun : "";
    return { langkah: L, susun, hasil };
  }

  /* Desimal ÷: pembagi dijadikan bilangan bulat (koma keduanya digeser sama banyak), lalu bagi. */
  function desimalBagi(ta, tb, jenis) {
    const x = bacaDes(ta), y = bacaDes(tb), L = [];
    if (!y.p) return null;
    const hasil = Q(x.p * y.q, x.q * y.p);
    let tx = ta;
    if (y.k > 0) {
      const xs = Q(x.p * y.q, x.q);                                    // yang dibagi × 10^k
      tx = desTeks(xs.p, xs.q);
      L.push({ h: `Jadikan pembagi bilangan bulat: geser koma ${N(tb)} ${y.k} tempat ke kanan menjadi ${N(Math.abs(y.p))}. Koma ${N(ta)} juga digeser ${y.k} tempat ke kanan menjadi ${N(tx)}.`, p: jenis === "koma" });
      L.push({ h: `Soalnya menjadi ${N(tx)} ÷ ${N(Math.abs(y.p))}` });
    }
    const xd = bacaDes(tx), M = Math.abs(y.p);
    // angka di belakang koma yang dipakai: cukup supaya pembagiannya habis
    let k = xd.k;
    while (k <= 8 && (Math.abs(xd.p) * pangkat10(k - xd.k)) % M !== 0) k++;
    if (k > 8) return null;
    const Nn = Math.abs(xd.p) * pangkat10(k - xd.k), qInt = Nn / M;
    if (k > xd.k) L.push({ h: `Tambahkan 0 di belakang koma supaya pembagiannya habis: ${N(tx)} = ${N(desTeks(Nn, pangkat10(k), k))}` });
    L.push({ h: `Bagi tanpa koma: ${N(Nn)} ÷ ${N(M)} = ${N(qInt)}` });
    if (Nn < 1e6) bagiBersusun(Nn, M, "").langkah.forEach((s) => L.push({ h: s.h, anak: true }));
    const sr = desTeks(qInt, pangkat10(k), k), akhir = desTeks(hasil.p, hasil.q);
    if (k > 0) L.push({ h: `Yang dibagi punya ${angkaBelakang(k)}, jadi hasilnya juga ${angkaBelakang(k)}: ${N(sr)}${akhir !== sr ? ` = ${N(akhir)}` : ""}`, p: jenis === "koma" });
    L.push({ h: `Periksa: ${N(akhir)} × ${N(tb)} = ${N(ta)} ✓` });
    L.push({ h: `Jadi ${N(ta)} ÷ ${N(tb)}${sama}${N(akhir)}` });
    return { langkah: L, susun: "", hasil };
  }

  /* Gabungan desimal: × ÷ dulu dari kiri, lalu + − dari kiri. */
  function gabunganDesimal(tok, jenis) {
    const L = [{ h: "Kerjakan × dan ÷ lebih dulu dari kiri ke kanan, baru + dan − dari kiri ke kanan.", p: jenis === "urutan" }];
    let t = tok.map((x) => typeof x === "string" ? x : Q(x.p, x.q));
    // Hasil antara yang desimalnya tidak berhenti (55,7 ÷ 1,5) ditulis sebagai pecahan supaya tetap tepat.
    const Dx = (x) => desTeks(x.p, x.q) !== null ? D(x.p, x.q) : P(x.p, x.q);
    const tulis = (t) => t.map((x) => typeof x === "string" ? op(x).trim() : Dx(x)).join(" ");
    for (const tahap of [["×", "÷"], ["+", "−"]]) {
      for (;;) {
        const i = t.findIndex((x, k) => k % 2 === 1 && tahap.includes(x));
        if (i < 0) break;
        const a = t[i - 1], o = t[i], b = t[i + 1], r = hitungQ(a, o, b);
        if (!r) return null;
        t = t.slice(0, i - 1).concat([r], t.slice(i + 2));
        const pec = desTeks(r.p, r.q) === null ? " (desimalnya tidak berhenti, jadi ditulis sebagai pecahan dulu supaya tetap tepat)" : "";
        L.push({ h: `${Dx(a)}${op(o)}${Dx(b)}${sama}${Dx(r)}${pec}${t.length > 1 ? ` → ${tulis(t)}` : ""}` });
      }
    }
    if (desTeks(t[0].p, t[0].q) === null) return null;
    L.push({ h: `Jadi hasilnya ${D(t[0].p, t[0].q)}` });
    return { langkah: L, susun: "", hasil: t[0] };
  }

  /* Satu bilangan campuran: desimal "1,98", persen "145%", pecahan "3/8" atau "1_1/2". */
  function bacaCampuran(t) {
    let m = t.match(/^(\d+(?:,\d+)?)%$/);
    if (m) { const d = bacaDes(m[1]); return { jenis: "persen", t, ...Q(d.p, d.q * 100), ps: m[1] }; }
    const f = bacaPec(t);
    if (f) return { jenis: "pecahan", t, ...Q(f.p, f.q), f };
    const d = bacaDes(t);
    return d ? { jenis: "desimal", t, ...Q(d.p, d.q) } : null;
  }
  const htmlCampuran = (x) => x.jenis === "pecahan" ? campHtml(x.f) : x.jenis === "persen" ? `${N(x.ps)}%` : N(x.t);
  /* Pecahan berpenyebut 2, 4, 5, 8 → desimal lewat penyebut 10, 100, 1000. */
  function pecahanKeDesimal(x) {
    const f = x.f, d = f.d, kali = { 2: 5, 4: 25, 5: 2, 8: 125 }[d];
    const ke = d * kali, des = desTeks(x.p, x.q);
    if (!kali) return `${campHtml(f)}${sama}${N(des)}`;
    const w = f.w ? `${N(f.w)} + ` : "";
    return `${f.w ? `${campHtml(f)}${sama}` : ""}${w}${P(f.n, d)}${sama}${w}${pecHtml("", `${f.n} × ${kali}`, `${d} × ${kali}`)}${sama}${w}${pecHtml("", f.n * kali, ke)}${sama}${N(des)}`;
  }
  function campuran(tok, jenis) {
    const [a, o, b] = tok, L = [];
    const ubah = (x) => x.jenis === "persen"
      ? { h: `Ubah persen ke desimal (bagi 100): ${N(x.ps)}%${sama}${pecHtml("", x.ps, 100)}${sama}${D(x.p, x.q)}`, p: jenis === "persen" }
      : { h: `Ubah pecahan ke desimal: ${pecahanKeDesimal(x)}` };
    if (o === "÷" && b.jenis === "pecahan") {
      if (a.jenis !== "desimal") L.push(ubah(a));
      L.push({ h: `Membagi dengan pecahan sama dengan mengalikan dengan kebalikannya: ${D(a.p, a.q)} ÷ ${P(b.p, b.q)}${sama}${D(a.p, a.q)} × ${P(b.q, b.p)}`, p: jenis === "balik" });
      const kali = Q(a.p * b.q, a.q), hasil = Q(kali.p, kali.q * b.p);
      if (b.p === 1) L.push({ h: `${D(a.p, a.q)} × ${N(b.q)}${sama}${D(hasil.p, hasil.q)}` });
      else {
        L.push({ h: `${D(a.p, a.q)} × ${N(b.q)}${sama}${D(kali.p, kali.q)}` });
        L.push({ h: `${D(kali.p, kali.q)} ÷ ${N(b.p)}${sama}${D(hasil.p, hasil.q)}` });
      }
      L.push({ h: `Jadi hasilnya ${D(hasil.p, hasil.q)}` });
      return { langkah: L, susun: "", hasil };
    }
    L.push({ h: "Ubah semua bilangan ke bentuk desimal dulu, baru dihitung." });
    [a, b].filter((x) => x.jenis !== "desimal").forEach((x) => L.push(ubah(x)));
    const hasil = hitungQ(a, o, b);
    if (!hasil || hasil.p < 0) return null;
    L.push({ h: `${D(a.p, a.q)}${op(o)}${D(b.p, b.q)}${sama}${D(hasil.p, hasil.q)}` });
    L.push({ h: `Jadi hasilnya ${D(hasil.p, hasil.q)}` });
    return { langkah: L, susun: "", hasil };
  }

  /* Mengurutkan: ubah semua ke desimal, lalu bandingkan. */
  function urutkan(soal, kunci, jenis) {
    const m = soal.match(/^Urutkan dari yang (terkecil|terbesar): (.*)$/);
    if (!m) return null;
    const besar = m[1] === "terbesar", item = m[2].split(" | ").map((t) => ({ t, x: bacaCampuran(t) }));
    if (item.some((i) => !i.x)) return null;
    const L = [{ h: "Ubah semua bilangan ke bentuk desimal supaya mudah dibandingkan." }];
    item.forEach((i) => {
      if (i.x.jenis === "persen") L.push({ h: `${N(i.x.ps)}%${sama}${pecHtml("", i.x.ps, 100)}${sama}${D(i.x.p, i.x.q)}`, p: jenis === "persen" });
      else if (i.x.jenis === "pecahan") L.push({ h: pecahanKeDesimal(i.x) });
    });
    const urut = item.slice().sort((u, v) => (besar ? -1 : 1) * (u.x.p * v.x.q - v.x.p * u.x.q));
    if (urut.map((i) => i.t).join("|") !== kunci) return null;
    L.push({ h: `Diminta dari yang <b>${m[1]}</b>, jadi mulai dari nilai paling ${besar ? "besar" : "kecil"}: ${urut.map((i) => D(i.x.p, i.x.q)).join(besar ? " &gt; " : " &lt; ")}`, p: jenis === "terbalik" });
    L.push({ h: `Kembalikan ke bentuk semula: ${urut.map((i) => htmlCampuran(i.x)).join(" ; ")}` });
    return { langkah: L, susun: "", hasil: true };
  }

  /* Persentase dalam kehidupan (soal cerita K11-08). */
  const rp = (v) => `<span class="nm">Rp${String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</span>`;
  const bacaRp = (t) => Number(String(t).replace(/^Rp/, "").replace(/,00$/, "").replace(/\./g, ""));
  const bacaRibu = (t) => Number(String(t).replace(/\./g, ""));
  function persenCerita(soal, kunci, jenis) {
    const RP = "(Rp[\\d.]+,00)", L = [], k = Number(kunci);
    const persenDari = (d, h, uang) => { const v = h * d / 100; L.push({ h: `${d}% dari ${uang ? rp(h) : N(h)}${sama}${pecHtml("", d, 100)} × ${uang ? rp(h) : N(h)}${sama}${uang ? rp(v) : N(v)}` }); return v; };
    const persenBagian = (s, h, uang, sebut) => {
      const v = s * 100 / h;
      L.push({ h: `Persen ${sebut}${sama}${pecHtml("", uang ? rp(s) : N(s), uang ? rp(h) : N(h))} × 100%${sama}${N(v)}%` });
      return v;
    };
    let m, hasil;
    if ((m = soal.match(new RegExp(`berharga ${RP} mendapat diskon (\\d+)%, kemudian mendapat diskon lagi (\\d+)%`)))) {
      const h = bacaRp(m[1]), d = +m[2], d2 = +m[3];
      L.push({ h: "Diskon pertama:" });
      const p1 = persenDari(d, h, true), h1 = h - p1;
      L.push({ h: `Harga setelah diskon pertama${sama}${rp(h)} − ${rp(p1)}${sama}${rp(h1)}` });
      L.push({ h: `Diskon kedua dihitung dari harga setelah diskon pertama (bukan dari harga awal, dan bukan ${d + d2}%):`, p: !!jenis });
      const p2 = persenDari(d2, h1, true);
      hasil = h1 - p2;
      L.push({ h: `Harga yang dibayar${sama}${rp(h1)} − ${rp(p2)}${sama}${rp(hasil)}` });
    } else if ((m = soal.match(new RegExp(`berharga ${RP} mendapat diskon (\\d+)%\\. Berapa (harga yang harus dibayar|besar potongan harganya)`)))) {
      const h = bacaRp(m[1]), d = +m[2];
      L.push({ h: "Hitung besar potongan (diskon):" });
      const pot = persenDari(d, h, true);
      hasil = pot;
      if (m[3].startsWith("harga")) { hasil = h - pot; L.push({ h: `Harga yang dibayar${sama}harga awal − potongan${sama}${rp(h)} − ${rp(pot)}${sama}${rp(hasil)}` }); }
    } else if ((m = soal.match(new RegExp(`seharga ${RP} lalu menjualnya ${RP}\\. Berapa persen (keuntungan|kerugian)`)))) {
      const h = bacaRp(m[1]), j = bacaRp(m[2]), untung = m[3] === "keuntungan", s = Math.abs(j - h);
      L.push({ h: `${untung ? "Untung" : "Rugi"}${sama}${untung ? `harga jual − harga beli${sama}${rp(j)} − ${rp(h)}` : `harga beli − harga jual${sama}${rp(h)} − ${rp(j)}`}${sama}${rp(s)}` });
      L.push({ h: "Persen untung/rugi selalu dibandingkan dengan harga beli:" });
      hasil = persenBagian(s, h, true, untung ? "keuntungan" : "kerugian");
    } else if ((m = soal.match(new RegExp(`seharga ${RP} lalu menjualnya dengan (keuntungan|kerugian) (\\d+)%\\. Berapa harga jualnya`)))) {
      const h = bacaRp(m[1]), untung = m[2] === "keuntungan", d = +m[3];
      L.push({ h: `Hitung besar ${untung ? "keuntungan" : "kerugian"} dari harga beli:` });
      const s = persenDari(d, h, true);
      hasil = untung ? h + s : h - s;
      L.push({ h: `Harga jual${sama}${rp(h)} ${untung ? "+" : "−"} ${rp(s)}${sama}${rp(hasil)}` });
    } else if ((m = soal.match(new RegExp(`restoran ${RP} dan dikenai pajak restoran (\\d+)%`)))) {
      const h = bacaRp(m[1]), d = +m[2];
      L.push({ h: "Hitung besar pajak:" });
      const pj = persenDari(d, h, true);
      hasil = h + pj;
      L.push({ h: `Total yang dibayar${sama}harga + pajak${sama}${rp(h)} + ${rp(pj)}${sama}${rp(hasil)}` });
    } else if ((m = soal.match(new RegExp(`sebesar ${RP}\\. Ia memberi tip (\\d+)% dari tagihan`)))) {
      L.push({ h: "Hitung besar tip:" });
      hasil = persenDari(+m[2], bacaRp(m[1]), true);
    } else if ((m = soal.match(/(meningkat|turun) dari (\d+) menjadi (\d+)\. Berapa persen/))) {
      const n = +m[2], b = +m[3], naik = m[1] === "meningkat", s = Math.abs(b - n);
      L.push({ h: `${naik ? "Kenaikan" : "Penurunan"}${sama}${naik ? `${N(b)} − ${N(n)}` : `${N(n)} − ${N(b)}`}${sama}${N(s)}` });
      L.push({ h: `Persen ${naik ? "kenaikan" : "penurunan"} dibandingkan dengan nilai awal (${N(n)}), bukan nilai akhir:`, p: !!jenis });
      hasil = persenBagian(s, n, false, naik ? "kenaikan" : "penurunan");
    } else if ((m = soal.match(/^Dari (\d+) siswa, (\d+) siswa .*Berapa persen/))) {
      L.push({ h: "Bandingkan banyak siswa yang mengikuti dengan seluruh siswa:" });
      hasil = persenBagian(+m[2], +m[1], false, "siswa");
    } else if ((m = soal.match(/menargetkan produksi ([\d.]+) .*hanya menghasilkan ([\d.]+) /))) {
      L.push({ h: "Bandingkan hasil produksi dengan targetnya:" });
      hasil = persenBagian(bacaRibu(m[2]), bacaRibu(m[1]), false, "target tercapai");
    } else if ((m = soal.match(new RegExp(`menyisihkan ${RP} dari gaji ${RP}`)))) {
      L.push({ h: "Bandingkan tabungan dengan gaji:" });
      hasil = persenBagian(bacaRp(m[1]), bacaRp(m[2]), true, "gaji yang ditabung");
    } else return null;
    if (hasil !== k) return null;
    const persen = /Berapa persen/.test(soal);
    L.push({ h: `Jadi jawabannya ${persen ? `${N(k)}%` : rp(k)}` });
    return { langkah: L, susun: "", hasil: k };
  }

  /* Notasi baku (K11-09 level 1–2): kunci "a;n". */
  function notasiBaku(soal, kunci, jenis) {
    const v = bacaDes(soal), km = kunci.match(/^(\d(?:,\d+)?);(-?\d+)$/);
    if (!v || !km || v.p <= 0) return null;
    const a = bacaDes(km[1]), n = +km[2];
    const nilaiKunci = n >= 0 ? Q(a.p * pangkat10(n), a.q) : Q(a.p, a.q * pangkat10(-n));
    if (!samaQ(nilaiKunci, Q(v.p, v.q))) return null;
    const L = [{ h: `Notasi baku berbentuk a × 10${sup("n")} dengan 1 ≤ a &lt; 10: di depan koma hanya ada <b>satu</b> angka bukan nol.`, p: jenis === "bukan_baku" }];
    const ta = km[1];
    if (n >= 0) {
      L.push({ h: `Letakkan koma sesudah angka pertama: ${N(soal)} → ${N(ta)}${ta.includes(",") ? " (angka 0 di ujung dibuang)" : ""}` });
      L.push({ h: `Koma bergeser ${n} tempat ke kiri, jadi pangkat 10-nya ${n} (bilangan besar → pangkat positif).`, p: jenis === "pangkat" || jenis === "tanda" });
    } else {
      L.push({ h: `Geser koma ke kanan sampai di depannya ada satu angka bukan nol: ${N(soal)} → ${N(ta)}` });
      L.push({ h: `Koma bergeser ${-n} tempat ke kanan, jadi pangkat 10-nya −${-n} (bilangan kurang dari 1 → pangkat negatif).`, p: jenis === "pangkat" || jenis === "tanda" });
    }
    L.push({ h: `Jadi ${N(soal)}${sama}${N(ta)} × 10${sup(n)}` });
    return { langkah: L, susun: "", hasil: true };
  }

  /* Eksponen (K11-09 level 3–5). Teks memakai pangkat ⁰¹²…⁻ yang diubah ke ^n. */
  const SUP = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-" };
  const kaliBerulang = (b, e) => e === 1 ? N(b) : Array(e).fill(b).join(" × ");
  function eksponen(soal, kunci) {
    const s = soal.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (x) => "^" + [...x].map((c) => SUP[c]).join(""));
    const k = bacaKunci(kunci), L = [];
    const pkt = (b, e) => `${N(b)}${sup(e)}`;
    const hitung = (b, e) => {                                       // langkah b^e → {p, q}
      if (e === 0) { L.push({ h: `${pkt(b, 0)} = 1 (setiap bilangan bukan nol pangkat 0 hasilnya 1)` }); return Q(1, 1); }
      if (e < 0) {
        const v = b ** -e;
        L.push({ h: `Pangkat negatif artinya kebalikan: ${pkt(b, e)}${sama}${pecHtml("", 1, `${b}${sup(-e)}`)}${sama}${pecHtml("", 1, `${kaliBerulang(b, -e)}`)}${sama}${P(1, v)}` });
        return Q(1, v);
      }
      const v = b ** e;
      L.push({ h: `${pkt(b, e)}${sama}${kaliBerulang(b, e)}${sama}${N(v)}` });
      return Q(v, 1);
    };
    let m, hasil;
    if ((m = s.match(/^(\d+(?:,\d+)?) ([×÷]) 10\^(\d+)$/))) {          // a × 10ⁿ, a ÷ 10ⁿ
      const a = bacaDes(m[1]), n = +m[3], kali = m[2] === "×";
      hasil = kali ? Q(a.p * pangkat10(n), a.q) : Q(a.p, a.q * pangkat10(n));
      L.push({ h: `${kali ? "Dikali" : "Dibagi"} 10${sup(n)} artinya koma digeser ${n} tempat ke ${kali ? "kanan" : "kiri"}${kali ? " (tambahkan 0 bila angkanya kurang)" : " (tambahkan 0 di depan bila angkanya kurang)"}.` });
      L.push({ h: `${N(m[1])} ${m[2]} 10${sup(n)}${sama}${D(hasil.p, hasil.q)}` });
    } else if ((m = s.match(/^(\d+)\^(\d+) ([×÷]) (\d+)\^(\d+)$/)) && m[1] === m[4]) {
      const b = +m[1], e = m[3] === "×" ? +m[2] + +m[5] : +m[2] - +m[5];
      L.push({ h: m[3] === "×" ? `Bilangan pokok sama, dikali → pangkatnya dijumlahkan: ${pkt(b, +m[2])} × ${pkt(b, +m[5])}${sama}${N(b)}<sup>${m[2]} + ${m[5]}</sup>${sama}${pkt(b, e)}`
        : `Bilangan pokok sama, dibagi → pangkatnya dikurangkan: ${pkt(b, +m[2])} ÷ ${pkt(b, +m[5])}${sama}${N(b)}<sup>${m[2]} − ${m[5]}</sup>${sama}${pkt(b, e)}` });
      hasil = hitung(b, e);
    } else if ((m = s.match(/^\((\d+)\^(\d+)\)\^(\d+)$/))) {
      const b = +m[1], e = +m[2] * +m[3];
      L.push({ h: `Pangkat dipangkatkan → pangkatnya dikalikan: (${pkt(b, +m[2])})${sup(+m[3])}${sama}${N(b)}<sup>${m[2]} × ${m[3]}</sup>${sama}${pkt(b, e)}` });
      hasil = hitung(b, e);
    } else if ((m = s.match(/^(\d+)\^0 \+ (\d+)\^(\d+)$/))) {
      const a = hitung(+m[1], 0), c = hitung(+m[2], +m[3]);
      hasil = Q(a.p + c.p, 1);
      L.push({ h: `${N(1)} + ${N(c.p)}${sama}${N(hasil.p)}` });
    } else if ((m = s.match(/^(\d+)\^(-\d+)$/))) {
      hasil = hitung(+m[1], +m[2]);
    } else if ((m = s.match(/^\((\d+)\/(\d+)\)\^(\d+)$/))) {
      const c = +m[1], b = +m[2], n = +m[3];
      hasil = Q(c ** n, b ** n);
      L.push({ h: `Pecahan dipangkatkan → pembilang dan penyebut masing-masing dipangkatkan: (${P(c, b)})${sup(n)}${sama}${pecHtml("", `${c}${sup(n)}`, `${b}${sup(n)}`)}${sama}${pecHtml("", kaliBerulang(c, n), kaliBerulang(b, n))}${sama}${P(hasil.p, hasil.q)}` });
    } else if ((m = s.match(/^(\d+)\^(\d+) × (\d+)\^(\d+) ÷ (\d+)\^(\d+)$/)) && m[1] === m[3] && m[1] === m[5]) {
      const b = +m[1], e = +m[2] + +m[4] - +m[6];
      L.push({ h: `Bilangan pokok sama: × → pangkat dijumlah, ÷ → pangkat dikurangi: ${N(b)}<sup>${m[2]} + ${m[4]} − ${m[6]}</sup>${sama}${pkt(b, e)}` });
      hasil = hitung(b, e);
    } else return null;
    if (!samaQ(hasil, k)) return null;
    const dk = desTeks(hasil.p, hasil.q);
    L.push({ h: `Jadi hasilnya ${hasil.q === 1 ? N(hasil.p) : !kunci.includes("/") && dk ? N(dk) : `${P(hasil.p, hasil.q)}${dk && dk.length <= 8 ? ` = ${N(dk)}` : ""}`}` });
    return { langkah: L, susun: "", hasil };
  }

  /* Pintu MD11: undefined = bukan bentuk MD11 (lanjut ke MD10), null = MD11 tetapi tidak bisa dibahas. */
  function susunMD11(soal, kunci, jenis) {
    if (soal.includes(" ¶ ")) return undefined;
    if (/^Urutkan dari yang /.test(soal)) return urutkan(soal, kunci, jenis);
    if (/[A-Za-z]{3,}/.test(soal)) return /%|persen/.test(soal) && /^\d+$/.test(kunci) ? persenCerita(soal, kunci, jenis) : undefined;
    if (/^\d(?:,\d+)?;-?\d+$/.test(kunci) && /^[\d.,]+$/.test(soal)) return notasiBaku(soal, kunci, jenis);
    if (/[⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(soal)) return eksponen(soal, kunci);
    if (!/[,%]/.test(soal)) return undefined;
    const k = bacaKunci(kunci);
    if (!k) return null;
    const t = soal.split(" ");
    if (t.length < 3 || t.length % 2 === 0) return null;
    const ops = t.filter((x, i) => i % 2), bil2 = t.filter((x, i) => i % 2 === 0);
    if (!ops.every((o) => /^[+−×÷]$/.test(o))) return null;
    let r;
    if (bil2.every((x) => bacaDes(x))) {
      if (t.length === 3) r = ops[0] === "×" ? desimalKali(t[0], t[2], jenis) : ops[0] === "÷" ? desimalBagi(t[0], t[2], jenis) : desimalTambahKurang(t[0], ops[0], t[2], jenis);
      else r = gabunganDesimal(bacaUngkapan(soal, bacaDes), jenis);
    } else if (t.length === 3) {
      const a = bacaCampuran(t[0]), b = bacaCampuran(t[2]);
      if (!a || !b) return null;
      r = campuran([a, ops[0], b], jenis);
    } else return null;
    return r && samaQ(Q(r.hasil.p, r.hasil.q), k) ? r : null;
  }

  /* ------------------------------------------------------------ pintu masuk */
  function bahasSoal(o) {
    try { return susun(o); } catch (e) { return null; }
  }
  function susun(o) {
    const soal = String(o.soal || "").trim(), kunci = String(o.kunci == null ? "" : o.kunci).trim(), jenis = o.jenis || "";
    if (!soal || !kunci) return null;
    const md11 = susunMD11(soal, kunci, jenis);
    if (md11 !== undefined) return md11;
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
