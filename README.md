# 🎓 Skillora — Platform Edukasi Interaktif, Sertifikasi & Karir

Platform pembelajaran, asesmen adaptif, simulasi wawancara AI, dan penyaluran karir berbasis gamifikasi yang dibangun dengan arsitektur full-stack modern.

## ✨ Fitur Utama

- **LMS & Katalog Kursus**: Materi terstruktur, progres pelajaran, bookmark, dan manajemen kursus (Portal Mentor/Admin).
- **Sistem Kuis & Asesmen Adaptif (CAT)**: Kuis berbatas waktu, Flash Challenge harian, dan asesmen adaptif berbasis AI.
- **AI Career Suite**:
  - **Duo Owl Mentor AI**: Bantuan belajar kontekstual sesuai materi aktif.
  - **Mock Interview Suara AI (WebSocket + Gemini Live)** & **Simulasi STAR/HRD**.
  - **CV ATS Builder & Audit AI**: Analisis kecocokan CV terhadap lowongan target.
  - **Review Proyek & Sertifikat Terverifikasi Publik** (`/verify/:id`).
- **Gamifikasi & Ekonomi**: XP, Level, Gems, Streak & Streak Freeze, Daily Quests, Toko Hadiah, Wallet Ledger, dan Leaderboard.
- **Komunitas & Bursa Kerja**: Forum diskusi, ruang kolaborasi tim real-time (WebSocket), event/webinar, beasiswa, mentoring 1-on-1, dan Portal HRD/Recruiter.

## 🚀 Teknologi

- **Frontend**: React 19, Vite 6, TypeScript, Tailwind CSS v4, React Router v7, TanStack Query, `motion`, Lucide React, Recharts.
- **Backend**: Node.js, Express, WebSocket (`ws`), Drizzle ORM, PostgreSQL (`pg`).
- **Autentikasi & AI**: Firebase Auth / Firebase Admin SDK, Google GenAI SDK (`@google/genai`).
- **Testing**: Vitest & Supertest.

## 🛠️ Cara Menjalankan

1. **Salin konfigurasi environment**:
   ```bash
   cp .env.example .env
   ```
   Isi `GEMINI_API_KEY`, kredensial PostgreSQL (`SQL_HOST`, `SQL_DB_NAME`, `SQL_USER`, `SQL_PASSWORD`), dan `BILLING_WEBHOOK_SECRET`.

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Sinkronisasi migrasi database (Drizzle)**:
   ```bash
   npm run db:migrate
   ```

4. **Jalankan server pengembangan**:
   ```bash
   npm run dev
   ```
   Aplikasi berjalan di `http://localhost:3000`.

5. **Typecheck, Test, dan Build Produksi**:
   ```bash
   npm run lint
   npm test
   npm run build
   npm start
   ```

## 📌 Struktur Folder

- `server.ts`: Entry point Express, keamanan (Helmet, CORS, Rate Limiter), API Router (`/api/v1`), dan WebSocket Hub.
- `src/server/`: Backend berlapis (`routes/`, `controllers/`, `services/`, `repositories/`, `middlewares/`, `wsHub.ts`, `tests/`).
- `src/db/`: Konfigurasi koneksi PostgreSQL dan skema Drizzle (`schema.ts`).
- `src/features/` & `src/components/`: Modul tampilan dan UI frontend.
- `src/api/apiClient.ts`: Klien HTTP terpusat dengan injeksi Firebase ID Token otomatis.
