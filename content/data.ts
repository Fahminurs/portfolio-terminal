// Single source of truth — extracted from wireframe-portfolio-v11.html

export const profile = {
  first: "FAHMI",
  last: "NURSAFAAT",
  role: "Computer Engineer",
  tagline:
    "Merancang dan membangun software serta sistem embedded untuk menyelesaikan masalah nyata.",
  geo: { lat: "N 06.9039°", lng: "E 107.7233°", city: "BANDUNG, ID" },
  scope: "SOFTWARE / EMBEDDED / NETWORKING / COMPUTER VISION",
  status: [
    { k: "STATUS", v: "OPEN_TO_WORK", tone: "ok" as const },
    { k: "LOCATION", v: "Bandung, ID" },
    { k: "FOCUS", v: "Software / Embedded" },
    { k: "EXPERIENCE", v: "Project-Based" },
  ],
  socials: [
    { short: "in", label: "LinkedIn", href: "https://www.linkedin.com/" },
    { short: "ig", label: "Instagram", href: "https://www.instagram.com/" },
    { short: "gh", label: "GitHub", href: "https://github.com/Fahminurs" },
  ],
  github: "https://github.com/Fahminurs",
};

export const about = {
  quote:
    "Saya membangun teknologi dengan memahami masalah sebelum merancang solusinya.",
  paragraphs: [
    "Saya merupakan lulusan Program Studi Teknik Komputer Universitas Pendidikan Indonesia, angkatan 2022. Selama masa studi, saya mengembangkan berbagai proyek yang menggabungkan software, embedded systems, dan teknologi komputasi untuk menyelesaikan permasalahan nyata.",
    "Di luar akademik, saya aktif mengikuti berbagai kompetisi teknologi seperti GEMASTIK, LIDM, Capture The Flag (CTF), Software Development, dan Artificial Intelligence. Pengalaman tersebut memperluas cara saya dalam memecahkan masalah, bekerja dalam tim, dan menerjemahkan ide menjadi solusi yang dapat diimplementasikan.",
  ],
  approach: [
    { n: "01", t: "UNDERSTAND", d: "Memahami masalah, kebutuhan, dan konteks sebelum menentukan solusi." },
    { n: "02", t: "BUILD", d: "Merancang dan membangun software maupun sistem embedded secara terstruktur." },
    { n: "03", t: "ITERATE", d: "Menguji, mengevaluasi, dan menyempurnakan solusi berdasarkan hasil yang ditemukan." },
  ],
  stack: {
    core: ["C / C++", "JavaScript", "Node.js", "PHP", "Java", "Express", "Laravel", "React", "Flutter", "MySQL"],
    supporting: ["Firebase", "Supabase", "MongoDB", "IoT", "Computer Vision"],
  },
};

/** tech tag → project slugs that actually use it (§5.3 cross-link). Empty = repo-only. */
export const stackUses: Record<string, string[]> = {
  "C / C++": ["parkeasy-alat", "chillstation"],
  JavaScript: ["acnesense"],
  "Node.js": ["acnesense"],
  PHP: ["eunoia"],
  Java: [],
  Express: ["acnesense"],
  Laravel: ["eunoia", "helios"],
  React: ["eduviana"],
  Flutter: ["skinsenseai", "helios"],
  MySQL: [],
  Firebase: [],
  Supabase: ["parkeasy-ai", "acnesense"],
  MongoDB: [],
  IoT: ["parkeasy-alat", "chillstation", "helios"],
  "Computer Vision": ["parkeasy-ai", "skinsenseai", "acnesense"],
};

export type ProjectStatus =
  | { kind: "progress" }
  | { kind: "skripsi" }
  | { kind: "place"; place: 2 | 3 };

/** Verbatim excerpt from a public repo — never edited for looks (§6.7-E). */
export type CodeExcerpt = {
  repo: string;
  sha: string;
  path: string;
  lines: [number, number];
  lang: string;
  href: string;
  src: string;
};

/** `src` is always a still (for a video figure: its poster) so the projector can draw it */
export type Figure = { src: string; thumb: string; caption: string; video?: string };

const figs = (slug: string, items: [file: string, caption: string, video?: string][]): Figure[] =>
  items.map(([file, caption, video], i) => {
    const n = String(i + 1).padStart(2, "0");
    return { src: file.startsWith("/") ? file : `/media/gallery/${slug}/${file}`, thumb: `/media/gallery/${slug}/${n}.png`, caption, video };
  });

export type Project = {
  slug: string;
  category: string;
  title: string;
  period: string;
  status?: ProjectStatus;
  summary: string;
  stack: string[];
  /** src/dither absent → [ no signal ] */
  media: { kind: "image" | "video"; label: string; src?: string; dither?: string };
  /** click the media → `man <slug>` viewer; `thumb` is a 240px 1-bit mask like `dither` */
  gallery?: Figure[];
  repo?: string;
  /** asciinema .cast under /public/casts — real recordings only (§6.7-A) */
  cast?: string;
  code?: CodeExcerpt;
  /** UART line as written by the server, drawn as an 8N1 timing diagram (§6.7-B) */
  uart?: { command: string; baud: number; source: string };
};

const ghBlob = (repo: string, sha: string, file: string, [a, b]: [number, number]) =>
  `https://github.com/Fahminurs/${repo}/blob/${sha}/${file}#L${a}-L${b}`;

export const projects: Project[] = [
  {
    slug: "eduviana",
    category: "SAAS LEARNING PLATFORM",
    title: "Eduviana",
    period: "2025 — Sekarang",
    status: { kind: "progress" },
    summary:
      "Platform SaaS pembelajaran — ujian lisan berbasis Gemini Live API, mind map, quiz, flashcard, rangkuman otomatis, upload dokumen, dan glosarium. Masih dalam tahap pengembangan aktif menuju deployment self-hosted di VPS.",
    stack: ["Next.js", "FastAPI", "PostgreSQL", "Gemini API"],
    media: { kind: "image", label: "foto.jpg" },
    repo: "https://github.com/Fahminurs/Eduviana/tree/master",
  },
  {
    slug: "parkeasy-ai",
    category: "AI ENGINE — ANPR & SMART GATE",
    title: "ParkEasy AI",
    period: "~2025 (Skripsi)",
    status: { kind: "skripsi" },
    summary:
      "Mesin AI dari ekosistem ParkEasy — mendeteksi plat nomor kendaraan real-time (YOLOv8 + PaddleOCR), validasi ke database Supabase, lalu mengirim perintah buka/tutup gerbang ke ESP32 via UART. Termasuk streaming kamera MJPEG, WebSocket broadcast, dan monitoring slot parkir via sensor ToF. Dibuat untuk skripsi.",
    stack: ["Python", "YOLOv8", "PaddleOCR", "FastAPI", "ESP32"],
    media: {
      kind: "image",
      label: "gate_server.log",
      src: "/media/parkeasy-ai-log.jpg",
      dither: "/media/dither/parkeasy-ai-log.png",
    },
    gallery: figs("parkeasy-ai", [
      ["/media/parkeasy-ai-log.jpg", "gate_server.py: serial ke ESP32 tersambung, sensor siap, lalu gerbang dibuka manual"],
      ["02.webp", "FastAPI /docs: stream kamera masuk/keluar, manual open, reset, status"],
      ["03.webp", "GET /status dipanggil langsung: serial dan kedua kamera aktif"],
      ["04.webp", "POST /manual/open dipanggil langsung, server menjawab 200 dan plat dinormalisasi"],
      ["05.webp", "ReDoc dari skema OpenAPI yang sama"],
      ["06.webp", "Endpoint MJPEG /stream/masuk, diberi video uji sintetis (tanpa kamera fisik)"],
      ["07.webp", "Endpoint MJPEG /stream/keluar, diberi video uji sintetis"],
      ["08.webp", "Respons mentah GET /status"],
      ["09.webp", "Log lengkap gate_server.py; DB error karena Supabase sengaja dummy di sandbox"],
      ["10.webp", "Lalu lintas UART dua arah: sensor dari ESP32 (→) dan perintah server (←)"],
      ["11.webp", "WebSocket /ws: frame log, jarak HC-SR04, dan status slot & servo ke dashboard"],
    ]),
    repo: "https://github.com/Fahminurs/ParkEasy_AI",
    code: {
      repo: "ParkEasy_AI",
      sha: "291a546",
      path: "gate_server.py",
      lines: [328, 335],
      lang: "python",
      href: ghBlob("ParkEasy_AI", "291a546", "gate_server.py", [328, 335]),
      src: `def send_uart(command: str):
    global ser
    if ser and ser.is_open:
        try:
            ser.write((command.strip() + "\\n").encode("utf-8"))
            log_broadcast(f"-> ESP32: {command}", "uart")
        except Exception as e:
            log_broadcast(f"[ERROR] UART Error: {e}", "error")`,
    },
  },
  {
    slug: "parkeasy-alat",
    category: "EMBEDDED FIRMWARE — HARDWARE OTAK SISTEM",
    title: "ParkEasy Alat",
    period: "~2025 (Skripsi)",
    status: { kind: "skripsi" },
    summary:
      "Firmware ESP32 — komponen hardware dari ekosistem ParkEasy. Mengontrol servo palang gerbang, sensor ultrasonik HC-SR04 untuk deteksi kendaraan, sensor ToF VL53L1X untuk monitoring 3 slot parkir via multiplexer I2C, LCD 20x4, dan buzzer — semua dengan health monitoring otomatis dan komunikasi UART ke server AI.",
    stack: ["Arduino/C++", "ESP32", "VL53L1X", "HC-SR04"],
    media: {
      kind: "image",
      label: "DEMO SKRIPSI.mp4",
      src: "/media/parkeasy-alat-lcd.jpg",
      dither: "/media/dither/parkeasy-alat-lcd.png",
    },
    gallery: figs("parkeasy-alat", [
      ["/media/parkeasy-alat-demo.jpg", "Video demo sidang skripsi: alur parkir masuk, monitoring petak, sampai keluar & bayar (4:15)", "/media/parkeasy-alat-demo.mp4"],
      ["02.webp", "LCD 20x4 gerbang keluar: menunggu kendaraan didekatkan ke garis deteksi"],
      ["03.webp", "LCD saat memindai: kamera aktif, progres deteksi plat"],
      ["04.webp", "Prototipe gerbang: palang servo dan sensor dengan mobil uji"],
      ["05.webp", "Dashboard manajemen petak: status 3 slot dari sensor VL53L1X, live"],
      ["06.webp", "Dashboard gerbang: kamera masuk/keluar, mode darurat, log ESP32, dan aplikasi mobile"],
      ["07.webp", "Akhir demo: plat AB 123 AR terbaca di gerbang keluar, saldo di aplikasi sudah terpotong"],
    ]),
    repo: "https://github.com/Fahminurs/ParkEasy_Alat",
    uart: {
      command: "MASUK:BERHASIL|D 123 DX|14:30:00",
      baud: 115200,
      source: "main/uart_handler.h · main/config.h",
    },
    code: {
      repo: "ParkEasy_Alat",
      sha: "285e743",
      path: "main/uart_handler.h",
      lines: [220, 233],
      lang: "cpp",
      href: ghBlob("ParkEasy_Alat", "285e743", "main/uart_handler.h", [220, 233]),
      src: `void uart_read() {
    while (Serial.available()) {
        char c = (char)Serial.read();
        if (c == '\\n') {
            uartBuffer.trim();
            if (uartBuffer.length() > 0) {
                uart_dispatch(uartBuffer);
            }
            uartBuffer = "";
        } else {
            uartBuffer += c;
        }
    }
}`,
    },
  },
  {
    slug: "chillstation",
    category: "IOT BILLING SYSTEM",
    title: "Chillstation Billing PS",
    period: "~2024",
    summary:
      "Sistem billing rental PlayStation berbasis ESP32 — waktu sewa dihitung mundur dan tampil di panel LED P10, operator input kode/durasi lewat keypad, notifikasi suara via DFPlayer Mini, dan relay otomatis memutus daya konsol saat waktu habis. Status device disinkronkan ke server lewat HTTP.",
    stack: ["ESP32", "Arduino", "HTTPClient"],
    media: {
      kind: "image",
      label: "pcb-assembled.jpg",
      src: "/media/chillstation-pcb.jpg",
      dither: "/media/dither/chillstation-pcb.png",
    },
    gallery: figs("chillstation", [["/media/chillstation-pcb.jpg", "PCB Chillstation Billing yang sudah dirakit"]]),
    repo: "https://github.com/Fahminurs/Chillstation-Billing-PS",
  },
  {
    slug: "skinsenseai",
    category: "AI HEALTHCARE — 3RD PLACE",
    title: "SkinSenseAI",
    period: "Sep–Okt 2024",
    status: { kind: "place", place: 3 },
    summary:
      "Aplikasi mobile deteksi kondisi kulit berbasis YOLOv8 dan conversational AI (RAG). Dikembangkan untuk kompetisi AI-NOVAC — meraih Juara 3.",
    stack: ["Flutter", "YOLOv8", "RAG / AI"],
    media: { kind: "image", label: "screenshot.png" },
  },
  {
    slug: "eunoia",
    category: "MENTAL HEALTH — 2ND PLACE",
    title: "Eunoia",
    period: "Agu–Sep 2024",
    status: { kind: "place", place: 2 },
    summary:
      "Web app kesehatan mental dengan arsitektur dual LSTM untuk analisis mood berbasis diary, serta deteksi risiko bunuh diri berbasis forum. Kompetisi ITConvert, Universitas Jember — meraih Juara 2 kategori Software Development.",
    stack: ["Laravel", "PHP", "LSTM / AI"],
    media: { kind: "image", label: "screenshot.png" },
  },
  {
    slug: "acnesense",
    category: "AI SKINCARE — PWA · DBS CODING CAMP 2025",
    title: "AcneSense",
    period: "Mei–Jun 2025",
    summary:
      "Proyek akhir DBS Coding Camp 2025 — Progressive Web App deteksi & klasifikasi jerawat berbasis AI untuk skrining dini. Full-stack — Express.js, EJS, Vite, Tailwind CSS, Supabase. Termasuk fitur riwayat diagnosis dan chatbot edukatif, di-deploy via Docker ke Google Cloud Run.",
    stack: ["Node.js", "Express.js", "Supabase", "Docker"],
    media: { kind: "video", label: "video_demo.mp4" },
  },
  {
    slug: "helios",
    category: "IOT MONITORING — WEB + MOBILE",
    title: "Helios Tracker",
    period: "Nov–Des 2024",
    summary:
      "Sistem monitoring solar tracker dual-axis berbasis IoT, tersedia dalam versi web (Laravel, real-time data visualization) dan mobile (Flutter). Integrasi IoT API untuk manajemen akun dan tracking data secara real-time.",
    stack: ["Laravel", "Flutter", "IoT API"],
    media: {
      kind: "image",
      label: "helios-app.png",
      src: "/media/helios-app.jpg",
      dither: "/media/dither/helios-app.png",
    },
    gallery: figs("helios", [
      ["/media/helios-app.jpg", "Aplikasi mobile Helios: login, monitoring, daftar perangkat"],
      ["02.webp", "Splash screen"],
      ["03.webp", "Login, dengan ilustrasi panel surya"],
      ["04.webp", "Registrasi akun"],
      ["05.webp", "Lupa password"],
      ["06.webp", "Login dengan akun demo terisi"],
      ["07.webp", "Info perangkat: kode, status servo & ESP32, cuaca, lokasi GPS"],
      ["08.webp", "Monitoring: sudut panel horizontal/vertikal, arus, tegangan, baterai"],
      ["09.webp", "Menu opsi perangkat"],
      ["10.webp", "Ubah info perangkat"],
      ["11.webp", "Daftar perangkat solar tracker yang terdaftar di akun"],
      ["12.webp", "Tambah perangkat: kode perangkat + ambil lokasi GPS"],
      ["13.webp", "Profil pengguna (data demo)"],
      ["14.webp", "Ubah profil"],
      ["15.webp", "Ganti password"],
      ["16.webp", "Tentang aplikasi"],
    ]),
    repo: "https://github.com/Fahminurs/Helios-Tracker",
  },
];

export type RepoCat =
  | "web" | "ai" | "iot" | "embedded" | "software" | "mobile" | "desktop" | "security";

export type Repo = {
  name: string;
  desc: string;
  lang: string | null; // null = private
  date: string;
  estimated?: boolean;
  cats: RepoCat[];
  href?: string;
  inProjects?: boolean;
};

const gh = (n: string) => `https://github.com/Fahminurs/${n}`;

export const repos: Repo[] = [
  { name: "Academe", desc: "Aplikasi mobile pembelajaran — membantu siswa memahami konsep lewat roadmap belajar terstruktur, dengan pengulangan materi hingga mencapai nilai yang memuaskan.", lang: null, date: "~2025", estimated: true, cats: ["mobile"] },
  { name: "ParkEasy_Aplikasi", desc: "Aplikasi mobile ParkEasy untuk end-user — cari lokasi parkir, pesan slot real-time, bayar via e-wallet (Midtrans), dan kelola kendaraan terdaftar.", lang: "Flutter / Supabase", date: "~2025", estimated: true, cats: ["mobile"], href: gh("ParkEasy_Aplikasi") },
  { name: "Mood-Journal-MoJu", desc: "Web mood journal (Moju) — forum diskusi, artikel edukasi, chatbot dengan Gemini API.", lang: "PHP", date: "Okt–Nov 2024", cats: ["web"], href: gh("Mood-Journal-MoJu") },
  { name: "billingPS-Web-App", desc: "Sistem billing rental PlayStation berbasis web, multi-lantai, dengan pembacaan waktu & login member.", lang: "PHP", date: "~2023", estimated: true, cats: ["web"], href: gh("billingPS-Web-App") },
  { name: "xploria", desc: "Platform coding block (visual programming) untuk mikrokontroler — alternatif ngoding Arduino/ESP32 tanpa nulis teks, lengkap dengan autentikasi Google Sign-In dan profil pengguna.", lang: "Node.js / Express", date: "~2024", estimated: true, cats: ["web"], href: gh("xploria") },
  { name: "Maxview", desc: "Aplikasi desktop untuk memantau & mengelola rental PlayStation/TV multi-unit — timer, manajemen tarif, transaksi makanan/minuman, laporan, tema light/dark.", lang: "Java Swing / MySQL", date: "~2024", estimated: true, cats: ["desktop"], href: gh("Maxview") },
  { name: "Bandung-Park-Zoo", desc: "Tugas Akhir Basis Data — sistem manajemen kebun binatang untuk 1500+ data pengunjung.", lang: "C++ / MySQL", date: "~2023", estimated: true, cats: ["software"], href: gh("Bandung-Park-Zoo") },
  { name: "Mata-Kuliah-Struktur-Data-Algoritma", desc: "Perbandingan performa algoritma sorting & searching, terintegrasi database MySQL.", lang: "C++ / MySQL", date: "~2023", estimated: true, cats: ["software"], href: gh("Mata-Kuliah-Struktur-Data-Algoritma") },
  { name: "Bot_WhatsApp-_unclear", desc: "Bot WhatsApp untuk keperluan project Kompetegram.", lang: "JavaScript / Node.js", date: "~2023", estimated: true, cats: ["web"], href: gh("Bot_WhatsApp-_unclear") },
  { name: "ImagePicker-Stegano-CyberSecurity", desc: "Website steganografi gambar berbasis Flask — enkripsi & dekripsi data tersembunyi dalam gambar.", lang: "Python / Flask", date: "Nov–Des 2024", cats: ["web", "security"], href: gh("ImagePicker-Stegano-CyberSecurity") },
  { name: "Eunoia-PWA", desc: "Progressive Web App kesehatan mental — diary, chat konsultasi, chatbot AI, relaxing sound & breathing exercise.", lang: "HTML / CSS / JS", date: "~2024", estimated: true, cats: ["web"], href: gh("Eunoia-PWA") },
  { name: "Nusantara-Zoo", desc: "Web edukasi satwa kebun binatang dengan model 3D Augmented Reality yang bisa diakses lewat mobile.", lang: "PHP / Laravel", date: "Jun–Agu 2024", cats: ["web"], href: gh("Nusantara-Zoo") },
  { name: "ParkEasy_AI", desc: "AI Engine ParkEasy — ANPR & Gate Server, deteksi plat nomor otomatis (YOLOv8 + PaddleOCR).", lang: "Python", date: "~2025", estimated: true, cats: ["ai"], href: gh("ParkEasy_AI"), inProjects: true },
  { name: "ParkEasy_Alat", desc: "Firmware ESP32 — kontrol servo gerbang, sensor HC-SR04 & VL53L1X, LCD, komunikasi UART.", lang: "Arduino / C++", date: "~2025", estimated: true, cats: ["embedded", "iot"], href: gh("ParkEasy_Alat"), inProjects: true },
  { name: "Chillstation-Billing-PS", desc: "Sistem billing rental PlayStation berbasis ESP32, panel LED P10 & kontrol relay.", lang: "C++", date: "~2024", estimated: true, cats: ["embedded", "iot"], href: gh("Chillstation-Billing-PS"), inProjects: true },
  { name: "Eduviana", desc: "Platform SaaS pembelajaran — ujian lisan AI, mind map, quiz, flashcard. Masih progress.", lang: "TypeScript", date: "2025 — Sekarang", cats: ["web", "software"], href: "https://github.com/Fahminurs/Eduviana/tree/master", inProjects: true },
  { name: "SkinSenseAI", desc: "Mobile app deteksi kondisi kulit berbasis YOLOv8 dan conversational AI (RAG). Juara 3 AI-NOVAC 2024.", lang: "Flutter", date: "Sep–Okt 2024", cats: ["mobile"], inProjects: true },
  { name: "Eunoia", desc: "Web app kesehatan mental — dual LSTM mood analysis. Juara 2 IT Convert Universitas Jember 2024.", lang: "Laravel / PHP", date: "Agu–Sep 2024", cats: ["web", "software"], inProjects: true },
  { name: "AcneSense", desc: "PWA deteksi & klasifikasi jerawat berbasis AI. Proyek akhir DBS Coding Camp 2025.", lang: "Node.js / Express", date: "Mei–Jun 2025", cats: ["web"], inProjects: true },
  { name: "Helios-Tracker", desc: "Monitoring solar tracker dual-axis berbasis IoT, real-time via web (Laravel) & mobile (Flutter).", lang: "Dart / Laravel", date: "Nov–Des 2024", cats: ["web", "iot"], href: gh("Helios-Tracker"), inProjects: true },
];

export const REPO_TOTAL = 27;

export const repoFilters: { id: "all" | RepoCat; label: string }[] = [
  { id: "all", label: "ALL" },
  { id: "web", label: "WEB" },
  { id: "ai", label: "AI" },
  { id: "iot", label: "IOT" },
  { id: "embedded", label: "EMBEDDED" },
  { id: "software", label: "SOFTWARE" },
  { id: "mobile", label: "MOBILE" },
  { id: "desktop", label: "DESKTOP" },
  { id: "security", label: "SECURITY" },
];

export const education = [
  {
    years: "2022—2026",
    note: "expected",
    title: "Teknik Komputer",
    org: "Universitas Pendidikan Indonesia — Kampus Cibiru · GPA 3.83/4.00",
    desc: "Undergraduate, fokus embedded systems, computer vision, dan software engineering.",
  },
  {
    years: "2019—2022",
    title: "MAN 1 Tegal",
    org: "Jurusan IPS",
    desc: "Menempuh pendidikan menengah atas dengan penjurusan Ilmu Pengetahuan Sosial (IPS), sebelum melanjutkan studi ke bidang Teknik Komputer.",
  },
];

export const experience = [
  {
    ts: ["2025", "Sem. 7"],
    tag: "INTERN",
    title: "Software Engineer",
    org: "PT. Irostech",
    desc: "Magang sebagai Software Engineer pada semester 7 — terlibat dalam pengembangan software sesuai kebutuhan perusahaan.",
  },
  {
    ts: ["2025", "DBS CC"],
    tag: "STUDI INDEPENDEN",
    title: "DBS Coding Camp 2025",
    org: "Kampus Merdeka — Program Studi Independen Bersertifikat",
    desc: "Mengikuti program Studi Independen DBS Coding Camp 2025 — hasil akhirnya berupa proyek AcneSense.",
  },
  {
    ts: ["2024", "1—8 Jun"],
    tag: "ORG",
    title: "Staff — Design & Decoration",
    org: "Dies Natalis Teknik Komputer, Universitas Pendidikan Indonesia",
    desc: "Merancang konsep visual acara — brainstorming, pemilihan warna, dan penataan ruang untuk menciptakan suasana perayaan. Berkolaborasi dengan tim lain untuk memastikan keselarasan elemen dekorasi dan turut terlibat dalam persiapan materi.",
  },
];

export const achievements = [
  {
    seal: "II",
    caseNo: "CASE 01",
    category: "Kompetisi Nasional",
    title: "IT Convert — Juara 2",
    desc: "National Software Development Competition, Universitas Jember. Proyek: Eunoia Mental Health Web App.",
    year: "2024",
    inverted: true,
  },
  {
    seal: "III",
    caseNo: "CASE 02",
    category: "Kompetisi Nasional",
    title: "AI-NOVAC — Juara 3",
    desc: "National Artificial Intelligence Innovation Competition, Institut Teknologi Sumatera. Proyek: SkinSenseAI Mobile App.",
    year: "2024",
  },
  {
    seal: "★",
    caseNo: "CASE 03",
    category: "Penghargaan Kampus",
    title: "Academic & Non-Academic Excellence",
    desc: "Penghargaan atas prestasi akademik dan non-akademik dari Universitas Pendidikan Indonesia.",
    year: "2025",
  },
];

export const sections = [
  { id: "index", n: 0, label: "index", cmd: "whoami" },
  { id: "about", n: 1, label: "about", cmd: "cat about.md" },
  { id: "projects", n: 2, label: "projects", cmd: "ls -la ./projects --media" },
  { id: "archive", n: 3, label: "archive", cmd: "git log --repos" },
  { id: "education", n: 4, label: "education", cmd: "cat education.log" },
  { id: "work", n: 5, label: "work", cmd: "tail -f experience.log" },
  { id: "records", n: 6, label: "records", cmd: "./open-case-files.sh --all" },
  { id: "contact", n: 7, label: "contact", cmd: "send --to fahmi" },
] as const;

export type SectionId = (typeof sections)[number]["id"];
