'use client';

import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTheme } from 'next-themes';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  duotoneDark,
  duotoneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Artifact } from '@/types/artifacts';

interface MarkdownRendererProps {
  artifact: Artifact;
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  artifact,
}: MarkdownRendererProps) {
  const { theme } = useTheme();

  return (
    <div className="space-y-4">
      <div className="prose prose-sm max-w-none dark:prose-invert prose-neutral">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code: ({ className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';

              return match ? (
                <SyntaxHighlighter
                  style={
                    theme === 'dark' || theme === 'system'
                      ? duotoneDark
                      : duotoneLight
                  }
                  language={language}
                  PreTag="div"
                  customStyle={{
                    margin: '1rem 0',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                  }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code
                  className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground mb-4">
                {children}
              </blockquote>
            ),
            pre: ({ children }) => (
              <div className="relative group mb-4">{children}</div>
            ),
            a: ({ children, href }) => (
              <a
                href={href}
                className="text-primary hover:text-primary/80 underline underline-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto mb-4">
                <table className="w-full border-collapse border border-border rounded-lg">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-border px-3 py-2 bg-muted font-medium text-left">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-border px-3 py-2">{children}</td>
            ),
            p: ({ children }) => (
              <p className="text-foreground leading-relaxed mb-4 last:mb-0">
                {children}
              </p>
            ),
            h1: ({ children }) => (
              <h1 className="text-2xl font-semibold text-foreground mb-4 mt-6 first:mt-0">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-semibold text-foreground mb-3 mt-5 first:mt-0">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-medium text-foreground mb-2 mt-4 first:mt-0">
                {children}
              </h3>
            ),
            li: ({ children }) => (
              <li className="text-foreground leading-relaxed mb-2">
                {children}
              </li>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-5 mb-4">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-5 mb-4">{children}</ol>
            ),
          }}
        >
          {artifact.content}
        </ReactMarkdown>
      </div>
    </div>
  );
});
