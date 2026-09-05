"use client";

type SeekBarProps = {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default function SeekBar({
  currentTime,
  duration,
  onSeek,
}: SeekBarProps) {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const safeCurrentTime =
    Number.isFinite(currentTime) && currentTime >= 0 ? currentTime : 0;

  return (
    <div className="fb-seekbar">
      <input
        type="range"
        min={0}
        max={safeDuration || 1}
        step={0.1}
        value={Math.min(safeCurrentTime, safeDuration || 1)}
        onChange={(event) => onSeek(Number(event.target.value))}
        aria-label="Seek through track"
      />

      <div className="fb-seekbar-time">
        <span>{formatTime(safeCurrentTime)}</span>
        <span>{formatTime(safeDuration)}</span>
      </div>
    </div>
  );
}