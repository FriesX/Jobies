# 🚀 Jobies — AI Job Search Web App

> **Grounded AI Career Strategist, ATS-Compliant CV Tailoring, Fit Analysis, and Application Tracker.**  
> Built with Next.js 15 (App Router), TypeScript, Prisma ORM, Supabase (PostgreSQL & Storage), Google Gen AI SDK (Gemini), and Tailwind CSS.

---

## 🌟 Fitur Utama

- 🛡️ **Deterministic Safety Gate & SSRF Shield**: Memfilter teks lowongan kerja mentah dari internet sebagai data tidak tepercaya (*untrusted data*), membersihkan HTML tersembunyi, mendeteksi karakter invisible/zero-width Unicode, dan memblokir serangan *Prompt Injection* sebelum mencapai LLM.
- 🔐 **Google OAuth 2.0 (OpenID Connect)**: Autentikasi sesi server yang aman dengan validasi `state` dan `nonce`. Identitas pengguna diikat ke Google `sub` unik (bukan email). Dilengkapi fitur **Instant Demo Login** untuk pengujian langsung.
- 📂 **Private Document Vault**: Upload file CV (PDF, DOCX, TXT) hingga 10MB dengan ekstraksi teks serverless otomatis dan penyimpanan privat di Supabase Storage dengan *signed URLs*.
- 🎯 **Job Intake 3 Mode**: Input lowongan via URL (dengan SSRF Shield), Paste deskripsi pekerjaan, atau Form manual.
- 🧠 **Gemini AI Fit Analysis**: Evaluasi kecocokan kandidat dengan skor 0–100, rekomendasi (`Apply`, `Consider`, `Skip`), breakdown 4 dimensi (*Requirements*, *Skills*, *Experience*, *Location*), serta rincian bukti grounded fact vs gap.
- 📑 **Tailored CV (Output PDF ATS-Compliant)**: Menghasilkan resume tailored yang berakar kuat pada pengalaman nyata kandidat menggunakan `@react-pdf/renderer` dengan layout bersih ramah ATS.
- ✍️ **Cover Letter (Full-Text Markdown)**: Menyusun surat lamaran terpersonalisasi dalam format Markdown dengan editor dua kolom (live preview) dan tombol *copy-to-clipboard*.
- 🕵️ **Dual-Pass AI Fact-Check Reviewer**: Audit independen lapis kedua untuk mendeteksi halusinasi atau klaim yang tidak didukung oleh CV sumber asli (*unsupported claims checker*).
- 🎤 **Interview Prep & Mock Room**: Panduan pertanyaan teknis dan behavioral (STAR format), strategi jembatan jujur (*honesty bridges*), dan simulator wawancara interaktif berbasis teks.
- 📊 **Application Tracker (Kanban Board)**: Melacak 8 status lamaran (`Saved`, `Screening`, `Applied`, `Interview`, `Offer`, `Rejected`, `Closed`) dengan selebrasi confetti saat menerima `Offer`.

---

## 🛠️ Tech Stack

| Komponen | Teknologi |
|---|---|
| **Framework** | Next.js 15.1 (App Router, Server Actions, Route Handlers) |
| **Language** | TypeScript |
| **Styling & UI** | Tailwind CSS, Lucide React, Theme Toggle (Dark/Light) |
| **Database & ORM** | Supabase (PostgreSQL) + Prisma ORM v6 |
| **Object Storage** | Supabase Storage (Private Bucket S3-compatible) |
| **AI Engine** | Google Gemini API (`@google/generative-ai`) |
| **PDF Generation** | `@react-pdf/renderer` |
| **Document Parsers** | `pdf-parse`, `mammoth` |
| **Auth & Security** | Jose (JWT HttpOnly cookies), Google OAuth OIDC |

---

## 📋 Konfigurasi Environment Variables

Salin file `.env.example` menjadi `.env.local`:

```bash
cp .env.example .env.local
```

Isi variabel berikut:

```env
# Google Gemini API
GEMINI_API_KEY="your-gemini-api-key"

# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase Storage (S3-compatible / Supabase Client)
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
SUPABASE_BUCKET="job-search-documents"

# Google OAuth 2.0 (OpenID Connect)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# App & Session Secret
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret-key-min-32-chars"
```

---

## 🚀 Panduan Setup & Deployment Step-by-Step

### Langkah 1: Setup Supabase (Database & Storage)

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan buat project baru.
2. Simpan **Database Password** yang Anda buat.
3. Buka **Project Settings** > **Database** > bagian **Connection Pooling** / **Connection Strings**:
   - Salin **URI (Transaction pooler - port 6543 / 5432)** untuk `DATABASE_URL`.
   - Salin **Direct Connection (port 5432)** untuk `DIRECT_URL`.
4. Buka **Project Settings** > **API**:
   - Salin `Project URL` ke `NEXT_PUBLIC_SUPABASE_URL`.
   - Salin `anon public` key ke `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Salin `service_role secret` key ke `SUPABASE_SERVICE_ROLE_KEY`.
5. Buka menu **Storage** di sidebar Supabase:
   - Klik **New Bucket**, beri nama `job-search-documents`.
   - Pastikan opsi **Public Bucket** dimatikan (**Private**).
6. Jalankan migrasi Prisma untuk membuat tabel di Supabase:
   ```bash
   npx prisma db push
   ```

---

### Langkah 2: Setup Google OAuth 2.0

1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat project baru, lalu buka **APIs & Services** > **OAuth consent screen**:
   - Pilih **External**, isi App name dan email support.
3. Buka menu **Credentials** > **Create Credentials** > **OAuth client ID**:
   - Application type: **Web application**.
   - Name: `Jobies Web App`.
   - Authorized JavaScript origins:
     - `http://localhost:3000` (untuk dev)
     - `https://your-app.vercel.app` (untuk produksi)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (untuk dev)
     - `https://your-app.vercel.app/api/auth/google/callback` (untuk produksi)
4. Salin `Client ID` dan `Client Secret` ke file konfigurasi Anda.

---

### Langkah 3: Setup Google Gemini API Key

1. Buka [Google AI Studio](https://aistudio.google.com/).
2. Buat API key baru dan simpan pada variabel `GEMINI_API_KEY`.

---

### Langkah 4: Menjalankan di Lokal (Development)

```bash
# Install dependencies
npm install --legacy-peer-deps

# Generate Prisma Client
npx prisma generate

# Jalankan server development
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Anda dapat langsung menggunakan tombol **Instant Demo Mode (1-Click Login)** untuk menjelajahi dashboard!

---

### Langkah 5: Deployment ke Vercel

1. Buka [Vercel Dashboard](https://vercel.com/dashboard) dan klik **Add New Project**.
2. Hubungkan repository GitHub Anda (`FriesX/Jobies`).
3. Pada bagian **Environment Variables**, tambahkan seluruh variabel dari `.env.example`:
   - `GEMINI_API_KEY`
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_BUCKET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_URL` (isi dengan domain Vercel Anda, misal: `https://jobies.vercel.app`)
   - `NEXTAUTH_SECRET` (string acak minimal 32 karakter)
4. Build Command: `npm run build` (atau otomatis dari Next.js).
5. Klik **Deploy**.
6. Setelah deployment selesai, salin URL produksi Vercel Anda dan tambahkan ke **Authorized Redirect URIs** di Google Cloud Console.

---

## 🧪 Testing & Verifikasi

Jalankan test suite keamanan deterministic:
```bash
node --experimental-strip-types scripts/verify-security.mjs
```

Jalankan type-checking TypeScript:
```bash
npx tsc --noEmit
```

Jalankan build produksi:
```bash
npm run build
```

---

## 📜 Lisensi & Privasi

Aplikasi ini dibangun untuk privasi data pencari kerja. Data pribadi, CV asli, dan riwayat lamaran Anda disimpan secara terisolasi dan tidak dibagikan secara publik.
