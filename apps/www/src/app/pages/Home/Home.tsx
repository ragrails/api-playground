import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Button, Icon } from '@pkg/components/ui'
import { ApiPlaygroundShowcase } from '../Landing/ApiPlaygroundShowcase'
import { DotGridCanvas } from '../../components/DotGridCanvas'
import { SiteNav } from '../../components/SiteNav'
import {
  EMBED_IFRAME_TABS,
  EMBED_REACT_TABS,
  FAQS,
  FEATURES,
  GITHUB_URL,
  NPM_URL,
  STATS,
  ctaClass,
  embedLink
} from '../../utils/utils'
import './Home.css'

function accentCode(code: string) {
  return code
    .split(/(@xendr\/react|www\.xendr\.dev)/g)
    .map((part, i) =>
      part === '@xendr/react' || part === 'www.xendr.dev' ? (
        <span key={i} className="text-[#9ece6a]">
          {part}
        </span>
      ) : (
        part
      ),
    )
}

/** Terminal-style code sample: traffic lights, tab pills, copy button. */
function CodeCard({ tabs }: { tabs: readonly { id: string; label: string; code: string }[] }) {
  const [activeId, setActiveId] = useState(tabs[0].id)
  const [copied, setCopied] = useState(false)
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0]

  const copy = () =>
    navigator.clipboard?.writeText(active.code).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    })

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#14151a]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-3 w-3 rounded-full border border-white/10 bg-white/5" />
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {tabs.length > 1 &&
            tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveId(tab.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${tab.id === active.id ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          <button
            type="button"
            onClick={copy}
            aria-label="Copy code"
            className="grid h-7 w-7 place-items-center rounded-md text-white/45 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Icon name={copied ? 'check' : 'copy'} className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {/* The global `code` rule (inline-flex + padding + code-bg) breaks
          multi-line samples; reset it to a plain block here. */}
      <pre className="overflow-x-auto px-5 py-5 font-mono text-xs leading-relaxed text-white/85">
        <code className="block whitespace-pre bg-transparent p-0 text-xs leading-relaxed text-white/85">
          {accentCode(active.code)}
        </code>
      </pre>
    </div>
  )
}

function Home() {
  const navigate = useNavigate()
  return (
    <div className="lp flex flex-1 flex-col font-sans text-ink [color-scheme:light]">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <SiteNav />

      <main className="flex-1">
        {/* Dotted backdrop shared by the hero and the playground showcase.
            Interactive: dots disperse away from the cursor (DotGridCanvas). */}
        <div className="relative">
          <DotGridCanvas className="lp-hero-grid" />

          <section className="relative z-10 py-[70px] pb-10 max-[720px]:py-14 max-[720px]:pb-8">
            <div className="mx-auto max-w-[1270px] px-6">
              <h1 className="max-w-[20ch] text-balance  font-medium leading-[1.04] tracking-[-0.03em] text-ink my-0">
                The fastest way for your developers to test your API.
              </h1>
              <p className="max-w-[60ch] text-sm text-muted mt-3">
                Xendr is a lightweight API tester for developer documentation, websites, and guides.
                Users can run requests where they read them, without copying cURL into Postman,
                Swagger, or Hoppscotch.
              </p>
              <div data-theme="light" className="mt-8 flex flex-wrap gap-3">
                <Button
                  className={ctaClass}
                  rightIcon={<Icon name="arrow-right" className="h-4 w-4" />}
                  onClick={() => navigate('/playground')}
                >
                  Embed Xendr
                </Button>
                <Button
                  variant="secondary"
                  className={ctaClass}
                  onClick={() => navigate('/try-it')}
                >
                  Test API Online
                </Button>
              </div>
            </div>
          </section>

          <section id="showcase" className="relative z-10 pt-6 pb-6">
            <div className="mx-auto max-w-[1270px] h-[80vh] lg:h-[88vh] px-6">
              <ApiPlaygroundShowcase embedded />
            </div>
          </section>
        </div>

        {/* ── Stats ticker (scrolling) ──────────────────────────────────── */}
        <section aria-label="Xendr at a glance">
          <div className="mx-auto flex max-w-[1270px] items-center px-6">
            {/* Pinned leading label (Ramp-style), solid on the left. */}
            <div className="flex shrink-0 items-center gap-2 py-[10px] pr-4">
              <img
                src="/logo/png/xendr-logo-icon.png"
                alt="Xendr Logo"
                aria-hidden="true"
                className="h-[19px] w-[19px] rounded-[4px]"
              />
              <span className="text-[11px] font-medium uppercase tracking-[0.11em] text-ink">
                Xendr at a glance
              </span>
            </div>
            {/* Scrolling stats; fades as items emerge and at the right edge. */}
            <div className="lp-marquee relative flex-1 overflow-hidden">
              <div className="lp-marquee-track flex w-max items-center">
                {Array.from({ length: 6 }).flatMap((_, copy) =>
                  STATS.map((stat, i) => (
                    <div
                      key={`${copy}-${i}`}
                      className="flex items-center gap-2.5 whitespace-nowrap border-r border-line px-6 py-[4px]"
                    >
                      <span className="text-[11px] uppercase tracking-[0.1em] text-[#404042]">
                        {stat.label}
                      </span>
                      <span className="inline-flex items-center rounded-[5px] bg-[#f2f4f5] px-[7px] text-[11px] font-medium text-ink">
                        {stat.value}
                      </span>
                    </div>
                  )),
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Features (bento) — dark band ──────────────────────────────── */}
        <section id="features" className="mt-20 lg:mt-36 bg-[#101015] text-white">
          <div className="mx-auto max-w-[1270px] px-6">
            {/* Header band. */}
            <div className="pt-20 max-[900px]:pt-14">
              <h2 className="max-w-[640px] text-balance text-[clamp(28px,3.1vw,40px)] font-medium leading-[1.12] tracking-[-0.02em] text-white mb-0">
                Everything developers need to test from your docs.
              </h2>
              <p className="mt-4 max-w-[52ch] text-sm text-white/55">
                Show cURL examples as code snippets, add sample error responses, run live API calls,
                keep request history, import new cURL requests, and match the tester to your brand.
              </p>
            </div>

            <div className="grid grid-cols-6 gap-[28px] py-14 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
              {FEATURES.map((feature) => (
                <article
                  key={feature.id}
                  className={`lp-card-glow flex flex-col rounded-xl border border-white/10 bg-[#14151a1a] pl-[18px] pt-[18px] lg:pl-[28px] lg:pt-[28px] max-[900px]:col-span-1 ${feature.minH} ${feature.span}`}
                >
                  <div className="flex items-start justify-between gap-4 pr-[28px]">
                    <h3 className="max-w-[22ch] font-medium tracking-[-0.01em] text-white">
                      {feature.title} <span className="font-medium text-white/45">{feature.titleMuted}</span>
                    </h3>
                  </div>
                  <div className="mt-6 lg:mt-8 flex flex-1 items-center justify-center overflow-hidden rounded-tl-xl">
                    <img
                      src={feature.image}
                      alt={`Xendr ${feature.title} preview`}
                      className="h-full w-full object-cover object-left-top"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Embed section (React / iframe) — dark band ────────────────── */}
        <section id="embed" className="bg-[#15151b] text-white">
          <div className="mx-auto max-w-[1270px] px-6">
            {/* Header band. */}
            <div className="border-b border-white/10 pt-20 pb-14 max-[900px]:py-14">
              <h2 className="max-w-[450px] text-balance text-[clamp(28px,3.1vw,40px)] font-medium leading-[1.12] tracking-[-0.02em] text-white">
                Embed the API tester your way, React or an iframe
              </h2>
              <p className="max-w-[40ch] text-sm text-white/55">
                Add Xendr to documentation, websites, or guides in minutes, whichever stack they run on.
              </p>
            </div>

            {/* Two embed paths, divided like the header band. */}
            <div className="grid grid-cols-2 max-[900px]:grid-cols-1">
              <div className="border-r border-white/10 py-14 pr-12 max-[900px]:border-b max-[900px]:border-r-0 max-[900px]:py-10 max-[900px]:pr-0">
                <p className="max-w-[46ch] lg:text-sm text-white/55">
                  <span className="font-medium text-white">React component.</span> Install the
                  package and render the API tester wherever your docs live.
                </p>
                <div className="mt-8">
                  <CodeCard tabs={EMBED_REACT_TABS} />
                </div>
                <a
                  className={embedLink}
                  href={`${GITHUB_URL}#readme`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View the docs <Icon name="arrow-right" className="h-4 w-4" />
                </a>
              </div>
              <div className="py-14 pl-12 max-[900px]:py-10 max-[900px]:pl-0">
                <p className="max-w-[46ch] lg:text-sm text-white/55">
                  <span className="font-medium text-white">Plain iframe.</span> Works on any site,
                  paste one snippet with your tester settings encoded in the URL.
                </p>
                <div className="mt-8">
                  <CodeCard tabs={EMBED_IFRAME_TABS} />
                </div>
                <Link className={embedLink} to="/playground">
                  Generate yours in the playground <Icon name="arrow-right" className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Company story ─────────────────────────────────────────────── */}
        <section id="story" className="pt-20 lg:pt-30 pb-30">
          <div className="mx-auto grid max-w-[1270px] grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-stretch gap-14 px-6 max-[900px]:grid-cols-1 max-[900px]:gap-8">
            <div className="flex flex-col">
              <h2 className={'text-2xl font-medium leading-[1.12] tracking-[-0.02em] text-ink text-balance'}>
                &ldquo;With Xendr embedded in our docs, we were able to onboard developers faster and
                get them using our product.&rdquo;
              </h2>
              <div className="mt-auto pt-16 max-[900px]:pt-10">
                <div className="mt-10 flex flex-col">
                  <span className="font-medium text-ink">Samuel Owolabi</span>
                  <span className="text-xs text-muted">Creator - RagRails</span>
                </div>
              </div>
            </div>

            <div
              className="relative flex min-h-[440px] items-center justify-center overflow-hidden rounded-[20px] border border-line max-[900px]:min-h-[320px]"
              style={{
                background:
                  'radial-gradient(120% 90% at 50% 20%, color-mix(in srgb, #7855ff 6%, #eef1f0) 0%, #eef1f0 70%)',
              }}
              role="img"
              aria-label="RagRails logo"
            >
              <img
                src="/partners/ragrails.png"
                alt="Xendr customer RagRails"
                className="w-auto"
                style={{ height: 'clamp(28px,3.6vw,42px)' }}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section id="faq" className="border-t border-line bg-[#f7f8f9] py-20 lg:py-24">
          <div className="mx-auto grid max-w-[1270px] grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] gap-14 px-6 max-[900px]:grid-cols-1 max-[900px]:gap-8">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-brand-deep">FAQ</p>
              <h2 className={'text-3xl font-medium tracking-[-0.02em] text-ink text-balance'}>Answers before your team embeds an API tester.</h2>
              <p className="mt-4 max-w-[42ch] text-sm text-muted">
                What Xendr does, where it fits, and how it helps developers test documented APIs
                without leaving the page.
              </p>
            </div>

            <div className="divide-y divide-line rounded-2xl border border-line bg-white">
              {FAQS.map((item) => (
                <details key={item.question} className="group">
                  <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-5 px-5 py-5 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
                    <span>{item.question}</span>
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f2f4f5] text-muted transition-colors group-open:text-brand-deep">
                      <Icon name="plus" className="h-4 w-4 transition-transform group-open:rotate-45" />
                    </span>
                  </summary>
                  <p className="max-w-[62ch] px-5 pb-5 text-sm text-muted">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-[#101015] text-white">
        <div className="mx-auto flex max-w-[1270px] items-center justify-between gap-6 px-6 py-8 max-[720px]:flex-col max-[720px]:items-start max-[720px]:gap-5">
          <img src="/logo/svg/xendr-white-dark-bg.svg" alt="Xendr" className="h-[22px] w-auto" />
          <div className="flex items-center gap-7 text-xs font-medium max-[720px]:flex-wrap">
            <Link to="/playground" className="text-white/[0.78] transition-colors hover:text-brand">
              Playground
            </Link>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-white/[0.78] transition-colors hover:text-brand">
              GitHub
            </a>
            <a href={NPM_URL} target="_blank" rel="noreferrer" className="text-white/[0.78] transition-colors hover:text-brand">
              NPM (800+)
            </a>
            <span className="text-xs text-white/50">MIT © {new Date().getFullYear()} Xendr</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
