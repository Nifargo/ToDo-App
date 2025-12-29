/* @refresh reset */
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { DecoratorNode } from 'lexical';
import React from 'react';
import CustomCheckbox from '../CustomCheckbox';

export type SerializedCheckboxNode = Spread<
  {
    checked: boolean;
    text: string;
  },
  SerializedLexicalNode
>;

export class CheckboxNode extends DecoratorNode<React.JSX.Element> {
  __checked: boolean;
  __text: string;

  static getType(): string {
    return 'checkbox';
  }

  static clone(node: CheckboxNode): CheckboxNode {
    return new CheckboxNode(node.__checked, node.__text, node.__key);
  }

  constructor(checked: boolean, text: string, key?: NodeKey) {
    super(key);
    this.__checked = checked;
    this.__text = text;
  }

  createDOM(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'checkbox-container flex items-start gap-2 my-1';
    element.setAttribute('data-checkbox-key', this.__key);
    return element;
  }

  updateDOM(): false {
    return false;
  }

  setChecked(checked: boolean): void {
    const writable = this.getWritable();
    writable.__checked = checked;
  }

  getChecked(): boolean {
    return this.__checked;
  }

  setText(text: string): void {
    const writable = this.getWritable();
    writable.__text = text;
  }

  getText(): string {
    return this.__text;
  }

  decorate(): React.JSX.Element {
    return (
      <CheckboxItem
        nodeKey={this.__key}
        checked={this.__checked}
        text={this.__text}
      />
    );
  }

  exportJSON(): SerializedCheckboxNode {
    return {
      checked: this.__checked,
      text: this.__text,
      type: 'checkbox',
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedCheckboxNode): CheckboxNode {
    const node = $createCheckboxNode(
      serializedNode.checked,
      serializedNode.text
    );
    return node;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-checkbox', 'true');
    element.setAttribute('data-checked', String(this.__checked));
    element.textContent = this.__text;
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-checkbox')) {
          return null;
        }
        return {
          conversion: convertCheckboxElement,
          priority: 1,
        };
      },
    };
  }

  isInline(): false {
    return false;
  }
}

function convertCheckboxElement(domNode: HTMLElement): DOMConversionOutput | null {
  const checked = domNode.getAttribute('data-checked') === 'true';
  const text = domNode.textContent || '';
  const node = $createCheckboxNode(checked, text);
  return { node };
}

export function $createCheckboxNode(checked: boolean, text: string): CheckboxNode {
  return new CheckboxNode(checked, text);
}

export function $isCheckboxNode(
  node: LexicalNode | null | undefined
): node is CheckboxNode {
  return node instanceof CheckboxNode;
}

// React component for rendering the checkbox
interface CheckboxItemProps {
  nodeKey: NodeKey;
  checked: boolean;
  text: string;
}

function CheckboxItem({ nodeKey, checked, text }: CheckboxItemProps) {
  const inputRef = React.useRef<HTMLSpanElement>(null);
  const [shouldAutoFocus, setShouldAutoFocus] = React.useState(false);

  // Auto-focus on mount if text is empty (new checkbox)
  React.useEffect(() => {
    if (!text && inputRef.current) {
      setShouldAutoFocus(true);
      let hasFocusedSuccessfully = false;

      const focusWithRetry = (attempts = 0) => {
        if (attempts > 20 || hasFocusedSuccessfully) {
          // Stop trying after success or max attempts
          setShouldAutoFocus(false);
          return;
        }

        if (inputRef.current) {
          inputRef.current.focus();

          // Set cursor position - works even for empty contenteditable
          const range = document.createRange();
          const sel = window.getSelection();
          if (sel) {
            // For empty or non-empty spans, this approach works
            range.selectNodeContents(inputRef.current);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);

            // Additional focus call to ensure it sticks
            inputRef.current.focus();

            // Check if focus was successful
            if (document.activeElement === inputRef.current) {
              hasFocusedSuccessfully = true;
              setShouldAutoFocus(false);
              return; // Stop retrying once focused
            }
          }
        }

        // Retry with increasing delays
        const delay = attempts < 5 ? 50 : attempts < 10 ? 100 : 200;
        setTimeout(() => focusWithRetry(attempts + 1), delay);
      };

      // Start focusing immediately and keep trying
      requestAnimationFrame(() => {
        focusWithRetry(0);
      });
    }
  }, [text]);

  // Prevent focus loss by listening to blur events - but only for first 1 second
  React.useEffect(() => {
    if (!shouldAutoFocus) return; // Only active when auto-focusing

    let blurProtectionActive = true;

    // Disable blur protection after 1 second (focus should be stable by then)
    const timeout = setTimeout(() => {
      blurProtectionActive = false;
    }, 1000);

    const handleBlur = (_e: FocusEvent) => {
      if (blurProtectionActive && inputRef.current && !text) {
        // Check if focus moved to a non-checkbox element (exiting checklist mode)
        setTimeout(() => {
          const newActiveElement = document.activeElement as HTMLElement;

          // Don't reclaim focus if user moved to paragraph or other non-checkbox element
          const movedToCheckbox = newActiveElement?.closest('[data-checkbox-key]');

          if (!movedToCheckbox) {
            // User exited checklist mode, stop auto-focusing
            blurProtectionActive = false;
            return;
          }

          // Only reclaim focus if still within checklist mode
          if (inputRef.current && document.activeElement !== inputRef.current && blurProtectionActive) {
            inputRef.current.focus();
          }
        }, 0);
      }
    };

    const element = inputRef.current;
    if (element) {
      element.addEventListener('blur', handleBlur);
      return () => {
        clearTimeout(timeout);
        element.removeEventListener('blur', handleBlur);
      };
    }

    return () => clearTimeout(timeout);
  }, [shouldAutoFocus, text]);

  const handleChange = () => {
    // This will be handled by the plugin
    const event = new CustomEvent('checkbox-toggle', {
      detail: { nodeKey },
    });
    window.dispatchEvent(event);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      // Get current text content
      const currentText = (e.currentTarget as HTMLSpanElement).textContent || '';

      // If checkbox is empty, exit checklist mode
      if (currentText.trim() === '') {
        const event = new CustomEvent('checkbox-exit', {
          detail: { nodeKey },
        });
        window.dispatchEvent(event);
      } else {
        // Dispatch event to create new checkbox
        const event = new CustomEvent('checkbox-enter', {
          detail: { nodeKey, currentText },
        });
        window.dispatchEvent(event);
      }
    }
  };

  const handleFocus = () => {
    // Once user manually interacts, stop auto-focusing
    setShouldAutoFocus(false);
  };

  const handleInput = () => {
    // Once user types something, stop auto-focusing
    if (inputRef.current?.textContent) {
      setShouldAutoFocus(false);
    }
  };

  return (
    <div className="flex items-start gap-2">
      <CustomCheckbox checked={checked} onChange={handleChange} readOnly={false} />
      <span
        ref={inputRef}
        className={cn(
          'flex-1 font-mono text-sm text-white/90',
          checked && 'line-through opacity-60',
          !text && 'empty-checkbox-placeholder'
        )}
        contentEditable
        suppressContentEditableWarning
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onInput={handleInput}
        data-placeholder="Type something..."
      >
        {text}
      </span>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}