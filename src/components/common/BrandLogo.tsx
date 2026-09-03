import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: 'white' | 'dark';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  textColor = 'white',
  className = '',
}) => {
  const iconSizeMap = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <div className={`flex items-center space-x-2.5 ${className}`}>
      {/* Crisp Circular Vector Emblem */}
      <div className={`relative shrink-0 ${iconSizeMap[size]} flex items-center justify-center`}>
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-xs"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer circle */}
          <circle
            cx="100"
            cy="100"
            r="92"
            stroke="#0056B3"
            strokeWidth="12"
            fill="#FFFFFF"
          />
          {/* Inner ring */}
          <circle
            cx="100"
            cy="100"
            r="82"
            stroke="#0056B3"
            strokeWidth="2"
            strokeDasharray="4 2"
            opacity="0.3"
          />

          {/* Bar Chart Behind Arrow */}
          <rect x="70" y="70" width="13" height="42" rx="2" fill="#0056B3" />
          <rect x="87" y="58" width="13" height="54" rx="2" fill="#0056B3" />
          <rect x="104" y="44" width="13" height="68" rx="2" fill="#0056B3" />

          {/* Upward Growth Arrow */}
          <path
            d="M60 102 L86 78 L104 94 L138 52"
            stroke="#0056B3"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polygon points="144,46 128,52 140,66" fill="#0056B3" />

          {/* Handshake Arch & Hands */}
          {/* Left sleeve & wrist */}
          <path
            d="M32 108 C35 125 45 138 58 145 L78 128 C74 122 75 116 80 114 L98 124 C100 126 102 129 100 133 L88 152 C82 155 76 153 72 148 L56 136 C42 128 34 116 32 108 Z"
            fill="#0056B3"
          />
          {/* Right sleeve & fingers */}
          <path
            d="M168 108 C165 125 155 138 142 145 L122 128 C126 122 125 116 120 114 L102 124 C100 126 98 129 100 133 L112 152 C118 155 124 153 128 148 L144 136 C158 128 166 116 168 108 Z"
            fill="#0056B3"
          />
          {/* Interlocked handshake fingers */}
          <path
            d="M78 148 C82 156 94 162 102 162 C110 162 122 156 126 148 C120 152 110 154 102 154 C94 154 84 152 78 148 Z"
            fill="#004085"
          />
        </svg>
      </div>

      {/* Brand Name Typography */}
      {showText && (
        <div className="flex flex-col justify-center leading-none select-none">
          <div className="flex items-center space-x-1.5">
            <span
              className={`font-black text-sm tracking-tight uppercase ${
                textColor === 'white' ? 'text-white' : 'text-slate-900 dark:text-white'
              }`}
            >
              ĐẠI LÝ THUẾ <span className="text-blue-500">THÀNH PHỐ</span>
            </span>
          </div>
          <span
            className={`text-[9px] font-bold tracking-wider uppercase mt-0.5 ${
              textColor === 'white' ? 'text-blue-300/90' : 'text-blue-600 dark:text-blue-400'
            }`}
          >
            Đồng Hành Pháp Lý Doanh Nghiệp
          </span>
        </div>
      )}
    </div>
  );
};
