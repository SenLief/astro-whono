import type {
  HeroPresetId,
  HomeIntroLinkKey,
  PageId,
  SidebarDividerVariant,
  SidebarNavId,
  SiteSocialIconKey,
  SiteSocialPresetId,
  SiteSocialPresetOrder
} from '../theme-settings';

export const ADMIN_NAV_IDS = ['essay', 'bits', 'memo', 'archive', 'about'] as const satisfies readonly SidebarNavId[];
export const ADMIN_PAGE_IDS = ['essay', 'archive', 'bits', 'memo', 'about'] as const satisfies readonly PageId[];
export const ADMIN_SOCIAL_CUSTOM_LIMIT = 8;

export const ADMIN_HERO_PRESETS = ['default', 'none'] as const satisfies readonly HeroPresetId[];
export const ADMIN_HERO_PRESET_SET: ReadonlySet<HeroPresetId> = new Set(ADMIN_HERO_PRESETS);
export const ADMIN_HERO_IMAGE_ALT_DEFAULT = 'Whono theme preview';
export const ADMIN_HERO_IMAGE_ALT_MAX_LENGTH = 120;

export const ADMIN_SIDEBAR_DIVIDER_VARIANTS = [
  'default',
  'subtle',
  'none'
] as const satisfies readonly SidebarDividerVariant[];
export const ADMIN_SIDEBAR_DIVIDER_DEFAULT: SidebarDividerVariant = 'default';
export const ADMIN_SIDEBAR_DIVIDER_SET: ReadonlySet<SidebarDividerVariant> = new Set(ADMIN_SIDEBAR_DIVIDER_VARIANTS);
export const ADMIN_SIDEBAR_DIVIDER_OPTIONS = [
  { id: 'default', label: '默认' },
  { id: 'subtle', label: '弱化' },
  { id: 'none', label: '隐藏' }
] as const satisfies readonly {
  id: SidebarDividerVariant;
  label: string;
}[];

export const ADMIN_HOME_INTRO_LINK_KEYS = [
  'archive',
  'essay',
  'bits',
  'memo',
  'about'
] as const satisfies readonly HomeIntroLinkKey[];
export const ADMIN_HOME_INTRO_LINK_DEFAULT = ['archive', 'essay'] as const satisfies readonly HomeIntroLinkKey[];
export const ADMIN_HOME_INTRO_LINK_LIMIT = 2;
export const ADMIN_HOME_INTRO_LINK_KEY_SET: ReadonlySet<HomeIntroLinkKey> = new Set(ADMIN_HOME_INTRO_LINK_KEYS);
export const ADMIN_HOME_INTRO_LINK_OPTIONS = [
  { id: 'archive', label: '归档', href: '/archive/' },
  { id: 'essay', label: '随笔', href: '/essay/' },
  { id: 'bits', label: '絮语', href: '/bits/' },
  { id: 'memo', label: '小记', href: '/memo/' },
  { id: 'about', label: '关于', href: '/about/' }
] as const satisfies readonly {
  id: HomeIntroLinkKey;
  label: string;
  href: string;
}[];

export const ADMIN_SOCIAL_PRESET_IDS = ['github', 'x', 'email'] as const satisfies readonly SiteSocialPresetId[];
export const ADMIN_SOCIAL_PRESET_ORDER_DEFAULT: Record<SiteSocialPresetId, number> = {
  github: 1,
  x: 2,
  email: 3
};
export const ADMIN_SOCIAL_ORDER_MIN = 1;
export const ADMIN_SOCIAL_ORDER_MAX = ADMIN_SOCIAL_PRESET_IDS.length + ADMIN_SOCIAL_CUSTOM_LIMIT;

type AdminSocialOrderScope = 'preset' | 'custom';
type AdminSocialOrderInput = {
  key: string;
  order: number;
};

export type AdminSocialOrderIssue = {
  type: 'range' | 'duplicate';
  scope: AdminSocialOrderScope;
  key: string;
  order: number;
};

export const ADMIN_SOCIAL_ICON_KEYS = [
  'github',
  'x',
  'email',
  'weibo',
  'facebook',
  'instagram',
  'telegram',
  'mastodon',
  'bilibili',
  'youtube',
  'linkedin',
  'website'
] as const satisfies readonly SiteSocialIconKey[];
export const ADMIN_SOCIAL_ICON_KEY_SET: ReadonlySet<SiteSocialIconKey> = new Set(ADMIN_SOCIAL_ICON_KEYS);

export const ADMIN_GITHUB_HOSTS = ['github.com'] as const;
export const ADMIN_X_HOSTS = ['x.com', 'twitter.com'] as const;

export const ADMIN_HOME_INTRO_MAX_LENGTH = 240;
export const ADMIN_PAGE_TITLE_MAX_LENGTH = 60;
export const ADMIN_PAGE_SUBTITLE_MAX_LENGTH = 120;
export const ADMIN_NAV_ORNAMENT_DEFAULT = '·';
export const ADMIN_NAV_ORNAMENT_MAX_LENGTH = 4;
export const ADMIN_FOOTER_START_YEAR_MIN = 1900;
export const ADMIN_FOOTER_COPYRIGHT_MAX_LENGTH = 120;

export const ADMIN_LOCALE_RE = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
export const ADMIN_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADMIN_HERO_IMAGE_LOCAL_EXT_RE = /\.(?:avif|gif|jpe?g|png|webp)$/i;

export const getAdminFooterStartYearMax = (): number => new Date().getFullYear();

export const isAdminNavId = (value: string): value is SidebarNavId =>
  (ADMIN_NAV_IDS as readonly string[]).includes(value);

export const isAdminHeroPresetId = (value: string): value is HeroPresetId =>
  ADMIN_HERO_PRESET_SET.has(value as HeroPresetId);

export const isAdminSidebarDividerVariant = (value: string): value is SidebarDividerVariant =>
  ADMIN_SIDEBAR_DIVIDER_SET.has(value as SidebarDividerVariant);

export const isAdminHomeIntroLinkKey = (value: string): value is HomeIntroLinkKey =>
  ADMIN_HOME_INTRO_LINK_KEY_SET.has(value as HomeIntroLinkKey);

export const isAdminSocialPresetId = (value: string): value is SiteSocialPresetId =>
  (ADMIN_SOCIAL_PRESET_IDS as readonly string[]).includes(value);

export const normalizeAdminSocialIconKey = (value: unknown): SiteSocialIconKey | undefined => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (normalized === 'link' || normalized === 'globe') return 'website';
  return ADMIN_SOCIAL_ICON_KEY_SET.has(normalized as SiteSocialIconKey) ? (normalized as SiteSocialIconKey) : undefined;
};

export const isAdminSocialIconKey = (value: string): value is SiteSocialIconKey =>
  ADMIN_SOCIAL_ICON_KEY_SET.has(value as SiteSocialIconKey);

export const isAdminSocialOrderValue = (value: number): boolean =>
  Number.isInteger(value) && value >= ADMIN_SOCIAL_ORDER_MIN && value <= ADMIN_SOCIAL_ORDER_MAX;

export const getAdminSocialOrderIssues = (
  presetOrder: Readonly<SiteSocialPresetOrder>,
  customItems: readonly AdminSocialOrderInput[]
): AdminSocialOrderIssue[] => {
  const entries = [
    ...ADMIN_SOCIAL_PRESET_IDS.map((id) => ({
      scope: 'preset' as const,
      key: id,
      order: presetOrder[id]
    })),
    ...customItems.map((item) => ({
      scope: 'custom' as const,
      key: item.key,
      order: item.order
    }))
  ];
  const orderCounts = new Map<number, number>();

  entries.forEach((entry) => {
    if (!isAdminSocialOrderValue(entry.order)) return;
    orderCounts.set(entry.order, (orderCounts.get(entry.order) ?? 0) + 1);
  });

  const issues: AdminSocialOrderIssue[] = [];

  entries.forEach((entry) => {
    if (!isAdminSocialOrderValue(entry.order)) {
      issues.push({ type: 'range', ...entry });
      return;
    }

    if ((orderCounts.get(entry.order) ?? 0) > 1) {
      issues.push({ type: 'duplicate', ...entry });
    }
  });

  return issues;
};

export const getAdminHomeIntroLinkOption = (
  id: HomeIntroLinkKey
): (typeof ADMIN_HOME_INTRO_LINK_OPTIONS)[number] =>
  ADMIN_HOME_INTRO_LINK_OPTIONS.find((option) => option.id === id) ?? ADMIN_HOME_INTRO_LINK_OPTIONS[0];

export const isAdminAllowedHttpsUrl = (value: string, allowedHosts?: readonly string[]): boolean => {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') return false;
    if (!Array.isArray(allowedHosts) || !allowedHosts.length) return true;

    const hostname = parsed.hostname.toLowerCase();
    return allowedHosts.some((host) => hostname === host || hostname === `www.${host}` || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
};

const hasInvalidHeroImagePathSegment = (value: string): boolean =>
  /(^|\/)\.\.(?:\/|$)/.test(value) || value.includes('?') || value.includes('#');

const toCanonicalHeroAssetPath = (value: string): string | null => {
  if (value.startsWith('@/assets/')) {
    return `src/assets/${value.slice('@/assets/'.length)}`;
  }

  if (value.startsWith('assets/')) {
    return `src/assets/${value.slice('assets/'.length)}`;
  }

  return value.startsWith('src/assets/') ? value : null;
};

export const normalizeAdminHeroImageSrc = (value: unknown): string | null | undefined => {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isAdminAllowedHttpsUrl(trimmed)) return new URL(trimmed).toString();

  const normalized = trimmed.replace(/\\/g, '/').replace(/^\.\/+/, '');
  if (!normalized || normalized.startsWith('//') || hasInvalidHeroImagePathSegment(normalized)) {
    return undefined;
  }

  if (normalized.startsWith('/')) {
    return normalized !== '/' && ADMIN_HERO_IMAGE_LOCAL_EXT_RE.test(normalized) ? normalized : undefined;
  }

  if (normalized.startsWith('public/')) {
    const publicPath = `/${normalized.slice('public/'.length)}`;
    return publicPath !== '/' && ADMIN_HERO_IMAGE_LOCAL_EXT_RE.test(publicPath) ? publicPath : undefined;
  }

  const assetPath = toCanonicalHeroAssetPath(normalized);
  return assetPath && ADMIN_HERO_IMAGE_LOCAL_EXT_RE.test(assetPath) ? assetPath : undefined;
};

export const getAdminHeroImageLocalFilePath = (value: string): string | null => {
  if (value.startsWith('src/assets/')) return value;
  if (value.startsWith('/')) return `public${value}`;
  return null;
};
