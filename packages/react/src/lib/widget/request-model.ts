import type { HttpMethod } from '@/types';
import type { WidgetAuth, WidgetHeader, WidgetRequest } from './types';

export const DEFAULT_BODY = '{\n  \n}';
export const METHOD_OPTIONS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
export const AUTH_HEADER_KEY = 'Authorization';

export interface EditableHeader extends WidgetHeader {
  enabled: boolean;
}

export interface RequestParts {
  method: HttpMethod;
  url: string;
  body: string;
  auth: WidgetAuth;
  headers: EditableHeader[];
}

const BEARER_PREFIX = 'Bearer ';
const BODY_METHODS = new Set<HttpMethod>(['POST', 'PUT', 'PATCH', 'DELETE']);

const DEFAULT_HEADERS: EditableHeader[] = [
  { key: 'Content-Type', value: 'application/json', enabled: true },
];

export function methodSupportsBody(method: HttpMethod): boolean {
  return BODY_METHODS.has(method);
}

export function initialBody(request: WidgetRequest): string {
  return request.body ?? DEFAULT_BODY;
}

export function outgoingBodyForMethod(method: HttpMethod, body: string): string {
  return methodSupportsBody(method) ? body : '';
}

export function authHeader(auth: WidgetAuth): EditableHeader | null {
  if (auth.type === 'none') return null;
  if (auth.type === 'bearer') {
    return { key: AUTH_HEADER_KEY, value: `${BEARER_PREFIX}${auth.token}`, enabled: true };
  }
  return { key: auth.key, value: auth.value, enabled: true };
}

export function isSameHeaderKey(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

function isBearerValue(value: string): boolean {
  return value.toLowerCase().startsWith(BEARER_PREFIX.toLowerCase());
}

function tokenFromBearerValue(value: string): string {
  return isBearerValue(value) ? value.slice(BEARER_PREFIX.length) : value;
}

export function authFromHeader(header?: WidgetHeader | EditableHeader): WidgetAuth {
  if (!header) return { type: 'none' };
  if (isSameHeaderKey(header.key, AUTH_HEADER_KEY) && isBearerValue(header.value)) {
    return { type: 'bearer', token: tokenFromBearerValue(header.value) };
  }
  return { type: 'apiKey', key: header.key || AUTH_HEADER_KEY, value: header.value, in: 'header' };
}

function authHeaderKey(auth: WidgetAuth): string {
  return auth.type === 'apiKey' ? auth.key : AUTH_HEADER_KEY;
}

export function isAuthHeader(header: WidgetHeader | EditableHeader, auth: WidgetAuth): boolean {
  if (auth.type === 'none') return isSameHeaderKey(header.key, AUTH_HEADER_KEY);
  return isSameHeaderKey(header.key, authHeaderKey(auth));
}

export function initialAuth(request: WidgetRequest): WidgetAuth {
  if (request.auth) return request.auth;
  return authFromHeader(
    request.headers?.find((header) => isSameHeaderKey(header.key, AUTH_HEADER_KEY)),
  );
}

export function initialHeaders(request: WidgetRequest, auth: WidgetAuth): EditableHeader[] {
  const sourceHeaders = request.headers?.length ? request.headers : DEFAULT_HEADERS;
  const headers = sourceHeaders
    .filter((header) => !isAuthHeader(header, auth))
    .map((header) => ({ ...header, enabled: true }));
  const authRow = authHeader(auth);
  return authRow ? [...headers, authRow] : headers;
}

export function syncAuthHeader(
  headers: EditableHeader[],
  nextAuth: WidgetAuth,
  previousAuth: WidgetAuth,
): EditableHeader[] {
  if (nextAuth.type === 'none') {
    return headers.map((header) =>
      isAuthHeader(header, previousAuth) || isSameHeaderKey(header.key, AUTH_HEADER_KEY)
        ? { ...header, enabled: false }
        : header,
    );
  }

  const nextHeader = authHeader(nextAuth);
  if (!nextHeader) return headers;

  const retainedHeaders = headers.filter(
    (header) => !isAuthHeader(header, previousAuth) && !isAuthHeader(header, nextAuth),
  );
  return [...retainedHeaders, nextHeader];
}

function activeRequestHeaders(headers: EditableHeader[], auth: WidgetAuth): WidgetHeader[] {
  return headers
    .filter((header) => header.enabled && header.key.trim() && !isAuthHeader(header, auth))
    .map(({ key, value }) => ({ key, value }));
}

export function requestKey(request: WidgetRequest): string {
  return JSON.stringify({
    method: request.method,
    url: request.url,
    headers: request.headers ?? [],
    auth: request.auth ?? { type: 'none' },
    body: request.body ?? '',
  });
}

export function requestFromParts(base: WidgetRequest, parts: RequestParts): WidgetRequest {
  const outgoingBody = outgoingBodyForMethod(parts.method, parts.body);
  const body = outgoingBody.trim() ? outgoingBody : undefined;

  return {
    ...base,
    method: parts.method,
    url: parts.url,
    body,
    auth: parts.auth,
    headers: activeRequestHeaders(parts.headers, parts.auth),
  };
}
