import { useMemo } from 'react';
import { ApiPlayground } from '@xendr/react';
import { DEFAULT_EMBED_CONFIG, decodeEmbedConfig } from '@app/app/embedConfig';
import './Embed.css';

const InvalidEmbed = () => (
  <div data-theme="dark" className="embed-shell">
    <div className="embed-invalid">
      <div className="text-sm font-semibold text-content">Invalid API Playground embed</div>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        The iframe config is missing or could not be decoded.
      </p>
    </div>
  </div>
);

export default function Embed() {
  const config = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const rawConfig = params.get('config');
    return rawConfig ? decodeEmbedConfig(rawConfig) : DEFAULT_EMBED_CONFIG;
  }, []);

  if (!config) return <InvalidEmbed />;

  const shellTheme = config.mode === 'light' ? 'light' : 'dark';

  return (
    <div data-theme={shellTheme} className="embed-shell">
      <ApiPlayground
        request={config.request}
        title={config.title}
        responseExamples={config.responseExamples}
        mode={config.mode ?? 'dark'}
        editable={config.editable ?? true}
        allowImport={config.allowImport ?? true}
        syncSnippet={config.syncSnippet ?? false}
        defaultView={config.defaultView ?? 'snippet'}
        snippetLanguages={config.snippetLanguages}
        customization={config.customization}
      />
    </div>
  );
}
