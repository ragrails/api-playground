import React from 'react';
import { RequestSnippet } from '@ragrails/api-playground-react';
import type { WidgetRequest } from '@ragrails/api-playground-react';

const SAMPLE: WidgetRequest = {
  title: 'Get Users',
  method: 'GET',
  url: 'https://jsonplaceholder.typicode.com/users/1',
  sampleResponse: `{
  "id": 1,
  "name": "Leanne Graham",
  "email": "leanne@example.com",
  "status": "active",
  "role": "admin"
}`,
};

export const WidgetDemo: React.FC = () => (
  <div className="mx-auto max-w-3xl px-6 py-16">
    <RequestSnippet request={SAMPLE} onTryItOut={() => {}} />
  </div>
);
