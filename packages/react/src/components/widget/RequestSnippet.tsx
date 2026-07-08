import React, { useEffect, useState, useMemo } from 'react';
import { Button, Card, CodeBlock, FluidHeight, Icon, Select, Tabs } from '@/components/ui';
import { formatJsonIfPossible } from '@/lib/widget/format';
import {
  generateSnippet,
  highlightFor,
  initialSnippetLanguage,
  normalizeSnippetLanguages,
  snippetLanguageItems,
} from '@/lib/widget/snippets';
import type { SnippetLanguage, WidgetRequest } from '@/lib/widget/types';
import type { CodeLanguage } from '@/lib/highlight';

export interface RequestSnippetProps {
  request: WidgetRequest;
  /** Called when the user clicks "Try it out". */
  onTryItOut?: () => void;
  snippetLanguages?: readonly SnippetLanguage[];
}

const VISIBLE_LANGUAGE_COUNT = 4;
function responseLanguage(body: string): CodeLanguage {
  try {
    JSON.parse(body);
    return 'json';
  } catch {
    return 'plain';
  }
}

/**
 * Documentation view of a request: language-tabbed code snippet with a
 * "Try it out" action, plus an optional sample response.
 */
export const RequestSnippet: React.FC<RequestSnippetProps> = ({
  request,
  onTryItOut,
  snippetLanguages,
}) => {
  const languages = useMemo(
    () => normalizeSnippetLanguages(snippetLanguages as readonly string[] | undefined),
    [snippetLanguages],
  );
  const initialLanguage = useMemo(
    () => initialSnippetLanguage(languages),
    [languages],
  );
  const [lang, setLang] = useState<SnippetLanguage>(initialLanguage);
  const activeLanguage = languages.includes(lang) ? lang : initialLanguage;
  const code = useMemo(() => generateSnippet(request, activeLanguage), [request, activeLanguage]);
  const responseExamples = useMemo(
    () =>
      request.responseExamples?.length
        ? request.responseExamples.map((example) => ({
            ...example,
            body: formatJsonIfPossible(example.body),
          }))
        : request.sampleResponse
          ? [{ status: 200, statusText: 'OK', body: formatJsonIfPossible(request.sampleResponse) }]
          : [],
    [request.responseExamples, request.sampleResponse],
  );
  const [responseIndex, setResponseIndex] = useState(0);
  const activeResponseIndex = Math.min(responseIndex, Math.max(responseExamples.length - 1, 0));
  const activeResponse = responseExamples[activeResponseIndex];
  const responseItems = useMemo(
    () =>
      responseExamples.map((example, index) => ({
        id: `${index}`,
        label: `${example.status}${example.statusText ? ` ${example.statusText}` : ''}`,
      })),
    [responseExamples],
  );
  const visibleLanguages = useMemo(() => languages.slice(0, VISIBLE_LANGUAGE_COUNT), [languages]);
  const overflowLanguages = useMemo(() => languages.slice(VISIBLE_LANGUAGE_COUNT), [languages]);
  const visibleItems = useMemo(() => snippetLanguageItems(visibleLanguages), [visibleLanguages]);
  const overflowItems = useMemo(() => snippetLanguageItems(overflowLanguages), [overflowLanguages]);
  const moreValue = overflowLanguages.includes(activeLanguage) ? activeLanguage : overflowLanguages[0];
  const mobilePrimaryLanguage = useMemo<SnippetLanguage>(() => (languages.includes('curl') ? 'curl' : languages[0]), [languages]);
  const mobileOverflowLanguages = useMemo(
    () => languages.filter((language) => language !== mobilePrimaryLanguage),
    [languages, mobilePrimaryLanguage],
  );
  const mobilePrimaryItems = useMemo(() => snippetLanguageItems([mobilePrimaryLanguage]), [mobilePrimaryLanguage]);
  const mobileOverflowItems = useMemo(() => snippetLanguageItems(mobileOverflowLanguages), [mobileOverflowLanguages]);
  const mobileMoreValue = mobileOverflowLanguages.includes(activeLanguage) ? activeLanguage : mobileOverflowLanguages[0];
  const showTryButton = Boolean(onTryItOut);

  useEffect(() => {
    if (!languages.includes(lang)) setLang(initialLanguage);
  }, [languages, lang, initialLanguage]);

  useEffect(() => {
    if (responseIndex >= responseExamples.length) setResponseIndex(0);
  }, [responseExamples.length, responseIndex]);

  const selectLanguage = (id: string) => {
    setLang(id as SnippetLanguage);
  };

  return (
    <div className="w-full space-y-3">
      <Card>
        <div className="relative flex items-center justify-between gap-2">
          <div className="hidden min-w-0 items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:flex [&::-webkit-scrollbar]:hidden">
            <Tabs
              items={visibleItems}
              activeId={visibleLanguages.includes(activeLanguage) ? activeLanguage : ''}
              onChange={selectLanguage}
              className="[&_button]:text-[13px]"
            />
            {overflowLanguages.length > 0 && (
              <Select
                value={moreValue}
                onChange={setLang}
                items={overflowItems}
                size="sm"
                triggerLabel={overflowLanguages.includes(activeLanguage) ? undefined : 'More'}
                minWidthClassName="min-w-28"
              />
            )}
          </div>
          <div className="flex min-w-0 items-center gap-2 sm:hidden">
            <Tabs
              items={mobilePrimaryItems}
              activeId={activeLanguage === mobilePrimaryLanguage ? activeLanguage : ''}
              onChange={selectLanguage}
              className="[&_button]:text-[13px]"
            />
            {mobileOverflowLanguages.length > 0 && (
              <Select
                value={mobileMoreValue}
                onChange={setLang}
                items={mobileOverflowItems}
                size="sm"
                triggerLabel={mobileOverflowLanguages.includes(activeLanguage) ? undefined : 'More'}
                minWidthClassName="min-w-28"
              />
            )}
          </div>
          {showTryButton && (
            <Button
              size="sm"
              variant="primary"
              onClick={onTryItOut}
              rightIcon={<Icon name="arrow-right" className="h-4 w-4" />}
            >
              Try it
            </Button>
          )}
        </div>
        <div className="mt-4">
          <FluidHeight watchKey={activeLanguage}>
            <CodeBlock code={code} language={highlightFor(activeLanguage)} showLineNumbers className="[&_*]:text-[13px]" />
          </FluidHeight>
        </div>
      </Card>

      {activeResponse && (
        <Card label="">
          {responseExamples.length > 1 && (
            <div className="mb-1.5">
              <Select
                value={`${activeResponseIndex}`}
                onChange={(value) => setResponseIndex(Number(value))}
                items={responseItems}
                size="sm"
                minWidthClassName="min-w-36"
              />
            </div>
          )}
          <CodeBlock code={activeResponse.body} language={responseLanguage(activeResponse.body)} className="[&_*]:text-[13px]" />
        </Card>
      )}
    </div>
  );
};
