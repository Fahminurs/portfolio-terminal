# fahmi.dev — Terminal Edition

Portofolio Fahmi Nursafaat (Computer Engineer, Bandung) yang dirancang sebagai satu sesi terminal yang bisa di-scroll. Setiap section adalah output dari sebuah command (`whoami`, `ls -la ./projects`, `tail -f experience.log`, …).

**Stack:** Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS v4 · Motion · cmdk · Shiki · asciinema-player · NumberFlow · figlet

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build produksi
npm run dither     # public/media/*.jpg → mask 1-bit di public/media/dither/
```

Salin `.env.example` ke `.env.local` untuk mengaktifkan form kontak (Resend). Tanpa env, form tetap jalan dan menampilkan fallback.

## Fitur

- Command palette (`/` atau `Ctrl+K`): `help`, `cd`, `open <projek>`, `lpr resume`, `plain`, `theme amber|green|ice`, `sudo hire-me`, …
- Potongan kode asli (Shiki) dan diagram timing UART 8N1 yang dirender dari firmware ParkEasy
- Dither reveal 1-bit untuk foto, filter Archive bergaya dial/penggaris (chip di HP & tablet)
- Mode `plain` (`?plain=1`) dan `prefers-reduced-motion`: semua efek mati
- Print stylesheet: `lpr resume` / `Ctrl+P` menghasilkan CV bersih
- Placeholder `[ no signal ]` untuk aset yang belum ada (bukan gambar stok / AI)

Spesifikasi lengkap ada di `PRD-terminal.md` (di luar repo ini).
