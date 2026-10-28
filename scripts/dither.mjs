// Build-time 1-bit ordered dither (Bayer 8×8) → alpha mask PNG for <DitherReveal>.
// usage: npm run dither            (public/media/*.{jpg,jpeg,png,webp} → public/media/dither/*.png)
//        npm run dither -- a.jpg   (single file)
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = "public/media";
const OUT = "public/media/dither";
const WIDTH = 680; // 2× the 340px media column

const B = [
  [0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21],
];

async function dither(file) {
  const { data, info } = await sharp(path.join(SRC, file))
    .resize({ width: WIDTH, withoutEnlargement: true })
    .grayscale()
    .normalise()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = y * info.width + x;
      const t = ((B[y % 8][x % 8] + 0.5) / 64) * 255;
      const on = data[i] > t;
      rgba[i * 4 + 3] = on ? 255 : 0; // only alpha matters — CSS fills it with the accent
    }
  }

  const name = file.replace(/\.[^.]+$/, ".png");
  await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ palette: true, colours: 2 })
    .toFile(path.join(OUT, name));
  console.log(`[ OK ] ${file} → ${OUT}/${name} (${info.width}×${info.height})`);
}

await mkdir(OUT, { recursive: true });
const args = process.argv.slice(2);
const files = args.length
  ? args
  : (await readdir(SRC)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
if (!files.length) console.log(`no images in ${SRC}/ — nothing to dither`);
for (const f of files) await dither(f);
