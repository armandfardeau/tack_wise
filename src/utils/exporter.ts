// Client-side export helper for Tactical Sailing Simulator

export function exportToGif(
  images: string[],
  frameDelay: number, // in seconds (e.g. 0.5s for 500ms)
  width: number,
  height: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const gifshot = (window as any).gifshot;
    if (!gifshot) {
      reject(new Error('gifshot library is not loaded.'));
      return;
    }

    gifshot.createGIF(
      {
        images: images,
        interval: frameDelay,
        gifWidth: width,
        gifHeight: height,
        numWorkers: 2,
        sampleInterval: 10,
      },
      (obj: any) => {
        if (!obj.error) {
          // Convert dataURL to Blob
          const base64 = obj.image.split(',')[1];
          const binary = atob(base64);
          const array = [];
          for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
          }
          const blob = new Blob([new Uint8Array(array)], { type: 'image/gif' });
          resolve(blob);
        } else {
          reject(new Error(obj.errorMsg || 'Failed to create GIF'));
        }
      }
    );
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
