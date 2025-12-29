import { type FC, useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { $getRoot, $createParagraphNode, $createTextNode, type EditorState } from 'lexical';
import { CheckboxNode } from './CheckboxNode';
import { $isCheckboxNode, $createCheckboxNode, insertCheckbox } from './checkboxHelpers';
import { CheckboxPlugin } from './CheckboxPlugin';
import { cn } from '@/utils/cn';

const theme = {
  paragraph: 'mb-2',
  heading: {
    h1: 'text-2xl font-bold mb-3 text-white',
    h2: 'text-xl font-bold mb-2 text-white',
    h3: 'text-lg font-bold mb-2 text-white',
  },
  list: {
    ul: 'list-disc pl-5 mb-2',
    ol: 'list-decimal pl-5 mb-2',
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  },
};

interface LexicalNoteEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  onEditorReady?: (insertCheckboxFn: () => void) => void;
}

function onError(error: Error) {
  console.error('Lexical error:', error);
}

export const LexicalNoteEditor: FC<LexicalNoteEditorProps> = ({
  initialContent,
  onChange,
  placeholder = 'Start typing...',
  onEditorReady,
}) => {
  const initialConfig = {
    namespace: 'NoteEditor',
    theme,
    onError,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CheckboxNode,
    ],
  };

  const handleChange = (editorState: EditorState) => {
    if (!onChange) return;

    editorState.read(() => {
      const root = $getRoot();
      const children = root.getChildren();

      // Serialize content to markdown format
      const lines: string[] = [];

      children.forEach((node) => {
        if ($isCheckboxNode(node)) {
          // Serialize checkbox as markdown: - [ ] text or - [x] text
          const checked = node.getChecked();
          const text = node.getText();
          lines.push(`- [${checked ? 'x' : ' '}] ${text}`);
        } else {
          // Regular text nodes
          const textContent = node.getTextContent();
          if (textContent) {
            lines.push(textContent);
          }
        }
      });

      onChange(lines.join('\n'));
    });
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative h-full w-full">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className={cn(
                'h-full w-full overflow-y-auto px-4 py-3',
                'font-mono text-sm leading-relaxed text-white/90',
                'focus:outline-none',
                'editor-content'
              )}
            />
          }
          placeholder={
            <div className="pointer-events-none absolute left-4 top-3 font-mono text-sm text-white/30">
              {placeholder}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <OnChangePlugin onChange={handleChange} />
        <CheckboxPlugin />
        <InitialContentPlugin initialContent={initialContent} />
        <EditorReadyPlugin onEditorReady={onEditorReady} />
      </div>
    </LexicalComposer>
  );
};

// Plugin to load initial content
function InitialContentPlugin({ initialContent }: { initialContent?: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!initialContent) return;

    // Load content only once on mount
    editor.update(() => {
      const root = $getRoot();
      root.clear();

      // Parse markdown-like content and create nodes
      const lines = initialContent.split('\n');
      lines.forEach((line) => {
        // Check if line is a checkbox
        const checkboxMatch = line.match(/^-\s*\[([ xX])\]\s*(.*)$/);
        if (checkboxMatch) {
          const checked = checkboxMatch[1].toLowerCase() === 'x';
          const text = checkboxMatch[2];
          // Create a real CheckboxNode
          const checkboxNode = $createCheckboxNode(checked, text);
          root.append(checkboxNode);
        } else if (line.trim()) {
          // Only create paragraph if line is not empty
          const paragraph = $createParagraphNode();
          const textNode = $createTextNode(line);
          paragraph.append(textNode);
          root.append(paragraph);
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]); // ✅ Removed initialContent from dependencies - load only once

  return null;
}

// Plugin to expose editor methods to parent component
function EditorReadyPlugin({ onEditorReady }: { onEditorReady?: (insertCheckboxFn: () => void) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!onEditorReady) return;

    // Create a function that inserts a checkbox at the current cursor position
    const handleInsertCheckbox = () => {
      insertCheckbox(editor, '');
    };

    // Pass the function back to the parent component
    onEditorReady(handleInsertCheckbox);
  }, [editor, onEditorReady]);

  return null;
}