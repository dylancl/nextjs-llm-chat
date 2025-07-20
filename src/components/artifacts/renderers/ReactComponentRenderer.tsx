'use client';

import { memo } from 'react';
import { Artifact } from '@/types/artifacts';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, AlertTriangle } from 'lucide-react';

interface ReactComponentRendererProps {
  artifact: Artifact;
}

export const ReactComponentRenderer = memo(function ReactComponentRenderer({
  artifact,
}: ReactComponentRendererProps) {
  const handleOpenInCodeSandbox = () => {
    // Create a CodeSandbox with the React component
    const files = {
      'package.json': {
        content: JSON.stringify(
          {
            name: 'react-component-preview',
            version: '1.0.0',
            dependencies: {
              react: '^18.0.0',
              'react-dom': '^18.0.0',
              'react-scripts': '^5.0.0',
            },
            scripts: {
              start: 'react-scripts start',
            },
          },
          null,
          2
        ),
      },
      'src/App.js': {
        content: artifact.content,
      },
      'src/index.js': {
        content: `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
        `.trim(),
      },
      'public/index.html': {
        content: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>React Component Preview</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
        `.trim(),
      },
    };

    const parameters = {
      files: files,
    };

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://codesandbox.io/api/v1/sandboxes/define';
    form.target = '_blank';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'parameters';
    input.value = JSON.stringify(parameters);

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Warning about React component execution */}
      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 shrink-0">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          React components cannot be executed directly in this environment. Use
          the CodeSandbox button to run this component in a proper React
          environment.
        </AlertDescription>
      </Alert>

      {/* Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={handleOpenInCodeSandbox}
          className="h-8 px-3 text-xs"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Open in CodeSandbox
        </Button>
      </div>

      {/* Component Analysis */}
      <div className="space-y-2 shrink-0">
        <h4 className="text-sm font-medium text-foreground">
          Component Analysis:
        </h4>
        <div className="p-3 bg-muted/50 rounded-lg border border-border space-y-2">
          <ComponentAnalysis content={artifact.content} />
        </div>
      </div>

      {/* Dependencies */}
      {artifact.dependencies && artifact.dependencies.length > 0 && (
        <div className="text-xs text-muted-foreground shrink-0">
          <div className="font-medium mb-1">Dependencies:</div>
          <div className="flex flex-wrap gap-1">
            {artifact.dependencies.map((dep, index) => (
              <span key={index} className="px-2 py-1 bg-muted rounded text-xs">
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

function ComponentAnalysis({ content }: { content: string }) {
  const analysis = analyzeReactComponent(content);

  return (
    <div className="text-sm space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Component Type:</span>
        <span className="font-medium">{analysis.type}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Hooks Used:</span>
        <span className="font-medium">
          {analysis.hooks.length > 0 ? analysis.hooks.join(', ') : 'None'}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Props:</span>
        <span className="font-medium">{analysis.hasProps ? 'Yes' : 'No'}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">JSX Elements:</span>
        <span className="font-medium">{analysis.jsxElements}</span>
      </div>
    </div>
  );
}

function analyzeReactComponent(content: string) {
  const hooks: string[] = [];
  const hookPatterns = [
    { name: 'useState', pattern: /useState/g },
    { name: 'useEffect', pattern: /useEffect/g },
    { name: 'useCallback', pattern: /useCallback/g },
    { name: 'useMemo', pattern: /useMemo/g },
    { name: 'useRef', pattern: /useRef/g },
    { name: 'useContext', pattern: /useContext/g },
    { name: 'useReducer', pattern: /useReducer/g },
  ];

  hookPatterns.forEach(({ name, pattern }) => {
    if (pattern.test(content)) {
      hooks.push(name);
    }
  });

  const isFunctionalComponent =
    /const\s+\w+\s*=\s*\(\s*.*?\s*\)\s*=>/.test(content) ||
    /function\s+\w+\s*\(/.test(content);
  const isClassComponent = /class\s+\w+\s+extends\s+(React\.)?Component/.test(
    content
  );

  let type = 'Unknown';
  if (isFunctionalComponent) {
    type = 'Functional Component';
  } else if (isClassComponent) {
    type = 'Class Component';
  }

  const hasProps = /props/i.test(content) || /\{\s*\w+.*\}\s*\)/.test(content);
  const jsxElements = (content.match(/<[A-Z][a-zA-Z0-9]*[^>]*>/g) || []).length;

  return {
    type,
    hooks,
    hasProps,
    jsxElements,
  };
}
