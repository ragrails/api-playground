import React from 'react';
import { XendrLogo } from './XendrLogo';

interface PoweredBySignatureProps {
  mode: 'dark' | 'light';
}

export const PoweredBySignature: React.FC<PoweredBySignatureProps> = ({ mode }) => (
  <div className="mt-2 flex justify-end">
    <a
      href="https://www.xendr.dev"
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-[11px] font-medium text-muted/60 transition-colors hover:text-muted"
    >
      <span>Powered by</span>
      <XendrLogo
        className="h-[9px] w-auto opacity-70 transition-opacity hover:opacity-85"
        variant={mode === 'dark' ? 'light' : 'dark'}
      />
    </a>
  </div>
);
