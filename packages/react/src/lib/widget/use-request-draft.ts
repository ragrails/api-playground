import { useEffect, useMemo, useRef, useState } from 'react';
import type { HttpMethod } from '@/types';
import {
  AUTH_HEADER_KEY,
  authFromHeader,
  initialAuth,
  initialBody,
  initialHeaders,
  isAuthHeader,
  isSameHeaderKey,
  requestFromParts,
  requestKey,
  syncAuthHeader,
} from './request-model';
import type { EditableHeader, RequestParts } from './request-model';
import type { WidgetAuth, WidgetRequest } from './types';

export type DraftHeader = EditableHeader & { id: string };

function headerSignature(headers: EditableHeader[]): string {
  return JSON.stringify(headers.map(({ key, value, enabled }) => ({ key, value, enabled })));
}

function stripHeaderIds(headers: DraftHeader[]): EditableHeader[] {
  return headers.map(({ key, value, enabled }) => ({ key, value, enabled }));
}

export function useRequestDraft(
  request: WidgetRequest,
  editable: boolean,
  onRequestChange?: (request: WidgetRequest) => void,
) {
  const auth = useMemo(() => initialAuth(request), [request]);
  const initialHeaderRows = useMemo(() => initialHeaders(request, auth), [request, auth]);
  const nextHeaderIdRef = useRef(0);
  const lastPublishedHeaderSignatureRef = useRef<string | null>(null);
  const lastPublishedRequestKeyRef = useRef<string | null>(null);
  const createDraftHeaders = (headers: EditableHeader[]): DraftHeader[] =>
    headers.map((header) => ({ ...header, id: `header-${nextHeaderIdRef.current++}` }));

  const [headers, setHeaders] = useState<DraftHeader[]>(() => createDraftHeaders(initialHeaderRows));
  const [method, setMethod] = useState(request.method);
  const [url, setUrl] = useState(request.url);
  const [body, setBody] = useState(() => initialBody(request));

  useEffect(() => {
    const incomingKey = requestKey(request);
    const isLocalPublish = incomingKey === lastPublishedRequestKeyRef.current;

    setMethod(request.method);
    setUrl(request.url);
    setBody((currentBody) =>
      isLocalPublish && request.body === undefined ? currentBody : initialBody(request),
    );
  }, [request]);

  useEffect(() => {
    const incomingSignature = headerSignature(initialHeaderRows);
    if (incomingSignature === lastPublishedHeaderSignatureRef.current) return;
    setHeaders(createDraftHeaders(initialHeaderRows));
  }, [initialHeaderRows]);

  const buildRequest = (parts: Partial<RequestParts> = {}): WidgetRequest => {
    const nextHeaders = parts.headers ?? stripHeaderIds(headers);
    return requestFromParts(request, {
      method,
      url,
      body,
      auth,
      ...parts,
      headers: nextHeaders,
    });
  };

  const publish = (parts: Partial<RequestParts>) => {
    if (!editable) return;
    const nextRequest = buildRequest(parts);
    lastPublishedRequestKeyRef.current = requestKey(nextRequest);
    lastPublishedHeaderSignatureRef.current = headerSignature(
      initialHeaders(nextRequest, nextRequest.auth ?? { type: 'none' }),
    );
    onRequestChange?.(nextRequest);
  };

  const changeMethod = (nextMethod: HttpMethod) => {
    setMethod(nextMethod);
    publish({ method: nextMethod });
  };

  const changeUrl = (nextUrl: string) => {
    setUrl(nextUrl);
    publish({ url: nextUrl });
  };

  const changeBody = (nextBody: string) => {
    setBody(nextBody);
    publish({ body: nextBody });
  };

  const changeAuth = (nextAuth: WidgetAuth) => {
    const nextHeaders = syncAuthHeader(stripHeaderIds(headers), nextAuth, auth);
    setHeaders(createDraftHeaders(nextHeaders));
    publish({
      auth: nextAuth,
      headers: nextHeaders,
    });
  };

  const updateHeader = (id: string, patch: Partial<EditableHeader>) => {
    const previousHeader = headers.find((header) => header.id === id);
    const nextHeaders = headers.map((header) => (header.id === id ? { ...header, ...patch } : header));
    const nextHeader = nextHeaders.find((header) => header.id === id);
    const nextAuth =
      nextHeader &&
      ((previousHeader && isAuthHeader(previousHeader, auth)) ||
        isAuthHeader(nextHeader, auth) ||
        isSameHeaderKey(nextHeader.key, AUTH_HEADER_KEY))
        ? nextHeader.enabled
          ? authFromHeader(nextHeader)
          : { type: 'none' as const }
        : auth;

    setHeaders(nextHeaders);
    publish({ auth: nextAuth, headers: nextHeaders });
  };

  const removeHeader = (id: string) => {
    const removedHeader = headers.find((header) => header.id === id);
    const nextAuth =
      removedHeader &&
      (isAuthHeader(removedHeader, auth) || isSameHeaderKey(removedHeader.key, AUTH_HEADER_KEY))
        ? { type: 'none' as const }
        : auth;
    const nextHeaders = headers.filter((header) => header.id !== id);

    setHeaders(nextHeaders);
    publish({
      auth: nextAuth,
      headers: nextHeaders,
    });
  };

  const addHeader = () => {
    setHeaders([
      ...headers,
      { id: `header-${nextHeaderIdRef.current++}`, key: '', value: '', enabled: true },
    ]);
  };

  return {
    auth,
    body,
    headers,
    method,
    url,
    addHeader,
    buildRequest,
    changeAuth,
    changeBody,
    changeMethod,
    changeUrl,
    removeHeader,
    updateHeader,
  };
}
