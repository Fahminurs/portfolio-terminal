// Tailwind v4 through Next's own CSS pipeline. (The @tailwindcss/turbopack loader missed
// edits saved by write-to-temp-then-rename, so globals.css changes needed a dev restart.)
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
