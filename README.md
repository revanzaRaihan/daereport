# Daely Report (`dreport-studio-next`)

Sistem otomasi laporan progres belajar murid berbasis AI untuk pengajar les privat dan kursus pemrograman, dilengkapi dengan portal orang tua publik interaktif.

---

## Fitur Utama

- **Pembuat Laporan AI & Manual**: Membuat draf laporan harian dengan gaya bahasa konsisten berbasis contoh dataset Anda menggunakan model Gemini / Groq.
- **Portal Publik Orang Tua (`/p/[slug]`)**: Halaman transparan untuk wali murid melihat riwayat pertemuan, catatan progres belajar, proyek murid, serta mengirimkan masukan.
- **Manajemen Murid & Jadwal**: Pendataan murid, mata pelajaran, jumlah pertemuan, jadwal les mingguan, dan integrasi WhatsApp.
- **Riwayat Laporan & Paginasi Cerdas**: Manajemen arsip laporan dengan filter periode, pencarian teks, dan paginasi maksimal 5 laporan per tampilan.
- **Kotak Masuk Masukan Ortu (`/inbox`)**: Pusat review dan tindak lanjut umpan balik dari orang tua murid.
- **Dataset Gaya Bahasa**: Penyimpanan contoh format penulisan laporan dan rekomendasi latihan progresif agar AI beradaptasi dengan gaya guru.
- **Desain Adaptif (Palet 70-20-10 & Dark Mode)**:
  - 70% Background (`#FAF9F5` / `#262624`)
  - 20% Card & Sidebar (`#F0EEE6` / `#30302E`)
  - 10% Aksen Hijau (`#4da23c`)
- **Dukungan Multibahasa**: Beralih instan antara Bahasa Indonesia (ID) dan English (EN).

---

## Teknologi

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS v4
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Storage, Auth)
- **Kompresi Gambar**: Canvas-based client-side compression (zero external dependency)

---

## Menjalankan Proyek Secara Lokal

1. Salin konfigurasi environment:
   ```bash
   cp .env.example .env.local # atau lengkapi NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```

3. Buka [http://localhost:3000](http://localhost:3000) pada peramban Anda.

---

## Dokumentasi & Backlog

Catatan backlog pengembangan dan optimasi lanjutan tersimpan di [docs/WATCHLIST.md](file:///c:/Users/user/.gemini/antigravity/scratch/dreport-studio-next/docs/WATCHLIST.md).
