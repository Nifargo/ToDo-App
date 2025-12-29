import React from 'react';
import type { NodeKey } from 'lexical';
import CustomCheckbox from '../CustomCheckbox';

interface CheckboxItemProps {
  nodeKey: NodeKey;
  checked: boolean;
  text: string;
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function CheckboxItem({ nodeKey, checked, text }: CheckboxItemProps) {
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

    const handleBlur = () => {
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