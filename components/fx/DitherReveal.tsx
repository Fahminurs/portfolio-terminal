import Image from "next/image";
import { NoSignal } from "@/components/ui/NoSignal";
import { cn } from "@/lib/utils";

type Props = {
  /** original photo, e.g. /media/parkeasy-alat.jpg */
  src?: string;
  /** 1-bit alpha mask from `npm run dither`, e.g. /media/dither/parkeasy-alat.png */
  dither?: string;
  alt: string;
  label: string;
  className?: string;
};

/**
 * 1-bit amber image that "develops" into the real photo row by row on hover/focus (§6.7-I).
 * The dither is an alpha mask filled with the accent, so it follows `theme`. No JS.
 */
export function DitherReveal({ src, dither, alt, label, className }: Props) {
  if (!src || !dither)
    return <NoSignal label={label} reason="foto/screenshot belum ada" className={cn("aspect-[4/3] min-h-0", className)} />;

  return (
    <div tabIndex={0} className={cn("dither-reveal relative aspect-[4/3] overflow-hidden border border-line bg-bg", className)}>
      <div
        aria-hidden
        className="absolute inset-0 bg-accent"
        style={{ maskImage: `url(${dither})`, maskSize: "cover", maskPosition: "center", WebkitMaskImage: `url(${dither})`, WebkitMaskSize: "cover" }}
      />
      <Image src={src} alt={alt} fill sizes="(min-width: 850px) 340px, 100vw" className="dither-orig object-cover" />
      <span className="absolute left-2 top-2 border border-line bg-bg px-1.5 py-px text-[10px] text-fg-3">
        {label}
      </span>
    </div>
  );
}
