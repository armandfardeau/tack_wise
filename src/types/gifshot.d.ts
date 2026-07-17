declare module 'gifshot' {
  interface GifshotOptions {
    images: string[];
    interval: number;
    gifWidth: number;
    gifHeight: number;
    numWorkers: number;
    sampleInterval: number;
  }

  interface GifshotResult {
    error: boolean;
    errorMsg?: string;
    image?: string;
  }

  interface Gifshot {
    createGIF(
      options: GifshotOptions,
      callback: (result: GifshotResult) => void
    ): void;
  }

  const gifshot: Gifshot;
  export default gifshot;
}
