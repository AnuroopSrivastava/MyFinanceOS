import React, { useState, useCallback } from 'react';
import { Button, Modal } from '@financeos/ui';
import Cropper from 'react-easy-crop';
import { RotateCcw, RotateCw } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImageBase64: string) => void;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  // set each dimensions to double largest dimension to allow for a safe area for the
  // image to rotate in without being clipped by canvas context
  canvas.width = safeArea;
  canvas.height = safeArea;

  // translate canvas context to a central location on image to allow rotating around the center.
  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate(getRadianAngle(rotation));
  ctx.translate(-safeArea / 2, -safeArea / 2);

  // draw rotated image and store data.
  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );
  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // paste generated rotate image with correct offsets for x,y crop values.
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  // Resize to max 256x256 to save localStorage space
  const MAX_SIZE = 256;
  if (pixelCrop.width > MAX_SIZE || pixelCrop.height > MAX_SIZE) {
    const ratio = Math.min(MAX_SIZE / pixelCrop.width, MAX_SIZE / pixelCrop.height);
    const finalWidth = pixelCrop.width * ratio;
    const finalHeight = pixelCrop.height * ratio;
    
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = finalWidth;
    finalCanvas.height = finalHeight;
    const finalCtx = finalCanvas.getContext('2d');
    if (finalCtx) {
      finalCtx.drawImage(canvas, 0, 0, finalWidth, finalHeight);
      return finalCanvas.toDataURL('image/jpeg', 0.85);
    }
  }

  // As Base64 string
  return canvas.toDataURL('image/jpeg', 0.85);
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ isOpen, onClose, imageSrc, onCropComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [cropError, setCropError] = useState<string | null>(null);

  const onCropCompleteInternal = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      setCropError(null);
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropComplete(croppedImage);
      onClose();
    } catch (e) {
      console.error(e);
      setCropError('Could not crop this image. Please try another one.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adjust Profile Picture" size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
        {cropError && (
          <div style={{ padding: 'var(--spacing-05) var(--spacing-075)', background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid var(--error)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-sm)' }}>
            {cropError}
          </div>
        )}

        <div style={{ position: 'relative', width: '100%', height: '300px', background: '#000', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-075)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', minWidth: '40px' }}>Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--accent-1)' }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', minWidth: '40px' }}>Rotate</span>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)' }}>
              <Button
                type="button"
                onClick={() => setRotation(rotation - 90)}
                variant="secondary"
                style={{ padding: 'var(--spacing-04)', borderRadius: '50%', flexShrink: 0 }}
              >
                <RotateCcw size={16} />
              </Button>
              <input
                type="range"
                value={rotation}
                min={0}
                max={360}
                step={1}
                aria-label="Rotation"
                onChange={(e) => setRotation(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--accent-1)' }}
              />
              <Button
                type="button"
                onClick={() => setRotation(rotation + 90)}
                variant="secondary"
                style={{ padding: 'var(--spacing-04)', borderRadius: '50%', flexShrink: 0 }}
              >
                <RotateCw size={16} />
              </Button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-075)', marginTop: 'var(--spacing-05)' }}>
          <Button type="button" onClick={onClose} variant="secondary" style={{ padding: 'var(--spacing-05) var(--spacing-1)' }}>Cancel</Button>
          <Button type="button" onClick={handleSave} variant="primary" style={{ padding: 'var(--spacing-05) var(--spacing-125)' }}>Apply Image</Button>
        </div>
      </div>
    </Modal>
  );
};
