
import AssetsFiles from "@/assets";
import React from "react";

interface ProfileImageProps {
  src: string;
  alt: string;
  className?: string;
}

const ProfileImage: React.FC<ProfileImageProps> = ({
  src,
  alt,
  className = "",
}) => (
  <img
    src={src}
    alt={alt}
    className={`absolute lg:w-20 lg:h-20 md:w-15 md:h-15 rounded-full border-4 border-white shadow-lg ${className}`}
  />
);

const ConcentricArcsLayout = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-green-50 to-green-100 overflow-hidden">
      {/* Logo or Title */}
      <div className="absolute top-8 left-8 z-30">
        <div className="text-2xl font-bold text-green-700">
          <img src={AssetsFiles.LogoTwo} alt="" />
        </div>
      </div>

      {/* SVG Concentric Arcs */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          width="200%"
          height="100%"
          viewBox="0 0 800 800"
          className="absolute inset-0"
          style={{
            transform: "rotate(-90deg)",
          }}
        >
          {/* Concentric arcs - 4 balanced arcs */}

          {/* Outermost arc */}
          <path
            d="M 80 400 A 320 320 0 1 1 720 400"
            fill="none"
            stroke="rgb(134, 239, 172)"
            strokeWidth="2"
            opacity="0.3"
          />

          {/* Second arc */}
          <path
            d="M 140 400 A 260 260 0 1 1 660 400"
            fill="none"
            stroke="rgb(134, 239, 172)"
            strokeWidth="2"
            opacity="0.45"
          />

          {/* Third arc */}
          <path
            d="M 220 400 A 180 180 0 1 1 580 400"
            fill="none"
            stroke="rgb(134, 239, 172)"
            strokeWidth="2"
            opacity="0.6"
          />

          {/* Innermost arc */}
          <path
            d="M 300 400 A 100 100 0 1 1 500 400"
            fill="none"
            stroke="rgb(134, 239, 172)"
            strokeWidth="2"
            opacity="0.75"
          />
        </svg>
      </div>

      {/* Floating Profile Images positioned along the arcs */}
      <div
        className="absolute inset-0 z-20"
        style={{
          transform: "rotate()",
        }}
      >
        {/* Top-left profile - moved closer to the arc line */}
        <ProfileImage
          src={AssetsFiles.AuthBgImage.src}
          alt="Profile 4"
          className="bottom-16 top-90 lg:right-60 md:right-54 transform -translate-x-1/2"
        />

        {/* Left profile - moved closer to the arc line */}
        <ProfileImage
          src={AssetsFiles.AuthBgImage.src}
          alt="Profile 4"
          className="bottom-16 lg:top-20 md:top-35  right-20 transform -translate-x-1/2"
        />

        {/* Right profile - moved closer to the arc line */}
        <ProfileImage
          src={AssetsFiles.AuthBgImage.src}
          alt="Profile 4"
          className="lg:bottom-20 md:bottom-35 right-20 transform -translate-x-1/2"
        />

        {/* Bottom profile - moved closer to the arc line */}
        <ProfileImage
          src={AssetsFiles.AuthBgImage.src}
          alt="Profile 4"
          className="bottom-90 right-5 transform -translate-x-1/2"
        />
      </div>

      {/* Decorative corner dots */}
      <div className="absolute bottom-0 left-0 w-32 h-32 opacity-20 z-0">
        <div className="grid grid-cols-8 gap-1 p-4">
          {Array.from({ length: 64 }).map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 bg-green-400 rounded-full"
              style={{ opacity: Math.random() * 0.5 + 0.3 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConcentricArcsLayout;
