/* Matdas — pembahasan langkah demi langkah (19 Okt 2026).
   Disusun di peramban dari teks soal + kunci yang SUDAH dikirim server sesudah siswa menjawab
   (tidak ada kunci baru yang bocor). Hanya ditampilkan di latihan mandiri dan "Tinjau kesalahanku";
   sesi kelompok tidak menampilkannya.

   bahasSoal({ soal, kunci, jenis }) → { langkah: [{ h, p }], susun } atau null.
     h = HTML satu langkah, p = langkah yang berkaitan dengan jenis kesalahan siswa (disorot),
     susun = HTML cara bersusun (boleh kosong).
   Hasil hitungan pembahasan selalu dicocokkan dengan kunci server; bila berbeda (atau bentuk soal
   belum dikenali) hasilnya null dan tidak ada pembahasan yang tampil.
   Cakupan saat ini: MD10 — bilangan bulat (+ − × ÷, positif-negatif), pembagian bersisa,
   operasi gabungan, pecahan, gabungan pecahan, bilangan yang hilang; MD11 — desimal, gabungan desimal,
   campuran desimal/pecahan/persen, mengurutkan, persentase dalam kehidupan, notasi baku & eksponen;
   MD12 — persamaan linear satu variabel, SPLDV, soal cerita SPLDV, pola bilangan, penarikan kesimpulan.
   o.jawaban (pilihan siswa) dipakai untuk menjelaskan pilihan yang keliru pada penarikan kesimpulan.
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
    if (/[<>&"]/.test(soal)) return null;                         // teks soal ditulis apa adanya ke HTML
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
  function eksponen(soal, kunci, jenis) {
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
      // Angka yang dilewati koma, dan banyak 0 yang perlu ditambahkan
      const [ip, fp = ""] = m[1].split(",");
      const lewat = kali ? (fp + "0".repeat(n)).slice(0, n) : ip.padStart(n, "0").slice(-n);
      const nol0 = Math.max(0, kali ? n - fp.length : n - ip.length);
      L.push({ h: `${kali ? "Dikali" : "Dibagi"} 10${sup(n)} artinya koma digeser <b>${n} tempat ke ${kali ? "kanan" : "kiri"}</b> (${kali ? "bilangannya menjadi lebih besar" : "bilangannya menjadi lebih kecil"}).`, p: jenis === "koma" });
      L.push({ h: `${N(m[1])} → koma melewati angka ${lewat.split("").map((c) => `<b>${c}</b>`).join(" ")}${nol0 ? ` (${nol0} angka 0 ditambahkan ${kali ? "di belakang" : "di depan"})` : ""} → ${D(hasil.p, hasil.q)}`, p: jenis === "koma" });
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
    if (/[⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(soal)) return eksponen(soal, kunci, jenis);
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

  /* ============================================================ MD12 (20 Okt 2026)
     Persamaan linear satu variabel, SPLDV, soal cerita SPLDV, pola bilangan, penarikan kesimpulan. */
  const V = (v) => `<i class="var">${v}</i>`;
  const tambahQ = (a, b) => Q(a.p * b.q + b.p * a.q, a.q * b.q);
  const kaliQ = (a, b) => Q(a.p * b.p, a.q * b.q);
  const negQ = (a) => ({ p: -a.p, q: a.q });
  const nol = { p: 0, q: 1 }, satu = { p: 1, q: 1 };
  const QN = (x) => x.q === 1 ? N(x.p) : P(x.p, x.q);                 // bilangan pecahan/bulat → HTML
  const QNk = (x) => x.p < 0 ? `(${QN(x)})` : QN(x);
  /* Suku a·v + b (a, b pecahan) → HTML "3x − 5", "−x", "(2/3)x + 1". */
  function linHtml(a, b, v) {
    const s = [];
    if (a.p) {
      const abs = { p: Math.abs(a.p), q: a.q }, k = abs.p === 1 && abs.q === 1 ? "" : QN(abs);
      s.push({ neg: a.p < 0, t: `${k}${V(v)}` });
    }
    if (b.p || !s.length) s.push({ neg: b.p < 0, t: QN({ p: Math.abs(b.p), q: b.q }) });
    return s.map((x, i) => i === 0 ? (x.neg ? "−" : "") + x.t : (x.neg ? " − " : " + ") + x.t).join("");
  }
  /* Ruas dua variabel a·x + b·y → HTML */
  function lin2Html(a, b) {
    const s = [];
    [[a, "x"], [b, "y"]].forEach(([k, v]) => { if (k) s.push({ neg: k < 0, t: `${Math.abs(k) === 1 ? "" : N(Math.abs(k))}${V(v)}` }); });
    return s.length ? s.map((x, i) => i === 0 ? (x.neg ? "−" : "") + x.t : (x.neg ? " − " : " + ") + x.t).join("") : N(0);
  }
  const persHtml = (e) => `${lin2Html(e.a, e.b)}${sama}${N(e.c)}`;

  /* Ruas persamaan satu variabel: "3(x − 4) + 2x", "1/3 (x + 2) − 4", "2/3 x + 5", "−x". → {a, b, suku: [...]}.
     Setiap suku: {a, b, kurung?: {k, isi}} (sudah termasuk tandanya). */
  function bacaRuas(s, v) {
    let i = 0;
    const sp = () => { while (s[i] === " ") i++; };
    const angka = () => { const m = /^\d+/.exec(s.slice(i)); if (!m) return null; i += m[0].length; return +m[0]; };
    const kaliSuku = (k, t) => ({ a: kaliQ(k, t.a), b: kaliQ(k, t.b), kurung: t.kurung ? { k: kaliQ(k, t.kurung.k), isi: t.kurung.isi } : undefined });
    function suku() {
      sp();
      let k = null;
      const n = angka();
      if (n !== null) { k = Q(n, 1); if (s[i] === "/") { i++; const d = angka(); if (d === null) throw new Error("pecahan"); k = Q(n, d); } }
      sp();
      if (s[i] === "(") {
        i++; const isi = ungkapan(); sp();
        if (s[i] !== ")") throw new Error("kurung"); i++;
        const kk = k || satu;
        return { a: kaliQ(kk, isi.a), b: kaliQ(kk, isi.b), kurung: { k: kk, isi } };
      }
      if (s[i] === v) { i++; return { a: k || satu, b: nol }; }
      if (k === null) throw new Error("suku");
      return { a: nol, b: k };
    }
    function ungkapan() {
      sp();
      let neg = false;
      if (s[i] === "−") { neg = true; i++; }
      let t = suku(); if (neg) t = kaliSuku(negQ(satu), t);
      const daftar = [t];
      for (;;) {
        sp();
        if (s[i] !== "+" && s[i] !== "−") break;
        const o = s[i]; i++;
        let u = suku(); if (o === "−") u = kaliSuku(negQ(satu), u);
        daftar.push(u);
      }
      return { a: daftar.reduce((x, t) => tambahQ(x, t.a), nol), b: daftar.reduce((x, t) => tambahQ(x, t.b), nol), suku: daftar };
    }
    const r = ungkapan(); sp();
    if (i !== s.length) throw new Error("sisa");
    return r;
  }
  const nilaiRuas = (r, x) => tambahQ(kaliQ(r.a, x), r.b);

  /* Persamaan linear satu variabel (K12-01). */
  function plsv(soal, kunci, jenis) {
    const vm = soal.match(/[a-z]/);
    if (!vm || !/^-?\d+$/.test(kunci)) return null;
    const v = vm[0], sisi = soal.split(" = ");
    if (sisi.length !== 2) return null;
    const Lr = bacaRuas(sisi[0], v), Rr = bacaRuas(sisi[1], v), x0 = Q(+kunci, 1), L = [];
    let A = { a: Lr.a, b: Lr.b }, B = { a: Rr.a, b: Rr.b };
    const persSekarang = () => `${linHtml(A.a, A.b, v)}${sama}${linHtml(B.a, B.b, v)}`;
    // 1. Buka kurung
    const kurung = [...Lr.suku, ...Rr.suku].filter((t) => t.kurung);
    if (kurung.length) {
      L.push({ h: `Buka kurung: kalikan bilangan di depan kurung dengan setiap suku di dalamnya. ${kurung.map((t) =>
        `${QNk(t.kurung.k)}(${linHtml(t.kurung.isi.a, t.kurung.isi.b, v)})${sama}${linHtml(t.a, t.b, v)}`).join("; ")}`, p: jenis === "tanda" });
    }
    const gabung = (r) => r.suku.filter((t) => t.a.p).length > 1 || r.suku.filter((t) => !t.a.p && t.b.p).length > 1 || r.suku.some((t) => t.kurung && t.a.p && t.b.p && r.suku.length > 1);
    if (kurung.length || gabung(Lr) || gabung(Rr)) L.push({ h: `Sederhanakan setiap ruas (gabungkan suku sejenis): ${persSekarang()}` });
    // 2. Hilangkan pecahan
    const peny = [A.a, A.b, B.a, B.b].map((x) => x.q);
    const m = peny.reduce((x, y) => kpk(x, y), 1);
    if (m > 1) {
      const kM = Q(m, 1);
      A = { a: kaliQ(A.a, kM), b: kaliQ(A.b, kM) }; B = { a: kaliQ(B.a, kM), b: kaliQ(B.b, kM) };
      L.push({ h: `Hilangkan pecahan: kalikan kedua ruas dengan ${N(m)} (KPK penyebutnya): ${persSekarang()}` });
    }
    // 3. Kumpulkan suku
    const kiriV = tambahQ(A.a, negQ(B.a)), kananB = tambahQ(B.b, negQ(A.b));
    if (!kiriV.p) return null;
    if (B.a.p || A.b.p) {
      const kiri = B.a.p ? `${linHtml(A.a, nol, v)} ${B.a.p > 0 ? "−" : "+"} ${linHtml({ p: Math.abs(B.a.p), q: B.a.q }, nol, v)}` : linHtml(A.a, nol, v);
      const kanan = A.b.p ? `${QN(B.b)} ${A.b.p > 0 ? "−" : "+"} ${QN({ p: Math.abs(A.b.p), q: A.b.q })}` : QN(B.b);
      L.push({ h: `Kumpulkan suku ber-${V(v)} di ruas kiri dan bilangan di ruas kanan. Suku yang pindah ruas berganti tanda: ${kiri}${sama}${kanan}`, p: jenis === "tanda" || jenis === "lain" });
      L.push({ h: `${linHtml(kiriV, nol, v)}${sama}${QN(kananB)}` });
    }
    // 4. Bagi koefisien
    const hasil = Q(kananB.p * kiriV.q, kananB.q * kiriV.p);
    if (!(kiriV.p === 1 && kiriV.q === 1)) L.push({ h: `Bagi kedua ruas dengan ${QNk(kiriV)}: ${V(v)}${sama}${QN(kananB)} ÷ ${QNk(kiriV)}${sama}${QN(hasil)}`, p: jenis === "tanda" });
    if (!samaQ(hasil, x0)) return null;
    const nl = nilaiRuas(Lr, x0), nr = nilaiRuas(Rr, x0);
    if (!samaQ(nl, nr)) return null;
    L.push({ h: `Periksa: ganti ${V(v)} dengan ${QNk(x0)} → ruas kiri ${QN(nl)}, ruas kanan ${QN(nr)} ✓` });
    L.push({ h: `Jadi ${V(v)}${sama}${QN(x0)}` });
    return { langkah: L, susun: "", hasil: true };
  }

  /* Satu persamaan dua variabel "3x − 2y = 7" → {a, b, c}. */
  function bacaPers2(s) {
    const [kiri, kanan] = s.replace(/ =\s*$/, " = 0").split(" = ");   // ruas kanan kosong = 0 (soal lama)
    if (kanan === undefined || !/^−?\d+$/.test(kanan)) return null;
    const e = { a: 0, b: 0, c: +kanan.replace("−", "-") };
    const suku = kiri.replace(/ − /g, " + −").split(" + ");
    for (const t of suku) {
      const m = t.match(/^(−?)(\d*)([xy])$/);
      if (!m) return null;
      e[m[3] === "x" ? "a" : "b"] += (m[1] ? -1 : 1) * (m[2] ? +m[2] : 1);
    }
    return e;
  }
  /* Selesaikan SPLDV dengan eliminasi + substitusi. nama: {x, y} keterangan variabel (soal cerita). */
  function eliminasi(e1, e2, L, jenis) {
    const hilangX = Math.abs(e1.a) === Math.abs(e2.a) && Math.abs(e1.b) !== Math.abs(e2.b);
    const kH = hilangX ? "a" : "b", kT = hilangX ? "b" : "a", vH = hilangX ? "x" : "y", vT = hilangX ? "y" : "x";
    const g = kpk(Math.abs(e1[kH]), Math.abs(e2[kH])), m1 = g / Math.abs(e1[kH]), m2 = g / Math.abs(e2[kH]);
    const k1 = { a: e1.a * m1, b: e1.b * m1, c: e1.c * m1 }, k2 = { a: e2.a * m2, b: e2.b * m2, c: e2.c * m2 };
    L.push({ h: `Eliminasi ${V(vH)} (hilangkan ${V(vH)}): samakan dulu koefisien ${V(vH)}${m1 === 1 && m2 === 1 ? " — keduanya sudah sama besar." : `. Kalikan persamaan (1) dengan ${N(m1)} dan persamaan (2) dengan ${N(m2)}:`}` });
    if (m1 !== 1 || m2 !== 1) { L.push({ h: `(1) × ${N(m1)}: ${persHtml(k1)}`, anak: true }); L.push({ h: `(2) × ${N(m2)}: ${persHtml(k2)}`, anak: true }); }
    const samaTanda = Math.sign(k1[kH]) === Math.sign(k2[kH]);
    const r = samaTanda ? { a: k1.a - k2.a, b: k1.b - k2.b, c: k1.c - k2.c } : { a: k1.a + k2.a, b: k1.b + k2.b, c: k1.c + k2.c };
    L.push({ h: `Koefisien ${V(vH)} ${samaTanda ? "bertanda sama, jadi kedua persamaan <b>dikurangkan</b>" : "berlawanan tanda, jadi kedua persamaan <b>dijumlahkan</b>"}: ${persHtml(r)}` });
    if (!r[kT] || r.c % r[kT]) return null;
    const nT = r.c / r[kT];
    if (r[kT] !== 1) L.push({ h: `${V(vT)}${sama}${N(r.c)} ÷ ${Nk(r[kT])}${sama}${N(nT)}` });
    // substitusi ke persamaan (1) (atau (2) bila koefisien variabel lain di (1) nol)
    const e = e1[kH] ? e1 : e2, no = e1[kH] ? 1 : 2;
    const sisa = e.c - e[kT] * nT;
    if (sisa % e[kH]) return null;
    const nH = sisa / e[kH];
    L.push({ h: `Substitusi ${V(vT)}${sama}${N(nT)} ke persamaan (${no}): ${ganti(e, { [vT]: nT })}${sama}${N(e.c)}` });
    const kv = `${e[kH] === 1 ? "" : e[kH] === -1 ? "−" : N(e[kH])}${V(vH)}`;
    let akhir = "";
    if (e[kH] === -1) akhir = ` → ${V(vH)}${sama}${N(nH)} (kedua ruas dikali −1)`;
    else if (e[kH] !== 1) akhir = ` → ${V(vH)}${sama}${N(sisa)} ÷ ${Nk(e[kH])}${sama}${N(nH)}`;
    L.push({ h: `${kv}${sama}${N(e.c)} ${e[kT] * nT < 0 ? "+" : "−"} ${N(Math.abs(e[kT] * nT))}${sama}${N(sisa)}${akhir}` });
    return hilangX ? { x: nH, y: nT } : { x: nT, y: nH };
  }
  /* Ruas kiri a·x + b·y dengan variabel yang diketahui diganti nilainya: "4(15.000) + 3y", "x − 12", "2 + (−5)". */
  function ganti(e, nilai) {
    const s = [];
    [["a", "x"], ["b", "y"]].forEach(([k, v]) => {
      const c = e[k];
      if (!c) return;
      const ab = Math.abs(c);
      let t;
      if (nilai[v] === undefined) t = `${ab === 1 ? "" : N(ab)}${V(v)}`;
      else t = ab === 1 ? Nk(nilai[v]) : `${N(ab)}(${N(nilai[v])})`;
      s.push({ neg: c < 0, t });
    });
    return s.map((x, i) => i === 0 ? (x.neg ? "−" : "") + x.t.replace(/^\((<span class="nm">−[^<]*<\/span>)\)$/, "$1") : (x.neg ? " − " : " + ") + x.t).join("");
  }
  function substitusi(e1, varSub, k, L) {                          // persamaan (2): y = kx atau x = ky
    const lain = varSub === "y" ? "x" : "y";
    const kSub = varSub === "y" ? e1.b : e1.a, kLain = varSub === "y" ? e1.a : e1.b;
    L.push({ h: `Substitusi persamaan (2) ke persamaan (1): ganti ${V(varSub)} dengan ${k === 1 ? "" : k === -1 ? "−" : N(k)}${V(lain)}.` });
    const koef = kLain + kSub * k;
    L.push({ h: `${lin2Html(varSub === "y" ? e1.a : 0, varSub === "x" ? e1.b : 0).replace(/^0$/, "")}${(varSub === "y" ? e1.a : e1.b) ? " " : ""}${kSub < 0 ? "−" : (varSub === "y" ? e1.a : e1.b) ? "+" : ""} ${Math.abs(kSub) === 1 ? "" : N(Math.abs(kSub))}(${k === 1 ? "" : N(k)}${V(lain)})${sama}${N(e1.c)} → ${koef === 1 ? "" : koef === -1 ? "−" : N(koef)}${V(lain)}${sama}${N(e1.c)}` });
    if (!koef || e1.c % koef) return null;
    const nL = e1.c / koef, nS = k * nL;
    if (koef !== 1) L.push({ h: `${V(lain)}${sama}${N(e1.c)} ÷ ${Nk(koef)}${sama}${N(nL)}` });
    L.push({ h: `Hitung ${V(varSub)} dari persamaan (2): ${V(varSub)}${sama}${N(k)} × ${Nk(nL)}${sama}${N(nS)}` });
    return varSub === "y" ? { x: nL, y: nS } : { x: nS, y: nL };
  }
  function spldv(soal, kunci, jenis) {
    const km = kunci.match(/^(-?\d+);(-?\d+)$/), b = soal.split(" ; ");
    if (!km || b.length !== 2) return null;
    const L = [], e1 = bacaPers2(b[0]);
    if (!e1) return null;
    let hasil;
    const sub = b[1].match(/^([xy]) = (−?)(\d*)([xy])$/);
    L.push({ h: `Beri nomor: (1) ${b[0].includes("=") ? persHtml(e1) : ""}` });
    if (sub) {
      if (sub[1] === sub[4]) return null;
      const k = (sub[2] ? -1 : 1) * (sub[3] ? +sub[3] : 1);
      L[0].h += `; (2) ${V(sub[1])}${sama}${k === 1 ? "" : k === -1 ? "−" : N(k)}${V(sub[4])}`;
      hasil = substitusi(e1, sub[1], k, L);
    } else {
      const e2 = bacaPers2(b[1]);
      if (!e2) return null;
      L[0].h += `; (2) ${persHtml(e2)}`;
      hasil = eliminasi(e1, e2, L, jenis);
      if (hasil) L.push({ h: `Periksa di persamaan (2): ${ganti(e2, hasil)}${sama}${N(e2.a * hasil.x + e2.b * hasil.y)} ✓` });
    }
    if (!hasil || hasil.x !== +km[1] || hasil.y !== +km[2]) return null;
    L.push({ h: `Jadi ${V("x")}${sama}${N(hasil.x)} dan ${V("y")}${sama}${N(hasil.y)}`, p: jenis === "tertukar" || jenis === "sebagian" });
    return { langkah: L, susun: "", hasil: true };
  }

  /* Soal cerita SPLDV (K12-03): harga barang dan umur. */
  const KATA = { satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, delapan: 8, sembilan: 9, sepuluh: 10 };
  const kata = (t) => KATA[String(t).toLowerCase()];
  function ceritaSPLDV(soal, kunci, jenis) {
    if (/[<>&"]/.test(soal)) return null;                         // nama/barang ditulis apa adanya ke HTML
    const L = [], k = Number(kunci), RP = "(Rp[\\d.]+,00)";
    let m, e1, e2, nx, ny, jawab;
    if ((m = soal.match(new RegExp(`^(\\S+) membeli (\\d+) (.+?) dan (\\d+) (.+?) seharga ${RP}\\. (\\S+) membeli (\\d+) (.+?) dan (\\d+) (.+?) di toko yang sama seharga ${RP}\\. Berapa harga (.+)\\?$`)))) {
      const b1 = m[3], b2 = m[5];
      if (m[9] !== b1 || m[11] !== b2) return null;
      nx = `harga satu ${b1}`; ny = `harga satu ${b2}`;
      e1 = { a: +m[2], b: +m[4], c: bacaRp(m[6]) }; e2 = { a: +m[8], b: +m[10], c: bacaRp(m[12]) };
      const tanya = m[13];
      let t;
      if ((t = tanya.match(/^satu (.+)$/))) jawab = (s) => t[1] === b1 ? s.x : t[1] === b2 ? s.y : null;
      else if ((t = tanya.match(/^(\d+) (.+?) dan (\d+) (.+)$/)) && t[2] === b1 && t[4] === b2) jawab = (s) => { L.push({ h: `Harga ${N(t[1])} ${b1} dan ${N(t[3])} ${b2}${sama}${N(t[1])} × ${rp(s.x)} + ${N(t[3])} × ${rp(s.y)}${sama}${rp(+t[1] * s.x + +t[3] * s.y)}` }); return +t[1] * s.x + +t[3] * s.y; };
      else return null;
    } else {
      const umur = soal.match(/^(.*?)Berapa (umur (\S+) sekarang|jumlah umur (\S+) dan (\S+) lima tahun lagi)\?$/);
      if (!umur) return null;
      const isi = umur[1].trim();
      // nama pertama dan kedua
      let a1, a2;
      if ((m = isi.match(/^Jumlah umur (\S+) dan (\S+) adalah (\d+) tahun\. Selisih umur mereka (\d+) tahun, dan \1 lebih tua\.$/))) {
        a1 = m[1]; a2 = m[2]; e1 = { a: 1, b: 1, c: +m[3] }; e2 = { a: 1, b: -1, c: +m[4] };
        L.push({ h: `Misalkan ${V("x")} = umur ${a1}, ${V("y")} = umur ${a2}. Jumlah umur → (1); ${a1} lebih tua, jadi selisihnya ${V("x")} − ${V("y")} → (2).` });
      } else if ((m = isi.match(/^Umur (\S+) (\S+) kali umur (\S+)\. Jumlah umur mereka (\d+) tahun\.$/)) && kata(m[2])) {
        a1 = m[1]; a2 = m[3]; const w = kata(m[2]);
        e1 = { a: 1, b: 1, c: +m[4] }; e2 = { a: 1, b: -w, c: 0 };
        L.push({ h: `Misalkan ${V("x")} = umur ${a1}, ${V("y")} = umur ${a2}. "Umur ${a1} ${m[2]} kali umur ${a2}": ${V("x")}${sama}${N(w)}${V("y")}, ditulis ${persHtml(e2)} → (2). Jumlah umur → (1).` });
      } else if ((m = isi.match(/^(\S+) kali umur (\S+) ditambah (\S+) kali umur (\S+) adalah (\d+) tahun\. Sedangkan (\S+) kali umur \4 dikurangi (\S+) kali umur \2 adalah (\d+) tahun\.$/)) && [m[1], m[3], m[6], m[7]].every(kata)) {
        a1 = m[2]; a2 = m[4];
        e1 = { a: kata(m[1]), b: kata(m[3]), c: +m[5] }; e2 = { a: -kata(m[7]), b: kata(m[6]), c: +m[8] };
        L.push({ h: `Misalkan ${V("x")} = umur ${a1}, ${V("y")} = umur ${a2}. Kalimat pertama → (1), kalimat kedua → (2) (perhatikan: umur ${a2} disebut lebih dulu, umur ${a1} dikurangkan).` });
      } else if ((m = isi.match(/^(\S+) tahun yang lalu, umur (\S+) (\S+) kali umur (\S+)\. Jumlah umur mereka sekarang (\d+) tahun\.$/)) && kata(m[1]) && kata(m[3])) {
        a1 = m[2]; a2 = m[4]; const w = kata(m[1]), kk = kata(m[3]);
        e1 = { a: 1, b: 1, c: +m[5] }; e2 = { a: 1, b: -kk, c: w - kk * w };
        L.push({ h: `Misalkan ${V("x")} = umur ${a1} sekarang, ${V("y")} = umur ${a2} sekarang. ${N(w)} tahun yang lalu umur mereka ${V("x")} − ${N(w)} dan ${V("y")} − ${N(w)} (keduanya dikurangi ${N(w)}).`, p: !!jenis });
        L.push({ h: `${V("x")} − ${N(w)}${sama}${N(kk)}(${V("y")} − ${N(w)}) → ${V("x")} − ${N(w)}${sama}${N(kk)}${V("y")} − ${N(kk * w)} → ${persHtml(e2)} → (2). Jumlah umur sekarang → (1).` });
      } else if ((m = isi.match(/^(\S+) tahun lagi, umur (\S+) menjadi (\S+) kali umur (\S+)\. Selisih umur mereka (\d+) tahun\.$/)) && kata(m[1]) && kata(m[3])) {
        a1 = m[2]; a2 = m[4]; const w = kata(m[1]), kk = kata(m[3]);
        e1 = { a: 1, b: -1, c: +m[5] }; e2 = { a: 1, b: -kk, c: kk * w - w };
        L.push({ h: `Misalkan ${V("x")} = umur ${a1} sekarang, ${V("y")} = umur ${a2} sekarang. ${N(w)} tahun lagi umur mereka ${V("x")} + ${N(w)} dan ${V("y")} + ${N(w)} (keduanya ditambah ${N(w)}).`, p: !!jenis });
        L.push({ h: `${V("x")} + ${N(w)}${sama}${N(kk)}(${V("y")} + ${N(w)}) → ${V("x")} + ${N(w)}${sama}${N(kk)}${V("y")} + ${N(kk * w)} → ${persHtml(e2)} → (2). Selisih umur → (1).` });
      } else return null;
      nx = `umur ${a1}`; ny = `umur ${a2}`;
      jawab = (s) => {
        if (umur[3] === a1) return s.x;
        if (umur[3] === a2) return s.y;
        if (umur[4] === a1 && umur[5] === a2) {
          L.push({ h: `Lima tahun lagi umur mereka masing-masing bertambah 5, jadi jumlahnya bertambah 10: ${N(s.x)} + ${N(s.y)} + 10${sama}${N(s.x + s.y + 10)} tahun`, p: !!jenis });
          return s.x + s.y + 10;
        }
        return null;
      };
    }
    if (!L.length) L.push({ h: `Misalkan ${V("x")} = ${nx}, ${V("y")} = ${ny}.` });
    L.push({ h: `Buat model matematikanya: (1) ${persHtml(e1)}; (2) ${persHtml(e2)}` });
    const s = eliminasi(e1, e2, L, jenis);
    if (!s) return null;
    const uang = /Rp/.test(soal) ? rp : (v) => `${N(v)} tahun`;
    L.push({ h: `Didapat ${nx} = ${uang(s.x)} dan ${ny} = ${uang(s.y)}` });
    const h = jawab(s);
    if (h !== k) return null;
    L.push({ h: `Jadi jawabannya ${/Rp/.test(soal) ? rp(k) : `${N(k)} tahun`}` });
    return { langkah: L, susun: "", hasil: true };
  }

  /* Pola bilangan (K12-04): cari aturan yang cocok dengan semua suku yang diketahui. */
  const bacaBil = (t) => Number(String(t).replace("−", "-"));
  function pola(soal, kunci) {
    const t = soal.split(", ");
    if (t.length < 5 || !t.includes("□")) return null;
    const kosong = t.map((x, i) => x === "□" ? i : -1).filter((i) => i >= 0);
    const k = kunci.split(";").map(Number);
    if (k.length !== kosong.length || kosong[0] < 2) return null;
    const u = t.map((x) => x === "□" ? null : bacaBil(x)), n = u.length;
    const cocok = (f) => f.length === n && f.every((x, i) => u[i] === null || x === u[i]) && kosong.every((i, j) => f[i] === k[j]);
    const buat = (awal, langkah) => { const f = awal.slice(); for (let i = f.length; i < n; i++) f.push(langkah(f, i)); return f; };
    const sg = (v) => v < 0 ? `− ${N(-v)}` : `+ ${N(v)}`;
    const L = [];
    const isi = (f, cara) => kosong.forEach((i, j) => L.push({ h: `Suku ke-${i + 1}: ${cara(f, i)}${sama}${N(f[i])}` }));
    let f;
    const [u0, u1] = u;
    // 1. Aritmetika
    if (cocok(f = buat([u0], (g, i) => g[i - 1] + (u1 - u0)))) {
      const d = u1 - u0;
      L.push({ h: `Selisih dua suku berurutan selalu sama: ${N(u1)} − ${Nk(u0)}${sama}${N(d)}. Ini barisan aritmetika dengan beda ${N(d)}.` });
      isi(f, (g, i) => `${N(g[i - 1])} ${sg(d)}`);
    } else if (u0 && Number.isInteger(u1 / u0) && cocok(f = buat([u0], (g, i) => g[i - 1] * (u1 / u0)))) {
      const r = u1 / u0;
      L.push({ h: `Setiap suku dikali bilangan yang sama: ${N(u1)} ÷ ${Nk(u0)}${sama}${N(r)}. Ini barisan geometri dengan rasio ${N(r)}.` });
      isi(f, (g, i) => `${N(g[i - 1])} × ${Nk(r)}`);
    } else if (u1 && Number.isInteger(u0 / u1) && cocok(f = buat([u0], (g, i) => g[i - 1] / (u0 / u1)))) {
      const r = u0 / u1;
      L.push({ h: `Setiap suku dibagi bilangan yang sama: ${N(u0)} ÷ ${Nk(u1)}${sama}${N(r)} (barisan geometri dengan rasio ${pecHtml("", 1, r)}).` });
      isi(f, (g, i) => `${N(g[i - 1])} ÷ ${Nk(r)}`);
    } else if (cocok(f = buat([u0, u1], (g, i) => g[i - 1] + g[i - 2]))) {
      L.push({ h: "Setiap suku adalah jumlah dua suku sebelumnya (pola Fibonacci)." });
      isi(f, (g, i) => `${N(g[i - 2])} + ${N(g[i - 1])}`);
    } else {
      let ketemu = false;
      // 2. Selisih bertingkat: selisih bertambah tetap e
      for (let e = -30; e <= 30 && !ketemu; e++) {
        if (!e) continue;
        const d0 = u1 - u0;
        if (cocok(f = buat([u0], (g, i) => g[i - 1] + d0 + (i - 1) * e))) {
          ketemu = true;
          const sel = f.slice(1).map((x, i) => x - f[i]);
          L.push({ h: `Selisihnya tidak tetap, tetapi selalu bertambah ${N(e)}: ${sel.map((x) => N(x)).join(", ")}. Ini pola selisih bertingkat.` });
          isi(f, (g, i) => `${N(g[i - 1])} + ${N(g[i] - g[i - 1])}`);
        }
      }
      // 3. Dikali m lalu ditambah c
      for (let mm = 2; mm <= 5 && !ketemu; mm++) {
        const c = u1 - mm * u0;
        if (c && cocok(f = buat([u0], (g, i) => g[i - 1] * mm + c))) {
          ketemu = true;
          L.push({ h: `Setiap suku dikali ${N(mm)} lalu ${c > 0 ? "ditambah" : "dikurangi"} ${N(Math.abs(c))}: ${N(u0)} × ${N(mm)} ${sg(c)}${sama}${N(u1)}.` });
          isi(f, (g, i) => `${N(g[i - 1])} × ${N(mm)} ${sg(c)}`);
        }
      }
      // 4. Dua operasi bergantian
      const opsi = [];
      for (let a = -40; a <= 40; a++) if (a) opsi.push({ t: a > 0 ? `+ ${a}` : `− ${-a}`, f: (x) => x + a, h: (x) => `${N(x)} ${sg(a)}` });
      for (let r = 2; r <= 5; r++) opsi.push({ t: `× ${r}`, f: (x) => x * r, h: (x) => `${N(x)} × ${N(r)}` });
      for (const o1 of opsi) {
        if (ketemu) break;
        if (o1.f(u0) !== u1) continue;
        for (const o2 of opsi) {
          if (o1 === o2) continue;
          if (cocok(f = buat([u0], (g, i) => (i % 2 ? o1 : o2).f(g[i - 1])))) {
            ketemu = true;
            L.push({ h: `Ada dua operasi yang bergantian: <b>${o1.t}</b>, lalu <b>${o2.t}</b>, lalu ${o1.t} lagi, dan seterusnya.` });
            isi(f, (g, i) => (i % 2 ? o1 : o2).h(g[i - 1]));
            break;
          }
        }
      }
      // 5. Dua pola berselang (suku ganjil dan suku genap masing-masing aritmetika)
      for (let d = -40; d <= 40 && !ketemu; d++) {
        for (let e = -40; e <= 40 && !ketemu; e++) {
          if (cocok(f = buat([u0, u1], (g, i) => g[i - 2] + (i % 2 ? e : d)))) {
            ketemu = true;
            L.push({ h: `Ada dua pola yang berselang-seling: suku ke-1, 3, 5, … ${d >= 0 ? "bertambah" : "berkurang"} ${N(Math.abs(d))}; suku ke-2, 4, 6, … ${e >= 0 ? "bertambah" : "berkurang"} ${N(Math.abs(e))}.` });
            isi(f, (g, i) => `${N(g[i - 2])} ${sg(i % 2 ? e : d)}`);
          }
        }
      }
      if (!ketemu) return null;
    }
    L.push({ h: `Jadi ${kosong.length > 1 ? "bilangan pengganti kotak berturut-turut" : "bilangan pengganti kotak"} ${k.map((x) => N(x)).join(" dan ")}` });
    return { langkah: L, susun: "", hasil: true };
  }

  /* Penarikan kesimpulan (K12-05, pilihan ganda). */
  const ALASAN = {
    konvers: "membalik urutan implikasi. \"Jika p, maka q\" tidak sama dengan \"Jika q, maka p\".",
    invers: "menyangkal kedua bagian tanpa membaliknya. \"Jika tidak p, maka tidak q\" belum tentu benar.",
    kuantor: "kata \"semua\" dipakai, padahal yang pasti hanya \"sebagian\".",
    tidak_sah: "pernyataan itu tidak mengikuti dari premis; belum tentu benar.",
    ingkaran: "bukan ingkaran/kesetaraan yang tepat.",
  };
  function kesimpulan(soal, kunci, jenis, jawaban) {
    const b = soal.split(" ¶ ");
    if (b.length < 4 || !/^[A-E]$/.test(kunci)) return null;
    const premis = b[0], tanya = b[1], opsi = Object.fromEntries(b.slice(2).map((o) => [o[0], o.slice(3)]));
    const benar = opsi[kunci];
    if (!benar) return null;
    const L = [], q = (t) => `<b>${esc(t)}</b>`;
    const kecil = (t) => t.charAt(0).toLowerCase() + t.slice(1);
    let m;
    if ((m = premis.match(/^"Jika (.+?), maka (.+?)\."$/))) {
      L.push({ h: `Misalkan p: ${q(m[1])}; q: ${q(m[2])}. Pernyataannya "jika p, maka q" (p → q).` });
      if (/setara/.test(tanya)) {
        L.push({ h: `Yang setara dengan p → q ada dua: kontraposisi (tidak q → tidak p) dan "tidak p atau q".`, p: !!jenis });
        L.push({ h: `Di pilihan yang ada: ${q(benar)} (bentuk "tidak p atau q").` });
      } else if (/Ingkaran/.test(tanya)) {
        L.push({ h: `Ingkaran p → q adalah "p dan tidak q": syaratnya terjadi, tetapi akibatnya tidak terjadi.`, p: !!jenis });
        L.push({ h: `Jadi ingkarannya: ${q(benar)}` });
      } else return null;
    } else if ((m = premis.match(/^Semua (.+?)\. (Sebagian|Semua) (.+?) adalah (.+?)\.$/))) {
      L.push({ h: `Premis 1: semua ${q(m[1])}. Premis 2: ${kecil(m[2])} ${q(m[3])} adalah ${q(m[4])}.` });
      L.push({ h: m[2] === "Sebagian"
        ? `Hanya <b>sebagian</b> ${esc(m[3])} yang termasuk ${esc(m[4])}, jadi yang pasti hanya sebagian itu yang memiliki sifatnya.`
        : `<b>Semua</b> ${esc(m[3])} termasuk ${esc(m[4])}, jadi semuanya juga memiliki sifat ${esc(m[4])}.`, p: jenis === "kuantor" });
      L.push({ h: `Kesimpulan: ${q(benar)}` });
    } else if ((m = premis.match(/^Jika (.+?), maka (.+?)\. Jika (.+?), maka (.+?)\.$/)) && m[2] === m[3]) {
      L.push({ h: `Misalkan p: ${q(m[1])}; q: ${q(m[2])}; r: ${q(m[4])}. Premisnya p → q dan q → r.` });
      L.push({ h: `Silogisme: dari p → q dan q → r disimpulkan <b>p → r</b> (jika ${esc(m[1])}, maka ${esc(m[4])}).` });
      if (/^Jika .*tidak|^Jika .* tidak /.test(benar) && !benar.startsWith(`Jika ${m[1]}`)) L.push({ h: `p → r setara dengan kontraposisinya, <b>tidak r → tidak p</b>. Pilihan yang sesuai: ${q(benar)}`, p: jenis === "invers" || jenis === "konvers" });
      else L.push({ h: `Pilihan yang sesuai: ${q(benar)}` });
    } else if ((m = premis.match(/^Jika (.+?), maka (.+?)\. (.+?)\.$/))) {
      const fakta = kecil(m[3]);
      L.push({ h: `Misalkan p: ${q(m[1])}; q: ${q(m[2])}. Premis 1: p → q. Premis 2: ${q(m[3])}.` });
      if (fakta === m[1]) L.push({ h: `Premis 2 menyatakan p terjadi. Modus ponens: p → q dan p, maka <b>q</b>.`, p: !!jenis });
      else L.push({ h: `Premis 2 menyatakan q <b>tidak</b> terjadi. Modus tollens: p → q dan tidak q, maka <b>tidak p</b>.`, p: !!jenis });
      L.push({ h: `Kesimpulan: ${q(benar)}` });
    } else return null;
    const j = String(jawaban || "").toUpperCase();
    if (jenis && ALASAN[jenis] && opsi[j]) L.push({ h: `Pilihanmu (${j}) keliru karena ${esc(ALASAN[jenis])}`, p: true });
    L.push({ h: `Jadi jawabannya <b>${kunci}</b>.` });
    return { langkah: L, susun: "", hasil: true };
  }

  /* Pintu MD12: undefined = bukan bentuk MD12. */
  function susunMD12(soal, kunci, jenis, jawaban) {
    if (soal.includes(" ¶ ")) return kesimpulan(soal, kunci, jenis, jawaban);
    if (/^[−\d□]/.test(soal) && soal.includes(", ") && soal.includes("□")) return pola(soal, kunci);
    if (/ ; /.test(soal) && /[xy]/.test(soal)) return spldv(soal, kunci, jenis);
    if (/membeli .* seharga|umur/i.test(soal) && !/%|persen/.test(soal)) return ceritaSPLDV(soal, kunci, jenis);
    if (/[a-z]/.test(soal) && soal.includes(" = ") && !/[A-Za-z]{3,}/.test(soal) && !soal.includes("□")) return plsv(soal, kunci, jenis);
    return undefined;
  }

  /* ------------------------------------------------------------ pintu masuk */
  function bahasSoal(o) {
    try { return susun(o); } catch (e) { return null; }
  }
  function susun(o) {
    const soal = String(o.soal || "").trim(), kunci = String(o.kunci == null ? "" : o.kunci).trim(), jenis = o.jenis || "";
    if (!soal || !kunci) return null;
    const md12 = susunMD12(soal, kunci, jenis, o.jawaban);
    if (md12 !== undefined) return md12;
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
    const akhir = b.langkah.length - 1;
    const li = b.langkah.map((x, i) => {
      // Baris penutup "Jadi …" tampil sebagai kotak kesimpulan, tanpa nomor
      if (i === akhir && /^Jadi /.test(x.h)) return `<li class="bh-jadi"><span class="bh-cek" aria-hidden="true">✓</span><span class="bh-isi">${x.h}</span></li>`;
      if (x.anak) return `<li class="bh-anak${x.p ? " bh-sorot" : ""}"><span class="bh-isi">${x.h}${x.p ? ' <span class="bh-tanda">← perhatikan</span>' : ""}</span></li>`;
      no++;
      return `<li${x.p ? ' class="bh-sorot"' : ""}><span class="bh-no">${no}</span><span class="bh-isi">${x.h}${x.p ? ' <span class="bh-tanda">← perhatikan</span>' : ""}</span></li>`;
    }).join("");
    return `<div class="bahas">${b.susun ? `<div class="bh-susun">${b.susun}</div>` : ""}<ol class="bh-langkah">${li}</ol></div>`;
  }

  return { bahasSoal, bahasHtml };
})();
const bahasSoal = BahasMatdas.bahasSoal, bahasHtml = BahasMatdas.bahasHtml;
if (typeof module !== "undefined") module.exports = BahasMatdas;
