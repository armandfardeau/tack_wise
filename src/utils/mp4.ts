import coreURL from '@ffmpeg/core?url';
import wasmURL from '@ffmpeg/core/wasm?url';
import type { FFmpeg } from '@ffmpeg/ffmpeg';
import type { VideoExportType } from '../types';

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

export async function prepareVideoEncoder() {
  await getFFmpeg();
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

export async function encodePngFramesToVideo(
  frames: Blob[],
  fps: number,
  type: VideoExportType,
  onProgress?: ProgressHandler,
): Promise<Blob> {
  if (frames.length === 0) throw new Error('No frames were captured for the video export.');

  const [{ fetchFile }, ffmpeg] = await Promise.all([import('@ffmpeg/util'), getFFmpeg()]);
  const filePrefix = `tack-wise-export-${Date.now()}-`;
  const inputFiles = frames.map((_, index) => `${filePrefix}${String(index + 1).padStart(6, '0')}.png`);
  const inputPattern = `${filePrefix}%06d.png`;
  const outputFile = `${filePrefix}output.${type}`;
  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress?.(Math.min(1, Math.max(0, 0.2 + progress * 0.8)));
  };

  ffmpeg.on('progress', progressHandler);

  try {
    for (let index = 0; index < frames.length; index += 1) {
      await ffmpeg.writeFile(inputFiles[index], await fetchFile(frames[index]));
      onProgress?.(((index + 1) / frames.length) * 0.2);
    }

    const codecArguments = type === 'mp4'
      ? ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-movflags', '+faststart']
      : ['-c:v', 'libvpx-vp9', '-deadline', 'realtime', '-cpu-used', '5', '-crf', '32', '-b:v', '0'];
    const exitCode = await ffmpeg.exec([
      '-framerate', String(fps),
      '-start_number', '1',
      '-i', inputPattern,
      '-an',
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
      '-pix_fmt', 'yuv420p',
      ...codecArguments,
      outputFile,
    ]);
    if (exitCode !== 0) throw new Error(`FFmpeg could not create the ${type.toUpperCase()} export.`);

    const output = await ffmpeg.readFile(outputFile);
    if (typeof output === 'string') throw new Error('FFmpeg returned an invalid video file.');

    return new Blob([new Uint8Array(output)], { type: type === 'mp4' ? 'video/mp4' : 'video/webm' });
  } finally {
    ffmpeg.off('progress', progressHandler);
    await Promise.all([
      ...inputFiles.map((file) => ffmpeg.deleteFile(file).catch(() => undefined)),
      ffmpeg.deleteFile(outputFile).catch(() => undefined),
    ]);
  }
}
