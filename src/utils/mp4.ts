import coreURL from '@ffmpeg/core?url';
import wasmURL from '@ffmpeg/core/wasm?url';
import type { FFmpeg } from '@ffmpeg/ffmpeg';

type ProgressHandler = (progress: number) => void;

let ffmpegPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg() {
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');

  if (!ffmpegPromise) {
    const ffmpeg = new FFmpeg();
    ffmpegPromise = ffmpeg
      .load({ coreURL, wasmURL })
      .then(() => ffmpeg)
      .catch((error) => {
        ffmpegPromise = null;
        throw error;
      });
  }

  return ffmpegPromise;
}

export async function convertWebmToMp4(webmBlob: Blob, onProgress?: ProgressHandler): Promise<Blob> {
  const [{ fetchFile }, ffmpeg] = await Promise.all([import('@ffmpeg/util'), getFFmpeg()]);
  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress?.(Math.min(1, Math.max(0, progress)));
  };

  ffmpeg.on('progress', progressHandler);

  try {
    await ffmpeg.writeFile('tack-wise-input.webm', await fetchFile(webmBlob));
    const exitCode = await ffmpeg.exec([
      '-i', 'tack-wise-input.webm',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '23',
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      'tack-wise-output.mp4',
    ]);
    if (exitCode !== 0) throw new Error('FFmpeg could not convert the recording to MP4.');

    const output = await ffmpeg.readFile('tack-wise-output.mp4');
    if (typeof output === 'string') throw new Error('FFmpeg returned an invalid MP4 file.');

    return new Blob([new Uint8Array(output)], { type: 'video/mp4' });
  } finally {
    ffmpeg.off('progress', progressHandler);
    await Promise.all([
      ffmpeg.deleteFile('tack-wise-input.webm').catch(() => undefined),
      ffmpeg.deleteFile('tack-wise-output.mp4').catch(() => undefined),
    ]);
  }
}
