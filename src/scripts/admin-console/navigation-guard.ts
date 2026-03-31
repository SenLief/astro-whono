type UrlLike = string | URL;

export type AdminNavigationGuardInput = {
  isDirty: boolean;
  currentUrl: UrlLike;
  nextUrl: UrlLike;
  button?: number;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  target?: string | null;
  download?: boolean;
};

const toUrl = (value: UrlLike): URL => value instanceof URL ? value : new URL(value);

const normalizeTarget = (value?: string | null): string => {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
};

export const shouldGuardAdminNavigation = ({
  isDirty,
  currentUrl,
  nextUrl,
  button = 0,
  metaKey = false,
  ctrlKey = false,
  shiftKey = false,
  altKey = false,
  target = '',
  download = false
}: AdminNavigationGuardInput): boolean => {
  if (!isDirty) return false;
  if (button !== 0) return false;
  if (metaKey || ctrlKey || shiftKey || altKey) return false;
  if (download) return false;

  const normalizedTarget = normalizeTarget(target);
  if (normalizedTarget && normalizedTarget !== '_self') {
    return false;
  }

  const current = toUrl(currentUrl);
  const next = toUrl(nextUrl);

  if (current.origin !== next.origin) {
    return false;
  }

  return current.pathname !== next.pathname || current.search !== next.search;
};
