import {
  ADMIN_MEDIA_BROWSE_GROUP_LABELS,
  ADMIN_MEDIA_BROWSE_GROUP_ORDER,
  isAdminMediaBrowseGroup,
  type AdminMediaBrowseGroup,
  type AdminMediaScopeKey
} from './media-contract';

export type AdminMediaBrowseResolvedGroup = Exclude<AdminMediaBrowseGroup, 'all'>;

export type AdminMediaBrowseFilterOption = {
  value: string;
  label: string;
  count: number;
  hidden?: boolean;
};

type AdminMediaQueryItem = {
  path: string;
  fileName: string;
  owner: string | null;
  ownerLabel: string | null;
};

export type AdminMediaBrowseFacetItem = AdminMediaQueryItem & {
  browseGroup: AdminMediaBrowseResolvedGroup;
  browseSubgroup: string;
  browseSubgroupLabel: string | null;
};

export type AdminMediaScopeIndex = {
  recent: string[];
};

export const normalizeAdminMediaBrowseGroup = (value: string | null | undefined): string =>
  (value ?? '').trim().toLowerCase().replace(/\\/g, '/');

export const normalizeAdminMediaBrowseSubgroup = (value: string | null | undefined): string =>
  (value ?? '').trim().replace(/\\/g, '/');

const normalizeAdminMediaQuery = (query: string): string => query.trim().toLowerCase();

export const matchesAdminMediaQuery = (item: AdminMediaQueryItem, query: string): boolean => {
  const normalizedQuery = normalizeAdminMediaQuery(query);
  if (!normalizedQuery) return true;

  const haystack = `${item.path} ${item.fileName} ${item.owner ?? ''} ${item.ownerLabel ?? ''}`.toLowerCase();
  return haystack.includes(normalizedQuery);
};

export const buildAdminMediaBrowseGroupOptions = <
  TItem extends Pick<AdminMediaBrowseFacetItem, 'browseGroup'>
>(
  items: readonly TItem[]
): AdminMediaBrowseFilterOption[] => {
  const counts = items.reduce((map, item) => {
    map.set(item.browseGroup, (map.get(item.browseGroup) ?? 0) + 1);
    return map;
  }, new Map<AdminMediaBrowseResolvedGroup, number>());

  return ADMIN_MEDIA_BROWSE_GROUP_ORDER.map((group) => ({
    value: group,
    label: ADMIN_MEDIA_BROWSE_GROUP_LABELS[group],
    count: group === 'all' ? items.length : (counts.get(group) ?? 0),
    hidden: group === 'uncategorized'
  }));
};

export const buildAdminMediaBrowseSubgroupOptions = <
  TItem extends Pick<AdminMediaBrowseFacetItem, 'browseGroup' | 'browseSubgroup' | 'browseSubgroupLabel'>
>(
  group: AdminMediaBrowseResolvedGroup,
  items: readonly TItem[]
): AdminMediaBrowseFilterOption[] => {
  const subgroupMap = items.reduce((map, item) => {
    if (item.browseGroup !== group || !item.browseSubgroup) return map;
    const current = map.get(item.browseSubgroup);
    if (current) {
      current.count += 1;
      return map;
    }

    map.set(item.browseSubgroup, {
      value: item.browseSubgroup,
      label: item.browseSubgroupLabel ?? item.browseSubgroup,
      count: 1
    });
    return map;
  }, new Map<string, AdminMediaBrowseFilterOption>());

  return Array.from(subgroupMap.values()).sort((left, right) => {
    if (/^(?:19|20)\d{2}$/.test(left.value) && /^(?:19|20)\d{2}$/.test(right.value)) {
      return Number.parseInt(right.value, 10) - Number.parseInt(left.value, 10);
    }

    return left.label.localeCompare(right.label, 'zh-CN');
  });
};

export const paginateAdminMediaItems = <TItem>({
  items,
  page,
  limit
}: {
  items: readonly TItem[];
  page: number;
  limit: number;
}): {
  items: TItem[];
  page: number;
  totalPages: number;
  totalCount: number;
} => {
  const safeLimit = Math.max(1, limit);
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / safeLimit));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * safeLimit;

  return {
    items: items.slice(startIndex, startIndex + safeLimit),
    page: safePage,
    totalPages,
    totalCount
  };
};

export const resolveAdminMediaBrowsePage = <TItem extends AdminMediaBrowseFacetItem>({
  items,
  group,
  subgroup,
  query,
  page,
  limit
}: {
  items: readonly TItem[];
  group: string;
  subgroup: string;
  query: string;
  page: number;
  limit: number;
}): {
  query: string;
  isKnownGroup: boolean;
  activeGroup: AdminMediaBrowseGroup;
  groupOptions: AdminMediaBrowseFilterOption[];
  subgroupOptions: AdminMediaBrowseFilterOption[];
  activeSubgroup: string;
  items: TItem[];
  page: number;
  totalPages: number;
  totalCount: number;
} => {
  const normalizedGroup = normalizeAdminMediaBrowseGroup(group);
  const normalizedSubgroup = normalizeAdminMediaBrowseSubgroup(subgroup);
  const trimmedQuery = query.trim();
  const queryPool = items.filter((item) => matchesAdminMediaQuery(item, trimmedQuery));
  const groupOptions = buildAdminMediaBrowseGroupOptions(queryPool);
  const isKnownGroup = isAdminMediaBrowseGroup(normalizedGroup);
  const activeGroup: AdminMediaBrowseGroup = isKnownGroup ? normalizedGroup : 'all';
  const browsePool = (() => {
    if (activeGroup === 'all') return queryPool;
    return queryPool.filter((item) => item.browseGroup === activeGroup);
  })();
  const subgroupOptions = activeGroup !== 'all'
    ? buildAdminMediaBrowseSubgroupOptions(activeGroup, browsePool)
    : [];
  const activeSubgroup = activeGroup !== 'all'
    && subgroupOptions.some((option) => option.value === normalizedSubgroup)
    ? normalizedSubgroup
    : '';
  const filteredItems = activeSubgroup
    ? browsePool.filter((item) => item.browseSubgroup === activeSubgroup)
    : browsePool;
  const pagination = paginateAdminMediaItems({
    items: filteredItems,
    page,
    limit
  });

  return {
    query: trimmedQuery,
    isKnownGroup,
    activeGroup,
    groupOptions,
    subgroupOptions,
    activeSubgroup,
    ...pagination
  };
};

export const buildAdminMediaScopeItems = <
  TItem extends Pick<AdminMediaBrowseFacetItem, 'path'>
>(
  scope: AdminMediaScopeKey,
  browseIndex: readonly TItem[],
  scopeIndex: AdminMediaScopeIndex
): TItem[] => {
  if (scope !== 'recent') return [];

  const orderMap = scopeIndex.recent.reduce((map, assetPath, index) => {
    if (!map.has(assetPath)) {
      map.set(assetPath, index);
    }
    return map;
  }, new Map<string, number>());

  return browseIndex
    .filter((item) => orderMap.has(item.path))
    .sort((left, right) => {
      const leftIndex = orderMap.get(left.path) ?? Number.MAX_SAFE_INTEGER;
      const rightIndex = orderMap.get(right.path) ?? Number.MAX_SAFE_INTEGER;
      return leftIndex - rightIndex;
    });
};
