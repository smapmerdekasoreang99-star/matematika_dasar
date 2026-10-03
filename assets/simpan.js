/* Mengunduh berkas buatan halaman (Excel, Word, PNG, JSON, teks) ke folder Unduhan.
   Unduhan biasa lewat tautan <a download>:
     - berkas kecil (≤ 1,5 MB) memakai alamat data:, berkas besar memakai alamat blob: (Chrome membatasi panjang data:);
     - setiap langkah diberi batas waktu, supaya tombol tidak pernah macet di "Menyiapkan…".
   Jendela "Simpan sebagai" (File System Access API) sengaja TIDAK dipakai: di perangkat sekolah penulisannya
   bisa menggantung (tersisa berkas .crswap dan berkas tidak jadi).
   Bila unduhan gagal "Network error", periksa VPN / ekstensi peramban lebih dulu.
   Salinan yang sama dipakai Asesmen Merdeka (Tryout_Guru/assets/simpan.js) dan Matematika Dasar. */
"use strict";
let SIMPAN_TERAKHIR = "";   // "diunduh" — untuk pesan sesudah mengunduh

const BATAS_DATA_URL = 1.5 * 1024 * 1024;
const keDataUrlSimpan = (blob) => new Promise((ok, gagal) => {
  const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => gagal(r.error || new Error("berkas tidak terbaca"));
  r.readAsDataURL(blob); setTimeout(() => gagal(new Error("menyiapkan unduhan tidak selesai dalam 15 detik")), 15000);
});
async function unduhTautan(blob, nama) {
  const pakaiBlob = blob.size > BATAS_DATA_URL;
  const a = document.createElement("a"); a.href = pakaiBlob ? URL.createObjectURL(blob) : await keDataUrlSimpan(blob);
  a.download = nama; a.style.display = "none"; document.body.appendChild(a); a.click();
  setTimeout(() => { if (pakaiBlob) URL.revokeObjectURL(a.href); a.remove(); }, 120000);
}
// Satu berkas → "diunduh"
async function simpanBerkas(blob, nama) { await unduhTautan(blob, nama); return (SIMPAN_TERAKHIR = "diunduh"); }
// Banyak berkas, diunduh satu per satu. daftar = [{ blob, nama }]
async function simpanBanyak(daftar) {
  for (const [i, x] of daftar.entries()) { await unduhTautan(x.blob, x.nama); if (i < daftar.length - 1) await new Promise((r) => setTimeout(r, 500)); }
  return (SIMPAN_TERAKHIR = "diunduh");
}
const pesanSimpan = (status, nama) => status === "diunduh" ? "Diunduh: " + nama + " — lihat folder Unduhan" : "";
