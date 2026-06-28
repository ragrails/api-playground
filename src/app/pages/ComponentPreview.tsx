import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  CodeBlock,
  ColorField,
  CopyButton,
  Icon,
  IconButton,
  MethodBadge,
  MethodSelect,
  ResponseEmptyState,
  ResponseLoadingState,
  Spinner,
  StatusBadge,
  Switch,
  Tabs,
  TextField,
} from '@/components/ui';
import type { IconName } from '@/components/ui';
import { ApiConsole, ApiPlayground, ImportCard, RequestSnippet } from '@ragrails/api-playground-react';
import type { WidgetRequest } from '@ragrails/api-playground-react';
import { useTheme, DEFAULT_PRIMARY } from '@/theme';
import { cn } from '@/lib/cn';
import type { HttpMethod } from '@/types';

/* ── Sample data ──────────────────────────────────────────────────────────── */

const ALL_ICONS: IconName[] = [
  'copy', 'check', 'download', 'send', 'share', 'code', 'arrow-left', 'arrow-right',
  'chevron-down', 'trash', 'plus', 'moon', 'sun', 'palette', 'magic', 'restart', 'close',
  'eye', 'eye-closed',
];

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const SAMPLE_CURL = `curl -X GET 'https://jsonplaceholder.typicode.com/users/1' \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk_live_123"`;

const SAMPLE_JSON = `{
  "id": 1,
  "name": "Leanne Graham",
  "email": "leanne@example.com",
  "status": "active",
  "role": "admin"
}`;

const SAMPLE_REQUEST: WidgetRequest = {
  title: 'Get Users',
  method: 'GET',
  url: 'https://jsonplaceholder.typicode.com/users/1',
  sampleResponse: SAMPLE_JSON,
};

const POST_RESPONSE = `{
  "id": 101,
  "title": "API client",
  "body": "Live request from the widget",
  "userId": 1
}`;

const POST_REQUEST: WidgetRequest = {
  title: 'Create Post',
  method: 'POST',
  url: 'https://jsonplaceholder.typicode.com/posts',
  headers: [
    { key: 'Content-Type', value: 'application/json' },
  ],
  body: `{ "title": "API client", "body": "Live request from the widget", "userId": 1 }`,
  sampleResponse: POST_RESPONSE,
};

const POST_CURL = `curl -X POST 'https://jsonplaceholder.typicode.com/posts' \\
  -H 'Content-Type: application/json' \\
  -d '{ "title": "API client", "body": "Live request from the widget", "userId": 1 }'`;

const WIDGET_NAV: { group: string; items: { id: string; label: string }[] }[] = [
  {
    group: 'Snippets',
    items: [
      { id: 'widget-get', label: 'GET request' },
      { id: 'widget-post', label: 'POST request' },
    ],
  },
  {
    group: 'Try it',
    items: [
      { id: 'widget-console', label: 'Console' },
      { id: 'widget-import', label: 'Import' },
    ],
  },
];

const PREVIEW_NAV: { group: string; items: { id: string; label: string }[] }[] = [
  {
    group: 'Product',
    items: [{ id: 'product-preview', label: 'API widget' }],
  },
];

const TOKENS = [
  { name: 'bg', cls: 'bg-bg' },
  { name: 'surface', cls: 'bg-surface' },
  { name: 'surface-2', cls: 'bg-surface-2' },
  { name: 'border', cls: 'bg-border' },
  { name: 'primary', cls: 'bg-primary' },
  { name: 'primary-hover', cls: 'bg-primary-hover' },
  { name: 'primary-soft', cls: 'bg-primary-soft' },
  { name: 'content', cls: 'bg-content' },
  { name: 'muted', cls: 'bg-muted' },
];

/* ── Documentation navigation ─────────────────────────────────────────────── */

const NAV: { group: string; items: { id: string; label: string }[] }[] = [
  {
    group: 'Foundations',
    items: [
      { id: 'colors', label: 'Color tokens' },
      { id: 'icons', label: 'Iconography' },
    ],
  },
  {
    group: 'Actions',
    items: [
      { id: 'buttons', label: 'Buttons' },
      { id: 'icon-buttons', label: 'Icon buttons' },
    ],
  },
  {
    group: 'Data display',
    items: [
      { id: 'badges', label: 'Badges' },
      { id: 'cards', label: 'Cards' },
      { id: 'code', label: 'Code blocks' },
      { id: 'loading', label: 'Loading' },
      { id: 'empty', label: 'Empty state' },
      { id: 'response-loading', label: 'Loading skeleton' },
      { id: 'reveal', label: 'Response reveal' },
    ],
  },
  {
    group: 'Inputs & controls',
    items: [
      { id: 'fields', label: 'Fields' },
      { id: 'checkbox', label: 'Checkbox' },
      { id: 'switch', label: 'Switch' },
      { id: 'method', label: 'Method dropdown' },
      { id: 'tabs', label: 'Tabs' },
    ],
  },
];

/* ── Layout primitives ────────────────────────────────────────────────────── */

/** A documented component section with title + description. */
const Section: React.FC<{ id: string; title: string; description?: string; children: React.ReactNode }> = ({
  id,
  title,
  description,
  children,
}) => (
  <section id={id} className="scroll-mt-24">
    <h2 className="text-lg font-semibold text-content">{title}</h2>
    {description && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>}
    <div className="mt-5 space-y-5">{children}</div>
  </section>
);

/** A neutral canvas for showing component variants, with an optional caption. */
const Example: React.FC<{ caption?: string; children: React.ReactNode; className?: string }> = ({
  caption,
  children,
  className,
}) => (
  <div>
    {caption && (
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">{caption}</div>
    )}
    <div className={cn('rounded-xl border border-border bg-surface p-5', className)}>{children}</div>
  </div>
);

/* ── Theme controls ───────────────────────────────────────────────────────── */

const ThemePanel: React.FC = () => {
  const { mode, primaryColor, bgColor, toggleMode, setPrimaryColor, setBgColor } = useTheme();
  const effectiveBg = bgColor ?? (mode === 'dark' ? '#16171d' : '#f2f4f7');

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Theme</span>
        <Switch checked={mode === 'dark'} onChange={toggleMode} label={mode === 'dark' ? 'Dark' : 'Light'} />
      </div>
      <ColorField label="Primary" value={primaryColor} onChange={setPrimaryColor} />
      <ColorField label="Background" value={effectiveBg} onChange={setBgColor} />
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<Icon name="restart" className="h-4 w-4" />}
        onClick={() => {
          setPrimaryColor(DEFAULT_PRIMARY);
          setBgColor(null);
        }}
        className="w-full justify-center"
      >
        Reset
      </Button>
    </div>
  );
};

/** Highlights the section currently in view within the sidebar nav. */
function useScrollSpy(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? '');
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-88px 0px -70% 0px' },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export type PreviewSection = 'components' | 'widgets' | 'preview';

const PREVIEW_TABS: { id: PreviewSection; label: string; href: string }[] = [
  { id: 'components', label: 'Component', href: '/preview/components' },
  { id: 'widgets', label: 'Widget', href: '/preview/widgets' },
  { id: 'preview', label: 'Preview', href: '/preview' },
];

const NAV_BY_SECTION: Record<PreviewSection, typeof NAV> = {
  components: NAV,
  widgets: WIDGET_NAV,
  preview: PREVIEW_NAV,
};

export const ComponentPreview: React.FC<{ section?: PreviewSection }> = ({ section = 'preview' }) => {
  const [tab, setTab] = useState('curl');
  const [seg, setSeg] = useState('headers');
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [revealId, setRevealId] = useState(0);
  const [consoleRequest, setConsoleRequest] = useState<WidgetRequest>(POST_REQUEST);
  const { mode, toggleMode, primaryColor, bgColor } = useTheme();

  const componentIds = useMemo(() => NAV.flatMap((g) => g.items.map((i) => i.id)), []);
  const widgetIds = useMemo(() => WIDGET_NAV.flatMap((g) => g.items.map((i) => i.id)), []);
  const previewIds = useMemo(() => PREVIEW_NAV.flatMap((g) => g.items.map((i) => i.id)), []);
  const sectionIds = section === 'components' ? componentIds : section === 'widgets' ? widgetIds : previewIds;
  const active = useScrollSpy(sectionIds);
  const activeTab = PREVIEW_TABS.find((item) => item.id === section)?.id ?? 'preview';

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-contrast">
              <Icon name="code" className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-content">Component Library</div>
              <div className="text-xs text-muted">API Client design system</div>
            </div>
          </div>
          <IconButton aria-label="Toggle color mode" variant="surface" onClick={toggleMode}>
            <Icon name={mode === 'dark' ? 'moon' : 'sun'} className="h-5 w-5" />
          </IconButton>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-10 px-6 py-10">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24 space-y-6">
            <ThemePanel />
            <Tabs
              variant="segmented"
              items={PREVIEW_TABS}
              activeId={activeTab}
              onChange={(id) => {
                const next = PREVIEW_TABS.find((item) => item.id === id);
                if (next) window.location.href = next.href;
              }}
              className="flex w-full [&>button]:flex-1"
            />
            <nav className="space-y-5">
              {NAV_BY_SECTION[section].map((group) => (
                <div key={group.group}>
                  <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    {group.group}
                  </div>
                  <ul className="mt-1.5 space-y-0.5">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className={cn(
                            'block rounded-md px-3 py-1.5 text-sm transition-colors',
                            active === item.id
                              ? 'bg-surface-2 font-medium text-content'
                              : 'text-muted hover:bg-surface-2/60 hover:text-content',
                          )}
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1">
          {section === 'components' ? (
          <>
          <div className="mb-12 border-b border-border pb-10">
            <Badge tone="primary">v1.0</Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-content">Component Library</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              A themeable set of React + Tailwind components for the API client. Every color flows
              through CSS variables, so primary color, background, and dark/light mode can be changed
              at runtime — try the controls in the sidebar.
            </p>
          </div>

          <div className="space-y-14">
            <Section
              id="colors"
              title="Color tokens"
              description="Semantic tokens exposed as Tailwind utilities (bg-surface, text-content, border-border…). They resolve to CSS variables that change with the theme."
            >
              <Example>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                  {TOKENS.map((t) => (
                    <div key={t.name} className="space-y-1.5">
                      <div className={cn('h-14 rounded-lg border border-border', t.cls)} />
                      <span className="block text-xs text-muted">{t.name}</span>
                    </div>
                  ))}
                </div>
              </Example>
            </Section>

            <Section
              id="icons"
              title="Iconography"
              description="The Solar icon set, inlined as a single Icon component. Sized with width/height utilities and colored via currentColor."
            >
              <Example>
                <div className="flex flex-wrap gap-3">
                  {ALL_ICONS.map((name) => (
                    <div
                      key={name}
                      className="flex w-[88px] flex-col items-center gap-2 rounded-lg border border-border bg-surface-2 py-3 text-muted"
                    >
                      <Icon name={name} className="h-6 w-6 text-content" />
                      <span className="text-[10px]">{name}</span>
                    </div>
                  ))}
                </div>
              </Example>
            </Section>

            <Section
              id="buttons"
              title="Buttons"
              description="Four variants and three sizes, with optional leading/trailing icons and a loading state."
            >
              <Example caption="Variants">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                </div>
              </Example>
              <Example caption="Sizes & icons">
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                  <Button leftIcon={<Icon name="send" className="h-4 w-4" />}>Send</Button>
                  <Button variant="secondary" rightIcon={<Icon name="arrow-right" className="h-4 w-4" />}>
                    Try it out
                  </Button>
                  <Button
                    isLoading={loading}
                    onClick={() => {
                      setLoading(true);
                      setTimeout(() => setLoading(false), 1500);
                    }}
                  >
                    {loading ? 'Sending' : 'Click to load'}
                  </Button>
                </div>
              </Example>
            </Section>

            <Section
              id="icon-buttons"
              title="Icon buttons"
              description="Square, icon-only buttons. Always pass an aria-label. CopyButton wraps one with copy-to-clipboard feedback."
            >
              <Example>
                <div className="flex flex-wrap items-center gap-3">
                  <IconButton aria-label="Download"><Icon name="download" className="h-5 w-5" /></IconButton>
                  <IconButton aria-label="Share" variant="surface"><Icon name="share" className="h-5 w-5" /></IconButton>
                  <IconButton aria-label="Add" variant="solid"><Icon name="plus" className="h-5 w-5" /></IconButton>
                  <IconButton aria-label="Delete" variant="surface"><Icon name="trash" className="h-5 w-5" /></IconButton>
                  <CopyButton value="Copied from the docs!" />
                </div>
              </Example>
            </Section>

            <Section
              id="badges"
              title="Badges"
              description="Tone-based pills, plus method- and status-aware variants used in the request/response views."
            >
              <Example caption="Tones">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">Neutral</Badge>
                  <Badge tone="primary">Primary</Badge>
                  <Badge tone="success">Success</Badge>
                  <Badge tone="error">Error</Badge>
                  <Badge tone="warning">Warning</Badge>
                  <Badge tone="info">Info</Badge>
                </div>
              </Example>
              <Example caption="HTTP methods">
                <div className="flex flex-wrap items-center gap-2">
                  {METHODS.map((m) => <MethodBadge key={m} method={m} />)}
                </div>
              </Example>
              <Example caption="Status codes">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={200} statusText="OK" />
                  <StatusBadge status={301} statusText="Moved" />
                  <StatusBadge status={404} statusText="Not Found" />
                  <StatusBadge status={500} statusText="Server Error" />
                </div>
              </Example>
            </Section>

            <Section
              id="cards"
              title="Cards"
              description="Elevated surface containers with an optional caption. Use flush to host a toolbar or code body edge-to-edge."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Card label="Get Users">
                  <p className="text-sm text-muted">A labeled card, like the snippet container.</p>
                </Card>
                <Card label="Sample Response" flush>
                  <CodeBlock code={SAMPLE_JSON} language="json" className="border-0" />
                </Card>
              </div>
            </Section>

            <Section
              id="code"
              title="Code blocks"
              description="Read-only, syntax-highlighted code with optional line numbers and a copy button. Supports bash (cURL) and JSON."
            >
              <Example caption="bash">
                <CodeBlock code={SAMPLE_CURL} language="bash" showLineNumbers />
              </Example>
              <Example caption="json">
                <CodeBlock code={SAMPLE_JSON} language="json" />
              </Example>
            </Section>

            <Section id="loading" title="Loading" description="Indeterminate spinner tinted with the primary color.">
              <Example>
                <div className="flex flex-wrap items-center gap-6">
                  <Spinner size={16} />
                  <Spinner size={24} />
                  <Spinner size={32} label="Sending request..." />
                </div>
              </Example>
            </Section>

            <Section
              id="empty"
              title="Empty state"
              description="Shown in the response panel before a request has been sent."
            >
              <Example>
                <ResponseEmptyState />
              </Example>
            </Section>

            <Section
              id="response-loading"
              title="Loading skeleton"
              description="Shimmering placeholder shown in the response panel while a request is in flight."
            >
              <ResponseLoadingState />
            </Section>

            <Section
              id="reveal"
              title="Response reveal"
              description="When a response arrives, the code snippet reveals line by line, each fading in from the top. Replay to watch it again."
            >
              <Example>
                <div className="space-y-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Icon name="restart" className="h-4 w-4" />}
                    onClick={() => setRevealId((n) => n + 1)}
                  >
                    Replay
                  </Button>
                  <CodeBlock key={revealId} code={SAMPLE_JSON} language="json" reveal />
                </div>
              </Example>
            </Section>

            <Section
              id="fields"
              title="Fields"
              description="Text inputs with labels, inline slots, and error/hint states, plus a color picker field."
            >
              <Example>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="URL" placeholder="https://jsonplaceholder.typicode.com/users/1" />
                  <TextField
                    label="With method"
                    defaultValue="https://jsonplaceholder.typicode.com/users/1"
                    leftSlot={<MethodBadge method="GET" />}
                  />
                  <TextField label="Error state" defaultValue="not-a-url" error="Enter a valid URL" />
                  <ColorField label="Color field" value="#7855FF" onChange={() => {}} />
                </div>
              </Example>
              <Example caption="Sizes">
                <div className="grid gap-4 md:grid-cols-3">
                  <TextField size="sm" label="Small" defaultValue="https://jsonplaceholder.typicode.com" />
                  <TextField size="md" label="Medium" defaultValue="https://jsonplaceholder.typicode.com" />
                  <TextField size="lg" label="Large" defaultValue="https://jsonplaceholder.typicode.com" />
                </div>
              </Example>
            </Section>

            <Section id="checkbox" title="Checkbox" description="Controlled selection input for compact forms and option lists.">
              <Example>
                <div className="flex flex-wrap items-center gap-6">
                  <Checkbox checked onChange={() => {}} label="Enabled" />
                  <Checkbox checked={false} onChange={() => {}} label="Unchecked" />
                  <Checkbox size="sm" checked onChange={() => {}} label="Small" />
                  <Checkbox checked disabled onChange={() => {}} label="Disabled" />
                </div>
              </Example>
            </Section>

            <Section id="switch" title="Switch" description="Accessible on/off toggle. The track fills with the primary color when on.">
              <Example>
                <div className="flex flex-wrap items-center gap-6">
                  <Switch checked onChange={() => {}} label="Enabled" />
                  <Switch checked={false} onChange={() => {}} label="Off" />
                  <Switch checked disabled onChange={() => {}} label="Disabled" />
                </div>
              </Example>
            </Section>

            <Section
              id="method"
              title="Method dropdown"
              description="Color-coded HTTP method selector with an accessible menu, used at the start of the request bar."
            >
              <Example>
                <div className="flex items-center gap-3">
                  <MethodSelect value={method} onChange={setMethod} />
                  <span className="text-sm text-muted">Selected: {method}</span>
                </div>
              </Example>
            </Section>

            <Section
              id="tabs"
              title="Tabs"
              description="Two variants with a sliding active indicator: an underline bar and a segmented pill group."
            >
              <Example caption="Underline">
                <Tabs
                  items={[
                    { id: 'curl', label: 'cURL' },
                    { id: 'javascript', label: 'Javascript' },
                    { id: 'python', label: 'Python' },
                    { id: 'go', label: 'Go' },
                  ]}
                  activeId={tab}
                  onChange={setTab}
                />
              </Example>
              <Example caption="Segmented">
                <Tabs
                  variant="segmented"
                  items={[
                    { id: 'headers', label: 'Headers', badge: 2 },
                    { id: 'body', label: 'Body' },
                    { id: 'auth', label: 'Auth' },
                  ]}
                  activeId={seg}
                  onChange={setSeg}
                />
              </Example>
            </Section>
          </div>
          </>
          ) : section === 'widgets' ? (
            <>
              <div className="mb-12 border-b border-border pb-10">
                <Badge tone="primary">Widget</Badge>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-content">
                  Request widget
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                  The embeddable documentation widget, composed from the shared components.
                </p>
              </div>

              <div className="space-y-14">
                <Section
                  id="widget-get"
                  title="GET request"
                  description="A simple GET request with a sample response."
                >
                  <RequestSnippet request={SAMPLE_REQUEST} onTryItOut={() => {}} />
                </Section>

                <Section
                  id="widget-post"
                  title="POST request"
                  description="Headers and a JSON body flow into every language snippet."
                >
                  <RequestSnippet request={POST_REQUEST} onTryItOut={() => {}} />
                </Section>

                <Section
                  id="widget-console"
                  title="Try it console"
                  description="The request builder and response surface users see after choosing to try a documented endpoint."
                >
                  <ApiConsole request={consoleRequest} onRequestChange={setConsoleRequest} />
                </Section>

                <Section
                  id="widget-import"
                  title="Import"
                  description="Paste a cURL command to populate a request. Standalone for now — not yet wired into the console."
                >
                  <div className="max-w-xl">
                    <ImportCard onImport={() => {}} />
                  </div>
                </Section>
              </div>
            </>
          ) : (
            <>
              <div className="mb-12 border-b border-border pb-10">
                <Badge tone="primary">Preview</Badge>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-content">
                  API widget preview
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                  The complete product flow using cURL as the source of truth.
                </p>
              </div>

              <div className="space-y-14">
                <Section
                  id="product-preview"
                  title="Product preview"
                  description="Try the full flow: open the console, edit fields, import cURL, and send requests into history."
                >
                  <ApiPlayground
                    request={POST_CURL}
                    title="Create Post"
                    sampleResponse={POST_RESPONSE}
                    editable
                    allowImport
                    mode={mode}
                    customization={{
                      primary: primaryColor,
                      background: bgColor ?? undefined,
                    }}
                  />
                </Section>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};
