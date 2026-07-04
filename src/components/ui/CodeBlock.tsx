import React, { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { highlightLine } from '@/lib/highlight';
import type { CodeLanguage } from '@/lib/highlight';
import { CopyButton } from './CopyButton';

interface CodeBlockProps {
  code: string;
  language?: CodeLanguage;
  showLineNumbers?: boolean;
  copyable?: boolean;
  /** Max height before the body scrolls (CSS length). */
  maxHeight?: string;
  /** Reveal each line with a staggered fade-in from the top (e.g. when a response arrives). */
  reveal?: boolean;
  /** Per-line stagger for `reveal`, in ms. */
  revealStagger?: number;
  className?: string;
}

/** Read-only, syntax-highlighted code surface with optional line numbers + copy. */
export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'plain',
  showLineNumbers = false,
  copyable = true,
  maxHeight,
  reveal = false,
  revealStagger = 70,
  className,
}) => {
  const lines = useMemo(() => code.replace(/\n$/, '').split('\n'), [code]);
  const gutterWidth = String(lines.length).length;

  return (
    <div
      className={cn(
        'group relative w-full overflow-hidden rounded-lg border border-border/35 bg-surface-2',
        className,
      )}
    >
      {copyable && (
        <div className="absolute right-2 top-2 z-10">
          <CopyButton value={code} size="sm" />
        </div>
      )}
      <div className="overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
        <pre className="w-max min-w-full p-3 font-mono text-[13px] leading-relaxed text-content">
          <code className="flex flex-col bg-transparent p-0 text-[13px] text-content">
            {lines.map((line, i) => (
              <span
                key={i}
                className={cn('flex', reveal && 'motion-safe:animate-[fade-in_0.6s_ease-out_both]')}
                style={reveal ? { animationDelay: `${i * revealStagger}ms` } : undefined}
              >
                {showLineNumbers && (
                  <span
                    className="mr-4 shrink-0 select-none text-right text-muted"
                    style={{ width: `${gutterWidth}ch` }}
                  >
                    {i + 1}
                  </span>
                )}
                <span className="whitespace-pre">{highlightLine(line, language) || ' '}</span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
};
