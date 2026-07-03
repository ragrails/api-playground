import type {
  ApiPlaygroundCustomization,
  ApiPlaygroundDefaultView,
  ApiPlaygroundMode,
  ApiPlaygroundResponseExample,
} from '@/components/widget';
import type { SnippetLanguage } from '@/lib/widget/types';

export const EMBED_BASE_URL = 'https://www.xendr.dev';

export interface ApiPlaygroundEmbedConfig {
  request: string;
  title?: string;
  responseExamples?: ApiPlaygroundResponseExample[];
  mode?: ApiPlaygroundMode;
  editable?: boolean;
  allowImport?: boolean;
  syncSnippet?: boolean;
  defaultView?: ApiPlaygroundDefaultView;
  emptyResponseUntilSend?: boolean;
  snippetLanguages?: SnippetLanguage[];
  customization?: ApiPlaygroundCustomization;
}

export const DEFAULT_EMBED_CONFIG: ApiPlaygroundEmbedConfig = {
  request: `curl -X GET 'https://api.example.com'`,
  title: 'New Request',
  mode: 'dark',
  editable: true,
  allowImport: true,
  syncSnippet: false,
  defaultView: 'console',
  emptyResponseUntilSend: true,
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function toBase64Url(value: string): string {
  return bytesToBase64(new TextEncoder().encode(value))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function fromBase64Url(value: string): string {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return new TextDecoder().decode(base64ToBytes(padded));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isMode(value: unknown): value is ApiPlaygroundMode {
  return value === 'dark' || value === 'light' || value === 'system';
}

function isDefaultView(value: unknown): value is ApiPlaygroundDefaultView {
  return value === 'snippet' || value === 'console';
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function normalizeResponseExamples(value: unknown): ApiPlaygroundResponseExample[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const examples = value
    .filter(isRecord)
    .map((example) => ({
      status: typeof example.status === 'number' ? example.status : Number.NaN,
      statusText: typeof example.statusText === 'string' ? example.statusText : undefined,
      body: typeof example.body === 'string' ? example.body : '',
    }))
    .filter((example) => Number.isFinite(example.status) && example.body);

  return examples.length ? examples : undefined;
}

export function encodeEmbedConfig(config: ApiPlaygroundEmbedConfig): string {
  return toBase64Url(JSON.stringify(config));
}

export function decodeEmbedConfig(value: string | null): ApiPlaygroundEmbedConfig | null {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(fromBase64Url(value));
    if (!isRecord(parsed) || typeof parsed.request !== 'string' || !parsed.request.trim()) return null;

    const responseExamples = normalizeResponseExamples(parsed.responseExamples);

    return {
      request: parsed.request,
      ...(typeof parsed.title === 'string' ? { title: parsed.title } : {}),
      ...(responseExamples ? { responseExamples } : {}),
      ...(isMode(parsed.mode) ? { mode: parsed.mode } : {}),
      ...(isBoolean(parsed.editable) ? { editable: parsed.editable } : {}),
      ...(isBoolean(parsed.allowImport) ? { allowImport: parsed.allowImport } : {}),
      ...(isBoolean(parsed.syncSnippet) ? { syncSnippet: parsed.syncSnippet } : {}),
      ...(isDefaultView(parsed.defaultView) ? { defaultView: parsed.defaultView } : {}),
      ...(isBoolean(parsed.emptyResponseUntilSend) ? { emptyResponseUntilSend: parsed.emptyResponseUntilSend } : {}),
      ...(Array.isArray(parsed.snippetLanguages) ? { snippetLanguages: parsed.snippetLanguages as SnippetLanguage[] } : {}),
      ...(isRecord(parsed.customization) ? { customization: parsed.customization as ApiPlaygroundCustomization } : {}),
    };
  } catch {
    return null;
  }
}

export function embedUrl(config: ApiPlaygroundEmbedConfig): string {
  return `${EMBED_BASE_URL}/embed?config=${encodeEmbedConfig(config)}`;
}
