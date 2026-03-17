'use client'

import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/base16/tomorrow-night.css'

interface Props {
  content: string
}

export default function MarkdownRenderer({ content }: Props) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          // Override code block to add language label
          pre({ children, ...props }) {
            return (
              <pre {...props} style={{ position: 'relative' }}>
                {children}
              </pre>
            )
          },
          // Task list items
          li({ children, ...props }) {
            return <li {...props}>{children}</li>
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
