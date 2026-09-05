import fs from "node:fs";
import path from "node:path";

export type Track = {
    id: string;
    src: string;
    fileName: string;
};

const MUSIC_DIRECTORY = path.join(
    process.cwd(),
    "public",
    "music",
);

const AUDIO_EXTENSIONS = new Set([
    ".mp3",
    ".wav",
    ".ogg",
    ".m4a",
    ".aac",
]);

export function getTracks(): Track[] {
    if (!fs.existsSync(MUSIC_DIRECTORY)) {
        return [];
    }

    const files = fs
        .readdirSync(MUSIC_DIRECTORY, {
            withFileTypes: true,
        })
        .filter((entry) => {
            if (!entry.isFile()) {
                return false;
            }

            const extension = path
                .extname(entry.name)
                .toLowerCase();

            return AUDIO_EXTENSIONS.has(extension);
        })
        .map((entry) => entry.name)
        .sort((a, b) =>
            a.localeCompare(
                b,
                undefined,
                {
                    numeric: true,
                    sensitivity: "base",
                },
            ),
        );

    return files.map((fileName, index) => ({
        id: `${index}-${fileName}`,
        src: `/music/${encodeURIComponent(fileName)}`,
        fileName,
    }));
}