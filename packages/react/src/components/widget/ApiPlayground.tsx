import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, CodeBlock, FluidHeight, Icon } from '@/components/ui';
import { ApiConsole, type ApiConsoleHistoryEntry } from './ApiConsole';
import { CodePreviewCard } from './CodePreviewCard';
import { ImportCard } from './ImportCard';
import { PoweredBySignature } from './PoweredBySignature';
import { RequestSnippet } from './RequestSnippet';
import { parseCurl } from '@/lib/widget/curl';
import { formatJsonIfPossible } from '@/lib/widget/format';
import { generateSnippet } from '@/lib/widget/snippets';
import type {
  ApiPlaygroundResponseExample,
  SnippetLanguage,
  WidgetRequest,
  WidgetResponse,
} from '@/lib/widget/types';

type ApiPlaygroundPanel = 'idle' | 'console' | 'import' | 'code';
type RenderedPanel = 'snippet' | 'console' | 'import' | 'code' | 'invalid';

export type ApiPlaygroundMode = 'dark' | 'light' | 'system';
export type ApiPlaygroundDefaultView = 'snippet' | 'console';

/** Resolve the widget's effective theme, following the OS for `'system'`. */
function useResolvedMode(mode: ApiPlaygroundMode): 'dark' | 'light' {
  const getSystem = (): 'dark' | 'light' =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  const [systemMode, setSystemMode] = useState<'dark' | 'light'>(getSystem);

  useEffect(() => {
    if (mode !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemMode(media.matches ? 'dark' : 'light');
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);

  return mode === 'system' ? systemMode : mode;
}

export interface ApiPlaygroundThemeCustomization {
  primary?: string;
  background?: string;
}

export interface ApiPlaygroundCustomization extends ApiPlaygroundThemeCustomization {
  light?: ApiPlaygroundThemeCustomization;
  dark?: ApiPlaygroundThemeCustomization;
}

export interface ApiPlaygroundProps {
  request: string;
  title?: string;
  /** @deprecated Use `responseExamples` instead. Kept for backward compatibility. */
  sampleResponse?: string;
  responseExamples?: ApiPlaygroundResponseExample[];
  onUpdateRequest?: (request: string) => void;
  editable?: boolean;
  allowImport?: boolean;
  /** Color theme: `'dark'` (default), `'light'`, or `'system'` (follows the OS). */
  mode?: ApiPlaygroundMode;
  /**
   * When true, the start snippet tracks live edits made in the console.
   * Default false: the snippet stays pinned to the documented `request`.
   */
  syncSnippet?: boolean;
  /** Initial widget view. Use `'console'` to open directly in Try it Out. */
  defaultView?: ApiPlaygroundDefaultView;
  snippetLanguages?: readonly SnippetLanguage[];
  customization?: ApiPlaygroundCustomization;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = hex.trim().replace(/^#/, '');
  const value =
    normalized.length === 3
      ? normalized.split('').map((char) => char + char).join('')
      : normalized;

  if (!/^[0-9a-f]{6}$/i.test(value)) return null;

  const int = Number.parseInt(value, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;
}

function mixHex(base: string, overlay: string, overlayAmount: number): string | null {
  const baseRgb = hexToRgb(base);
  const overlayRgb = hexToRgb(overlay);
  if (!baseRgb || !overlayRgb) return null;

  const mixed = baseRgb.map((channel, index) =>
    channel * (1 - overlayAmount) + overlayRgb[index] * overlayAmount,
  ) as [number, number, number];

  return rgbToHex(mixed);
}

function backgroundThemeVars(background: string, mode: 'dark' | 'light'): React.CSSProperties {
  const surface = mode === 'dark' ? mixHex(background, '#ffffff', 0.08) : mixHex(background, '#ffffff', 0.78);
  const surface2 = mode === 'dark' ? mixHex(background, '#ffffff', 0.14) : mixHex(background, '#000000', 0.03);
  const border = mode === 'dark' ? mixHex(background, '#ffffff', 0.16) : mixHex(background, '#000000', 0.08);

  return {
    '--bg': background,
    ...(surface ? { '--surface': surface } : {}),
    ...(surface2 ? { '--surface-2': surface2 } : {}),
    ...(border ? { '--border': border } : {}),
  } as React.CSSProperties;
}

function resolveCustomization(
  customization: ApiPlaygroundCustomization | undefined,
  mode: 'dark' | 'light',
): ApiPlaygroundThemeCustomization {
  const modeCustomization = customization?.[mode];

  return {
    primary: modeCustomization?.primary ?? customization?.primary,
    background: modeCustomization?.background ?? customization?.background,
  };
}

function inferredTitle(request: WidgetRequest): string {
  try {
    const url = new URL(request.url);
    return `${request.method} ${url.pathname || '/'}`;
  } catch {
    return `${request.method} ${request.url || '/'}`;
  }
}

const InvalidRequest: React.FC<{
  request: string;
  allowImport: boolean;
  editable: boolean;
  onTryImport: () => void;
}> = ({ request, allowImport, editable, onTryImport }) => (
  <Card label="Invalid request">
    <div className="relative flex items-center justify-between">
      <div className="text-sm font-medium text-content">cURL</div>
      {allowImport && editable && (
        <Button
          size="sm"
          variant="primary"
          onClick={onTryImport}
          rightIcon={<Icon name="import" className="h-4 w-4" />}
        >
          Import
        </Button>
      )}
    </div>
    <div className="mt-4">
      <CodeBlock
        code={request.trim() || 'Paste or pass a cURL request with a URL.'}
        language="bash"
        showLineNumbers
      />
    </div>
    <p className="mt-3 text-xs text-muted">The request could not be parsed into a valid URL.</p>
  </Card>
);

function hydrateRequest(
  request: WidgetRequest,
  title?: string,
  sampleResponse?: string,
  responseExamples?: ApiPlaygroundResponseExample[],
): WidgetRequest {
  const normalizedResponseExamples = responseExamples?.length
    ? responseExamples.map((example) => ({
        ...example,
        body: formatJsonIfPossible(example.body),
      }))
    : undefined;

  return {
    ...request,
    title: title ?? inferredTitle(request),
    sampleResponse: normalizedResponseExamples ? undefined : sampleResponse ? formatJsonIfPossible(sampleResponse) : undefined,
    responseExamples: normalizedResponseExamples,
  };
}

/** Full embeddable API playground with cURL as its public request source of truth. */
export const ApiPlayground: React.FC<ApiPlaygroundProps> = ({
  request,
  title,
  sampleResponse,
  responseExamples,
  onUpdateRequest,
  editable = true,
  allowImport = true,
  mode = 'dark',
  syncSnippet = false,
  defaultView = 'snippet',
  snippetLanguages,
  customization,
}) => {
  const resolvedMode = useResolvedMode(mode);
  const [panel, setPanel] = useState<ApiPlaygroundPanel>(defaultView === 'console' ? 'console' : 'idle');
  const [consoleHistory, setConsoleHistory] = useState<ApiConsoleHistoryEntry[]>([]);
  const [consoleResponse, setConsoleResponse] = useState<WidgetResponse | null>(null);
  const previousDefaultViewRef = useRef(defaultView);

  useEffect(() => {
    if (previousDefaultViewRef.current === defaultView) return;
    previousDefaultViewRef.current = defaultView;
    setPanel(defaultView === 'console' ? 'console' : 'idle');
  }, [defaultView]);

  // Two separate entities:
  //  • `request` (prop): the documented request, drives the preview snippet.
  //  • `liveCurl` (internal): the console's working copy.
  // They start equal; the console only edits `liveCurl`. Reset when the
  // documented request changes.
  const [liveCurl, setLiveCurl] = useState(request);
  useEffect(() => {
    setLiveCurl(request);
  }, [request]);

  // Console entity: always the live cURL. An intentionally empty request is a
  // blank console draft (start-from-scratch surfaces), not an invalid one —
  // garbage input still falls through to the invalid card.
  const parsedRequest = useMemo(() => {
    const parsed =
      parseCurl(liveCurl) ??
      (liveCurl.trim() === '' ? ({ title: '', method: 'GET', url: '', headers: [] } as WidgetRequest) : null);
    return parsed ? hydrateRequest(parsed, title, sampleResponse, responseExamples) : null;
  }, [liveCurl, title, sampleResponse, responseExamples]);
  const lastConsoleRequestRef = useRef<WidgetRequest | null>(parsedRequest);
  if (parsedRequest) lastConsoleRequestRef.current = parsedRequest;
  const consoleRequest = parsedRequest ?? lastConsoleRequestRef.current;

  // Preview entity: the documented `request`, unless `syncSnippet` mirrors live edits.
  const snippetCurl = syncSnippet ? liveCurl : request;
  const snippetRequest = useMemo(() => {
    const parsed = parseCurl(snippetCurl);
    return parsed ? hydrateRequest(parsed, title, sampleResponse, responseExamples) : null;
  }, [snippetCurl, title, sampleResponse, responseExamples]);

  const publishCurl = (nextCurl: string) => {
    setLiveCurl(nextCurl);
    onUpdateRequest?.(nextCurl);
  };

  const updateRequest = (nextRequest: WidgetRequest) => {
    publishCurl(generateSnippet(nextRequest, 'curl'));
  };

  const importRequest = (_nextRequest: WidgetRequest, importedCurl: string) => {
    publishCurl(importedCurl.trim());
    setPanel('console');
  };

  const resolvedCustomization = resolveCustomization(customization, resolvedMode);
  const style = {
    ...(resolvedCustomization.primary ? { '--primary': resolvedCustomization.primary } : {}),
    ...(resolvedCustomization.background ? backgroundThemeVars(resolvedCustomization.background, resolvedMode) : {}),
  } as React.CSSProperties;

  const showConsole = panel === 'console' && consoleRequest;
  const showCode = panel === 'code' && parsedRequest;
  const renderedPanel: RenderedPanel =
    panel === 'import'
      ? 'import'
      : showCode
        ? 'code'
        : showConsole
          ? 'console'
          : snippetRequest
            ? 'snippet'
            : 'invalid';

  return (
    <div data-theme={resolvedMode} style={style} className="w-full text-content text-left">
      <FluidHeight watchKey={renderedPanel}>
        <div key={renderedPanel} className="w-full">
          {panel === 'import' ? (
            <ImportCard
              onImport={importRequest}
              onCancel={() => setPanel(parsedRequest ? 'console' : 'idle')}
            />
          ) : showCode ? (
            <CodePreviewCard
              request={parsedRequest}
              onBack={() => setPanel('console')}
              snippetLanguages={snippetLanguages}
            />
          ) : showConsole ? (
            <ApiConsole
              request={consoleRequest}
              onRequestChange={updateRequest}
              history={consoleHistory}
              onHistoryChange={setConsoleHistory}
              selectedResponse={consoleResponse}
              onSelectedResponseChange={setConsoleResponse}
              title={title}
              editable={editable}
              onBack={defaultView === 'console' ? undefined : () => setPanel('idle')}
              onImport={allowImport && editable ? () => setPanel('import') : undefined}
              onCodePreview={() => setPanel('code')}
            />
          ) : snippetRequest ? (
            <RequestSnippet
              request={snippetRequest}
              onTryItOut={() => setPanel('console')}
              snippetLanguages={snippetLanguages}
            />
          ) : (
            <InvalidRequest
              request={snippetCurl}
              allowImport={allowImport}
              editable={editable}
              onTryImport={() => setPanel('import')}
            />
          )}
          <PoweredBySignature mode={resolvedMode} />
        </div>
      </FluidHeight>
    </div>
  );
};
