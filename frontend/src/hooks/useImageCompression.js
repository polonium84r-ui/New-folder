import { useState, useCallback } from 'react';

/**
 * Custom hook for image compression and optimization
 * Reduces file size while maintaining medical image quality
 */
export const useImageCompression = () => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);

  const compressImage = useCallback(async (file, options = {}) => {
    const {
      maxWidth = 2048,
      maxHeight = 2048,
      quality = 0.9,
      format = 'image/jpeg'
    } = options;

    setIsCompressing(true);
    setCompressionProgress(0);

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;

          setCompressionProgress(30);

          // Apply image enhancement for medical images
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw image with potential enhancements
          ctx.drawImage(img, 0, 0, width, height);

          setCompressionProgress(70);

          // Apply subtle sharpening filter for medical images
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          // Simple sharpening kernel
          const sharpenKernel = [
            0, -1, 0,
            -1, 5, -1,
            0, -1, 0
          ];

          const sharpened = applySharpenFilter(data, width, height, sharpenKernel);
          const newImageData = new ImageData(sharpened, width, height);
          ctx.putImageData(newImageData, 0, 0);

          setCompressionProgress(90);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                setCompressionProgress(100);
                const compressedFile = new File([blob], file.name, {
                  type: format,
                  lastModified: Date.now()
                });
                
                setTimeout(() => {
                  setIsCompressing(false);
                  setCompressionProgress(0);
                  resolve({
                    file: compressedFile,
                    originalSize: file.size,
                    compressedSize: blob.size,
                    compressionRatio: ((file.size - blob.size) / file.size * 100).toFixed(1)
                  });
                }, 500);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            format,
            quality
          );
        } catch (error) {
          setIsCompressing(false);
          setCompressionProgress(0);
          reject(error);
        }
      };

      img.onerror = () => {
        setIsCompressing(false);
        setCompressionProgress(0);
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Helper function to apply sharpening filter
  const applySharpenFilter = (data, width, height, kernel) => {
    const output = new Uint8ClampedArray(data);
    const kernelSize = 3;
    const half = Math.floor(kernelSize / 2);

    for (let y = half; y < height - half; y++) {
      for (let x = half; x < width - half; x++) {
        const px = (y * width + x) * 4;
        let r = 0, g = 0, b = 0;

        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const py = y + ky - half;
            const px2 = x + kx - half;
            const pos = (py * width + px2) * 4;
            const weight = kernel[ky * kernelSize + kx];

            r += data[pos] * weight;
            g += data[pos + 1] * weight;
            b += data[pos + 2] * weight;
          }
        }

        output[px] = Math.max(0, Math.min(255, r));
        output[px + 1] = Math.max(0, Math.min(255, g));
        output[px + 2] = Math.max(0, Math.min(255, b));
      }
    }

    return output;
  };

  return {
    compressImage,
    isCompressing,
    compressionProgress
  };
};