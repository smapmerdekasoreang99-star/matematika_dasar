/* Rekapitulasi perkembangan kelas (22 Okt 2026, RENCANA_REKAP_PERKEMBANGAN.md).
   Menggambar rapor satu kelompok atau perbandingan antarkelompok dari jawaban mtd_rekap_periode
   (Matdas) / fungsi serupa di English Reading. SVG tanpa pustaka; warna status lolos validator dataviz.
   REKAP_KELAS.rapor(el, data, opsi)   REKAP_KELAS.banding(el, data, opsi)
   opsi: { satuan: "level", kelompokLbl: "kelompok", target: 80, bukaSiswa(nisn),
           nilaiRata: false (true = "akurasi" ditampilkan sebagai rata-rata nilai, mis. English Reading),
           macetKet: keterangan arti macet }
   Siswa boleh membawa posisi_teks (teks posisi) dan butir macet boleh membawa label (teks lokasi macet). */
(function (root) {
  "use strict";

  // ---------- gaya (memakai token dasar.css; warna status lolos validator dataviz) ----------
  const gaya = document.createElement("style");
  gaya.textContent = `
.rk{--rk-r:#A8432E;--rk-s:#B7862A;--rk-t:#2F7A4C;--rk-grid:#ECE6D8;--rk-lintas:#E9E2D2;--rk-seq-0:#EFF2F5;--rk-seq-1:#C9D7E2;--rk-seq-2:#93B1C8;--rk-seq-3:#5B87A8;--rk-seq-4:#2F5D7C;--rk-seq-5:#1E415A;display:grid;gap:14px}
.rk-pita{background:var(--kertas-2,#fff);border:1px solid var(--garis);border-radius:14px;padding:14px 18px}
.rk-kalimat{margin:0;font-size:17px;line-height:1.55;max-width:75ch}.rk-kalimat b{font-variant-numeric:tabular-nums}
.rk-angka{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}
.rk-tile{background:var(--kertas-2,#fff);border:1px solid var(--garis);border-radius:12px;padding:12px 14px;display:grid;gap:2px}
.rk-tile .l{font-size:12.5px;color:var(--tinta-2)}.rk-tile .v{font-size:27px;font-weight:700;line-height:1.15}
.rk-d{font-size:12.5px;font-weight:600}.rk-d.naik{color:var(--rk-t)}.rk-d.turun{color:var(--rk-r)}.rk-d.datar{color:var(--tinta-3);font-weight:400}
.rk-dua{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr));gap:14px}
.rk-kartu{position:relative;min-width:0;background:var(--kertas-2,#fff);border:1px solid var(--garis);border-radius:14px;padding:14px 16px;display:grid;gap:6px;align-content:start}
.rk-kartu h3{margin:0;font-size:16px}.rk-kartu h4{margin:6px 0 0;font-size:13.5px}
.rk-tanya{font-size:11.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--tinta-3)}
.rk-ket{margin:0;font-size:13px;color:var(--tinta-2)}
.rk-leg{display:flex;flex-wrap:wrap;gap:12px;font-size:12.5px;color:var(--tinta-2)}.rk-leg span{display:inline-flex;align-items:center;gap:6px}
.rk-leg i{display:inline-block;width:10px;height:10px;border-radius:50%}.rk-leg i.k{border-radius:2px;border:1px solid var(--garis)}
.rk-gulir{overflow-x:auto}.rk svg{display:block;width:100%;height:auto;overflow:visible}
.rk svg text{font-family:inherit;fill:var(--tinta-2)}.rk svg .rk-kuat{fill:var(--tinta);font-weight:700}
.rk-hit{fill:transparent;cursor:pointer}.rk-hit:focus{outline:none}.rk-hit:focus-visible{stroke:var(--emas);stroke-width:2}
.rk-tip{position:absolute;z-index:5;pointer-events:none;background:var(--gelap);color:#fff;font-size:12.5px;line-height:1.4;padding:6px 10px;border-radius:8px;white-space:nowrap;transform:translate(-50%,calc(-100% - 10px));box-shadow:0 6px 16px rgba(0,0,0,.18)}
.rk-daftar{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.rk-daftar li{display:grid;grid-template-columns:34px 1fr auto;gap:10px;align-items:center;padding:8px 10px;border:1px solid var(--garis);border-radius:10px;background:#fff}
.rk-daftar li[data-nisn]{cursor:pointer}.rk-daftar li[data-nisn]:hover{border-color:var(--garis-2)}.rk-daftar li.rk-kosong{display:block;color:var(--tinta-2);font-size:13.5px}
.rk-ava{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:700;background:var(--gelap);color:#fff}
.rk-nm{font-weight:600;min-width:0}.rk-nm small{display:block;font-weight:400;color:var(--tinta-2);font-size:12.5px}
.rk-chip{font-size:12px;font-weight:700;border-radius:999px;padding:2px 9px;white-space:nowrap}
.rk-chip.r{background:#F7E4DF;color:var(--rk-r)}.rk-chip.s{background:#FFF4D6;color:#8F6B1A}.rk-chip.t{background:#E4EFE7;color:var(--rk-t)}
/* Rekapitulasi: pilihan periode */
.rk-seg { display: inline-flex; flex-wrap: wrap; gap: 2px; padding: 3px; background: var(--kertas-2); border: 1px solid var(--garis-2); border-radius: 999px; }
.rk-seg button { background: transparent; color: var(--tinta-2); border: 0; box-shadow: none; padding: 6px 14px; border-radius: 999px; font-weight: 700; font-size: 13px; }
.rk-seg button[aria-pressed="true"] { background: var(--gelap); color: #fff; }
.rk-tgl { display: flex; flex-wrap: wrap; gap: 10px 14px; align-items: flex-end; background: var(--kertas-2); border: 1px solid var(--garis); border-radius: 12px; padding: 12px 14px; margin-top: 8px; }
.rk-tgl.hidden { display: none; }
.rk-tgl label { display: grid; gap: 4px; font-size: 12px; font-weight: 700; color: var(--tinta-2); }
@media(max-width:560px){.rk-gulir svg{min-width:480px}.rk-gulir svg.rk-peta{min-width:760px}.rk-tile .v{font-size:23px}.rk-kalimat{font-size:15.5px}}
`;
  document.head.appendChild(gaya);
  const NS = "http://www.w3.org/2000/svg";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const el = (t, a, isi) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (isi != null) e.textContent = isi; return e; };
  const fmt = (n) => Number(n || 0).toLocaleString("id-ID", { maximumFractionDigits: 1 });
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
  const tgl = (s, o) => new Date(s + (String(s).length === 10 ? "T00:00:00" : "")).toLocaleDateString("id-ID", o || { day: "numeric", month: "short" });
  const inisial = (n) => String(n || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();
  const bulat = (x, y, w, h, r) => `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  const bulatKanan = (x, y, w, h, r) => (w < r * 2 ? `M${x},${y}h${Math.max(w, 1)}v${h}h${-Math.max(w, 1)}Z` : `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`);

  // ---------- keterangan saat disentuh ----------
  function pasangTip(svg) {
    const kartu = svg.closest(".rk-kartu"); let tip = null;
    const tampil = (e, h) => {
      if (!tip) { tip = document.createElement("div"); tip.className = "rk-tip"; kartu.appendChild(tip); }
      tip.innerHTML = h.dataset.tip;
      const kb = kartu.getBoundingClientRect(), hb = h.getBoundingClientRect(), x = e && e.clientX ? e.clientX : hb.left + hb.width / 2;
      tip.style.left = Math.min(kb.width - 90, Math.max(90, x - kb.left)) + "px"; tip.style.top = (hb.top - kb.top) + "px";
    };
    svg.querySelectorAll(".rk-hit").forEach((h) => {
      h.setAttribute("tabindex", "0");
      h.addEventListener("mousemove", (e) => tampil(e, h)); h.addEventListener("click", (e) => tampil(e, h)); h.addEventListener("focus", () => tampil(null, h));
      const tutup = () => { if (tip) { tip.remove(); tip = null; } }; h.addEventListener("mouseleave", tutup); h.addEventListener("blur", tutup);
    });
  }
  const posTeks = (s) => s.posisi_teks || `${s.nama_tingkat} · Level ${s.level}`;
  const kartu = (tanya, judul, ket, isi) => `<div class="rk-kartu"><span class="rk-tanya">${tanya}</span><h3>${judul}</h3>${ket ? `<p class="rk-ket">${ket}</p>` : ""}${isi}</div>`;
  const delta = (kini, lalu, satuan, lebihBaik, kosong) => {
    if (kosong) return `<span class="rk-d datar">periode lalu tidak ada latihan</span>`;
    if (lalu == null) return `<span class="rk-d datar">belum ada pembanding</span>`;
    const d = Math.round((kini - lalu) * 10) / 10, c = d === 0 ? "datar" : (d > 0) === (lebihBaik !== false) ? "naik" : "turun";
    return `<span class="rk-d ${c}">${d > 0 ? "▲ +" : d < 0 ? "▼ " : "■ "}${d === 0 ? "sama" : fmt(d) + (satuan || "")}</span>`;
  };

  // ======================= RAPOR SATU KELOMPOK =======================
  function rapor(wadah, D, o) {
    o = Object.assign({ satuan: "level", kelompokLbl: "kelompok", target: 80, nilaiRata: false,
      macetKet: "Siswa yang 3 kali atau lebih mengulang level yang sama, atau 8 kali salah di level itu." }, o || {});
    const AK = o.nilaiRata ? "rata-rata nilai" : "akurasi", AKB = o.nilaiRata ? "Rata-rata nilai" : "Akurasi rata-rata", AKS = o.nilaiRata ? "" : "%";
    const K = (D.kelompok || [])[0] || {}, S = D.siswa || [], L = K.lalu || null;
    const latih = (s) => s.n_jawab > 0 || s.n_hasil > 0, aktif = S.filter(latih), akur = (k) => pct(k.n_benar, k.n_jawab);
    const perlu = S.filter((s) => !latih(s) || s.macet || (s.n_jawab >= 10 && pct(s.n_benar, s.n_jawab) < 65));
    const lbl = D.label || `${tgl(D.dari)} – ${tgl(D.sampai)}`;
    const kal = `Dalam ${esc(lbl)}, <b>${K.n_aktif} dari ${K.n_siswa}</b> siswa ${esc(K.kelompok)} berlatih. Kelas menuntaskan <b>${K.n_tuntas} ${o.satuan}</b>, rata-rata <b>${fmt(K.n_siswa ? K.n_tuntas / K.n_siswa : 0)} ${o.satuan}</b> per siswa` +
      (K.n_jawab ? `, dengan ${AK} <b>${akur(K)}${AKS}</b>` : "") + `. ${perlu.length ? `<b>${perlu.length} siswa</b> perlu perhatian.` : "Tidak ada siswa yang perlu perhatian khusus."}`;
    const tile = (l, v, d) => `<div class="rk-tile"><span class="l">${l}</span><span class="v">${v}</span>${d}</div>`;
    const angka = tile("Siswa berlatih", `${K.n_aktif}/${K.n_siswa}`, delta(K.n_aktif, L && L.n_aktif, "", true, L && !L.n_jawab)) +
      tile(`${o.satuan[0].toUpperCase() + o.satuan.slice(1)} dituntaskan`, K.n_tuntas, delta(K.n_tuntas, L && L.n_tuntas, "", true, L && !L.n_jawab)) +
      tile(AKB, K.n_jawab ? akur(K) + AKS : "–", K.n_jawab && L && L.n_jawab ? delta(akur(K), akur(L), " poin") : `<span class="rk-d datar">${L && !L.n_jawab ? "periode lalu tidak ada latihan" : "belum ada pembanding"}</span>`) +
      tile("Perlu perhatian", perlu.length, `<span class="rk-d datar">tidak berlatih, macet, atau ${AK} &lt; 65${AKS}</span>`);
    wadah.innerHTML = `<div class="rk"><div class="rk-pita"><p class="rk-kalimat">${kal}</p></div><div class="rk-angka">${angka}</div>` +
      kartu("Siapa di depan, siapa tertinggal?", "Peta posisi kelas", "Satu titik = satu siswa pada jalur latihan. Tumpukan tinggi di satu tingkat = banyak siswa di sana; mungkin materinya perlu dijelaskan ulang.",
        `<div class="rk-leg"><span><i style="background:var(--rk-t)"></i>naik ≥ 2 ${o.satuan}</span><span><i style="background:var(--rk-s)"></i>naik 1 ${o.satuan}</span><span><i style="background:var(--rk-r)"></i>belum naik / tidak berlatih</span></div><div class="rk-gulir"><svg class="rk-peta" role="img" aria-label="Peta posisi siswa"></svg></div><p class="rk-ket rk-belum"></p>`) +
      `<div class="rk-dua">` +
      kartu("Apakah kelas makin cepat?", `${o.satuan[0].toUpperCase() + o.satuan.slice(1)} dituntaskan per hari latihan`, "", `<div class="rk-gulir"><svg class="rk-tren" role="img" aria-label="${o.satuan} dituntaskan per hari"></svg></div><h4>${AKB.replace(" rata-rata", "")} per hari latihan</h4><div class="rk-gulir"><svg class="rk-akur" role="img" aria-label="Akurasi per hari"></svg></div>`) +
      kartu("Materi apa yang perlu diajarkan ulang?", "Di mana siswa macet", o.macetKet, `<div class="rk-gulir"><svg class="rk-macet" role="img" aria-label="Level tempat siswa macet"></svg></div>`) +
      `</div><div class="rk-dua">` +
      kartu("Siapa yang perlu didekati?", "Perlu perhatian", "", `<ul class="rk-daftar rk-perlu"></ul>`) +
      kartu("Siapa yang patut diapresiasi?", "Bintang periode ini", "", `<ul class="rk-daftar rk-bintang"></ul>`) + `</div></div>`;
    gambarPeta(wadah.querySelector(".rk-peta"), D, o, wadah.querySelector(".rk-belum"));
    gambarTren(wadah.querySelector(".rk-tren"), wadah.querySelector(".rk-akur"), D.harian || [], o);
    gambarMacet(wadah.querySelector(".rk-macet"), D.macet || [], o);
    const daftar = (ul, L2, kanan, kosong) => {
      ul.innerHTML = L2.length ? L2.map((s) => `<li${o.bukaSiswa ? ` data-nisn="${esc(s.nisn)}" tabindex="0" role="button"` : ""}><span class="rk-ava">${esc(inisial(s.nama))}</span><span class="rk-nm">${esc(s.nama)}<small>${s.selesai ? "sudah tamat" : s.tingkat ? esc(posTeks(s)) : "belum pernah berlatih"}</small></span>${kanan(s)}</li>`).join("") : `<li class="rk-kosong">${kosong}</li>`;
      if (o.bukaSiswa) ul.querySelectorAll("[data-nisn]").forEach((li) => { li.onclick = () => o.bukaSiswa(li.dataset.nisn); li.onkeydown = (e) => { if (e.key === "Enter") o.bukaSiswa(li.dataset.nisn); }; });
    };
    const alasan = (s) => !latih(s) ? ["tidak berlatih", "r"] : s.macet ? ["macet", "s"] : [AK + " " + pct(s.n_benar, s.n_jawab) + AKS, "r"];
    daftar(wadah.querySelector(".rk-perlu"), perlu.sort((a, b) => latih(a) - latih(b) || a.nama.localeCompare(b.nama, "id")).slice(0, 12),
      (s) => { const [a, c] = alasan(s); return `<span class="rk-chip ${c}">${a}</span>`; }, "Tidak ada. Semua siswa berlatih tanpa kendala berarti.");
    daftar(wadah.querySelector(".rk-bintang"), aktif.filter((s) => s.naik > 0).sort((a, b) => b.naik - a.naik || pct(b.n_benar, b.n_jawab) - pct(a.n_benar, a.n_jawab)).slice(0, 5),
      (s) => `<span class="rk-chip t">+${s.naik} ${o.satuan}</span>`, `Belum ada siswa yang naik ${o.satuan} pada periode ini.`);
  }

  // ---------- peta posisi: jalur tingkat sebagai lintasan, titik bertumpuk ----------
  function gambarPeta(svg, D, o, ketBelum) {
    const S = (D.siswa || []).filter((s) => s.tingkat || s.selesai), J = D.jalur || [], total = D.total || 1;
    const belum = (D.siswa || []).length - S.length;
    ketBelum.textContent = belum ? `${belum} siswa belum pernah berlatih, sehingga belum punya posisi.` : "";
    if (!S.length || !J.length) { svg.outerHTML = `<p class="rk-ket">Belum ada siswa yang berlatih.</p>`; return; }
    // tampilkan hanya tingkat yang mencakup posisi siswa (± satu tingkat di kiri/kanan)
    const posTingkat = (p) => { let k = 0; J.forEach((t, i) => { if (p + 1 >= t.awal) k = i; }); return k; };
    const lo = Math.max(0, posTingkat(Math.min(...S.map((s) => s.lewat))) - 1), hi = Math.min(J.length - 1, posTingkat(Math.min(total - 1, Math.max(...S.map((s) => s.lewat)))) + 1);
    let seg = J.slice(lo, hi + 1), awal = seg[0].awal - 1, akhir = seg[seg.length - 1].awal - 1 + seg[seg.length - 1].n_level;
    // siswa hanya menempati sebagian kecil jalur (mis. tahap ER berisi 35 level): perbesar ke rentang posisi siswa
    const pMin = Math.min(...S.map((s) => (s.selesai ? total - 1 : s.lewat))), pMax = Math.max(...S.map((s) => (s.selesai ? total - 1 : s.lewat)));
    const zoom = akhir - awal > 24 && akhir - awal > 3 * (pMax - pMin + 1);
    if (zoom) { awal = Math.max(0, pMin - 2); akhir = Math.min(total, pMax + 4); seg = J.filter((t) => t.awal - 1 < akhir && t.awal - 1 + t.n_level > awal); }
    const rentang = akhir - awal;
    const W = 1000, ml = 8, mr = 8, gap = 2, x = (p) => ml + ((Math.min(Math.max(p, awal), akhir - 1) - awal + 0.5) / rentang) * (W - ml - mr);
    const kol = new Map(); S.slice().sort((a, b) => a.lewat - b.lewat).forEach((s) => { const k = s.selesai ? akhir - 1 : s.lewat; if (!kol.has(k)) kol.set(k, []); kol.get(k).push(s); });
    const tumpuk = Math.max(...[...kol.values()].map((v) => v.length)), r = Math.max(3, Math.min(7, (230 / tumpuk - gap) / 2)), top = 14, base = top + tumpuk * (2 * r + gap), H = base + 62;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const pendek = seg.length > 6;
    seg.forEach((t, i) => {
      const a0 = Math.max(t.awal - 1, awal), a1 = Math.min(t.awal - 1 + t.n_level, akhir), x0 = ml + ((a0 - awal) / rentang) * (W - ml - mr), w = ((a1 - a0) / rentang) * (W - ml - mr);
      svg.append(el("rect", { x: x0 + 1, y: base + 6, width: Math.max(2, w - 2), height: 10, rx: 5, fill: "var(--rk-lintas)" }));
      const nama = pendek && w < 150 ? t.nama.split(" ")[0] : t.nama;
      svg.append(el("text", { x: x0 + w / 2, y: base + (zoom ? 40 : 34), "font-size": pendek ? 12 : 13.5, "text-anchor": "middle", class: "rk-kuat" }, nama));
      svg.append(el("text", { x: x0 + w / 2, y: base + (zoom ? 55 : 50), "font-size": 11.5, "text-anchor": "middle" }, zoom && (a0 > t.awal - 1 || a1 < t.awal - 1 + t.n_level) ? `level ${a0 - t.awal + 2}–${a1 - t.awal + 1} dari ${t.n_level}` : `${t.n_level} level`));
      const g = el("g"); g.append(el("rect", { class: "rk-hit", x: x0, y: base, width: w, height: 58, "data-tip": `<b>${esc(t.nama)}</b> · ${t.n_level} level<br>${S.filter((s) => s.tingkat === t.kode && !s.selesai).length} siswa di tingkat ini` })); svg.append(g);
    });
    if (zoom) for (let p = awal; p < akhir; p++) { const t = J.find((u) => p >= u.awal - 1 && p < u.awal - 1 + u.n_level); if (t) svg.append(el("text", { x: x(p), y: base + 24, "font-size": 10.5, "text-anchor": "middle" }, "L" + (p - t.awal + 2))); }
    const warna = (s) => s.naik >= 2 ? "var(--rk-t)" : s.naik === 1 ? "var(--rk-s)" : "var(--rk-r)";
    for (const [p, L] of kol) L.forEach((s, j) => {
      const cy = base - r - j * (2 * r + gap), g = el("g");
      g.append(el("circle", { cx: x(p), cy, r, fill: warna(s), stroke: "#fff", "stroke-width": 2 }));
      g.append(el("circle", { class: "rk-hit", cx: x(p), cy, r: r + 4, "data-tip": `<b>${esc(s.nama)}</b><br>${s.selesai ? "Sudah tamat" : esc(posTeks(s))}<br>${s.n_jawab || s.n_hasil ? `naik ${s.naik} ${o.satuan}${s.n_jawab ? ` · ${o.nilaiRata ? "rata-rata nilai" : "akurasi"} ${pct(s.n_benar, s.n_jawab)}${o.nilaiRata ? "" : "%"}` : ""}` : "tidak berlatih pada periode ini"}${s.macet ? " · <b>macet</b>" : ""}` }));
      svg.append(g);
    });
    for (const [p, L2] of kol) if (L2.length >= 10 && L2.length === tumpuk) svg.append(el("text", { x: x(p), y: base - L2.length * (2 * r + gap) - 4, "font-size": 12, "text-anchor": "middle", class: "rk-kuat" }, `${L2.length} siswa`));
    pasangTip(svg);
  }

  // ---------- per hari latihan (rentang panjang diringkas per minggu) + akurasi ----------
  function gambarTren(svg, svgA, H0, o) {
    if (!H0.length) { svg.closest(".rk-kartu").querySelector("h4").remove(); svgA.remove(); svg.outerHTML = `<p class="rk-ket">Belum ada latihan pada periode ini.</p>`; return; }
    let T = H0.map((h) => ({ d: h.tanggal, lv: h.n_tuntas, j: h.n_jawab, b: h.n_benar, n: h.n_siswa, minggu: false }));
    if (T.length > 14) {   // diringkas per minggu (Senin)
      const m = new Map(); T.forEach((t) => { const d = new Date(t.d + "T00:00:00"), sen = new Date(d); sen.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const k = sen.toISOString().slice(0, 10);
        const a = m.get(k) || { d: k, lv: 0, j: 0, b: 0, n: 0, minggu: true }; a.lv += t.lv; a.j += t.j; a.b += t.b; a.n = Math.max(a.n, t.n); m.set(k, a); });
      T = [...m.values()].sort((a, b) => a.d.localeCompare(b.d));
    }
    const W = 520, Hh = 210, ml = 34, mr = 8, mt = 20, mb = 30, pw = W - ml - mr, ph = Hh - mt - mb;
    svg.setAttribute("viewBox", `0 0 ${W} ${Hh}`);
    const mx = Math.max(1, ...T.map((t) => t.lv)), st = [1, 2, 5, 10, 20, 50, 100, 200, 500].find((v) => mx / v <= 5) || 1000, ym = Math.ceil((mx * 1.15) / st) * st;
    const y = (v) => mt + ph - (v / ym) * ph, slot = pw / T.length, bw = Math.min(24, slot - 6);
    for (let v = 0; v <= ym; v += st) { svg.append(el("line", { x1: ml, x2: W - mr, y1: y(v), y2: y(v), stroke: "var(--rk-grid)", "stroke-width": 1 })); svg.append(el("text", { x: ml - 6, y: y(v) + 4, "font-size": 11, "text-anchor": "end" }, v)); }
    const lb = (t) => (t.minggu ? "mg " : "") + tgl(t.d);
    T.forEach((t, i) => {
      const cx = ml + i * slot + slot / 2, h = y(0) - y(t.lv), akhir = i === T.length - 1, g = el("g");
      if (t.lv) g.append(el("path", { d: bulat(cx - bw / 2, y(t.lv), bw, h, Math.min(4, h / 2)), fill: akhir ? "var(--rk-seq-4)" : "var(--rk-seq-2)" }));
      if (akhir || t.lv === mx) g.append(el("text", { x: cx, y: y(t.lv) - 6, "font-size": 12, "text-anchor": "middle", class: "rk-kuat" }, t.lv));
      if (T.length <= 8 || i % Math.ceil(T.length / 8) === 0 || akhir) g.append(el("text", { x: cx, y: Hh - 10, "font-size": 11, "text-anchor": "middle" }, lb(t)));
      g.append(el("rect", { class: "rk-hit", x: ml + i * slot, y: mt, width: slot, height: ph, "data-tip": `${t.minggu ? "Minggu mulai " : ""}${tgl(t.d, { weekday: t.minggu ? undefined : "long", day: "numeric", month: "long" })}<br><b>${t.lv} ${o.satuan}</b> dituntaskan · ${t.n} siswa berlatih${t.j ? ` · ${o.nilaiRata ? "rata-rata nilai" : "akurasi"} ${pct(t.b, t.j)}${o.nilaiRata ? "" : "%"}` : ""}` }));
      svg.append(g);
    });
    svg.append(el("line", { x1: ml, x2: W - mr, y1: y(0), y2: y(0), stroke: "var(--garis-2)", "stroke-width": 1 }));
    pasangTip(svg);
    // akurasi 50–100 dengan garis target
    const AH = 100, am = 14, ab = 18, ay = (v) => am + (AH - am - ab) * (1 - (Math.max(50, v) - 50) / 50); svgA.setAttribute("viewBox", `0 0 ${W} ${AH}`);
    [50, o.target, 100].forEach((v) => { svgA.append(el("line", { x1: ml, x2: W - mr, y1: ay(v), y2: ay(v), stroke: v === o.target ? "var(--emas)" : "var(--rk-grid)", "stroke-width": v === o.target ? 1.5 : 1 })); svgA.append(el("text", { x: ml - 6, y: ay(v) + 4, "font-size": 11, "text-anchor": "end" }, v)); });
    svgA.append(el("text", { x: W - mr, y: ay(o.target) - 5, "font-size": 11, "text-anchor": "end", class: "rk-kuat" }, `target ${o.target}${o.nilaiRata ? "" : "%"}`));
    const P = T.map((t, i) => [ml + i * slot + slot / 2, t.j ? ay(pct(t.b, t.j)) : null]).filter((p) => p[1] != null);
    if (P.length > 1) svgA.append(el("polyline", { points: P.map((p) => p.join(",")).join(" "), fill: "none", stroke: "var(--rk-seq-4)", "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }));
    T.forEach((t, i) => { if (!t.j) return; const cx = ml + i * slot + slot / 2, cy = ay(pct(t.b, t.j)), g = el("g");
      g.append(el("circle", { cx, cy, r: 4, fill: "var(--rk-seq-4)", stroke: "#fff", "stroke-width": 2 }));
      g.append(el("circle", { class: "rk-hit", cx, cy, r: 10, "data-tip": o.nilaiRata ? `${lb(t)}: rata-rata nilai <b>${pct(t.b, t.j)}</b> (${t.j} kegiatan)` : `${lb(t)}: akurasi <b>${pct(t.b, t.j)}%</b> (${t.b} dari ${t.j} jawaban benar)` })); svgA.append(g); });
    const tl = T.filter((t) => t.j).pop(); if (tl) { const i = T.indexOf(tl); svgA.append(el("text", { x: ml + i * slot + slot / 2, y: ay(pct(tl.b, tl.j)) - 9, "font-size": 12, "text-anchor": "middle", class: "rk-kuat" }, pct(tl.b, tl.j) + (o.nilaiRata ? "" : "%"))); }
    pasangTip(svgA);
  }

  // ---------- di mana siswa macet ----------
  function gambarMacet(svg, M, o) {
    if (!M.length) { svg.outerHTML = `<p class="rk-ket"><b>Tidak ada siswa yang macet.</b> Semua siswa masih bergerak.</p>`; return; }
    const W = 520, rh = 38, ml = 200, mr = 76, H = M.length * rh + 12, mx = Math.max(...M.map((m) => m.n)), x = (v) => ml + (v / mx) * (W - ml - mr);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    M.forEach((m, i) => { const cy = 6 + i * rh + rh / 2, g = el("g"), bh = 18, nm = m.label || `${m.nama_tingkat} · Level ${m.level}`;
      g.append(el("text", { x: ml - 12, y: cy + 5, "font-size": 13, "text-anchor": "end", class: i === 0 ? "rk-kuat" : "" }, nm.length > 30 ? nm.slice(0, 29) + "…" : nm));
      g.append(el("path", { d: bulatKanan(ml, cy - bh / 2, x(m.n) - ml, bh, 4), fill: m.n >= 4 ? "var(--rk-r)" : m.n >= 2 ? "var(--rk-s)" : "var(--rk-seq-2)" }));
      g.append(el("text", { x: x(m.n) + 8, y: cy + 5, "font-size": 13, class: "rk-kuat" }, `${m.n} siswa`));
      g.append(el("rect", { class: "rk-hit", x: 0, y: cy - rh / 2, width: W, height: rh, "data-tip": `<b>${esc(nm)}</b><br>${m.n} siswa macet di sini` })); svg.append(g); });
    svg.append(el("line", { x1: ml, x2: ml, y1: 2, y2: H - 2, stroke: "var(--garis-2)", "stroke-width": 1 }));
    pasangTip(svg);
  }

  // ======================= PERBANDINGAN ANTARKELOMPOK =======================
  function banding(wadah, D, o) {
    o = Object.assign({ satuan: "level", kelompokLbl: "kelompok" }, o || {});
    const K0 = (D.kelompok || []).filter((k) => k.n_siswa > 0), K = K0.filter((k) => k.n_aktif > 0), diam = K0.filter((k) => !k.n_aktif).map((k) => k.kelompok);
    const ketDiam = diam.length ? `<p class="rk-ket"><b>Tidak berlatih pada periode ini (${diam.length}):</b> ${diam.map(esc).join(", ")}. Tidak ikut dibandingkan.</p>` : "";
    if (!K.length) { wadah.innerHTML = `<div class="rk"><div class="rk-pita"><p class="rk-kalimat">Belum ada ${o.kelompokLbl} yang berlatih pada periode ini.</p></div>${ketDiam}</div>`; return; }
    const per = (k) => (k.n_siswa ? k.n_tuntas / k.n_siswa : 0), L = K.slice().sort((a, b) => per(b) - per(a) || a.kelompok.localeCompare(b.kelompok, "id", { numeric: true }));
    const a = L[0], z = L[L.length - 1], lbl = D.label || `${tgl(D.dari)} – ${tgl(D.sampai)}`;
    const kal = L.length > 1
      ? `Dalam ${esc(lbl)}, kemajuan terbaik: <b>${esc(a.kelompok)}</b> (${fmt(per(a))} ${o.satuan} per siswa, ${pct(a.n_aktif, a.n_siswa)}% berlatih). Perlu didorong: <b>${esc(z.kelompok)}</b> (${fmt(per(z))} ${o.satuan} per siswa, ${pct(z.n_aktif, z.n_siswa)}% berlatih).`
      : `Dalam ${esc(lbl)}, ${esc(a.kelompok)} menuntaskan ${fmt(per(a))} ${o.satuan} per siswa; ${pct(a.n_aktif, a.n_siswa)}% siswa berlatih.`;
    wadah.innerHTML = `<div class="rk"><div class="rk-pita"><p class="rk-kalimat">${kal}</p></div>${ketDiam}<div class="rk-dua">` +
      kartu(`${o.kelompokLbl[0].toUpperCase() + o.kelompokLbl.slice(1)} mana yang paling berkembang?`, `${o.satuan[0].toUpperCase() + o.satuan.slice(1)} dituntaskan per siswa`, `Dihitung per siswa supaya ${o.kelompokLbl} besar dan kecil adil dibandingkan. Angka di kanan = siswa yang berlatih. Ketuk baris untuk membuka rapornya.`, `<div class="rk-gulir"><svg class="rk-banding" role="img" aria-label="Peringkat ${o.kelompokLbl}"></svg></div>`) +
      kartu("Siapa yang konsisten tiap minggu?", "Keaktifan per minggu", `Warna makin gelap = makin banyak siswa yang berlatih minggu itu.`, `<div class="rk-leg rk-leg-panas"></div><div class="rk-gulir"><svg class="rk-panas" role="img" aria-label="Keaktifan per minggu"></svg></div>`) +
      `</div></div>`;
    // peringkat
    const svg = wadah.querySelector(".rk-banding"), W = 520, rh = 34, ml = 84, mr = 100, H = L.length * rh + 26, mx = Math.max(1, Math.ceil(per(a) * 1.18)), x = (v) => ml + (v / mx) * (W - ml - mr);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const st = mx > 10 ? Math.ceil(mx / 5) : mx > 4 ? 2 : 1;
    for (let v = 0; v <= mx; v += st) { svg.append(el("line", { x1: x(v), x2: x(v), y1: 4, y2: H - 22, stroke: "var(--rk-grid)", "stroke-width": 1 })); svg.append(el("text", { x: x(v), y: H - 6, "font-size": 11, "text-anchor": "middle" }, v)); }
    L.forEach((k, i) => { const cy = 8 + i * rh + rh / 2, g = el("g"), bh = 16;
      g.append(el("text", { x: ml - 12, y: cy + 5, "font-size": 13, "text-anchor": "end", class: "rk-kuat" }, k.kelompok));
      g.append(el("path", { d: bulatKanan(ml, cy - bh / 2, x(per(k)) - ml, bh, 4), fill: L.length > 2 && i === 0 ? "var(--rk-t)" : L.length > 2 && i === L.length - 1 ? "var(--rk-r)" : "var(--rk-seq-3)" }));
      g.append(el("text", { x: x(per(k)) + 8, y: cy + 5, "font-size": 12.5, class: "rk-kuat" }, fmt(per(k))));
      g.append(el("text", { x: W - 4, y: cy + 5, "font-size": 12, "text-anchor": "end" }, `${pct(k.n_aktif, k.n_siswa)}% berlatih`));
      g.append(el("rect", { class: "rk-hit", "data-kel": k.kelompok, x: 0, y: cy - rh / 2, width: W, height: rh, "data-tip": `<b>${esc(k.kelompok)}</b> · ${k.n_siswa} siswa<br>${k.n_tuntas} ${o.satuan} (${fmt(per(k))} per siswa) · ${pct(k.n_aktif, k.n_siswa)}% berlatih${k.n_jawab ? ` · ${o.nilaiRata ? "rata-rata nilai" : "akurasi"} ${pct(k.n_benar, k.n_jawab)}${o.nilaiRata ? "" : "%"}` : ""}` }));
      svg.append(g); });
    pasangTip(svg);
    if (o.bukaKelompok) svg.querySelectorAll("[data-kel]").forEach((h) => { h.style.cursor = "pointer"; h.addEventListener("click", () => o.bukaKelompok(h.dataset.kel)); h.addEventListener("keydown", (e) => { if (e.key === "Enter") o.bukaKelompok(h.dataset.kel); }); });
    // peta panas kelompok × minggu
    const ph = wadah.querySelector(".rk-panas"), minggu = []; for (let t = new Date(D.dari + "T00:00:00"); t <= new Date(D.sampai + "T00:00:00"); t.setDate(t.getDate() + 1)) { const s = new Date(t); s.setDate(t.getDate() - ((t.getDay() + 6) % 7)); const k = `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, "0")}-${String(s.getDate()).padStart(2, "0")}`; if (!minggu.includes(k)) minggu.push(k); }
    const M = minggu.slice(-12), cw = Math.max(26, (W - ml - 4) / Math.max(M.length, 1)), PW = ml + cw * M.length + 4, ch = 28, mt = 24, PH = mt + L.length * ch + 4;
    ph.setAttribute("viewBox", `0 0 ${PW} ${PH}`);
    const step = ["--rk-seq-0", "--rk-seq-1", "--rk-seq-2", "--rk-seq-3", "--rk-seq-4", "--rk-seq-5"], kls = (v) => step[Math.min(5, Math.floor(v / 20) + (v > 0 ? 1 : 0))];
    M.forEach((m, j) => { if (M.length <= 8 || j % 2 === 0) ph.append(el("text", { x: ml + j * cw + cw / 2, y: mt - 8, "font-size": 11, "text-anchor": "middle" }, tgl(m))); });
    L.forEach((k, i) => { ph.append(el("text", { x: ml - 12, y: mt + i * ch + ch / 2 + 5, "font-size": 13, "text-anchor": "end", class: "rk-kuat" }, k.kelompok));
      M.forEach((m, j) => { const w = (k.minggu || []).find((x2) => x2.mulai === m), v = pct(w ? w.n_aktif : 0, k.n_siswa), g = el("g");
        g.append(el("rect", { x: ml + j * cw + 1, y: mt + i * ch + 1, width: cw - 2, height: ch - 2, rx: 4, fill: `var(${kls(v)})` }));
        g.append(el("rect", { class: "rk-hit", x: ml + j * cw, y: mt + i * ch, width: cw, height: ch, "data-tip": `<b>${esc(k.kelompok)}</b> · minggu ${tgl(m)}<br>${w ? w.n_aktif : 0} dari ${k.n_siswa} siswa berlatih (${v}%)` })); ph.append(g); }); });
    wadah.querySelector(".rk-leg-panas").innerHTML = ["0%", "1–19%", "20–39%", "40–59%", "60–79%", "80–100%"].map((t, i) => `<span><i class="k" style="background:var(${step[i]})"></i>${t}</span>`).join("");
    pasangTip(ph);
  }

  root.REKAP_KELAS = { rapor, banding };
})(window);
