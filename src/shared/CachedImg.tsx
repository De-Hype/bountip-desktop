import React, { useState, useEffect } from "react";

interface CachedImgProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  sizes?: string;
}

export const CachedImg: React.FC<CachedImgProps> = ({
  src,
  alt,
  width,
  height,
  className,
  fill,
  sizes,
}) => {
  const [resolved, setResolved] = useState<string>(src);

  useEffect(() => {
    setResolved(src);
    let active = true;
    (async () => {
      try {
        const w = window as unknown as {
          electronAPI?: { cacheGet: (key: string) => Promise<any> };
        };
        const api = w.electronAPI;
        if (!api) return;
        const cached = await api.cacheGet(`image:${src}`);
        if (active && cached && cached.data) setResolved(String(cached.data));
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, [src]);

  return (
    <img
      src={resolved}
      alt={alt}
      width={width}
      height={height}
      className={className}
      {...(fill ? { fill: true } : {})}
      {...(sizes ? { sizes } : {})}
    />
  );
};
