export type AdminMediaOrigin = 'public' | 'src/assets' | 'src/content';
export type AdminMediaBrowseGroup = 'all' | 'essay' | 'bits' | 'memo' | 'assets' | 'pages' | 'uncategorized';
export type AdminMediaScopeKey = 'recent';

export const ADMIN_MEDIA_DEFAULT_LIST_LIMIT = 20;

export const ADMIN_MEDIA_BROWSE_GROUP_LABELS = {
  all: '全部',
  essay: '随笔',
  bits: 'Bits',
  memo: 'Memo',
  assets: '配置素材',
  pages: '公共页面图',
  uncategorized: '未归类'
} as const satisfies Record<AdminMediaBrowseGroup, string>;

export const ADMIN_MEDIA_BROWSE_GROUP_ORDER = [
  'all',
  'essay',
  'bits',
  'memo',
  'assets',
  'pages',
  'uncategorized'
] as const satisfies readonly AdminMediaBrowseGroup[];

export const ADMIN_MEDIA_SCOPE_LABELS = {
  recent: '最近修改'
} as const satisfies Record<AdminMediaScopeKey, string>;

export const isAdminMediaOrigin = (value: unknown): value is AdminMediaOrigin =>
  value === 'public' || value === 'src/assets' || value === 'src/content';

export const isAdminMediaBrowseGroup = (value: unknown): value is AdminMediaBrowseGroup =>
  typeof value === 'string' && value in ADMIN_MEDIA_BROWSE_GROUP_LABELS;

export const isAdminMediaScopeKey = (value: unknown): value is AdminMediaScopeKey =>
  typeof value === 'string' && value in ADMIN_MEDIA_SCOPE_LABELS;
