export type MarkdownSyntaxIcon =
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'quote'
  | 'link'
  | 'image'
  | 'code'
  | 'code-block'
  | 'list'
  | 'ordered-list'
  | 'task-list'
  | 'table'
  | 'message-square-text'
  | 'sigma'
  | 'square-sigma'
  | 'smile'
  | 'minus';

export type MarkdownSyntaxExample = {
  label: string;
  syntax: string;
  icon?: MarkdownSyntaxIcon;
  marker?: string;
};

export type MarkdownShortcutExample = {
  label: string;
  shortcut: string;
  icon?: MarkdownSyntaxIcon;
};

export const MARKDOWN_SYNTAX_EXAMPLES: readonly MarkdownSyntaxExample[] = [
  { label: 'Section title', marker: 'H2', syntax: '## title' },
  { label: 'Level 3 headings', marker: 'H3', syntax: '### title' },
  { label: 'Bold', icon: 'bold', syntax: '**bold text**' },
  { label: 'italics', icon: 'italic', syntax: '*italicized text*' },
  { label: 'strikethrough', icon: 'strikethrough', syntax: '~~text~~' },
  { label: 'Link', icon: 'link', syntax: '[Link description](url)' },
  { label: 'picture', icon: 'image', syntax: '![alt](url "Image description")' },
  { label: 'Quote', icon: 'quote', syntax: '> quoted text' },
  { label: 'prompt block', icon: 'message-square-text', syntax: ':::note[title]' },
  { label: 'inline formula', icon: 'sigma', syntax: '$$x$$' },
  { label: 'Block level formula', icon: 'square-sigma', syntax: '$$\nx\n$$' },
  { label: 'expression', icon: 'smile', syntax: '🙂' },
  { label: 'code', icon: 'code', syntax: '`code`' },
  { label: 'code block', icon: 'code-block', syntax: '```language' },
  { label: 'unordered list', icon: 'list', syntax: '- project' },
  { label: 'ordered list', icon: 'ordered-list', syntax: '1. project' },
  { label: 'task list', icon: 'task-list', syntax: '- [ ] To-do list' },
  { label: 'sheet', icon: 'table', syntax: '| title | title |' },
  { label: 'dividing line', icon: 'minus', syntax: '---' }
] as const;

export const MARKDOWN_SHORTCUT_EXAMPLES: readonly MarkdownShortcutExample[] = [
  { label: 'Bold', icon: 'bold', shortcut: 'Ctrl + B' },
  { label: 'italics', icon: 'italic', shortcut: 'Ctrl + I' },
  { label: 'Link', icon: 'link', shortcut: 'Ctrl + K' }
] as const;
