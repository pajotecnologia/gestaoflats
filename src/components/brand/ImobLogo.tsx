import React from "react";

interface ImobLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
  showTagline?: boolean;
  variant?: "light" | "dark" | "full-color";
}

export default function ImobLogo({
  className = "",
  size = "md",
  showSubtitle = true,
  showTagline = false,
  variant = "full-color",
}: ImobLogoProps) {
  // Configurações de Escala
  const dimensions = {
    sm: { height: 26, textMain: "text-lg", textBy: "text-[9px]", textTag: "text-[10px]" },
    md: { height: 38, textMain: "text-2xl", textBy: "text-[11px]", textTag: "text-xs" },
    lg: { height: 50, textMain: "text-3xl", textBy: "text-xs", textTag: "text-sm" },
    xl: { height: 68, textMain: "text-5xl", textBy: "text-sm", textTag: "text-base" },
  }[size];

  const textColor = variant === "light" ? "text-slate-900" : "text-white";
  const subtextColor = variant === "light" ? "text-slate-600" : "text-slate-300";

  return (
    <div className={`flex flex-col select-none ${className}`}>
      <div className="flex items-center space-x-2">
        {/* Marca Tipográfica IMOB com Ícone Estilizado no M */}
        <div className="flex items-center">
          <span className={`font-black tracking-tight ${dimensions.textMain} ${textColor}`}>
            I
          </span>
          {/* O "M" com o triângulo verde esmeralda no centro */}
          <span className="relative inline-flex items-center justify-center font-black">
            <span className={`font-black tracking-tight ${dimensions.textMain} ${textColor}`}>
              M
            </span>
            <span className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] sm:border-l-[6px] border-l-transparent border-r-[4px] sm:border-r-[6px] border-r-transparent border-b-[7px] sm:border-b-[10px] border-b-emerald-400" />
          </span>
          <span className={`font-black tracking-tight ${dimensions.textMain} ${textColor}`}>
            OB
          </span>
        </div>
      </div>

      {/* by PAJO Tecnologia */}
      {showSubtitle && (
        <div className={`flex items-center space-x-1 tracking-widest uppercase font-medium ${dimensions.textBy} ${subtextColor} -mt-0.5`}>
          <span className="opacity-80">by</span>
          <span className="font-extrabold tracking-wider text-emerald-400">
            PAJO
          </span>
          <span className="opacity-80">Tecnologia</span>
        </div>
      )}

      {/* Tagline: Gestão inteligente de imóveis */}
      {showTagline && (
        <span className={`tracking-wide font-normal text-slate-400 mt-1 ${dimensions.textTag}`}>
          Gestão inteligente de imóveis
        </span>
      )}
    </div>
  );
}
