# Website Profil SMPN 5 Bandung

## Struktur folder
```
smpn5-bandung/
├── index.html          # Struktur halaman (semua section)
├── css/style.css       # Seluruh gaya, warna, animasi, responsif
├── js/script.js        # Interaksi: scroll, timeline, tilt, counter, form
└── assets/images/      # Tempat foto & logo sekolah
```

## Cara menjalankan
1. Ekstrak ZIP, lalu klik dua kali `index.html` (butuh internet hanya untuk font Plus Jakarta Sans; tanpa internet tampil dengan font cadangan).
2. Untuk hosting: unggah seluruh folder ke Netlify, Vercel, GitHub Pages, atau hosting sekolah.

## Cara mengganti konten
- **Warna**: blok `:root` di awal `css/style.css`.
- **Teks, statistik, berita, kontak**: langsung di `index.html` (cari komentar `<!-- ===== ... ===== -->`).
- **Foto**: taruh di `assets/images/`, lalu ganti emoji/gradien, contoh galeri:
  `<span class="bg" style="background:url('assets/images/lobi.jpg') center/cover"></span>`
- **Statistik animasi**: atribut `data-n` pada elemen `.stat b`.

## Urutan demo saat presentasi
1. Tirai pembuka dan hero (CTA berdenyut, statistik naik, ticker).
2. Hover menu: underline emas bergeser dan dropdown.
3. Scroll ke Visi: kartu 3D tilt.
4. Timeline: scroll pelan lalu klik tonggak.
5. Informasi, Ekskul, Galeri: hover tiap kartu.
6. Form kontak: efek fokus dan notifikasi.
7. Perkecil jendela / mode HP untuk menunjukkan responsif.
