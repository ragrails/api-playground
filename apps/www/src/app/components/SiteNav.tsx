import { Link } from 'react-router-dom'
import { Icon } from '@pkg/components/ui'

const GITHUB_URL = 'https://github.com/samowolabi/xendr'
const NPM_URL = 'https://www.npmjs.com/package/@xendr/react'

interface SiteNavProps {
  /** Chrome theme; dark matches the /try-it surface. */
  theme?: 'light' | 'dark'
}

/** Marketing site nav: logo left, primary links right. */
export function SiteNav({ theme = 'light' }: SiteNavProps) {
  const dark = theme === 'dark'
  const linkClass = dark
    ? 'text-white/[0.78] transition-colors hover:text-brand'
    : 'text-ink transition-colors hover:text-brand-deep'

  return (
    <header
      className={
        dark
          ? 'sticky top-0 z-40 border-b border-white/10 bg-[#14151a]/90 backdrop-blur'
          : 'sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur'
      }
    >
      <div className="mx-auto flex max-w-[1270px] items-center justify-between gap-6 px-6 py-4">
        <Link to="/" className="inline-flex items-center" aria-label="Xendr home">
          <img
            src={dark ? '/logo/svg/xendr-white-dark-bg.svg' : '/logo/svg/xendr-black-light-bg.svg'}
            alt="Xendr"
            className="h-[22px] w-auto"
          />
        </Link>
        <nav className="flex items-center gap-7 text-xs max-[640px]:gap-4" aria-label="Primary">
          <Link to="/playground" className={linkClass}>
            Playground
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-1 ${linkClass}`}
          >
            <Icon name="github" className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Star on GitHub</span>
            <span className="sm:hidden">Star</span>
          </a>
          <a
            href={NPM_URL}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-1 ${linkClass}`}
          >
            <Icon name="cloud-download" className="h-3.5 w-3.5" />
            NPM (800+)
          </a>
        </nav>
      </div>
    </header>
  )
}
