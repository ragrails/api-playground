import React from 'react';

type XendrLogoVariant = 'light' | 'dark' | 'coloredDark' | 'coloredLight';

interface XendrLogoProps {
  className?: string;
  title?: string;
  variant?: XendrLogoVariant;
}

const LOGO_SRC_BY_VARIANT: Record<XendrLogoVariant, string> = {
  light: '/logo/svg/xendr-white-dark-bg.svg',
  dark: '/logo/svg/xendr-black-light-bg.svg',
  coloredDark: '/logo/svg/xendr-purple-dark-bg.svg',
  coloredLight: '/logo/svg/xendr-purple-light-bg.svg',
};

const getLogoSrc = (variant: XendrLogoVariant) => {
  const path = LOGO_SRC_BY_VARIANT[variant];

  if (typeof window === 'undefined') {
    return path;
  }

  const { hostname } = window.location;
  const isXendrHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('xendr.dev');

  return isXendrHost ? path : `https://www.xendr.dev${path}`;
};

export const XendrLogo: React.FC<XendrLogoProps> = ({ className, title = 'Xendr', variant = 'coloredDark' }) => (
  <img
    src={getLogoSrc(variant)}
    alt={title}
    className={className}
    loading="lazy"
    decoding="async"
  />
);
