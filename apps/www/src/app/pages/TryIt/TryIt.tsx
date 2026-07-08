import { useState } from 'react'
import { ApiPlayground } from '@xendr/react'
import { Icon } from '@pkg/components/ui'
import { DotGridCanvas } from '../../components/DotGridCanvas'
import { SiteNav } from '../../components/SiteNav'
import '../Landing/Landing.css'

/**
 * /try-it: the site nav plus a bare full-screen surface with just the
 * interactive ApiPlayground over the dot-grid canvas — no inspector, no
 * config rail. Opens straight in the console with an empty request so
 * visitors can paste or build their own. One toggle themes everything:
 * nav, canvas chrome, and the widget itself.
 */
function TryIt() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  return (
    <div
      data-theme={theme}
      className="pg-shell flex h-[100svh] flex-col overflow-hidden bg-bg text-content"
    >
      <SiteNav theme={theme} />
      <div className="pg-canvas relative flex flex-1 overflow-auto p-6 sm:p-10">
        <DotGridCanvas />
        <div className="relative z-10 m-auto w-full max-w-[570px]">
          <ApiPlayground request="" title="Try it out" defaultView="console" mode={theme} />
        </div>
        <div className="pg-canvas-footer pg-canvas-footer--right">
          <button
            type="button"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className="grid h-5 w-5 place-items-center rounded-full transition-colors hover:text-content"
          >
            <Icon name={theme === 'light' ? 'moon' : 'sun'} className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default TryIt
