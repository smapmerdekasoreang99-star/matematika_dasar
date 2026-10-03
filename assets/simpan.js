/* Mengunduh berkas buatan halaman (Excel, Word, PNG, JSON, teks) ke folder Unduhan lewat tautan <a download>.
   - Isi berupa data mentah (ArrayBuffer/Uint8Array/teks) langsung diubah menjadi alamat data: — TANPA membaca
     Blob kembali (FileReader), karena pembacaan Blob bisa tersendat di sebagian perangkat (penyimpanan Blob di disk,
     antivirus) sehingga tombol macet di "Menyiapkan…".
   - Berkas besar (> 1,5 MB, mis. cadangan JSON) memakai alamat blob: (Chrome membatasi panjang data:).
   - Isi berupa Blob (mis. kartu PNG) dibaca dengan batas 5 detik; bila tersendat, beralih ke alamat blob:.
   Jendela "Simpan sebagai" (File System Access API) sengaja TIDAK dipakai: penulisannya bisa menggantung
   (tersisa berkas .crswap). Bila unduhan gagal "Network error", periksa VPN / ekstensi peramban lebih dulu.
   Salinan yang sama dipakai Asesmen Merdeka (Tryout_Guru/assets/simpan.js) dan Matematika Dasar. */
"use strict";
let SIMPAN_TERAKHIR = "";   // "diunduh" — untuk pesan sesudah mengunduh
const BATAS_DATA_URL = 1.5 * 1024 * 1024;

function klikUnduh(href, nama, cabut) {
  const a = document.createElement("a"); a.href = href; a.download = nama; a.style.display = "none";
  document.body.appendChild(a); a.click();
  setTimeout(() => { if (cabut) URL.revokeObjectURL(href); a.remove(); }, 120000);
}
function bytesKeBase64(u8) {
  let s = ""; const K = 0x8000;
  for (let i = 0; i < u8.length; i += K) s += String.fromCharCode.apply(null, u8.subarray(i, i + K));
  return btoa(s);
}
const mimeDari = (nama, bawaan) => bawaan || ({ xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", json: "application/json", png: "image/png",
  txt: "text/plain;charset=utf-8", csv: "text/csv;charset=utf-8" })[(String(nama).match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase()] || "application/octet-stream";
const bacaDataUrl = (blob, ms) => new Promise((ok, gagal) => {
  const r = new FileReader(); const t = setTimeout(() => { try { r.abort(); } catch (e) {} gagal(new Error("lambat")); }, ms);
  r.onload = () => { clearTimeout(t); ok(r.result); }; r.onerror = () => { clearTimeout(t); gagal(r.error || new Error("galat")); };
  r.readAsDataURL(blob);
});

/* isi: Blob, ArrayBuffer, Uint8Array (atau TypedArray lain), atau teks. mime opsional (ditebak dari nama berkas). */
async function simpanBerkas(isi, nama, mime) {
  if (typeof isi === "string" && /^data:/.test(isi)) { klikUnduh(isi, nama, false); return (SIMPAN_TERAKHIR = "diunduh"); }
  if (isi instanceof Blob) {
    if (isi.size <= BATAS_DATA_URL) {
      try { klikUnduh(await bacaDataUrl(isi, 5000), nama, false); return (SIMPAN_TERAKHIR = "diunduh"); }
      catch (e) { /* tersendat: pakai alamat blob: */ }
    }
    klikUnduh(URL.createObjectURL(isi), nama, true); return (SIMPAN_TERAKHIR = "diunduh");
  }
  const u8 = typeof isi === "string" ? new TextEncoder().encode(isi)
    : isi instanceof ArrayBuffer ? new Uint8Array(isi) : new Uint8Array(isi.buffer, isi.byteOffset, isi.byteLength);
  const tipe = mimeDari(nama, mime);
  if (u8.length <= BATAS_DATA_URL) klikUnduh(`data:${tipe};base64,${bytesKeBase64(u8)}`, nama, false);
  else klikUnduh(URL.createObjectURL(new Blob([u8], { type: tipe })), nama, true);
  return (SIMPAN_TERAKHIR = "diunduh");
}
// Banyak berkas, diunduh satu per satu. daftar = [{ blob | isi, nama }]
async function simpanBanyak(daftar) {
  for (const [i, x] of daftar.entries()) { await simpanBerkas(x.isi ?? x.blob, x.nama); if (i < daftar.length - 1) await new Promise((r) => setTimeout(r, 500)); }
  return (SIMPAN_TERAKHIR = "diunduh");
}
const pesanSimpan = (status, nama) => status === "diunduh" ? "Diunduh: " + nama + " — lihat folder Unduhan" : "";
