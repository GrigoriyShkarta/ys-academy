export const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Failed to load image'));
  });
};

export const getImageDimensionsFromFile = (
  file: File
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(objectUrl);
    };
  });
};

export const getVideoDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    // ✅ Если это YouTube — просто возвращаем стандартное соотношение 16:9
    if (/youtube\.com|youtu\.be/.test(url)) {
      resolve({ width: 1280, height: 720 });
      return;
    }

    if (typeof document === 'undefined') {
      // SSR: возвращаем дефолтные размеры 16:9
      resolve({ width: 1280, height: 720 });
      return;
    }
    const video = document.createElement('video');
    video.src = url;
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';

    const handleLoadedMetadata = () => {
      if (video.videoWidth && video.videoHeight) {
        resolve({ width: video.videoWidth, height: video.videoHeight });
      } else {
        reject(new Error('Video metadata not available'));
      }
      cleanup();
    };

    const handleError = () => {
      reject(new Error('Failed to load video metadata'));
      cleanup();
    };

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);

    // 🕒 fallback если событие не сработало за 3 секунды
    setTimeout(() => {
      if (!video.videoWidth) {
        cleanup();
        reject(new Error('Timeout loading video metadata'));
      }
    }, 3000);
  });
};

export const getVideoDimensionsFromFile = (
  file: File
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      // SSR: невозможно считать метаданные файла — возвращаем разумные значения
      resolve({ width: 1280, height: 720 });
      return;
    }
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;
    video.preload = 'metadata';

    const handleLoadedMetadata = () => {
      resolve({ width: video.videoWidth, height: video.videoHeight });
      cleanup();
    };

    const handleError = () => {
      reject(new Error('Failed to load video metadata'));
      cleanup();
    };

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
      URL.revokeObjectURL(objectUrl);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);

    setTimeout(() => {
      if (!video.videoWidth) {
        cleanup();
        reject(new Error('Timeout loading video metadata'));
      }
    }, 3000);
  });
};
