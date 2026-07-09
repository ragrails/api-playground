import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiPlayground } from '@xendr/react'
import { XendrLogo } from '@pkg/components/widget/XendrLogo'
import { Icon, Tabs } from '@pkg/components/ui'
import { DotGridCanvas } from '../../components/DotGridCanvas'
import { Inspector } from './Inspector'
import { usePlaygroundConfig } from './playground'
import './Landing.css'

interface ApiPlaygroundShowcaseProps {
  /**
   * Render as a bounded, in-document-flow surface (rounded card) instead of the
   * full-viewport `.pg-shell`. Used when the showcase sits inside a scrolling
   * page, e.g. the landing showcase section — avoids the
   * `#root:has(.pg-shell)` overflow lock.
   */
  embedded?: boolean
}

/**
 * Full playground shell: live widget on the left, control inspector on the
 * right, plus the branded footer and embed/share flows.
 */
export function ApiPlaygroundShowcase({ embedded = false }: ApiPlaygroundShowcaseProps) {
  const cfg = usePlaygroundConfig()
  // Chrome theme (canvas + inspector). Independent of the widget's own mode,
  // which the inspector controls separately.
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  // Mobile (<=1024px) shows one pane at a time via a Preview / Setup & Embed toggle.
  // Above 1024px both panes are always visible, so this is inert there.
  const [mobileView, setMobileView] = useState<'preview' | 'embed'>('preview')

  return (
    <div
      data-theme={theme}
      className={
        embedded
          ? 'pg-embed flex min-w-0 flex-col bg-bg text-content h-full'
          : 'pg-shell flex h-[100svh] min-w-0 flex-col overflow-hidden bg-bg text-content'
      }
    >
      <div className="pg-workspace flex-1 overflow-hidden">
        <div
          className={`pg-canvas relative flex overflow-auto p-4 pb-8 sm:p-10 ${
            mobileView === 'embed' ? 'max-[1024px]:hidden' : ''
          }`}
        >
          <DotGridCanvas />
          <div className="relative z-10 m-auto w-full min-w-0 max-w-[570px]">
            <ApiPlayground
              request={cfg.request}
              onUpdateRequest={cfg.setRequest}
              title={cfg.title || undefined}
              responseExamples={cfg.responseExamples}
              mode={cfg.widgetMode}
              editable={cfg.editable}
              allowImport={cfg.allowImport}
              syncSnippet={cfg.syncSnippet}
              defaultView={cfg.defaultView}
              snippetLanguages={cfg.snippetLanguages}
              customization={cfg.customization}
            />
          </div>
          {/* Inside our own site (embedded) the floating footer is redundant. */}
          {!embedded && (
            <div className="pg-canvas-footer">
              <Link to="/">
                <span>Powered by</span>
                <XendrLogo className="h-2.5 w-auto" variant={theme === 'dark' ? 'light' : 'dark'} />
              </Link>
              <span data-separator aria-hidden="true" />
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
          )}
        </div>

        {/* One inspector for both breakpoints: always visible on desktop, and
            on mobile it is the "Setup & Embed" pane (controls first, the embed
            flow opens from its button). */}
        <Inspector cfg={cfg} className={mobileView === 'preview' ? 'max-[1024px]:hidden' : ''} />
      </div>

      {/* Mobile-only pane switcher. Hidden from 1024px up. */}
      <div className="hidden shrink-0 items-center justify-center border-t border-border p-2.5 max-[1024px]:flex">
        <Tabs
          variant="segmented"
          items={[
            { id: 'preview', label: 'Preview' },
            { id: 'embed', label: 'Setup & Embed' },
          ]}
          activeId={mobileView}
          onChange={(id) => setMobileView(id as 'preview' | 'embed')}
          className="pg-mobile-switcher w-full max-w-[280px] [&>button]:flex-1"
        />
      </div>
    </div>
  )
}

export default ApiPlaygroundShowcase
