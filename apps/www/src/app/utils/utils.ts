export const GITHUB_URL = 'https://github.com/samowolabi/xendr'
export const NPM_URL = 'https://www.npmjs.com/package/@xendr/react'

export const ctaClass = 'h-[46px] rounded-[10px] px-5 text-sm'

export const FEATURES = [
  {
    id: 'snippets',
    title: 'Code snippets',
    titleMuted: 'in multiple programming languages',
    preview: 'JavaScript, Python, Go, PHP, Ruby, Java, C#',
    image: '/screenshots/code-snippet.png',
    span: 'col-span-3',
    minH: 'min-h-[240px]',
  },
  {
    id: 'console',
    title: 'Try-it-out console',
    titleMuted: 'for testing live API requests',
    preview: 'Method, URL, auth, params, headers, body',
    image: '/screenshots/try-it-out.png',
    span: 'col-span-3',
    minH: 'min-h-[240px]',
  },
  {
    id: 'errors',
    title: 'Error responses',
    titleMuted: 'for every HTTP status you document',
    preview: '400, 401, 403, 404, 422, 500',
    image: '/screenshots/error-response.png',
    span: 'col-span-2',
    minH: 'min-h-[300px]',
  },
  {
    id: 'import',
    title: 'cURL import',
    titleMuted: 'to create a new request instantly',
    preview: 'Paste cURL, get an editable request',
    image: '/screenshots/import.png',
    span: 'col-span-2',
    minH: 'min-h-[300px]',
  },
  {
    id: 'branding',
    title: 'Brand customization',
    titleMuted: 'for colors, theme, and docs experience',
    preview: 'Primary color, background, light and dark modes',
    image: '/screenshots/color-customize.png',
    span: 'col-span-2',
    minH: 'min-h-[300px]',
  },
] as const

export const EMBED_REACT_TABS = [
  {
    id: 'react',
    label: 'React',
    code: `npm i @xendr/react

import { ApiPlayground } from '@xendr/react'

<ApiPlayground request="curl https://api.example.com/users" />`,
  },
] as const

export const EMBED_IFRAME_TABS = [
  {
    id: 'html',
    label: 'HTML',
    code: `<iframe
  src="https://www.xendr.dev/embed?c=YOUR_CONFIG"
  width="100%"
  height="720"
  style="border: 0; border-radius: 16px;"
></iframe>`,
  },
] as const

export const embedLink =
  'mt-3 inline-flex w-fit items-center gap-2 text-xs text-[#9ece6a] transition-[gap] hover:gap-3'

export const STATS = [
  { label: 'Lightweight', value: '27 KB' },
  { label: 'Customizable', value: '✓' },
  { label: 'NPM downloads', value: '800' },
  { label: 'Languages', value: '10' },
] as const

export const FAQS = [
  {
    question: 'What is Xendr?',
    answer:
      'Xendr is a lightweight API tester you can embed in developer documentation, websites, and guides. It lets developers test requests where the API is documented instead of copying cURL into another tool.',
  },
  {
    question: 'Where can I embed Xendr?',
    answer:
      'You can embed Xendr in developer docs, product websites, API guides, and internal portals. React apps can use @xendr/react directly, and other sites can use the hosted iframe embed.',
  },
  {
    question: 'Does it replace tools like Postman or Hoppscotch?',
    answer:
      'For documentation workflows, yes. Instead of copying a cURL example into Postman, Swagger, or Hoppscotch, users can authenticate, edit, and send the request directly inside your docs.',
  },
  {
    question: 'Can developers preview code in other languages?',
    answer:
      'Yes. Xendr can show the same request as cURL and other programming language snippets, so developers can copy code that matches their stack.',
  },
  {
    question: 'Can I document error responses?',
    answer:
      'Yes. You can add sample responses for different HTTP status codes, including error cases, so users understand what each API response looks like.',
  },
  {
    question: 'Can users import a new cURL request?',
    answer:
      'Yes, when cURL import is enabled. Users can paste a new cURL request and turn it into an editable request inside the tester.',
  },
  {
    question: 'Can I customize the widget to match my brand?',
    answer:
      'Yes. You can configure primary color, background, mode, visible snippet languages, default view, imports, and sample responses.',
  },
  {
    question: 'Is the npm package tracking my users?',
    answer:
      'The @xendr/react package is built as a standalone component and does not include any analytics or tracking. ',
  },
] as const
