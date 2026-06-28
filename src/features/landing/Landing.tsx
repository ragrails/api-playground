import { useState } from 'react'
import { ApiPlayground } from '@ragrails/api-playground-react'
import './Landing.css'

const initialRequest = `curl -X POST 'https://jsonplaceholder.typicode.com/posts' \\
  -H 'Content-Type: application/json' \\
  -d '{ "title": "API playground", "body": "Test APIs directly inside your docs", "userId": 1 }'`

const sampleResponse = `{
  "id": 101,
  "title": "API playground",
  "body": "Test APIs directly inside your docs",
  "userId": 1
}`

const features = [
  'Embeddable API tester',
  'cURL import',
  'Live responses',
  'Headers, body, and auth',
  'Light, dark, and auto mode',
  'No required stylesheet import',
]

function Landing() {
  const [request, setRequest] = useState(initialRequest)

  return (
    <main className="demo-page">
      <section className="demo-hero" aria-labelledby="demo-title">
        <div className="demo-copy">
          <div className="demo-eyebrow">React API Playground</div>
          <h1 id="demo-title">Interactive API docs without sending users elsewhere.</h1>
          <p className="demo-lede">
            Add a lightweight, embeddable API tester to docs, developer portals, SDK pages,
            and internal tools. Start from cURL, show useful snippets, and let developers try
            requests in context.
          </p>

          <div className="demo-actions">
            <a href="#demo" className="demo-button demo-button-primary">
              Try the demo
            </a>
            <a
              href="https://github.com/ragrails/api-playground"
              className="demo-button demo-button-secondary"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>

          <div className="demo-install" aria-label="Install command">
            <span>npm i</span>
            <code>@ragrails/api-playground-react</code>
          </div>
        </div>

        <div className="demo-feature-list" aria-label="Feature highlights">
          {features.map((feature) => (
            <span key={feature}>{feature}</span>
          ))}
        </div>
      </section>

      <section id="demo" className="demo-widget" aria-label="Live API playground demo">
        <div className="demo-section-heading">
          <p>Live demo</p>
          <h2>Imported from the package entry</h2>
        </div>
        <ApiPlayground
          request={request}
          onUpdateRequest={setRequest}
          title="Create Post"
          sampleResponse={sampleResponse}
          mode="dark"
          customization={{
            primary: '#7855ff',
            background: '#16171d',
          }}
        />
      </section>
    </main>
  )
}

export default Landing
