import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getNodeByKey, $getSelection, $getRoot, $createParagraphNode, COMMAND_PRIORITY_LOW, KEY_ENTER_COMMAND } from 'lexical';
import { $createCheckboxNode, $isCheckboxNode } from './CheckboxNode';

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
                const timeoutIds: NodeJS.Timeout[] = [];

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

// Helper function to insert a checkbox
export function insertCheckbox(editor: any, text: string = '') {
  let newCheckboxKey: string | null = null;

  // Use editor.update() - it doesn't return a Promise
  editor.update(() => {
    const checkboxNode = $createCheckboxNode(false, text);
    const selection = $getSelection();

    if (selection) {
      const nodes = selection.getNodes();
      if (nodes.length > 0) {
        // Get the top-level block node (paragraph, heading, etc.)
        let targetNode = nodes[0];
        let parent = targetNode.getParent();

        // Traverse up to find a child of root
        while (parent && !parent.getType().includes('root')) {
          targetNode = parent;
          parent = parent.getParent();
        }

        // Insert after the target node (which is a direct child of root)
        if (targetNode && parent) {
          targetNode.insertAfter(checkboxNode);
        } else {
          // Fallback: append to root
          $getRoot().append(checkboxNode);
        }
      } else {
        // If no nodes in selection, append to root
        $getRoot().append(checkboxNode);
      }
    } else {
      // If no selection, append to root
      $getRoot().append(checkboxNode);
    }

    // Store the key of the new checkbox for focusing
    newCheckboxKey = checkboxNode.getKey();
  });

  // Wait for Lexical to complete all updates and re-renders
  // This ensures the checkbox is in its final position before focusing
  if (!newCheckboxKey) return;

  // Use MutationObserver to wait until DOM is stable
  const waitForStableDOMAndFocus = () => {
    let stabilityTimer: NodeJS.Timeout | null = null;
    let observerDisconnected = false;

    const performFocus = () => {
      const newCheckboxContainer = document.querySelector(
        `[data-checkbox-key="${newCheckboxKey}"]`
      );

      if (newCheckboxContainer) {
        const editableSpan = newCheckboxContainer.querySelector('[contenteditable]') as HTMLElement;
        if (editableSpan) {
          let focusSuccessful = false;
          const timeoutIds: NodeJS.Timeout[] = [];

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
          // Fewer attempts: 3 instead of 5
          const focusTimes = [50, 150, 300];
          focusTimes.forEach(delay => {
            const timeoutId = setTimeout(() => setFocusAndCursor(), delay);
            timeoutIds.push(timeoutId);
          });
        }
      }
    };

    // Create observer to watch for DOM changes
    const observer = new MutationObserver(() => {
      // Clear previous timer
      if (stabilityTimer) {
        clearTimeout(stabilityTimer);
      }

      // Set new timer - if no mutations for 200ms, DOM is stable
      stabilityTimer = setTimeout(() => {
        if (!observerDisconnected) {
          observerDisconnected = true;
          observer.disconnect();
          performFocus();
        }
      }, 200);
    });

    // Small delay to let Lexical start its DOM changes before observing
    setTimeout(() => {
      const editorElement = document.querySelector('[contenteditable="true"]')?.closest('[role="textbox"]') || document.body;

      observer.observe(editorElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });

      // Fallback: disconnect after 1.5 seconds max
      setTimeout(() => {
        if (!observerDisconnected) {
          observerDisconnected = true;
          observer.disconnect();
          if (stabilityTimer) clearTimeout(stabilityTimer);
          performFocus();
        }
      }, 1500);
    }, 100);
  };

  // Start the process
  waitForStableDOMAndFocus();
}