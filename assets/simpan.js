/* Menyimpan berkas buatan halaman (Excel, Word, PNG, JSON, teks) ke komputer/HP.
   Chrome yang dikelola sekolah (akun belajar.id) bisa memblokir unduhan dari alamat sementara blob:
   — di daftar unduhan muncul "Gagal - Network error". Karena itu:
     1. jendela "Simpan sebagai" (File System Access API, Chrome/Edge di komputer) menulis berkas langsung
        ke folder pilihan, tanpa tautan unduh;
     2. bila jendela itu tidak tersedia/ditolak (mis. di HP), unduhan memakai alamat data: (bukan blob:).
   Salinan yang sama dipakai Asesmen Merdeka (Tryout_Guru/assets/simpan.js) dan Matematika Dasar. */
"use strict";
let SIMPAN_TERAKHIR = "";   // "disimpan" | "diunduh" | "batal" — untuk pesan sesudah menyimpan

const keDataUrlSimpan = (blob) => new Promise((ok, gagal) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => gagal(r.error); r.readAsDataURL(blob); });
function jenisBerkasSimpan(blob, nama) {
  const ext = (String(nama).match(/\.[a-z0-9]+$/i) || [""])[0].toLowerCase(), mime = String(blob.type || "application/octet-stream").split(";")[0];
  return ext ? [{ description: "Berkas " + ext.slice(1).toUpperCase(), accept: { [mime]: [ext] } }] : undefined;
}
async function unduhDataUrl(blob, nama) {
  const a = document.createElement("a"); a.href = await keDataUrlSimpan(blob); a.download = nama; a.style.display = "none";
  document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 60000);
}
// Satu berkas. Hasil: "disimpan" (lewat jendela Simpan sebagai), "diunduh" (ke folder Unduhan), atau "batal".
async function simpanBerkas(blob, nama) {
  if (typeof window.showSaveFilePicker === "function") {
    try {
      const f = await window.showSaveFilePicker({ suggestedName: nama, types: jenisBerkasSimpan(blob, nama) });
      const w = await f.createWritable(); await w.write(blob); await w.close();
      return (SIMPAN_TERAKHIR = "disimpan");
    } catch (e) { if (e && e.name === "AbortError") return (SIMPAN_TERAKHIR = "batal"); /* ditolak/tidak didukung: cara berikutnya */ }
  }
  await unduhDataUrl(blob, nama);
  return (SIMPAN_TERAKHIR = "diunduh");
}
// Banyak berkas sekaligus: pilih folder sekali (bila tersedia), atau diunduh satu per satu. daftar = [{ blob, nama }]
async function simpanBanyak(daftar) {
  if (typeof window.showDirectoryPicker === "function") {
    try {
      const d = await window.showDirectoryPicker({ mode: "readwrite" });
      for (const x of daftar) { const f = await d.getFileHandle(x.nama, { create: true }); const w = await f.createWritable(); await w.write(x.blob); await w.close(); }
      return (SIMPAN_TERAKHIR = "disimpan");
    } catch (e) { if (e && e.name === "AbortError") return (SIMPAN_TERAKHIR = "batal"); }
  }
  for (const [i, x] of daftar.entries()) { await unduhDataUrl(x.blob, x.nama); if (i < daftar.length - 1) await new Promise((r) => setTimeout(r, 400)); }
  return (SIMPAN_TERAKHIR = "diunduh");
}
const pesanSimpan = (status, nama) => status === "disimpan" ? "Tersimpan: " + nama : status === "diunduh" ? "Diunduh: " + nama + " — lihat folder Unduhan" : "";
