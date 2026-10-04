/* Unduhan Excel (.xlsx) berformat — dipakai halaman guru Matdas dan admin Asesmen Merdeka (salinan sama di Tryout_Guru/assets/excel.js).
   Gaya mengikuti unduhan Dasbor Hasil Tryout (Tryout_Guru/index.html → bukuHasil):
   kop logo + nama sekolah + judul, garis emas, kepala tabel biru tua, baris
   zebra, kolom beku, siap cetak A4. ExcelJS dimuat hanya saat diperlukan. */
"use strict";

const CDN_EXCELJS = ["https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js",
  "https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js"];
async function muatExcelJS() {
  if (window.ExcelJS) return window.ExcelJS;
  for (const u of CDN_EXCELJS) {
    try {
      await new Promise((ok, gagal) => { const s = document.createElement("script"); s.src = u; s.onload = ok; s.onerror = () => gagal(new Error(u)); document.head.appendChild(s); });
      if (window.ExcelJS) return window.ExcelJS;
    } catch (e) { /* coba CDN berikutnya */ }
  }
  throw new Error("Pustaka pembuat Excel tidak bisa dimuat. Periksa sambungan internet lalu coba lagi.");
}

async function logoBase64() {
  try {
    const b = await (await fetch("assets/logo.png")).blob();
    return await new Promise((r) => { const f = new FileReader(); f.onload = () => r(String(f.result).split(",")[1]); f.readAsDataURL(b); });
  } catch (e) { return null; }
}

// Palet mengikuti assets/dasar.css (sama dengan Tryout).
const XL = { font: "Calibri", gelap: "FF1D2A3A", gelap2: "FF33445A", emas: "FFC29433", emasMuda: "FFFFF6D2", emasTeks: "FF8F6B1A",
  kertas: "FFF6F2E8", garis: "FFE7E0D1", garis2: "FFD6CCB6", tinta: "FF221E17", tinta2: "FF5E5548", putih: "FFFFFFFF",
  hijau: "FF2B4B37", hijauMuda: "FFE4EFE7", merah: "FF7C2F1F", merahMuda: "FFF7E4DF" };
const SEKOLAH = "SMA Plus Merdeka Soreang";
// Nama aplikasi di kop & kaki lembar; halaman lain (mis. admin Asesmen Merdeka) mengisi window.XL_APLIKASI sebelum memuat berkas ini.
const APLIKASI_XL = window.XL_APLIKASI || "Matematika Dasar";
const isiWarna = (c) => ({ type: "pattern", pattern: "solid", fgColor: { argb: c } });
const isiCF = (c) => ({ type: "pattern", pattern: "solid", fgColor: { argb: c }, bgColor: { argb: c } });
const garisXL = (c = XL.garis) => ({ style: "thin", color: { argb: c } });
const tepiXL = (c) => ({ top: garisXL(c), left: garisXL(c), bottom: garisXL(c), right: garisXL(c) });
const tglIndoXL = (d) => d.toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(/\./g, ":");
// ExcelJS menulis tanggal sebagai UTC; digeser agar tampil waktu setempat.
const waktuXL = (iso) => { if (!iso) return null; const d = new Date(iso); return isNaN(d) ? null : new Date(d.getTime() - d.getTimezoneOffset() * 60000); };
const kolomHuruf = (n) => { let s = ""; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
const namaLembar = (t) => String(t || "Lembar").replace(/[\\/*?:[\]]/g, "-").slice(0, 31);

/* Aturan warna bersyarat siap pakai: persen akurasi (≥ 80 hijau, 60–79 emas, < 60 merah). */
const CF_PERSEN = [
  { type: "cellIs", operator: "greaterThanOrEqual", formulae: [80], style: { fill: isiCF(XL.hijauMuda), font: { color: { argb: XL.hijau }, bold: true } } },
  { type: "cellIs", operator: "between", formulae: [60, 79.999], style: { fill: isiCF(XL.emasMuda), font: { color: { argb: XL.emasTeks }, bold: true } } },
  { type: "cellIs", operator: "lessThan", formulae: [60], style: { fill: isiCF(XL.merahMuda), font: { color: { argb: XL.merah }, bold: true } } },
];

/* Satu buku kerja, satu atau beberapa lembar tabel.
   lembar: [{ nama, judul, sub, info: [[label, isi]], ubin: [[label, nilai]],
              kolom: [{ t, w, rata, fmt, tebal, bungkus, cf }], baris: [[nilai…]],
              warnaSel(baris, j) → {warna, tebal, fill} | null, melintang, beku }] */
async function unduhBukuXLSX({ lembar, namaBerkas, judulBuku }) {
  const ExcelJS = await muatExcelJS();
  const logo = await logoBase64();
  const waktu = new Date();
  const wb = new ExcelJS.Workbook();
  wb.creator = SEKOLAH; wb.created = waktu; wb.modified = waktu;
  let logoId = null;
  if (logo) { try { logoId = wb.addImage({ base64: logo, extension: "png" }); } catch (e) { logoId = null; } }

  const sel = (ws, r, c, v, o = {}) => {
    const x = ws.getCell(r, c); x.value = v;
    x.font = { name: XL.font, size: o.size || 10, bold: !!o.bold, italic: !!o.italic, color: { argb: o.warna || XL.tinta } };
    x.alignment = { horizontal: o.rata || (typeof v === "number" ? "center" : "left"), vertical: "middle", wrapText: !!o.bungkus, indent: o.indent || 0 };
    if (o.fill) x.fill = isiWarna(o.fill); if (o.tepi) x.border = o.tepi; if (o.fmt) x.numFmt = o.fmt;
    return x;
  };

  lembar.forEach((L, iL) => {
    const kolom = L.kolom, K = kolom.length;
    const ws = wb.addWorksheet(namaLembar(L.nama), { properties: { tabColor: { argb: iL === 0 ? XL.emas : XL.gelap2 } } });
    kolom.forEach((k, i) => { ws.getColumn(i + 1).width = k.w || 12; });

    // Kop: logo, nama sekolah, keterangan, judul lembar, garis emas.
    ws.getRow(1).height = 8; ws.getRow(2).height = 20; ws.getRow(3).height = 15; ws.getRow(4).height = 18; ws.getRow(5).height = 6;
    for (let r = 1; r <= 5; r++) for (let c = 1; c <= K; c++) ws.getCell(r, c).fill = isiWarna(XL.putih);
    if (logoId !== null) { try { ws.addImage(logoId, { tl: { col: 0.1, row: 0.3 }, ext: { width: 34, height: 48 } }); } catch (e) { /* tanpa logo */ } }
    if (K > 2) { [2, 3, 4].forEach((r) => ws.mergeCells(r, 2, r, K)); }
    sel(ws, 2, 2, SEKOLAH, { size: 14, bold: true, warna: XL.gelap, indent: 1 });
    sel(ws, 3, 2, `${APLIKASI_XL}${L.sub ? "  ·  " + L.sub : ""}`, { size: 9, warna: XL.tinta2, indent: 1 });
    sel(ws, 4, 2, String(L.judul || judulBuku).toUpperCase(), { size: 12, bold: true, warna: XL.emasTeks, indent: 1 });
    for (let c = 1; c <= K; c++) ws.getCell(5, c).border = { bottom: { style: "medium", color: { argb: XL.emas } } };
    ws.getRow(6).height = 8;
    let r = 7;

    (L.info || []).forEach(([k, v]) => {
      sel(ws, r, 2, k, { size: 9, warna: XL.tinta2 });
      if (K > 3) ws.mergeCells(r, 3, r, Math.min(K, 8));
      sel(ws, r, 3, v, { size: 9, bold: true, rata: "left" });
      ws.getRow(r).height = 15; r++;
    });
    if ((L.info || []).length) r++;

    if ((L.ubin || []).length) {
      ws.getRow(r).height = 14; ws.getRow(r + 1).height = 26;
      L.ubin.forEach(([l, v], i) => {
        const c = 2 + i * 2; if (c > K) return;
        if (c + 1 <= K) { ws.mergeCells(r, c, r, c + 1); ws.mergeCells(r + 1, c, r + 1, c + 1); }
        sel(ws, r, c, String(l).toUpperCase(), { size: 8, bold: true, warna: XL.tinta2, rata: "center", fill: XL.kertas, tepi: { top: garisXL(XL.garis2), left: garisXL(XL.garis2), right: garisXL(XL.garis2) } });
        sel(ws, r + 1, c, v, { size: 14, bold: true, warna: XL.gelap, rata: "center", fill: XL.kertas, tepi: { bottom: garisXL(XL.garis2), left: garisXL(XL.garis2), right: garisXL(XL.garis2) } });
      });
      r += 3;
    }

    // Kepala tabel
    const barisJudul = r;
    kolom.forEach((k, i) => sel(ws, r, i + 1, k.t, { bold: true, warna: XL.putih, fill: XL.gelap, rata: "center", bungkus: true,
      tepi: { top: garisXL(XL.gelap), left: garisXL(XL.gelap2), right: garisXL(XL.gelap2), bottom: { style: "medium", color: { argb: XL.emas } } } }));
    ws.getRow(r).height = 30;
    // Kepala tabel: kata tidak terpotong di tengah (pasKepalaExcel, 4 Oktober 2026; assets/kepala-excel.js).
    if (window.pasKepalaExcel) window.pasKepalaExcel(ws, barisJudul, barisJudul, { kolomAwal: 1, kolomAkhir: K });
    r++;
    const awal = r;
    if (!L.baris.length) { if (K > 1) ws.mergeCells(r, 1, r, K); sel(ws, r, 1, "Tidak ada data.", { italic: true, warna: XL.tinta2, rata: "center" }); r++; }
    L.baris.forEach((b, i) => {
      kolom.forEach((k, j) => {
        const x = (L.warnaSel && L.warnaSel(b, j)) || {};
        const v = b[j] === undefined || b[j] === null || b[j] === "" ? "–" : b[j];
        sel(ws, r, j + 1, v, { rata: v === "–" ? "center" : k.rata, fmt: k.fmt, bold: k.tebal || x.tebal, bungkus: k.bungkus, size: k.size,
          warna: x.warna, fill: x.fill || (i % 2 ? XL.kertas : XL.putih), tepi: tepiXL() });
      });
      ws.getRow(r).height = 18; r++;
    });
    if (L.baris.length) kolom.forEach((k, j) => {
      if (k.cf) ws.addConditionalFormatting({ ref: `${kolomHuruf(j + 1)}${awal}:${kolomHuruf(j + 1)}${r - 1}`, rules: k.cf });
    });

    // Catatan kaki
    r++;
    (L.catatan || []).forEach((t) => { if (K > 1) ws.mergeCells(r, 1, r, K); sel(ws, r, 1, t, { size: 8, warna: XL.tinta2, bungkus: true }); ws.getRow(r).height = 24; r++; });
    if (K > 1) ws.mergeCells(r, 1, r, K);
    sel(ws, r, 1, `Diunduh ${tglIndoXL(waktu)} dari ${APLIKASI_XL} · ${SEKOLAH}`, { size: 8, italic: true, warna: XL.tinta2 });

    ws.views = [{ state: "frozen", xSplit: L.beku ?? 2, ySplit: barisJudul, showGridLines: false }];
    ws.pageSetup = { paperSize: 9, orientation: L.melintang === false ? "portrait" : "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0,
      printTitlesRow: `${barisJudul}:${barisJudul}`, horizontalCentered: true,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } };
    ws.headerFooter = { oddFooter: `&L&8${SEKOLAH} · ${APLIKASI_XL}&R&8Halaman &P dari &N` };
  });

  const buf = await wb.xlsx.writeBuffer();
  // lewat assets/simpan.js: jendela "Simpan sebagai" atau alamat data: (unduhan blob: diblokir Chrome yang dikelola sekolah)
  return simpanBerkas(buf, namaBerkas);   // data mentah langsung → alamat data: (tanpa membaca Blob)
}

/* Tombol unduh: "Menyiapkan…" selama berjalan, sama dengan aplikasi lain (ikon & lencana XLSX tetap, digambar CSS). */
async function jalankanUnduh(tombol, kerja) {
  const lama = tombol.textContent;
  tombol.disabled = true; tombol.textContent = "Menyiapkan…";
  try { const nama = await kerja(); if (nama && SIMPAN_TERAKHIR !== "batal") toast((SIMPAN_TERAKHIR === "disimpan" ? "Excel tersimpan: " : "Excel diunduh: ") + nama); }
  catch (e) { toast("Gagal menyusun Excel: " + e.message); }
  finally { tombol.disabled = false; tombol.textContent = lama; }
}

const tglBerkas = () => { const t = new Date(); return `${t.getFullYear()}${String(t.getMonth() + 1).padStart(2, "0")}${String(t.getDate()).padStart(2, "0")}`; };
const potongNama = (s) => String(s || "").replace(/[^\w-]+/g, "-");

/* Pustaka Excel (±1 MB) mulai dimuat saat tombol unduh disentuh/didekati kursor, supaya klik pertama tidak lama "Menyiapkan…". */
document.addEventListener("pointerover", (ev) => { if (ev.target.closest && ev.target.closest(".btn-unduh")) muatExcelJS().catch(() => {}); }, { passive: true });
document.addEventListener("focusin", (ev) => { if (ev.target.closest && ev.target.closest(".btn-unduh")) muatExcelJS().catch(() => {}); });
