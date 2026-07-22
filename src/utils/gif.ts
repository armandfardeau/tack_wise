import gifshot from 'gifshot';

export function exportToGif(
  images: string[],
  frameDelay: number, // in seconds (e.g. 0.5s for 500ms)
  width: number,
  height: number,
  options: { sampleInterval?: number; numWorkers?: number } = {},
): Promise<Blob> {
  const availableCores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined;
  const numWorkers = options.numWorkers ?? (availableCores ? Math.max(2, Math.min(4, availableCores - 1)) : 2);

  return new Promise((resolve, reject) => {
    gifshot.createGIF(
      {
        images,
        interval: frameDelay,
        gifWidth: width,
        gifHeight: height,
        numWorkers,
        sampleInterval: options.sampleInterval ?? 10,
      },
      (obj: any) => {
        if (!obj.error) {
          const base64 = obj.image.split(',')[1];
          const binary = atob(base64);
          const array = [];
          for (let index = 0; index < binary.length; index += 1) {
            array.push(binary.charCodeAt(index));
          }
          const blob = new Blob([new Uint8Array(array)], { type: 'image/gif' });
          resolve(blob);
        } else {
          reject(new Error(obj.errorMsg || 'Failed to create GIF'));
        }
      },
    );
  });
}
