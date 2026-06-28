import React, { useMemo, useState } from 'react';
import { Button, Card, CodeBlock, Icon, Tabs } from '@/components/ui';
import { formatJsonIfPossible } from './format';
import { SNIPPET_LANGUAGES, generateSnippet, highlightFor } from './snippets';
import type { SnippetLanguage, WidgetRequest } from './types';

interface RequestSnippetProps {
  request: WidgetRequest;
  /** Called when the user clicks "Try it out". */
  onTryItOut?: () => void;
}

/**
 * Documentation view of a request: language-tabbed code snippet with a
 * "Try it out" action, plus an optional sample response.
 */
export const RequestSnippet: React.FC<RequestSnippetProps> = ({ request, onTryItOut }) => {
  const [lang, setLang] = useState<SnippetLanguage>('curl');
  const code = useMemo(() => generateSnippet(request, lang), [request, lang]);
  const sampleResponse = useMemo(
    () => (request.sampleResponse ? formatJsonIfPossible(request.sampleResponse) : ''),
    [request.sampleResponse],
  );
  const showTryButton = Boolean(onTryItOut);

  const selectLanguage = (id: string) => {
    setLang(id as SnippetLanguage);
  };

  return (
    <div className="space-y-3">
      <Card>
        <div className="relative flex items-center justify-between">
          <Tabs
            items={SNIPPET_LANGUAGES}
            activeId={lang}
            onChange={selectLanguage}
            className="[&_button]:text-[14px]"
          />
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
          <CodeBlock code={code} language={highlightFor(lang)} showLineNumbers />
        </div>
      </Card>

      {sampleResponse && (
        <Card label="">
          <CodeBlock code={sampleResponse} language="json" />
        </Card>
      )}
    </div>
  );
};
