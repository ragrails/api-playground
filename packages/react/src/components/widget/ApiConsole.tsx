import React, { useRef, useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  CodeBlock,
  CopyButton,
  FluidHeight,
  Icon,
  IconButton,
  MethodBadge,
  MethodSelect,
  Select,
  StatusBadge,
  Tabs,
  TextField,
  Tooltip,
} from '@/components/ui';
import type { HttpMethod } from '@/types';
import { cn } from '@/lib/cn';
import { executeWidgetRequest, widgetErrorResponse } from '@/lib/widget/executor';
import { AUTH_HEADER_KEY, METHOD_OPTIONS, requestKey } from '@/lib/widget/request-model';
import type { EditableHeader } from '@/lib/widget/request-model';
import { useRequestDraft } from '@/lib/widget/use-request-draft';
import type { DraftHeader } from '@/lib/widget/use-request-draft';
import type {
  WidgetAuth,
  WidgetRequest,
  WidgetResponse,
  WidgetSendHandler,
} from '@/lib/widget/types';

type RequestTab = 'headers' | 'body' | 'auth';
type ResponseTab = 'response' | 'history';
type ResponsePanel = 'body' | 'headers';
type AuthMode = WidgetAuth['type'];

export interface ApiConsoleProps {
  request: WidgetRequest;
  onRequestChange?: (request: WidgetRequest) => void;
  onSend?: WidgetSendHandler;
  history?: ApiConsoleHistoryEntry[];
  onHistoryChange?: React.Dispatch<React.SetStateAction<ApiConsoleHistoryEntry[]>>;
  selectedResponse?: WidgetResponse | null;
  onSelectedResponseChange?: React.Dispatch<React.SetStateAction<WidgetResponse | null>>;
  title?: string;
  editable?: boolean;
  onBack?: () => void;
  onImport?: () => void;
  onCodePreview?: () => void;
  className?: string;
}

const REQUEST_TABS: { id: RequestTab; label: string; badge?: number }[] = [
  { id: 'body', label: 'Body' },
  { id: 'headers', label: 'Headers' },
  { id: 'auth', label: 'Auth' },
];

const RESPONSE_TABS: { id: ResponseTab; label: string }[] = [
  { id: 'response', label: 'Response' },
  { id: 'history', label: 'History' },
];

const RESPONSE_PANEL_OPTIONS: ResponsePanel[] = ['body', 'headers'];
const AUTH_OPTIONS: { id: AuthMode; label: string; className: string }[] = [
  { id: 'none', label: 'None', className: 'font-semibold text-content hover:bg-surface-2' },
  { id: 'bearer', label: 'Bearer', className: 'font-semibold text-content hover:bg-surface-2' },
  { id: 'apiKey', label: 'API key', className: 'font-semibold text-content hover:bg-surface-2' },
];

function rowsForBody(body: string): number {
  return Math.max(3, body.split('\n').length);
}

function formatJsonBody(body: string): string {
  return JSON.stringify(JSON.parse(body), null, 2);
}

const FieldShell: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      'flex min-h-10 items-center rounded-md border border-border/35 bg-surface-2 px-3 text-sm text-content',
      className,
    )}
  >
    {children}
  </div>
);

const ResponsePanelSwitch: React.FC<{
  value: ResponsePanel;
  onChange: (value: ResponsePanel) => void;
}> = ({ value, onChange }) => (
  <div className="inline-flex items-center gap-4">
    {RESPONSE_PANEL_OPTIONS.map((item) => (
      <button
        key={item}
        type="button"
        onClick={() => onChange(item)}
        className={cn(
          'text-[12px] font-medium capitalize transition-colors',
          value === item ? 'text-content' : 'text-muted hover:text-content',
        )}
      >
        {item}
      </button>
    ))}
  </div>
);

interface RequestBarProps {
  method: HttpMethod;
  url: string;
  isSending: boolean;
  editable: boolean;
  onMethodChange: (method: HttpMethod) => void;
  onUrlChange: (url: string) => void;
  onSend: () => void;
}

const RequestBar: React.FC<RequestBarProps> = ({
  method,
  url,
  isSending,
  editable,
  onMethodChange,
  onUrlChange,
  onSend,
}) => (
  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
    <FieldShell className="min-w-0">
      <MethodSelect
        value={method}
        onChange={onMethodChange}
        methods={METHOD_OPTIONS}
        disabled={!editable}
      />
      <input
        value={url}
        onChange={(event) => onUrlChange(event.target.value)}
        readOnly={!editable}
        aria-label="Request URL"
        className="min-w-0 flex-1 bg-transparent px-2 py-2 font-mono text-[14px] text-content outline-none read-only:cursor-default"
      />
    </FieldShell>
    <Button
      size="md"
      variant="primary"
      isLoading={isSending}
      onClick={onSend}
      rightIcon={<Icon name="send" className="h-4 w-4" />}
      className="min-h-10 px-7"
    >
      Send
    </Button>
  </div>
);

interface HeaderRowProps {
  header: DraftHeader;
  editable: boolean;
  onUpdate: (id: string, patch: Partial<EditableHeader>) => void;
  onRemove: (id: string) => void;
}

const HeaderRow: React.FC<HeaderRowProps> = ({ header, editable, onUpdate, onRemove }) => (
  <div className="grid grid-cols-[auto_1fr_auto] gap-3 md:grid-cols-[auto_1fr_1fr_auto]">
    <span className="flex h-8 items-center">
      <Checkbox
        size="sm"
        checked={header.enabled}
        onChange={(checked) => onUpdate(header.id, { enabled: checked })}
        disabled={!editable}
        aria-label={`Enable ${header.key}`}
      />
    </span>
    <TextField
      size="sm"
      value={header.key}
      onChange={(event) => onUpdate(header.id, { key: event.target.value })}
      readOnly={!editable}
      aria-label="Header name"
      className="font-mono"
    />
    <TextField
      size="sm"
      value={header.value}
      onChange={(event) => onUpdate(header.id, { value: event.target.value })}
      readOnly={!editable}
      aria-label="Header value"
      containerClassName="col-start-2 md:col-start-auto"
      className="font-mono"
    />
    <button
      type="button"
      aria-label={`Remove ${header.key}`}
      onClick={() => onRemove(header.id)}
      disabled={!editable}
      className="row-span-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-content disabled:cursor-not-allowed disabled:opacity-40 md:row-span-1"
    >
      <Icon name="trash" className="h-4 w-4" />
    </button>
  </div>
);

interface BodyEditorProps {
  body: string;
  error: string | null;
  editable: boolean;
  onBodyChange: (body: string) => void;
  onFormat: () => void;
  onClearError: () => void;
}

const BodyEditor: React.FC<BodyEditorProps> = ({
  body,
  error,
  editable,
  onBodyChange,
  onFormat,
  onClearError,
}) => (
  <div className="space-y-2">
    {error && <div className="text-xs text-muted">{error}</div>}
    <div className="relative">
      <textarea
        value={body}
        onChange={(event) => {
          onBodyChange(event.target.value);
          if (error) onClearError();
        }}
        readOnly={!editable}
        aria-label="Request body"
        spellCheck={false}
        rows={rowsForBody(body)}
        className={cn(
          'max-h-[300px] w-full resize-none overflow-auto rounded-lg border border-border/35 bg-surface-2 p-3 pr-11 [field-sizing:content]',
          'font-mono text-[13px] leading-relaxed text-content outline-none placeholder:text-muted read-only:cursor-default',
        )}
      />
      <div className="group absolute right-2 top-2">
        <button
          type="button"
          aria-label="Format JSON body"
          onClick={onFormat}
          disabled={!editable}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-surface text-muted transition-colors hover:text-content disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="magic" className="h-4 w-4" />
        </button>
        <div
          role="tooltip"
          className="pointer-events-none absolute right-0 top-full z-20 mt-1 whitespace-nowrap rounded-md bg-surface px-2 py-1 text-[11px] font-medium text-content opacity-0 shadow-lg transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        >
          Format JSON
        </div>
      </div>
    </div>
  </div>
);

interface AuthEditorProps {
  auth: WidgetAuth;
  editable: boolean;
  onChange: (auth: WidgetAuth) => void;
}

const AuthEditor: React.FC<AuthEditorProps> = ({ auth, editable, onChange }) => {
  const [showSecret, setShowSecret] = useState(false);
  const visibilityButton = (
    <button
      type="button"
      aria-label={showSecret ? 'Hide secret' : 'Show secret'}
      onClick={() => setShowSecret((visible) => !visible)}
      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:text-content"
    >
      <Icon name={showSecret ? 'eye-closed' : 'eye'} className="h-4 w-4" />
    </button>
  );

  const selectMode = (nextMode: AuthMode) => {
    if (nextMode === 'none') onChange({ type: 'none' });
    if (nextMode === 'bearer') {
      onChange({ type: 'bearer', token: auth.type === 'bearer' ? auth.token : '' });
    }
    if (nextMode === 'apiKey') {
      onChange({
        type: 'apiKey',
        key: auth.type === 'apiKey' ? auth.key : AUTH_HEADER_KEY,
        value: auth.type === 'apiKey' ? auth.value : '',
        in: 'header',
      });
    }
  };

  return (
    <div className="grid items-start gap-3 md:grid-cols-[auto_1fr]">
      <Select
        value={auth.type}
        onChange={selectMode}
        items={AUTH_OPTIONS}
        size="md"
        disabled={!editable}
        minWidthClassName="min-w-28"
      />

      {auth.type === 'none' && (
        <div className="rounded-lg bg-surface-2 p-2.5 text-xs text-muted">
          Auth is disabled for this request.
        </div>
      )}

      {auth.type === 'bearer' && (
        <TextField
          size="sm"
          type={showSecret ? 'text' : 'password'}
          value={auth.token}
          onChange={(event) => onChange({ type: 'bearer', token: event.target.value })}
          readOnly={!editable}
          rightSlot={visibilityButton}
          className="font-mono"
        />
      )}

      {auth.type === 'apiKey' && (
        <div className="grid gap-3 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)]">
          <TextField
            size="sm"
            value={auth.key}
            onChange={(event) =>
              onChange({ type: 'apiKey', key: event.target.value, value: auth.value, in: 'header' })
            }
            readOnly={!editable}
            className="font-mono"
          />
          <TextField
            size="sm"
            type={showSecret ? 'text' : 'password'}
            value={auth.value}
            onChange={(event) =>
              onChange({ type: 'apiKey', key: auth.key, value: event.target.value, in: 'header' })
            }
            readOnly={!editable}
            rightSlot={visibilityButton}
            className="font-mono"
          />
        </div>
      )}
    </div>
  );
};

interface RequestContentProps {
  activeTab: RequestTab;
  auth: WidgetAuth;
  headers: DraftHeader[];
  body: string;
  bodyError: string | null;
  editable: boolean;
  onAuthChange: (auth: WidgetAuth) => void;
  onHeaderUpdate: (id: string, patch: Partial<EditableHeader>) => void;
  onHeaderRemove: (id: string) => void;
  onHeaderAdd: () => void;
  onBodyChange: (body: string) => void;
  onBodyFormat: () => void;
  onBodyErrorClear: () => void;
}

const RequestContent: React.FC<RequestContentProps> = ({
  activeTab,
  auth,
  headers,
  body,
  bodyError,
  editable,
  onAuthChange,
  onHeaderUpdate,
  onHeaderRemove,
  onHeaderAdd,
  onBodyChange,
  onBodyFormat,
  onBodyErrorClear,
}) => {
  if (activeTab === 'body') {
    return (
      <BodyEditor
        body={body}
        error={bodyError}
        editable={editable}
        onBodyChange={onBodyChange}
        onFormat={onBodyFormat}
        onClearError={onBodyErrorClear}
      />
    );
  }

  if (activeTab === 'auth') {
    return <AuthEditor auth={auth} editable={editable} onChange={onAuthChange} />;
  }

  return (
    <div className="space-y-2.5">
      {headers.map((header) => (
        <HeaderRow
          key={header.id}
          header={header}
          editable={editable}
          onUpdate={onHeaderUpdate}
          onRemove={onHeaderRemove}
        />
      ))}
      <button
        type="button"
        onClick={onHeaderAdd}
        disabled={!editable}
        className="inline-flex items-center gap-1.5 rounded-md px-1 py-1 text-xs font-medium text-primary transition-colors hover:text-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Icon name="plus" className="h-4 w-4" />
        Add header
      </button>
    </div>
  );
};

interface ResponseContentProps {
  responsePanel: ResponsePanel;
  response: WidgetResponse;
}

const ResponseContent: React.FC<ResponseContentProps> = ({ responsePanel, response }) => {
  const isBody = responsePanel === 'body';
  const headers = response.headers
    .map((header) => `${header.key}: ${header.value}`)
    .join('\n');
  const code = isBody ? response.body : headers || 'No response headers';

  const download = () => {
    const blob = new Blob([code], { type: isBody ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = isBody ? 'response.json' : 'response-headers.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'API response', text: code });
      } catch {
        /* dismissed */
      }
    } else {
      await navigator.clipboard?.writeText(code);
    }
  };

  return (
    <div className="relative p-3">
      <div className="absolute right-5 top-5 z-10 flex items-center gap-1">
        <Tooltip content="Download" side="top">
          <IconButton aria-label="Download response" variant="surface" size="sm" onClick={download}>
            <Icon name="download" size={14} />
          </IconButton>
        </Tooltip>
        <Tooltip content="Share" side="top">
          <IconButton aria-label="Share response" variant="surface" size="sm" onClick={share}>
            <Icon name="share" size={14} />
          </IconButton>
        </Tooltip>
        <Tooltip content="Copy" side="top">
          <CopyButton value={code} size="sm" />
        </Tooltip>
      </div>
      <CodeBlock
        code={code}
        language={isBody ? 'json' : 'plain'}
        copyable={false}
        reveal
        revealStagger={28}
        maxHeight="200px"
        className="pr-4 [&_*]:text-[13px]"
      />
    </div>
  );
};

export interface ApiConsoleHistoryEntry {
  request: WidgetRequest;
  response: WidgetResponse;
  at: number;
}

function relativeTime(at: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

interface HistoryListProps {
  entries: ApiConsoleHistoryEntry[];
  onSelect: (entry: ApiConsoleHistoryEntry) => void;
  onClear: () => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ entries, onSelect, onClear }) => {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border px-6 py-10 text-center">
        <Icon name="restart" className="h-6 w-6 text-muted" />
        <p className="text-sm font-medium text-content">No requests yet</p>
        <p className="text-xs text-muted">Requests you send will show up here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-xs text-muted">
          {entries.length} request{entries.length === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-muted transition-colors hover:text-content"
        >
          Clear
        </button>
      </div>
      <ul className="overflow-hidden rounded-lg border border-border">
        {entries.map((entry) => (
          <li key={requestKey(entry.request)} className="border-b border-border last:border-b-0">
            <button
              type="button"
              onClick={() => onSelect(entry)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
            >
              <MethodBadge method={entry.request.method} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-content">
                {entry.request.url}
              </span>
              <StatusBadge
                status={entry.response.status}
                statusText={entry.response.statusText}
                className="shrink-0"
              />
              <span className="hidden shrink-0 tabular-nums text-xs text-muted sm:inline">
                {entry.response.timeMs}ms
              </span>
              <span className="hidden shrink-0 text-xs text-muted md:inline">
                {relativeTime(entry.at)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

async function runRequest(
  request: WidgetRequest,
  onSend: WidgetSendHandler | undefined,
): Promise<WidgetResponse> {
  const startedAt = performance.now();
  try {
    if (onSend) return await onSend(request);
    return await executeWidgetRequest(request);
  } catch (error) {
    return widgetErrorResponse(error, startedAt);
  }
}

/** Interactive request builder + response console used by the documentation widget. */
export const ApiConsole: React.FC<ApiConsoleProps> = ({
  request,
  onRequestChange,
  onSend,
  history: controlledHistory,
  onHistoryChange,
  selectedResponse: controlledSelectedResponse,
  onSelectedResponseChange,
  title,
  editable = true,
  onBack,
  onImport,
  onCodePreview,
  className,
}) => {
  const draft = useRequestDraft(request, editable, onRequestChange);
  const [requestTab, setRequestTab] = useState<RequestTab>('body');
  const [responseTab, setResponseTab] = useState<ResponseTab>('response');
  const [responsePanel, setResponsePanel] = useState<ResponsePanel>('body');
  const [isSending, setIsSending] = useState(false);
  const [internalHistory, setInternalHistory] = useState<ApiConsoleHistoryEntry[]>([]);
  const [internalSelectedResponse, setInternalSelectedResponse] = useState<WidgetResponse | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const responseCardRef = useRef<HTMLDivElement>(null);
  const history = controlledHistory ?? internalHistory;
  const setHistory = onHistoryChange ?? setInternalHistory;
  const selectedResponse =
    controlledSelectedResponse !== undefined ? controlledSelectedResponse : internalSelectedResponse;
  const setSelectedResponse = onSelectedResponseChange ?? setInternalSelectedResponse;

  const displayedResponse = selectedResponse;
  const showResponseCard = Boolean(selectedResponse);
  const headers = draft.headers;
  const body = draft.body;
  const enabledHeaderCount = headers.filter((header) => header.enabled).length;
  const requestTabs = REQUEST_TABS.map((tab) =>
    tab.id === 'headers' ? { ...tab, badge: enabledHeaderCount } : tab,
  );

  const send = async () => {
    const sentRequest = draft.buildRequest();
    const sentRequestKey = requestKey(sentRequest);

    setIsSending(true);
    const response = await runRequest(sentRequest, onSend);
    setIsSending(false);
    setSelectedResponse(response);
    setResponseTab('response');
    window.requestAnimationFrame(() => {
      const responseCard = responseCardRef.current;
      if (!responseCard) return;

      const top = responseCard.getBoundingClientRect().top + window.scrollY;
      const target = top - window.innerHeight / 2;
      window.scrollTo({
        top: Math.max(0, target),
        behavior: 'smooth',
      });
    });
    setHistory((previous) => {
      const entry: ApiConsoleHistoryEntry = { request: sentRequest, response, at: Date.now() };
      // De-duplicate: an identical request moves to the top instead of stacking.
      const withoutDuplicate = previous.filter((item) => requestKey(item.request) !== sentRequestKey);
      return [entry, ...withoutDuplicate].slice(0, 25);
    });
  };

  const selectHistory = (entry: ApiConsoleHistoryEntry) => {
    onRequestChange?.(entry.request);
    setSelectedResponse(entry.response);
    setResponseTab('response');
  };

  const formatBody = () => {
    try {
      const formattedBody = formatJsonBody(body);
      draft.changeBody(formattedBody);
      setBodyError(null);
    } catch {
      setBodyError('Invalid JSON');
    }
  };

  return (
    <div className={cn('w-full space-y-3', className)}>
      <Card flush>
        <div className="p-3">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {onBack && (
                <button
                  type="button"
                  aria-label="Back to request snippets"
                  onClick={onBack}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-content transition-colors hover:bg-surface-2"
                >
                  <Icon name="arrow-left" className="h-5 w-5" />
                </button>
              )}
              <div className="truncate font-heading text-sm font-semibold text-content">
                {title ?? 'Try it Out'}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {onCodePreview && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={onCodePreview}
                  leftIcon={<Icon name="code" className="h-4 w-4" />}
                >
                  Code
                </Button>
              )}
              {editable && onImport && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={onImport}
                  leftIcon={<Icon name="import" className="h-4 w-4" />}
                >
                  Import
                </Button>
              )}
            </div>
          </div>

          <RequestBar
            method={draft.method}
            url={draft.url}
            isSending={isSending}
            editable={editable}
            onMethodChange={draft.changeMethod}
            onUrlChange={draft.changeUrl}
            onSend={send}
          />
        </div>

        <div className="border-y border-border px-3">
          <Tabs
            items={requestTabs}
            activeId={requestTab}
            onChange={(id) => setRequestTab(id as RequestTab)}
            className="border-b-0"
          />
        </div>

        <div className="p-3">
          <FluidHeight watchKey={requestTab}>
            <RequestContent
              activeTab={requestTab}
              auth={draft.auth}
              headers={headers}
              body={body}
              bodyError={bodyError}
              editable={editable}
              onAuthChange={draft.changeAuth}
              onHeaderUpdate={draft.updateHeader}
              onHeaderRemove={draft.removeHeader}
              onHeaderAdd={draft.addHeader}
              onBodyChange={(nextBody) => {
                draft.changeBody(nextBody);
              }}
              onBodyFormat={formatBody}
              onBodyErrorClear={() => setBodyError(null)}
            />
          </FluidHeight>
        </div>
      </Card>

      {showResponseCard && (
        <div ref={responseCardRef} className="w-full">
          <Card flush>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-3 pt-1">
              <Tabs
                items={RESPONSE_TABS}
                activeId={responseTab}
                onChange={(id) => setResponseTab(id as ResponseTab)}
                className="border-b-0"
              />
              <div className="flex items-center gap-3">
                {responseTab === 'response' && (
                  <ResponsePanelSwitch value={responsePanel} onChange={setResponsePanel} />
                )}
              </div>
            </div>

            <FluidHeight watchKey={`${responseTab}:${responsePanel}:${displayedResponse ? 'present' : 'empty'}`}>
              {responseTab === 'response' && displayedResponse ? (
                <>
                  <div className="flex flex-wrap items-center gap-5 border-b border-border px-3 py-2.5 text-xs text-muted">
                    <StatusBadge status={displayedResponse.status} statusText={displayedResponse.statusText} />
                    <span>{displayedResponse.timeMs}ms</span>
                    <span>{displayedResponse.size}</span>
                  </div>
                  <ResponseContent responsePanel={responsePanel} response={displayedResponse} />
                </>
              ) : (
                <div className="p-3">
                  <HistoryList
                    entries={history}
                    onSelect={selectHistory}
                    onClear={() => setHistory([])}
                  />
                </div>
              )}
            </FluidHeight>
          </Card>
        </div>
      )}
    </div>
  );
};
