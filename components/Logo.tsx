import Image from "next/image";

interface LogoProps {
  /** Height in px — width scales proportionally (~4:1 wordmark ratio) */
  height?: number;
  className?: string;
}

/**
 * FloMCP brand logo — horizontal wordmark, transparent PNG.
 * White text + purple accent on transparent background.
 *
 * Dark mode  → shown as-is (white+purple on dark bg = perfect)
 * Light mode → wrapped in a dark pill so white text stays visible
 *
 * Asset: /public/FloMCP-Logo.png
 */
export function Logo({ height = 32, className = "" }: LogoProps) {
  const width = Math.round(height * 4.2);

  return (
    <span
      className={`inline-flex items-center rounded-lg dark:bg-transparent bg-[#0d1117] h-11 px-2 py-0.5 ${className}`}
    >
      <Image
        src={`/FloMCP-Logo.png?v=2`}
        alt="FloMCP"
        width={width}
        height={height}
        className="object-contain"
        unoptimized
        priority
      />
    </span>
  );
}
