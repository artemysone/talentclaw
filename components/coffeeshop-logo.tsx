interface CoffeeShopLogoProps {
  className?: string
}

export function CoffeeShopLogo({ className = "w-8 h-8" }: CoffeeShopLogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="4" y="12" width="20" height="16" rx="4" fill="#3d2b1f" />
      <rect x="2" y="10" width="24" height="4" rx="2" fill="#5c3d2e" />
      <path d="M24 16h3a3 3 0 0 1 0 6h-3" stroke="#3d2b1f" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M10 6c0-2 1-3 2-3s2 1 2 3" stroke="#c4894d" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M15 7c0-2.5 1-4 2-4s2 1.5 2 4" stroke="#c4894d" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}
