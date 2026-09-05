"use client";

type Props = {
  isPlaying: boolean;
  size?: "sm" | "md";
};

export default function Vinyl({ isPlaying, size = "md" }: Props) {
  const dim = size === "sm" ? "h-11 w-11" : "h-14 w-14";

  return (
    <div
      className={`relative shrink-0 ${dim} overflow-hidden rounded-full`}
      style={{
        background:
          "radial-gradient(circle at 35% 35%, #3a3a3a 0%, #1a1a1a 45%, #0d0d0d 100%)",
        boxShadow:
          "inset 0 0 0 1px rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.5)",
        animation: "vinyl-spin 8s linear infinite",
        animationPlayState: isPlaying ? "running" : "paused",
      }}
    >
      <div
        className="absolute inset-[18%] rounded-full border border-white/5"
        style={{
          background:
            "repeating-radial-gradient(circle at center, transparent 0, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 3px)",
        }}
      />
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-900/80 to-stone-900 ${
          size === "sm" ? "h-3.5 w-3.5" : "h-[18px] w-[18px]"
        }`}
        style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}
      />
    </div>
  );
}
