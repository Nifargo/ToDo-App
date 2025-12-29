import type { TextStyle } from '@/types';

export interface TextSelection {
  text: string;
  start: number;
  end: number;
}

/**
 * Apply markdown formatting to selected text
 */
export const applyMarkdownStyle = (
  content: string,
  selection: TextSelection,
  style: TextStyle
): { newContent: string; newCursorPos: number } => {
  const { text, start, end } = selection;
  const before = content.slice(0, start);
  const after = content.slice(end);

  let formatted = '';
  let cursorOffset = 0;

  switch (style) {
    case 'bold':
      formatted = `**${text}**`;
      cursorOffset = text ? formatted.length : 2; // Position cursor between **|**
      break;

    case 'italic':
      formatted = `*${text}*`;
      cursorOffset = text ? formatted.length : 1;
      break;

    case 'underline':
      formatted = `<u>${text}</u>`;
      cursorOffset = text ? formatted.length : 3;
      break;

    case 'heading1':
      formatted = text ? `# ${text}` : '# ';
      cursorOffset = formatted.length;
      break;

    case 'heading2':
      formatted = text ? `## ${text}` : '## ';
      cursorOffset = formatted.length;
      break;

    case 'heading3':
      formatted = text ? `### ${text}` : '### ';
      cursorOffset = formatted.length;
      break;

    case 'bulletList':
      formatted = text ? `- ${text}` : '- ';
      cursorOffset = formatted.length;
      break;

    case 'numberedList':
      formatted = text ? `1. ${text}` : '1. ';
      cursorOffset = formatted.length;
      break;

    case 'checklist':
      formatted = text ? `- [ ] ${text}` : '- [ ] ';
      cursorOffset = formatted.length;
      break;

    default:
      formatted = text;
      cursorOffset = text.length;
  }

  const newContent = before + formatted + after;
  const newCursorPos = start + cursorOffset;

  return { newContent, newCursorPos };
};

/**
 * Insert checklist at cursor position with placeholder text
 */
export const insertChecklist = (
  content: string,
  cursorPos: number
): { newContent: string; newCursorPos: number; selectionEnd?: number } => {
  const before = content.slice(0, cursorPos);
  const after = content.slice(cursorPos);

  // Check if we're at the start of a line
  const isStartOfLine = cursorPos === 0 || content[cursorPos - 1] === '\n';
  const prefix = isStartOfLine ? '' : '\n';

  // Add placeholder text so remark-gfm recognizes it as a task list item
  const placeholderText = 'Завдання';
  const checklistItem = `${prefix}- [ ] ${placeholderText}`;
  const newContent = before + checklistItem + after;

  // Position cursor to select the placeholder text
  const newCursorPos = cursorPos + prefix.length + 6; // After "- [ ] "
  const selectionEnd = newCursorPos + placeholderText.length;

  return { newContent, newCursorPos, selectionEnd };
};

/**
 * Normalize checkbox format to strict GFM format
 * Converts `- [x ]` or `- [ ]` to `- [x]` or `- [ ]`
 * Also removes empty checkbox lines (checkboxes without any text after them)
 */
export const normalizeCheckboxFormat = (content: string): string => {
  return content
    // Normalize checked boxes: [x ] or [X ] -> [x]
    .replace(/(-\s*\[)[xX]\s*(\])/g, '$1x$2')
    // Normalize unchecked boxes: ensure exactly one space
    .replace(/(-\s*\[)\s*(\])/g, '$1 $2')
    // Remove empty checkbox lines (checkbox with no text after it)
    .split('\n')
    .filter(line => {
      // Remove lines that are just "- [ ]" or "- [x]" with only whitespace after
      const emptyCheckboxPattern = /^\s*-\s*\[([ xX])\]\s*$/;
      return !emptyCheckboxPattern.test(line);
    })
    .join('\n');
};

/**
 * Toggle checkbox state in markdown and move checked items to end
 */
export const toggleCheckbox = (content: string, line: number): string => {
  const lines = content.split('\n');

  if (line < 0 || line >= lines.length) {
    return content;
  }

  const currentLine = lines[line];

  // Match [ ] or [x] or [X] (with flexible spacing)
  const uncheckedPattern = /^(\s*)-\s*\[\s*\]\s*/;
  const checkedPattern = /^(\s*)-\s*\[[xX]\s*\]\s*/;

  let wasJustChecked = false;

  if (uncheckedPattern.test(currentLine)) {
    // Change [ ] to [x] (strict GFM format, no space after x)
    lines[line] = currentLine.replace(uncheckedPattern, '$1- [x] ');
    wasJustChecked = true;
  } else if (checkedPattern.test(currentLine)) {
    // Change [x] to [ ] (strict GFM format, one space inside)
    lines[line] = currentLine.replace(checkedPattern, '$1- [ ] ');
  }

  // If item was just checked, move it to the end of checkbox list
  if (wasJustChecked) {
    return moveCheckedToEnd(lines.join('\n'), line);
  }

  return lines.join('\n');
};

/**
 * Move a checked checkbox item to the end of the checkbox list
 */
export const moveCheckedToEnd = (content: string, checkedLineIndex: number): string => {
  const lines = content.split('\n');

  // Find the range of consecutive checkbox lines around this item
  let startIdx = checkedLineIndex;
  let endIdx = checkedLineIndex;

  const checkboxPattern = /^(\s*)-\s*\[([ xX])\]\s*/;

  // Find start of checkbox list
  while (startIdx > 0 && checkboxPattern.test(lines[startIdx - 1])) {
    startIdx--;
  }

  // Find end of checkbox list
  while (endIdx < lines.length - 1 && checkboxPattern.test(lines[endIdx + 1])) {
    endIdx++;
  }

  // Extract the checkbox list
  const beforeList = lines.slice(0, startIdx);
  const checkboxList = lines.slice(startIdx, endIdx + 1);
  const afterList = lines.slice(endIdx + 1);

  // Remove the checked item from its current position
  const checkedItemIndex = checkedLineIndex - startIdx;
  const [movedItem] = checkboxList.splice(checkedItemIndex, 1);

  // Find the last unchecked item
  let lastUncheckedIdx = -1;
  for (let i = checkboxList.length - 1; i >= 0; i--) {
    if (/^(\s*)-\s*\[\s*\]\s*/.test(checkboxList[i])) {
      lastUncheckedIdx = i;
      break;
    }
  }

  // Insert after the last unchecked item, or at the end if all are checked
  const insertIdx = lastUncheckedIdx === -1 ? checkboxList.length : lastUncheckedIdx + 1;
  checkboxList.splice(insertIdx, 0, movedItem);

  // Reconstruct the content
  return [...beforeList, ...checkboxList, ...afterList].join('\n');
};

/**
 * Get line number from cursor position
 */
export const getLineFromPosition = (content: string, position: number): number => {
  return content.slice(0, position).split('\n').length - 1;
};

/**
 * Check if cursor is on a checkbox line
 */
export const isCheckboxLine = (content: string, cursorPos: number): boolean => {
  const lines = content.split('\n');
  const lineNumber = getLineFromPosition(content, cursorPos);
  const line = lines[lineNumber];

  return /^(\s*)-\s*\[([ xX])\]\s*/.test(line || '');
};

/**
 * Handle keyboard shortcuts
 */
export const handleShortcut = (
  event: KeyboardEvent,
  content: string,
  selection: TextSelection
): { newContent: string; newCursorPos: number } | null => {
  const { ctrlKey, metaKey, key } = event;
  const isModifier = ctrlKey || metaKey;

  if (!isModifier) return null;

  let style: TextStyle | null = null;

  switch (key.toLowerCase()) {
    case 'b':
      style = 'bold';
      break;
    case 'i':
      style = 'italic';
      break;
    case 'u':
      style = 'underline';
      break;
    default:
      return null;
  }

  if (style) {
    event.preventDefault();
    return applyMarkdownStyle(content, selection, style);
  }

  return null;
};