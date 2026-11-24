# 🎓 Portal Belajar Interaktif & Karir

Platform pembelajaran dan pengembangan karir berbasis gamifikasi yang dirancang untuk memberikan pengalaman belajar yang interaktif, personal, dan fokus pada tujuan pengguna (kerja, kuliah, upskill, sertifikasi).

## ✨ Fitur Utama

- **Dashboard Terpusat**: Ringkasan progres harian, target belajar, dan rekomendasi kursus yang dipersonalisasi.
- **Katalog Kursus**: Temukan berbagai kursus dengan pencarian dan filter berdasarkan level.
- **Sistem Kuis Interaktif**:
  - Pertanyaan pilihan ganda dengan waktu (Time Attack).
  - Mode nyawa (Hearts) untuk memberikan tantangan.
  - Opsi *Hint* dari AI Mentor.
  - Riwayat jawaban salah dan opsi untuk mengulang.
- **Gamifikasi**: Dapatkan XP, tingkatkan level, kumpulkan Gems, dan pertahankan *Streak* belajarmu.
- **Toko & Hadiah**: Gunakan Gems untuk membeli *Streak Freeze* atau item lainnya.
- **Komunitas & Forum**: Diskusikan materi, bagikan tips, dan berkolaborasi dengan pelajar lain.
- **Bursa Kerja**: Cari lowongan pekerjaan yang sesuai dengan keahlian yang telah dipelajari.

## 🚀 Teknologi

- **Frontend**: React 18 (Vite), TypeScript, Tailwind CSS
- **Routing**: React Router DOM
- **Animasi**: Framer Motion
- **Ikon**: Lucide React
- **Komponen**: Shadcn UI (terinspirasi, menggunakan gaya Tailwind langsung)

## 🛠️ Cara Menjalankan

1. **Install dependensi**:
   \`\`\`bash
   npm install
   \`\`\`

2. **Jalankan server pengembangan**:
   \`\`\`bash
   npm run dev
   \`\`\`
   Aplikasi akan berjalan di \`http://localhost:3000\`.

3. **Build untuk produksi**:
   \`\`\`bash
   npm run build
   npm start
   \`\`\`

## 📌 Struktur Folder

- \`/src/components\`: Berisi semua tampilan halaman (Views) dan komponen UI.
- \`/src/data\`: Dummy data untuk kursus, kuis, forum, pekerjaan, dll.
- \`/src/types.ts\`: Definisi tipe data TypeScript untuk seluruh aplikasi.
- \`/server.ts\`: (Jika ada backend/Express) Mengatur endpoint API.

## 🎨 Design System & UX

Aplikasi ini menggunakan sistem desain yang sederhana dan bersih:
- **Warna Utama**: Biru (\`blue-600\`) untuk aksi utama, dengan aksen Emerald (Sukses) dan Rose (Gagal/Nyawa).
- **Tipografi**: Inter (Sans) dan display font yang bersih.
- **Animasi**: Transisi mulus antar halaman dan mikro-interaksi pada tombol dan kuis.
