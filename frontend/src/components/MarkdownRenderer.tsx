import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";

type Props = {
  content: string;
};

// 统一的 Markdown 渲染器：支持 GFM、表格、任务列表、代码高亮、公式
function normalizeLatexDelimiters(src: string): string {
  let out = src;
  // 支持 \( ... \) 与 \[ ... \] 语法（转为 $ 与 $$）
  out = out.replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) => `$${inner}$`);
  out = out.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => `$$${inner}$$`);
  // 将中文全角括号包裹且以反斜杠开头的疑似 LaTeX 转为 $...$
  out = out.replace(/（\s*(\\[\s\S]*?)）/g, (_m, inner) => `$${inner}$`);
  return out;
}

export const MarkdownRenderer: React.FC<Props> = ({ content }) => {
  const text = useMemo(() => normalizeLatexDelimiters(content), [content]);
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, [rehypeHighlight, { ignoreMissing: true }]]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noreferrer" className="text-blue-600 underline" />
          ),
          code: ({ inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            if (!inline && match) {
              return (
                <pre className="overflow-x-auto rounded-md border bg-muted p-3">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              );
            }
            return (
              <code className="rounded bg-muted px-1.5 py-0.5" {...props}>
                {children}
              </code>
            );
          },
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto">
              <table {...props} />
            </div>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;


