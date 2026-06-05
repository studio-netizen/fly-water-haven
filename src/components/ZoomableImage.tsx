import { useState, useRef, useCallback } from 'react';

interface ZoomableImageProps {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'auto';
  decoding?: 'async' | 'auto' | 'sync';
  onSingleTap?: () => void;
  disableZoom?: boolean;
}

const ZoomableImage = ({
  src,
  srcSet,
  sizes,
  alt,
  className = '',
  style = {},
  loading,
  fetchPriority,
  decoding,
  onSingleTap,
  disableZoom = false,
}: ZoomableImageProps) => {
  const [zoomed, setZoomed] = useState(false);
  const lastTapRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTap = useCallback(() => {
    if (disableZoom) {
      onSingleTap?.();
      return;
    }

    const now = Date.now();

    // Cancel pending single-tap navigation
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (now - lastTapRef.current < 300) {
      // Double-tap → toggle zoom, cancel navigation
      lastTapRef.current = 0;
      setZoomed(z => !z);
    } else {
      // Single tap — queue navigation after delay so double-tap can cancel it
      lastTapRef.current = now;
      if (onSingleTap) {
        timerRef.current = setTimeout(() => {
          lastTapRef.current = 0;
          timerRef.current = null;
          onSingleTap();
        }, 320);
      }
    }
  }, [disableZoom, onSingleTap]);

  return (
    <div
      className={`overflow-hidden ${className}`}
      onClick={handleTap}
      style={{ touchAction: 'pan-y' }}
    >
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding={decoding}
        className="w-full h-full object-cover"
        style={{
          ...style,
          transform: zoomed ? 'scale(2)' : 'scale(1)',
          transition: 'transform 0.3s ease',
          cursor: zoomed ? 'zoom-out' : 'zoom-in',
          transformOrigin: 'center center',
        }}
      />
    </div>
  );
};

export default ZoomableImage;
