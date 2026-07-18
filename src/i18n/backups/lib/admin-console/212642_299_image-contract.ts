export type AdminImageOrigin = 'public' | 'src/assets' | 'src/content';
export type AdminImageBrowseGroup = 'all' | 'essay' | 'bits' | 'memo' | 'assets' | 'pages' | 'uncategorized';
export type AdminImageScopeKey = 'recent';

export const ADMIN_IMAGE_DEFAULT_LIST_LIMIT = 20;

export const ADMIN_IMAGE_BROWSE_GROUP_LABELS = {
  all: 'all',
  essay: 'Essay',
  bits: 'Bits',
  memo: 'Memo',
  assets: 'Configure materials',
  pages: 'Page illustration',
  uncategorized: 'Uncategorized'
} as const satisfies Record<AdminImageBrowseGroup, string>;

export const ADMIN_IMAGE_BROWSE_GROUP_ORDER = [
  'all',
  'essay',
  'bits',
  'memo',
  'assets',
  'pages',
  'uncategorized'
] as const satisfies readonly AdminImageBrowseGroup[];

export const ADMIN_IMAGE_SCOPE_LABELS = {
  recent: 'Latest modification'
} as const satisfies Record<AdminImageScopeKey, string>;

export const isAdminImageOrigin = (value: unknown): value is AdminImageOrigin =>
  value === 'public' || value === 'src/assets' || value === 'src/content';

export const isAdminImageBrowseGroup = (value: unknown): value is AdminImageBrowseGroup =>
  typeof value === 'string' && value in ADMIN_IMAGE_BROWSE_GROUP_LABELS;

export const isAdminImageScopeKey = (value: unknown): value is AdminImageScopeKey =>
  typeof value === 'string' && value in ADMIN_IMAGE_SCOPE_LABELS;
