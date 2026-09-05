import fs from "node:fs/promises";
import path from "node:path";

export type Track = {
  id: string;
  title: string;
  artist: string;
  src: string;
};

function cleanTitle(filename: string) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function getTracks(): Promise<Track[]> {
  const musicDirectory = path.join(process.cwd(), "public", "music");

  try {
    const files = await fs.readdir(musicDirectory);

    const audioFiles = files
      .filter((file) => /\.(mp3|wav|m4a|ogg|aac)$/i.test(file))
      .sort((a, b) =>
        a.localeCompare(b, undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      );

    return audioFiles.map((file, index) => {
      const title = cleanTitle(file);

      return {
        id: `${index + 1}-${file}`,
        title,
        artist: "Feel Blessed",
        src: `/music/${encodeURIComponent(file)}`,
      };
    });
  } catch {
    return [];
  }
}