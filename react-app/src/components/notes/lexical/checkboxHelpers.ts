import { $getSelection, $getRoot, type LexicalEditor, type LexicalNode } from 'lexical';
import { CheckboxNode } from './CheckboxNode';

// Helper function to create a checkbox node
export function $createCheckboxNode(checked: boolean, text: string): CheckboxNode {
  return new CheckboxNode(checked, text);
}

// Helper function to check if a node is a checkbox node
export function $isCheckboxNode(
  node: LexicalNode | null | undefined
): node is CheckboxNode {
  return node instanceof CheckboxNode;
}

// Helper function to insert a checkbox
export function insertCheckbox(editor: LexicalEditor, text: string = '') {
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
    let stabilityTimer: number | null = null;
    let observerDisconnected = false;

    const performFocus = () => {
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