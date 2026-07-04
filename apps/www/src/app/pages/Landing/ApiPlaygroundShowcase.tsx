import { ApiPlayground } from '@xendr/react'
import { XendrLogo } from '@pkg/components/widget/XendrLogo'
import { Inspector } from './Inspector'
import { usePlaygroundConfig } from './playground'

/**
 * Full playground shell: live widget on the left, control inspector on the
 * right, plus the branded footer and embed/share flows.
 */
export function ApiPlaygroundShowcase() {
  const cfg = usePlaygroundConfig()

  return (
    <div data-theme="light" className="pg-shell flex h-[100svh] flex-col overflow-hidden bg-bg text-content">
      <div className="pg-workspace flex-1 overflow-hidden">
        <div className="pg-canvas relative flex overflow-auto p-6 pb-20 sm:p-10 sm:pb-24">
          <div className="relative z-10 m-auto w-full max-w-[570px]">
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
          <div className="pg-canvas-footer">
            <a href="https://www.xendr.dev" target="_blank" rel="noreferrer">
              <span>Powered by</span>
              <XendrLogo className="h-3 w-auto text-content" />
            </a>
            <span data-separator aria-hidden="true" />
            <a href="https://www.xendr.dev" target="_blank" rel="noreferrer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="shrink-0"
              >
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2s10 4.477 10 10M12 7.75c-.621 0-1.125.504-1.125 1.125a.75.75 0 0 1-1.5 0a2.625 2.625 0 1 1 4.508 1.829q-.138.142-.264.267a7 7 0 0 0-.571.617c-.22.282-.298.489-.298.662V13a.75.75 0 0 1-1.5 0v-.75c0-.655.305-1.186.614-1.583c.229-.294.516-.58.75-.814q.106-.105.193-.194A1.125 1.125 0 0 0 12 7.75M12 17a1 1 0 1 0 0-2a1 1 0 0 0 0 2"
                  clipRule="evenodd"
                />
              </svg>
              Help
            </a>
          </div>
        </div>

        <Inspector cfg={cfg} />
      </div>
    </div>
  )
}

export default ApiPlaygroundShowcase
