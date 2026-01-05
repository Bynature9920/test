interface CryptoLogoProps {
  currency: 'BTC' | 'USDT' | 'ETH'
  size?: number
  className?: string
}

export default function CryptoLogo({ currency, size = 24, className = '' }: CryptoLogoProps) {
  const logoColors = {
    BTC: '#F7931A', // Bitcoin orange
    ETH: '#627EEA', // Ethereum blue
    USDT: '#26A17B', // Tether teal
  }

  const logos = {
    BTC: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ display: 'block', flexShrink: 0 }}
      >
        <circle cx="12" cy="12" r="12" fill={logoColors.BTC} />
        {/* Official Bitcoin B symbol with two vertical lines */}
        <path
          d="M16.793 8.27c.16-1.076-.653-1.654-1.765-2.04l.36-1.445-1.44-.358-.35 1.405c-.378-.094-.767-.183-1.15-.27l.353-1.415-1.44-.358-.36 1.444c-.314-.072-.623-.14-.92-.212l.001-.005-1.212-.302-.234.94s.653.15.639.158c.356.089.42.325.41.512l-.413 1.656c.025.006.057.015.092.03l-.093-.023-.576 2.31c-.043.107-.152.268-.4.212.009.012-.64-.16-.64-.16l-.437 1.01 1.145.285c.213.053.42.11.62.16l-.365 1.466 1.438.357.36-1.445c.392.106.77.204 1.14.295l-.36 1.444 1.44.358.365-1.464c2.244.425 3.933.253 4.644-1.778.57-1.62-.028-2.554-1.204-3.168.857-.197 1.502-.76 1.673-1.92zm-2.35 3.77c-.405 1.63-3.157.75-4.048.53l.722-2.896c.891.222 3.75.62 3.326 2.366zm.402-4.05c-.37 1.483-2.66.73-3.404.545l.654-2.623c.744.185 3.14.527 2.75 2.078z"
          fill="#FFFFFF"
          transform="scale(0.7) translate(3.4, 3.4)"
        />
      </svg>
    ),
    ETH: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ display: 'block', flexShrink: 0 }}
      >
        <circle cx="12" cy="12" r="12" fill={logoColors.ETH} />
        {/* Official Ethereum diamond shape */}
        <path
          d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.37 4.35z"
          fill="#FFFFFF"
        />
        <path
          d="M11.944 0L4.58 12.223l7.364 4.354 7.365-4.354L11.944 0z"
          fill="#C8C2FF"
        />
      </svg>
    ),
    USDT: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ display: 'block', flexShrink: 0 }}
      >
        <path
          d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z"
          fill={logoColors.USDT}
        />
        {/* Official Tether T symbol */}
        <path
          d="M13.312 8.475v-1.95h3.6V5.25H7.088v1.275h3.6v1.95c-2.4.15-4.2.825-4.2 1.725 0 .9 1.8 1.575 4.2 1.725v6.675h2.624v-6.675c2.4-.15 4.2-.825 4.2-1.725 0-.9-1.8-1.575-4.2-1.725zm0 2.85c-2.775.225-4.875.6-4.875 1.05 0 .45 2.1.825 4.875 1.05v-2.1zm0-5.7v2.1c2.775.225 4.875.6 4.875 1.05 0 .45-2.1.825-4.875 1.05V5.625z"
          fill="#FFFFFF"
        />
      </svg>
    ),
  }

  return logos[currency]
}
