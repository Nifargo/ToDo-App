import type { StyleOption } from '@/types';

export const styleOptions: StyleOption[] = [
  {
    id: 'bold',
    label: 'Bold',
    icon: 'Bold',
    shortcut: 'Ctrl+B',
    markdown: (text: string) => `**${text}**`,
  },
  {
    id: 'italic',
    label: 'Italic',
    icon: 'Italic',
    shortcut: 'Ctrl+I',
    markdown: (text: string) => `*${text}*`,
  },
  {
    id: 'underline',
    label: 'Underline',
    icon: 'Underline',
    shortcut: 'Ctrl+U',
    markdown: (text: string) => `<u>${text}</u>`,
  },
  {
    id: 'heading1',
    label: 'Heading 1',
    icon: 'Heading1',
    shortcut: '#',
    markdown: '# ',
  },
  {
    id: 'heading2',
    label: 'Heading 2',
    icon: 'Heading2',
    shortcut: '##',
    markdown: '## ',
  },
  {
    id: 'heading3',
    label: 'Heading 3',
    icon: 'Heading3',
    shortcut: '###',
    markdown: '### ',
  },
  {
    id: 'bulletList',
    label: 'Bullet List',
    icon: 'List',
    shortcut: '-',
    markdown: '- ',
  },
  {
    id: 'numberedList',
    label: 'Numbered List',
    icon: 'ListOrdered',
    shortcut: '1.',
    markdown: '1. ',
  },
];