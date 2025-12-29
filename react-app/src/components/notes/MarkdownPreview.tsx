import { type FC, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/utils/cn';
import CustomCheckbox from './CustomCheckbox';
import { toggleCheckbox, normalizeCheckboxFormat } from '@/utils/markdown';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
  onContentChange?: (newContent: string) => void;
}

const MarkdownPreview: FC<MarkdownPreviewProps> = ({ content, className, onContentChange }) => {
  // Find all checkbox lines in content
  const findCheckboxLine = useCallback((checkboxNumber: number): number => {
    const lines = content.split('\n');
    let count = 0;

    for (let i = 0; i < lines.length; i++) {
      if (/^(\s*)-\s*\[([ xX])\]\s*/.test(lines[i])) {
        if (count === checkboxNumber) {
          return i;
        }
        count++;
      }
    }

    return -1;
  }, [content]);

  const handleCheckboxChange = useCallback((index: number) => {
    if (!onContentChange) return;

    const lineNumber = findCheckboxLine(index);
    if (lineNumber !== -1) {
      const newContent = toggleCheckbox(content, lineNumber);
      onContentChange(newContent);
    }
  }, [content, findCheckboxLine, onContentChange]);

  // Create components object with checkbox counter
  const components = useMemo(() => {
    let checkboxCounter = 0;

    return {
      // Custom checkbox rendering for GitHub-flavored Markdown
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      input: (props: any) => {
        if (props.type === 'checkbox') {
          const currentIndex = checkboxCounter++;

          return (
            <CustomCheckbox
              checked={props.checked}
              onChange={() => handleCheckboxChange(currentIndex)}
              readOnly={false}
            />
          );
        }
        return <input {...props} />;
      },
      // Style list items with checkboxes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      li: ({ node, children, ...props }: any) => {
        const hasCheckbox =
          node &&
          node.children &&
          node.children[0] &&
          'tagName' in node.children[0] &&
          node.children[0].tagName === 'input';

        return (
          <li
            {...props}
            className={cn(
              'flex items-start',
              hasCheckbox && 'list-none'
            )}
          >
            {children}
          </li>
        );
      },
      // Custom heading rendering with better spacing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      h1: (props: any) => (
        <h1
          {...props}
          className="mt-6 mb-4 text-3xl font-bold text-white first:mt-0"
        />
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      h2: (props: any) => (
        <h2
          {...props}
          className="mt-5 mb-3 text-2xl font-bold text-white first:mt-0"
        />
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      h3: (props: any) => (
        <h3
          {...props}
          className="mt-4 mb-2 text-xl font-bold text-white first:mt-0"
        />
      ),
      // Custom paragraph with better line height
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p: (props: any) => (
        <p {...props} className="mb-3 leading-relaxed text-white/90" />
      ),
      // Custom list styling
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ul: (props: any) => (
        <ul {...props} className="my-2 space-y-1 pl-5" />
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ol: (props: any) => (
        <ol {...props} className="my-2 space-y-1 pl-5" />
      ),
    };
  }, [handleCheckboxChange]);

  // Normalize checkbox format for proper GFM parsing
  const normalizedContent = useMemo(() => {
    return normalizeCheckboxFormat(content);
  }, [content]);

  return (
    <div
      className={cn(
        'prose prose-invert max-w-none',
        'font-mono text-sm leading-relaxed tracking-normal', // Monospace font to match textarea
        'prose-headings:font-bold prose-headings:text-white',
        'prose-h1:text-2xl prose-h1:leading-relaxed prose-h1:mb-0 prose-h1:mt-0',
        'prose-h2:text-xl prose-h2:leading-relaxed prose-h2:mb-0 prose-h2:mt-0',
        'prose-h3:text-lg prose-h3:leading-relaxed prose-h3:mb-0 prose-h3:mt-0',
        'prose-p:text-white/90 prose-p:leading-relaxed prose-p:mb-0 prose-p:mt-0',
        'prose-a:text-purple-400 prose-a:no-underline hover:prose-a:text-purple-300 hover:prose-a:underline',
        'prose-strong:text-white prose-strong:font-bold',
        'prose-em:text-white/90 prose-em:italic',
        'prose-code:text-purple-300 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded',
        'prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg',
        'prose-ul:text-white/90 prose-ul:my-0',
        'prose-ol:text-white/90 prose-ol:my-0',
        'prose-li:my-0',
        'prose-blockquote:border-l-purple-500 prose-blockquote:text-white/80 prose-blockquote:italic',
        className
      )}
      style={{
        letterSpacing: 'normal',
        wordSpacing: 'normal',
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {normalizedContent || '*Start typing to see preview...*'}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownPreview;