# @ragrails/api-playground-react

[![npm version](https://img.shields.io/npm/v/@ragrails/api-playground-react.svg)](https://www.npmjs.com/package/@ragrails/api-playground-react)
[![bundle size](https://img.shields.io/bundlephobia/minzip/%40ragrails%2Fapi-playground-react.svg)](https://bundlephobia.com/package/@ragrails/api-playground-react)
[![types](https://img.shields.io/npm/types/@ragrails/api-playground-react.svg)](https://www.npmjs.com/package/@ragrails/api-playground-react)
[![license](https://img.shields.io/npm/l/@ragrails/api-playground-react.svg)](./LICENSE)

A lightweight, embeddable React API playground for interactive API docs, developer portals, SDK docs, and internal tools.

Give developers a fast way to understand and test your API without leaving your docs. Add one component and get cURL-powered code snippets, a **Try it out** console, request editing, auth, cURL import, live API responses, and history.

Built by [RagRails](https://docs.ragrails.com).

If you find this useful, please [star the repo](https://github.com/ragrails/api-playground).

## Features

- **Embeddable API tester**: add an interactive playground to docs, portals, and internal tools.
- **Multi-language examples**: show cURL, JavaScript, Python, and Go snippets.
- **Try-it-out console**: let developers edit requests and see responses immediately.
- **cURL import**: paste an existing cURL command and start testing from it.
- **Headers, body, and auth**: support common request controls out of the box.
- **Sample responses**: show expected output alongside the request.
- **Request history**: help users move between previous API calls.
- **Brandable design**: match your product with theme and color options.
- **Light, dark, and auto mode**: choose a fixed theme or follow the user's system preference.
- **Lightweight setup**: no Tailwind setup and no required stylesheet import.

## Benefits

- **Reduce friction**: users can test an endpoint at the moment they read about it.
- **Improve comprehension**: examples become interactive instead of static.
- **Speed up onboarding**: new developers can see inputs, auth, and responses in context.
- **Keep docs consistent**: one cURL request powers the experience.
- **Fit existing products**: embed it where your users already learn and work.

## Use Cases

- Interactive API documentation
- Developer portals
- SDK documentation
- API onboarding flows
- Internal API tools
- Support and debugging pages
- REST API testing inside React apps

## Install

```bash
npm i @ragrails/api-playground-react
```

`react` and `react-dom` are peer dependencies. React 18 and 19 are supported.

## Quick Start

```tsx
import { ApiPlayground } from '@ragrails/api-playground-react'

export function ApiDocs() {
  return (
    <ApiPlayground
      request={`curl -X GET 'https://jsonplaceholder.typicode.com/users/1'`}
    />
  )
}
```

That is enough to render a snippet card with a **Try it out** console.

Styles are included automatically. An optional CSS export is available if your app prefers explicit stylesheet loading:

```tsx
import '@ragrails/api-playground-react/styles.css'
```

## A Complete Example

```tsx
import { useState } from 'react'
import { ApiPlayground } from '@ragrails/api-playground-react'

const initialRequest = `curl -X POST 'https://jsonplaceholder.typicode.com/posts' \\
  -H 'Content-Type: application/json' \\
  -d '{ "title": "API client", "body": "Live request from the widget", "userId": 1 }'`

export function CreatePostDocs() {
  const [request, setRequest] = useState(initialRequest)

  return (
    <ApiPlayground
      request={request}
      onUpdateRequest={setRequest}
      title="Create Post"
      sampleResponse={`{
  "id": 101,
  "title": "API client",
  "body": "Live request from the widget",
  "userId": 1
}`}
      customization={{
        primary: '#7855ff',
        background: '#16171d',
      }}
    />
  )
}
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `request` | `string` | Required | The cURL request shown and tested by the widget. |
| `onUpdateRequest` | `(request: string) => void` | `undefined` | Receives the latest cURL request after edits or imports. |
| `title` | `string` | `undefined` | Optional console heading. Replaces “Try it Out” when set. |
| `sampleResponse` | `string` | `undefined` | Example response body shown below the snippet. JSON strings are syntax-highlighted. |
| `editable` | `boolean` | `true` | Enables or disables editing in the console. |
| `allowImport` | `boolean` | `true` | Shows or hides the cURL import action. |
| `customization` | `{ primary?: string; background?: string }` | `undefined` | Overrides the widget's primary color and background. Accepts any CSS color. |
| `mode` | `'dark' \| 'light' \| 'system'` | `'dark'` | Controls the widget theme. `system` follows the user's OS preference. |
| `syncSnippet` | `boolean` | `false` | When `true`, the snippet follows console edits. |

## Common Patterns

### Read-only documentation

Use this when the page should explain an endpoint but not allow mutation.

```tsx
<ApiPlayground
  request={curl}
  editable={false}
  allowImport={false}
/>
```

### Controlled request state

Use `onUpdateRequest` when the parent app should own the latest cURL string.

```tsx
const [request, setRequest] = useState(curl)

<ApiPlayground
  request={request}
  onUpdateRequest={setRequest}
/>
```

### Brand customization

```tsx
<ApiPlayground
  request={curl}
  customization={{
    primary: '#52b788',
    background: '#101114',
  }}
/>
```

### Light, dark, and auto mode

Use a fixed theme, or let the widget automatically match the user's system preference.

```tsx
<ApiPlayground request={curl} mode="light" />
<ApiPlayground request={curl} mode="dark" />
<ApiPlayground request={curl} mode="system" />
```

## Live Testing

The console sends real browser requests and displays the response status, timing, headers, and body.

For protected APIs, users can configure bearer tokens or API key headers directly in the console.

## cURL Import

When import is enabled, users can paste a cURL request and continue testing from it. This is useful for docs, support flows, onboarding, and internal tools where developers already share API examples as cURL.

## Styling

The widget includes its styles automatically. Consumers do not need Tailwind, a Tailwind config, or a required stylesheet import.

The optional stylesheet export remains available:

```tsx
import '@ragrails/api-playground-react/styles.css'
```

Use that path if your app prefers explicit CSS loading.

The widget is themeable with `mode` and `customization`.

## TypeScript

Types are included. No separate `@types` package is required.

```ts
import type { ApiPlaygroundProps } from '@ragrails/api-playground-react'
```

## Notes

- The browser enforces CORS for real requests.
- Keep secrets out of checked-in docs examples. Let users paste tokens in the console when possible.
- Use `editable={false}` for destructive endpoints if you only want to document the request.
- Use `syncSnippet={false}` when your docs should preserve the canonical example while users experiment.

## License

MIT
# api-playground
