import { useMemo, useState } from 'react'
import type {
  ApiPlaygroundCustomization,
  ApiPlaygroundMode,
  ApiPlaygroundResponseExample,
  SnippetLanguage,
} from '@xendr/react'
import { embedUrl, type ApiPlaygroundEmbedConfig } from '@app/app/embedConfig'
import { DEFAULT_SNIPPET_LANGUAGES } from '@xendr/react'

export interface Preset {
  id: string
  label: string
  title: string
  request: string
  responseExamples: ApiPlaygroundResponseExample[]
}

export const PRESETS: Preset[] = [
  {
    id: 'create-post',
    label: 'Create post',
    title: 'Create Post',
    request: `curl -X POST 'https://jsonplaceholder.typicode.com/posts' \\
  -H 'Content-Type: application/json' \\
  -d '{ "title": "API playground", "body": "Test APIs directly inside your docs", "userId": 1 }'`,
    responseExamples: [
      {
        status: 201,
        statusText: 'Created',
        body: `{
  "id": 101,
  "title": "API playground",
  "body": "Test APIs directly inside your docs",
  "userId": 1
}`,
      },
      {
        status: 400,
        statusText: 'Bad Request',
        body: `{
  "error": "Validation failed",
  "message": "title is required"
}`,
      },
      {
        status: 500,
        statusText: 'Server Error',
        body: `{
  "error": "Internal server error",
  "requestId": "req_01HY9"
}`,
      },
    ],
  },
  {
    id: 'get-user',
    label: 'Get user',
    title: 'Get User',
    request: `curl -X GET 'https://jsonplaceholder.typicode.com/users/1' \\
  -H 'Accept: application/json'`,
    responseExamples: [
      {
        status: 200,
        statusText: 'OK',
        body: `{
  "id": 1,
  "name": "Leanne Graham",
  "email": "leanne@example.com",
  "status": "active"
}`,
      },
      {
        status: 404,
        statusText: 'Not Found',
        body: `{
  "error": "User not found",
  "message": "No user exists for the supplied id"
}`,
      },
    ],
  },
]

export const DEFAULT_PRIMARY = '#7855FF'
const MODE_BG: Record<Exclude<ApiPlaygroundMode, 'system'>, string> = {
  dark: '#16171d',
  light: '#f7f7f9',
}

interface CodeInput {
  request: string
  title: string
  responseExamples: ApiPlaygroundResponseExample[]
  widgetMode: ApiPlaygroundMode
  editable: boolean
  allowImport: boolean
  syncSnippet: boolean
  defaultView: 'snippet' | 'console'
  snippetLanguages: SnippetLanguage[]
  primary: string
  background: string
  bgTouched: boolean
}

interface IframeInput {
  request: string
  title: string
  responseExamples: ApiPlaygroundResponseExample[]
  widgetMode: ApiPlaygroundMode
  editable: boolean
  allowImport: boolean
  syncSnippet: boolean
  defaultView: 'snippet' | 'console'
  snippetLanguages: SnippetLanguage[]
  customization: ApiPlaygroundCustomization
}

function quote(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function attr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function template(value: string): string {
  return `\`${value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\``
}

function formatResponseExamples(examples: ApiPlaygroundResponseExample[]): string | null {
  if (!examples.length) return null

  const lines = ['  responseExamples={[']
  examples.forEach((example) => {
    lines.push('    {')
    lines.push(`      status: ${example.status},`)
    if (example.statusText) lines.push(`      statusText: ${quote(example.statusText)},`)
    lines.push(`      body: ${template(example.body)},`)
    lines.push('    },')
  })
  lines.push('  ]}')
  return lines.join('\n')
}

function isDefaultSnippetLanguages(languages: SnippetLanguage[]): boolean {
  if (languages.length !== DEFAULT_SNIPPET_LANGUAGES.length) return false
  return languages.every((language, index) => language === DEFAULT_SNIPPET_LANGUAGES[index])
}

function formatCustomization(c: Pick<CodeInput, 'primary' | 'background' | 'bgTouched' | 'widgetMode'>): string | null {
  const custom: string[] = []
  const hasCustomPrimary = c.primary.toLowerCase() !== DEFAULT_PRIMARY.toLowerCase()
  if (hasCustomPrimary) custom.push(`primary: ${quote(c.primary)}`)

  if (c.bgTouched) {
    if (c.widgetMode === 'system') {
      custom.push(`light: { background: ${quote(c.background)} }`)
      custom.push(`dark: { background: ${quote(c.background)} }`)
    } else {
      custom.push(`${c.widgetMode}: { background: ${quote(c.background)} }`)
    }
  }

  return custom.length ? `  customization={{ ${custom.join(', ')} }}` : null
}

/** Build the `<ApiPlayground />` usage snippet, emitting only non-default props. */
function buildCode(c: CodeInput): string {
  const props = [`  request={${template(c.request)}}`]
  if (c.title) props.push(`  title="${attr(c.title)}"`)
  if (c.widgetMode !== 'dark') props.push(`  mode="${c.widgetMode}"`)
  if (!c.editable) props.push('  editable={false}')
  if (!c.allowImport) props.push('  allowImport={false}')
  if (c.syncSnippet) props.push('  syncSnippet')
  if (c.defaultView === 'console') props.push('  defaultView="console"')
  if (!isDefaultSnippetLanguages(c.snippetLanguages)) {
    props.push(`  snippetLanguages={[${c.snippetLanguages.map(quote).join(', ')}]}`)
  }

  const responseExamples = formatResponseExamples(c.responseExamples)
  if (responseExamples) props.push(responseExamples)

  const customization = formatCustomization(c)
  if (customization) props.push(customization)

  return `import { ApiPlayground } from '@xendr/react'\n\n<ApiPlayground\n${props.join('\n')}\n/>`
}

function buildEmbedConfig(c: IframeInput): ApiPlaygroundEmbedConfig {
  return {
    request: c.request,
    ...(c.title ? { title: c.title } : {}),
    ...(c.responseExamples.length ? { responseExamples: c.responseExamples } : {}),
    mode: c.widgetMode,
    editable: c.editable,
    allowImport: c.allowImport,
    syncSnippet: c.syncSnippet,
    ...(c.defaultView ? { defaultView: c.defaultView } : {}),
    ...(!isDefaultSnippetLanguages(c.snippetLanguages) ? { snippetLanguages: c.snippetLanguages } : {}),
    customization: c.customization,
  }
}

function buildIframeCode(c: IframeInput): string {
  const src = embedUrl(buildEmbedConfig(c))

  return `<iframe
  src="${src}"
  width="100%"
  height="720"
  style="border: 0; border-radius: 16px;"
  loading="lazy"
></iframe>`
}

/** All request/appearance/behavior state for the playground, plus derived output. */
export function usePlaygroundConfig() {
  const [presetId, setPresetId] = useState(PRESETS[0].id)
  const [request, setRequest] = useState(PRESETS[0].request)
  const [title, setTitle] = useState(PRESETS[0].title)
  const [responseExamples, setResponseExamples] = useState(PRESETS[0].responseExamples)
  const [widgetMode, setWidgetMode] = useState<ApiPlaygroundMode>('dark')
  const [primary, setPrimary] = useState(DEFAULT_PRIMARY)
  const [background, setBackground] = useState<string>(MODE_BG.dark)
  const [bgTouched, setBgTouched] = useState(false)
  const [editable, setEditable] = useState(true)
  const [allowImport, setAllowImport] = useState(true)
  const [syncSnippet, setSyncSnippet] = useState(false)
  const [defaultView, setDefaultView] = useState<'snippet' | 'console'>('snippet')
  const [snippetLanguages, setSnippetLanguages] = useState<SnippetLanguage[]>([
    ...DEFAULT_SNIPPET_LANGUAGES,
  ])

  const applyPreset = (id: string) => {
    const next = PRESETS.find((p) => p.id === id) ?? PRESETS[0]
    setPresetId(id)
    setRequest(next.request)
    setTitle(next.title)
    setResponseExamples(next.responseExamples)
  }

  const changeWidgetMode = (next: ApiPlaygroundMode) => {
    setWidgetMode(next)
    if (!bgTouched && next !== 'system') setBackground(MODE_BG[next])
  }

  const changeBackground = (next: string) => {
    setBackground(next)
    setBgTouched(true)
  }

  const customization = useMemo<ApiPlaygroundCustomization>(
    () => {
      if (!bgTouched) return { primary }
      if (widgetMode === 'system') return { primary, light: { background }, dark: { background } }
      return { primary, [widgetMode]: { background } }
    },
    [primary, background, bgTouched, widgetMode],
  )

  const code = useMemo(
    () =>
      buildCode({
        request,
        title,
        responseExamples,
        widgetMode,
        editable,
        allowImport,
        syncSnippet,
        defaultView,
        snippetLanguages,
        primary,
        background,
        bgTouched,
      }),
    [request, title, responseExamples, widgetMode, editable, allowImport, syncSnippet, defaultView, snippetLanguages, primary, background, bgTouched],
  )

  const iframeCode = useMemo(
    () =>
      buildIframeCode({
        request,
        title,
        responseExamples,
        widgetMode,
        editable,
        allowImport,
        syncSnippet,
        defaultView,
        snippetLanguages,
        customization,
      }),
    [request, title, responseExamples, widgetMode, editable, allowImport, syncSnippet, defaultView, snippetLanguages, customization],
  )

  return {
    presetId,
    applyPreset,
    request,
    setRequest,
    title,
    setTitle,
    responseExamples,
    setResponseExamples,
    widgetMode,
    changeWidgetMode,
    primary,
    setPrimary,
    background,
    changeBackground,
    editable,
    setEditable,
    allowImport,
    setAllowImport,
    syncSnippet,
    setSyncSnippet,
    defaultView,
    setDefaultView,
    snippetLanguages,
    setSnippetLanguages,
    customization,
    code,
    iframeCode,
  }
}

export type PlaygroundConfig = ReturnType<typeof usePlaygroundConfig>
