import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getNodeByKey, $createParagraphNode, COMMAND_PRIORITY_LOW, KEY_ENTER_COMMAND } from 'lexical';
import { $createCheckboxNode, $isCheckboxNode } from './checkboxHelpers';

export function CheckboxPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Handle checkbox toggle events
    const handleCheckboxToggle = (event: Event) => {
      const customEvent = event as CustomEvent<{ nodeKey: string }>;
      const { nodeKey } = customEvent.detail;

      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isCheckboxNode(node)) {
          const checked = node.getChecked();
          node.setChecked(!checked);

          // Move checked items to end (optional - can be implemented later)
          // This would require reordering nodes in the editor
        }
      });
    };

    // Handle Enter key in checkbox - create new checkbox
    const handleCheckboxEnter = (event: Event) => {
      const customEvent = event as CustomEvent<{ nodeKey: string; currentText: string }>;
      const { nodeKey, currentText } = customEvent.detail;

      let newCheckboxKey: string | null = null;

      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isCheckboxNode(node)) {
          // Update current checkbox text
          node.setText(currentText);

          // Create new checkbox after current one
          const newCheckbox = $createCheckboxNode(false, '');
          node.insertAfter(newCheckbox);

          // Store the key of the new checkbox
          newCheckboxKey = newCheckbox.getKey();
        }
      });

      // Focus new checkbox after DOM update with smart retry
      if (newCheckboxKey) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            const newCheckboxContainer = document.querySelector(
              `[data-checkbox-key="${newCheckboxKey}"]`
            );
            if (newCheckboxContainer) {
              const editableSpan = newCheckboxContainer.querySelector('[contenteditable]') as HTMLElement;
              if (editableSpan) {
                let focusSuccessful = false;
                const timeoutIds: number[] = [];

                const setFocusAndCursor = () => {
                  // Skip if already successful
                  if (focusSuccessful) return;

                  // Simulate click to activate contenteditable
                  editableSpan.click();

                  // Set focus
                  editableSpan.focus();

                  // Place cursor at the beginning
                  const range = document.createRange();
                  const sel = window.getSelection();
                  range.selectNodeContents(editableSpan);
                  range.collapse(true);
                  sel?.removeAllRanges();
                  sel?.addRange(range);

                  // Ensure contenteditable is active
                  editableSpan.setAttribute('contenteditable', 'true');

                  // Check if focus was successful
                  if (document.activeElement === editableSpan) {
                    focusSuccessful = true;
                    // Cancel all pending retries
                    timeoutIds.forEach(id => clearTimeout(id));
                  }
                };

                // First attempt
                setFocusAndCursor();

                // Reduced retries - only if first attempt failed
                const focusTimes = [50, 150, 300];
                focusTimes.forEach(delay => {
                  const timeoutId = setTimeout(() => setFocusAndCursor(), delay);
                  timeoutIds.push(timeoutId);
                });
              }
            }
          }, 100);
        });
      }
    };

    // Handle checkbox exit - exit checklist mode
    const handleCheckboxExit = (event: Event) => {
      const customEvent = event as CustomEvent<{ nodeKey: string }>;
      const { nodeKey } = customEvent.detail;

      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isCheckboxNode(node)) {
          // Create a paragraph node to replace this checkbox
          const paragraph = $createParagraphNode();

          // Replace the checkbox with the paragraph (maintains position)
          node.replace(paragraph);

          // Focus immediately - blur handler will be smart enough not to interfere
          paragraph.selectStart();
        }
      });
    };

    window.addEventListener('checkbox-toggle', handleCheckboxToggle);
    window.addEventListener('checkbox-enter', handleCheckboxEnter);
    window.addEventListener('checkbox-exit', handleCheckboxExit);

    return () => {
      window.removeEventListener('checkbox-toggle', handleCheckboxToggle);
      window.removeEventListener('checkbox-enter', handleCheckboxEnter);
      window.removeEventListener('checkbox-exit', handleCheckboxExit);
    };
  }, [editor]);

  useEffect(() => {
    // Register command to insert checkbox on Ctrl/Cmd + Shift + C
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      () => {
        // You can add custom behavior for Enter key if needed
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return null;
}