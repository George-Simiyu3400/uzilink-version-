import React from "react";

interface UziLinkLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  withText?: boolean;
  theme?: "light" | "dark";
}

export const UziLinkLogo: React.FC<UziLinkLogoProps> = ({
  className = "",
  size = "md",
  animated = false,
  withText = true,
  theme = "light"
}) => {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-11 h-11",
    xl: "w-16 h-16"
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl"
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Custom UziLink Loop Emblem (Thread Knot + Recycled Leaf) */}
      <div className={`relative ${iconSizes[size]} shrink-0 ${animated ? "animate-pulse" : ""}`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Outer organic circular loop path */}
          <circle
            cx="24"
            cy="24"
            r="20"
            className={theme === "light" ? "stroke-emerald-100" : "stroke-emerald-950"}
            strokeWidth="3"
            strokeDasharray="4 3"
          />
          {/* Primary Interlocking Green Thread Loop */}
          <path
            d="M16 28C13.7909 28 12 26.2091 12 24C12 21.7909 13.7909 20 16 20C19.5 20 22 28 25.5 28C27.9853 28 30 25.9853 30 23.5C30 21.0147 27.9853 19 25.5 19C22.5 19 20.5 27 18 27"
            stroke="url(#uzilink-gradient-emerald)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Secondary Blue Loop Link */}
          <path
            d="M32 20C34.2091 20 36 21.7909 36 24C36 26.2091 34.2091 28 32 28C28.5 28 26 20 22.5 20C20.0147 20 18 22.0147 18 24.5C18 26.9853 20.0147 29 22.5 29C25.5 29 27.5 21 30 21"
            stroke="url(#uzilink-gradient-blue)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Subtle Leaf Sprout Accent */}
          <path
            d="M24 10C24 10 26 13 28 14C28 16 26 17 24 17C22 17 20 16 20 14C22 13 24 10 24 10Z"
            fill="url(#uzilink-gradient-emerald)"
          />
          {/* Gradients */}
          <defs>
            <linearGradient id="uzilink-gradient-emerald" x1="12" y1="10" x2="30" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#059669" />
              <stop offset="1" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="uzilink-gradient-blue" x1="18" y1="20" x2="36" y2="29" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0284C7" />
              <stop offset="1" stopColor="#38BDF8" />
            </linearGradient>
          </defs>
        </svg>

        {animated && (
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/40 animate-ping pointer-events-none" />
        )}
      </div>

      {withText && (
        <div className="flex flex-col leading-tight select-none">
          <div className={`font-extrabold tracking-tight ${textSizes[size]} font-['Poppins',sans-serif]`}>
            <span className={theme === "light" ? "text-slate-900" : "text-white"}>Uzi</span>
            <span className="text-emerald-600">Link</span>
          </div>
          {size !== "sm" && (
            <span className={`text-[10px] tracking-wider uppercase font-semibold ${theme === "light" ? "text-slate-600" : "text-slate-400"}`}>
              Textile Circularity Kenya
            </span>
          )}
        </div>
      )}
    </div>
  );
};
