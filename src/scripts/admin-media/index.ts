import {
  fetchAdminMediaJson,
  formatAdminMediaBytes,
  isNullableNumber,
  isNullableString,
  isRecord,
  parseAdminMediaMetaResponse,
  type AdminMediaClientMeta
} from '../admin-shared/media-client';
import {
  ADMIN_MEDIA_DEFAULT_LIST_LIMIT,
  ADMIN_MEDIA_SCOPE_LABELS,
  isAdminMediaBrowseGroup,
  isAdminMediaOrigin,
  isAdminMediaScopeKey,
  type AdminMediaBrowseGroup,
  type AdminMediaOrigin,
  type AdminMediaScopeKey
} from '../../lib/admin-console/media-contract';
import {
  buildAdminMediaBrowseGroupOptions,
  buildAdminMediaScopeItems,
  matchesAdminMediaQuery,
  normalizeAdminMediaBrowseGroup,
  normalizeAdminMediaBrowseSubgroup,
  paginateAdminMediaItems,
  resolveAdminMediaBrowsePage,
  type AdminMediaBrowseFilterOption,
  type AdminMediaScopeIndex
} from '../../lib/admin-console/media-browse';

type AdminMediaScope = '' | AdminMediaScopeKey;

type AdminMediaBrowseItem = {
  path: string;
  origin: AdminMediaOrigin;
  fileName: string;
  owner: string | null;
  ownerLabel: string | null;
  browseGroup: Exclude<AdminMediaBrowseGroup, 'all'>;
  browseGroupLabel: string;
  browseSubgroup: string;
  browseSubgroupLabel: string | null;
  preferredValue: string | null;
  previewSrc: string | null;
};

type AdminMediaListItem = AdminMediaBrowseItem & {
  value: string;
  width: number | null;
  height: number | null;
  size: number | null;
  mimeType: string | null;
};

type AdminMediaBootstrap = {
  listEndpoint: string;
  metaEndpoint: string;
  initialState: {
    scope: AdminMediaScope;
    group: string;
    subgroup: string;
    query: string;
    page: number;
  };
  browseIndex: AdminMediaBrowseItem[] | null;
  scopeIndex: AdminMediaScopeIndex;
  didRefresh: boolean;
};

type AdminMediaListResponse = {
  group: string;
  subgroup: string;
  groupOptions: AdminMediaBrowseFilterOption[];
  subgroupOptions: AdminMediaBrowseFilterOption[];
  items: AdminMediaListItem[];
  page: number;
  totalPages: number;
  totalCount: number;
};

type AdminMediaState = {
  scope: AdminMediaScope;
  group: string;
  subgroup: string;
  query: string;
  page: number;
};

const root = document.querySelector<HTMLElement>('[data-admin-media-root]');
const DEFAULT_GROUP: AdminMediaBrowseGroup = 'all';
const DEFAULT_SCOPE: AdminMediaScope = '';
const PAGE_SIZE = ADMIN_MEDIA_DEFAULT_LIST_LIMIT;
const LARGE_FILE_THRESHOLD = 500 * 1024;
const byId = <T extends HTMLElement>(id: string): T | null => document.getElementById(id) as T | null;
const iconLibraryEl = byId<HTMLDivElement>('admin-media-icon-library');
const iconMarkupCache = new Map<string, string>();

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const parsePositiveInteger = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : fallback;

const getIconMarkup = (name: string): string => {
  const cached = iconMarkupCache.get(name);
  if (cached !== undefined) return cached;

  const markup = iconLibraryEl?.querySelector<HTMLElement>(`[data-icon="${name}"]`)?.innerHTML.trim() ?? '';
  iconMarkupCache.set(name, markup);
  return markup;
};

const getOriginBadgeLabel = (origin: AdminMediaBrowseItem['origin']): string => {
  if (origin === 'public') return '公开资源';
  if (origin === 'src/assets') return '站点素材';
  return '内容附件';
};

const getFilterOptionCount = (options: readonly AdminMediaFilterOption[]): number =>
  options.reduce((total, option) => total + option.count, 0);

const toBrowseItem = (item: AdminMediaListItem): AdminMediaBrowseItem => ({
  path: item.path,
  origin: item.origin,
  fileName: item.fileName,
  owner: item.owner,
  ownerLabel: item.ownerLabel,
  browseGroup: item.browseGroup,
  browseGroupLabel: item.browseGroupLabel,
  browseSubgroup: item.browseSubgroup,
  browseSubgroupLabel: item.browseSubgroupLabel,
  preferredValue: item.preferredValue,
  previewSrc: item.previewSrc
});

const toCachedMeta = (item: AdminMediaListItem): AdminMediaClientMeta => ({
  kind: 'local',
  path: item.path,
  value: item.value,
  origin: item.origin,
  width: item.width,
  height: item.height,
  size: item.size,
  mimeType: item.mimeType,
  previewSrc: item.previewSrc
});

type AdminMediaFilterOption = AdminMediaBrowseFilterOption;

const parseFilterOptions = (payload: unknown): AdminMediaFilterOption[] => {
  if (!Array.isArray(payload)) return [];

  return payload.filter((item): item is AdminMediaFilterOption => {
    if (!isRecord(item)) return false;
    return typeof item.value === 'string'
      && typeof item.label === 'string'
      && typeof item.count === 'number'
      && (typeof item.hidden === 'boolean' || typeof item.hidden === 'undefined');
  });
};

const isBrowseItem = (item: unknown): item is AdminMediaBrowseItem =>
  isRecord(item)
  && typeof item.path === 'string'
  && isAdminMediaOrigin(item.origin)
  && typeof item.fileName === 'string'
  && isNullableString(item.owner)
  && isNullableString(item.ownerLabel)
  && isAdminMediaBrowseGroup(item.browseGroup)
  && item.browseGroup !== DEFAULT_GROUP
  && typeof item.browseGroupLabel === 'string'
  && typeof item.browseSubgroup === 'string'
  && isNullableString(item.browseSubgroupLabel)
  && isNullableString(item.preferredValue)
  && isNullableString(item.previewSrc);

const isListItem = (item: unknown): item is AdminMediaListItem =>
  isRecord(item)
  && typeof item.path === 'string'
  && isAdminMediaOrigin(item.origin)
  && typeof item.fileName === 'string'
  && isNullableString(item.owner)
  && isNullableString(item.ownerLabel)
  && isAdminMediaBrowseGroup(item.browseGroup)
  && item.browseGroup !== DEFAULT_GROUP
  && typeof item.browseGroupLabel === 'string'
  && typeof item.browseSubgroup === 'string'
  && isNullableString(item.browseSubgroupLabel)
  && isNullableString(item.preferredValue)
  && isNullableString(item.previewSrc)
  && typeof item.value === 'string'
  && isNullableNumber(item.width)
  && isNullableNumber(item.height)
  && isNullableNumber(item.size)
  && isNullableString(item.mimeType);

const parseListResult = (result: unknown): AdminMediaListResponse => {
  if (!isRecord(result) || !Array.isArray(result.items)) {
    throw new Error('媒体列表结果格式无效');
  }

  const normalizedGroup = typeof result.group === 'string'
    ? normalizeAdminMediaBrowseGroup(result.group)
    : '';

  return {
    group: isAdminMediaBrowseGroup(normalizedGroup) ? normalizedGroup : DEFAULT_GROUP,
    subgroup: typeof result.subgroup === 'string'
      ? normalizeAdminMediaBrowseSubgroup(result.subgroup)
      : '',
    groupOptions: parseFilterOptions(result.groupOptions),
    subgroupOptions: parseFilterOptions(result.subgroupOptions),
    items: result.items.filter(isListItem),
    page: parsePositiveInteger(result.page, 1),
    totalPages: parsePositiveInteger(result.totalPages, 1),
    totalCount: typeof result.totalCount === 'number' && result.totalCount >= 0
      ? result.totalCount
      : 0
  };
};

const parseBrowseIndex = (payload: unknown): AdminMediaBrowseItem[] | null => {
  if (payload == null) return null;
  if (!Array.isArray(payload)) return null;
  return payload.filter(isBrowseItem);
};

const parseScopeIndex = (payload: unknown): AdminMediaScopeIndex | null => {
  if (payload == null) {
    return { recent: [] };
  }
  if (!isRecord(payload) || !Array.isArray(payload.recent)) return null;
  return {
    recent: payload.recent.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  };
};

const parseBootstrap = (text: string): AdminMediaBootstrap | null => {
  try {
    const payload = JSON.parse(text) as unknown;
    if (
      !isRecord(payload)
      || typeof payload.listEndpoint !== 'string'
      || typeof payload.metaEndpoint !== 'string'
      || !isRecord(payload.initialState)
    ) {
      return null;
    }

    const browseIndex = parseBrowseIndex(payload.browseIndex);
    if (payload.browseIndex != null && browseIndex === null) {
      return null;
    }
    const scopeIndex = parseScopeIndex(payload.scopeIndex);
    if (scopeIndex === null) {
      return null;
    }
    const normalizedScope = typeof payload.initialState.scope === 'string'
      ? payload.initialState.scope.trim().toLowerCase()
      : '';
    const normalizedGroup = typeof payload.initialState.group === 'string'
      ? normalizeAdminMediaBrowseGroup(payload.initialState.group)
      : '';
    const initialScope = isAdminMediaScopeKey(normalizedScope) ? normalizedScope : DEFAULT_SCOPE;

    return {
      listEndpoint: payload.listEndpoint,
      metaEndpoint: payload.metaEndpoint,
      initialState: {
        scope: initialScope,
        group: isAdminMediaBrowseGroup(normalizedGroup) ? normalizedGroup : DEFAULT_GROUP,
        subgroup: typeof payload.initialState.subgroup === 'string' ? payload.initialState.subgroup.trim() : '',
        query: typeof payload.initialState.query === 'string' ? payload.initialState.query : '',
        page: parsePositiveInteger(payload.initialState.page, 1)
      },
      browseIndex,
      scopeIndex,
      didRefresh: payload.didRefresh === true
    };
  } catch {
    return null;
  }
};

const parseListResponse = (payload: unknown): AdminMediaListResponse => {
  if (!isRecord(payload) || payload.ok !== true || !isRecord(payload.result) || !Array.isArray(payload.result.items)) {
    throw new Error('媒体列表响应格式无效');
  }

  return parseListResult(payload.result);
};

const fetchList = async (endpoint: string, state: AdminMediaState): Promise<AdminMediaListResponse> => {
  const params = new URLSearchParams({
    group: state.group || DEFAULT_GROUP,
    page: String(state.page),
    limit: String(PAGE_SIZE)
  });
  if (state.group !== DEFAULT_GROUP && state.subgroup.trim()) {
    params.set('sub', state.subgroup.trim());
  }
  if (state.query.trim()) {
    params.set('q', state.query.trim());
  }

  const payload = await fetchAdminMediaJson(`${endpoint}?${params.toString()}`, '媒体列表请求失败');
  return parseListResponse(payload);
};

const fetchMetaByPath = async (endpoint: string, assetPath: string): Promise<AdminMediaClientMeta> => {
  const payload = await fetchAdminMediaJson(
    `${endpoint}?${new URLSearchParams({ path: assetPath }).toString()}`,
    '媒体元数据请求失败'
  );
  return parseAdminMediaMetaResponse(payload);
};

const updateUrl = (state: AdminMediaState) => {
  const url = new URL(window.location.href);
  url.searchParams.delete('refresh');

  if (state.scope) {
    url.searchParams.set('scope', state.scope);
  } else {
    url.searchParams.delete('scope');
  }

  if (!state.scope && state.group !== DEFAULT_GROUP && state.group.trim()) {
    url.searchParams.set('group', state.group.trim());
  } else {
    url.searchParams.delete('group');
  }

  if (!state.scope && state.group !== DEFAULT_GROUP && state.subgroup.trim()) {
    url.searchParams.set('sub', state.subgroup.trim());
  } else {
    url.searchParams.delete('sub');
  }

  if (state.query.trim()) {
    url.searchParams.set('q', state.query.trim());
  } else {
    url.searchParams.delete('q');
  }

  if (state.page > 1) {
    url.searchParams.set('page', String(state.page));
  } else {
    url.searchParams.delete('page');
  }

  history.replaceState(null, '', `${url.pathname}${url.search}`);
};

const navigateToRefresh = ({ resetState = false }: { resetState?: boolean } = {}) => {
  const url = new URL(window.location.href);
  if (resetState) {
    url.searchParams.delete('scope');
    url.searchParams.delete('group');
    url.searchParams.delete('sub');
    url.searchParams.delete('q');
    url.searchParams.delete('page');
  }
  url.searchParams.set('refresh', '1');
  window.location.assign(`${url.pathname}${url.search}`);
};

const copyText = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  document.body.append(textarea);
  textarea.select();
  const execCommand = Reflect.get(document as object, 'execCommand') as
    | ((commandId: string, showUI?: boolean, input?: string) => boolean)
    | undefined;
  const copied = execCommand?.call(document, 'copy') ?? false;
  textarea.remove();

  if (!copied) {
    throw new Error('浏览器阻止了复制动作');
  }
};

if (root) {
  const bootstrapEl = byId<HTMLDivElement>('admin-media-bootstrap');
  const formEl = byId<HTMLFormElement>('admin-media-form');
  const groupsWrapEl = byId<HTMLDivElement>('admin-media-groups-wrap');
  const groupsEl = byId<HTMLDivElement>('admin-media-groups');
  const showUncategorizedBtn = byId<HTMLButtonElement>('admin-media-show-uncategorized');
  const subgroupsWrapEl = byId<HTMLDivElement>('admin-media-subgroups-wrap');
  const subgroupsEl = byId<HTMLDivElement>('admin-media-subgroups');
  const searchPanelEl = byId<HTMLDivElement>('admin-media-search-panel');
  const searchToggleBtn = byId<HTMLButtonElement>('admin-media-search-toggle');
  const queryInput = byId<HTMLInputElement>('admin-media-query');
  const recentBtn = byId<HTMLButtonElement>('admin-media-recent');
  const refreshBtn = byId<HTMLButtonElement>('admin-media-refresh');
  const statusLiveEl = byId<HTMLElement>('admin-media-status-live');
  const statusEl = byId<HTMLElement>('admin-media-status');
  const pageMetaEl = byId<HTMLElement>('admin-media-page-meta');
  const resultListEl = byId<HTMLUListElement>('admin-media-result-list');
  const emptyEl = byId<HTMLElement>('admin-media-empty');
  const prevBtn = byId<HTMLButtonElement>('admin-media-prev');
  const nextBtn = byId<HTMLButtonElement>('admin-media-next');
  const detailEl = byId<HTMLElement>('admin-media-detail');

  if (
    !bootstrapEl
    || !formEl
    || !groupsWrapEl
    || !groupsEl
    || !showUncategorizedBtn
    || !subgroupsWrapEl
    || !subgroupsEl
    || !searchPanelEl
    || !searchToggleBtn
    || !queryInput
    || !recentBtn
    || !refreshBtn
    || !statusLiveEl
    || !statusEl
    || !pageMetaEl
    || !resultListEl
    || !emptyEl
    || !prevBtn
    || !nextBtn
    || !detailEl
  ) {
    // Required controls are missing.
  } else {
    const bootstrap = parseBootstrap(bootstrapEl.textContent ?? '');
    if (!bootstrap) {
      statusEl.dataset.state = 'error';
      statusEl.textContent = '媒体库初始化失败';
      statusLiveEl.textContent = '媒体库初始化失败';
    } else {
      const hasLocalBrowse = Array.isArray(bootstrap.browseIndex);
      let busy = false;
      let requestToken = 0;
      let currentTotalPages = 1;
      let currentTotalCount = 0;
      let currentItems: AdminMediaBrowseItem[] = [];
      let currentGroupOptions: AdminMediaFilterOption[] = [];
      let currentSubgroupOptions: AdminMediaFilterOption[] = [];
      let selectedPath: string | null = null;
      let showHiddenGroups = bootstrap.initialState.group === 'uncategorized';
      const detailMetaCache = new Map<string, AdminMediaClientMeta>();
      const detailMetaErrors = new Map<string, string>();
      const detailMetaPending = new Set<string>();
      let currentState: AdminMediaState = {
        scope: hasLocalBrowse && bootstrap.initialState.scope === 'recent' ? 'recent' : DEFAULT_SCOPE,
        group: bootstrap.initialState.group,
        subgroup: bootstrap.initialState.group === DEFAULT_GROUP ? '' : bootstrap.initialState.subgroup,
        query: bootstrap.initialState.query,
        page: bootstrap.initialState.page
      };
      let searchOpen = currentState.query.trim().length > 0;
      let draftQuery = currentState.query;

      const setStatus = (
        state: 'idle' | 'loading' | 'ok' | 'warn' | 'error',
        message: string,
        announce = true
      ) => {
        statusEl.dataset.state = state;
        statusEl.textContent = message;
        if (announce) {
          statusLiveEl.textContent = message;
        }
      };

      const getCardOverlayMetaText = (item: AdminMediaBrowseItem): string => {
        const detailMeta = detailMetaCache.get(item.path);
        if (!detailMeta?.width || !detailMeta.height) {
          return '';
        }

        const dimensions = `${detailMeta.width} × ${detailMeta.height}`;
        if (!detailMeta.size || detailMeta.size <= 0) {
          return dimensions;
        }

        return `${dimensions} · ${formatAdminMediaBytes(detailMeta.size)}`;
      };

      const createChipButton = (
        option: Pick<AdminMediaFilterOption, 'label' | 'count'>,
        active: boolean,
        disabled: boolean,
        onClick: () => void
      ): HTMLButtonElement => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `admin-media-browser__chip${active ? ' admin-media-browser__chip--active' : ''}`;
        button.disabled = disabled;
        button.setAttribute('aria-pressed', active ? 'true' : 'false');

        const label = document.createElement('span');
        label.textContent = option.label;
        button.append(label);

        const count = document.createElement('span');
        count.className = 'admin-media-browser__chip-count';
        count.textContent = String(option.count);
        button.append(count);

        button.addEventListener('click', onClick);
        return button;
      };

      const renderGroupButtons = () => {
        groupsWrapEl.hidden = currentState.scope !== DEFAULT_SCOPE;
        groupsEl.replaceChildren();
        if (currentState.scope !== DEFAULT_SCOPE) {
          showUncategorizedBtn.hidden = true;
          return;
        }

        const hasHiddenOptions = currentGroupOptions.some(
          (option) => option.hidden && (option.count > 0 || currentState.group === option.value)
        );
        showUncategorizedBtn.hidden = !hasHiddenOptions;
        showUncategorizedBtn.textContent = currentState.group === 'uncategorized' || showHiddenGroups
          ? '隐藏未归类'
          : '显示未归类';

        const visibleOptions = currentGroupOptions.filter(
          (option) => !option.hidden || showHiddenGroups || currentState.group === option.value
        );

        visibleOptions.forEach((option) => {
          groupsEl.append(
            createChipButton(option, currentState.group === option.value, busy, () => {
              if (busy) return;
              if (currentState.group === option.value && currentState.page === 1 && !currentState.subgroup) {
                return;
              }
              currentState = {
                scope: DEFAULT_SCOPE,
                group: option.value,
                subgroup: '',
                query: currentState.query,
                page: 1
              };
              if (option.value === 'uncategorized') {
                showHiddenGroups = true;
              }
              if (hasLocalBrowse) {
                applyBrowseState({ updateLocation: true });
                return;
              }
              void loadList();
            })
          );
        });
      };

      const renderSubgroupButtons = () => {
        subgroupsEl.replaceChildren();

        if (currentState.scope !== DEFAULT_SCOPE || currentState.group === DEFAULT_GROUP || currentSubgroupOptions.length === 0) {
          subgroupsWrapEl.hidden = true;
          return;
        }

        subgroupsWrapEl.hidden = false;
        subgroupsEl.append(
          createChipButton(
            {
              label: '全部',
              count: getFilterOptionCount(currentSubgroupOptions)
            },
            currentState.subgroup.length === 0,
            busy,
            () => {
              if (busy || currentState.subgroup.length === 0) return;
              currentState = {
                ...currentState,
                subgroup: '',
                page: 1
              };
              if (hasLocalBrowse) {
                applyBrowseState({ updateLocation: true });
                return;
              }
              void loadList();
            }
          )
        );

        currentSubgroupOptions.forEach((option) => {
          subgroupsEl.append(
            createChipButton(option, currentState.subgroup === option.value, busy, () => {
              if (busy || currentState.subgroup === option.value) return;
              currentState = {
                ...currentState,
                subgroup: option.value,
                page: 1
              };
              if (hasLocalBrowse) {
                applyBrowseState({ updateLocation: true });
                return;
              }
              void loadList();
            })
          );
        });
      };

      const renderItems = () => {
        if (currentItems.length === 0) {
          resultListEl.innerHTML = '';
          emptyEl.hidden = false;
          return;
        }

        emptyEl.hidden = true;
        resultListEl.innerHTML = currentItems
          .map((item, index) => {
            const overlayMeta = getCardOverlayMetaText(item);

            return `
              <li class="admin-media-browser__item-shell">
                <button
                  class="admin-media-browser__card${selectedPath === item.path ? ' admin-media-browser__card--active' : ''}"
                  type="button"
                  data-path="${escapeHtml(item.path)}"
                  aria-label="${escapeHtml(item.fileName)}"
                  style="--item-index:${index};"
                >
                  <span class="admin-media-browser__thumb">
                    ${item.previewSrc
                ? `<img src="${escapeHtml(item.previewSrc)}" alt="" loading="lazy" decoding="async" />`
                : '<span class="admin-media-browser__thumb-fallback">暂无预览</span>'}
                    ${overlayMeta
                ? `
                        <span class="admin-media-browser__thumb-overlay" aria-hidden="true">
                          <span class="admin-media-browser__thumb-meta">${escapeHtml(overlayMeta)}</span>
                        </span>
                      `
                : ''}
                  </span>
                </button>
              </li>
            `;
          })
          .join('');
      };

      const getRenderedCard = (assetPath: string): HTMLButtonElement | null =>
        Array.from(resultListEl.querySelectorAll<HTMLButtonElement>('[data-path]')).find(
          (button) => button.dataset.path === assetPath
        ) ?? null;

      const syncRenderedSelection = (previousPath: string | null, nextPath: string | null) => {
        if (previousPath) {
          getRenderedCard(previousPath)?.classList.remove('admin-media-browser__card--active');
        }
        if (nextPath) {
          getRenderedCard(nextPath)?.classList.add('admin-media-browser__card--active');
        }
      };

      const syncRenderedCardMeta = (assetPath: string) => {
        const item = currentItems.find((entry) => entry.path === assetPath);
        if (!item) return;

        const card = getRenderedCard(assetPath);
        if (!(card instanceof HTMLButtonElement)) return;

        const thumb = card.querySelector<HTMLElement>('.admin-media-browser__thumb');
        if (!(thumb instanceof HTMLElement)) return;

        const overlayMeta = getCardOverlayMetaText(item);
        const overlay = thumb.querySelector<HTMLElement>('.admin-media-browser__thumb-overlay');
        if (!overlayMeta) {
          overlay?.remove();
          return;
        }

        if (overlay instanceof HTMLElement) {
          const metaEl = overlay.querySelector<HTMLElement>('.admin-media-browser__thumb-meta');
          if (metaEl instanceof HTMLElement) {
            metaEl.textContent = overlayMeta;
            return;
          }
        }

        const nextOverlay = document.createElement('span');
        nextOverlay.className = 'admin-media-browser__thumb-overlay';
        nextOverlay.setAttribute('aria-hidden', 'true');

        const metaEl = document.createElement('span');
        metaEl.className = 'admin-media-browser__thumb-meta';
        metaEl.textContent = overlayMeta;

        nextOverlay.append(metaEl);
        overlay?.remove();
        thumb.append(nextOverlay);
      };

      const renderDetail = () => {
        const item = currentItems.find((entry) => entry.path === selectedPath) ?? null;
        if (!item) {
          detailEl.hidden = true;
          detailEl.innerHTML = '';
          return;
        }

        const detailMeta = detailMetaCache.get(item.path) ?? null;
        const detailError = detailMetaErrors.get(item.path) ?? null;
        const detailLoading = detailMetaPending.has(item.path);

        const dimensionsText = detailMeta?.width && detailMeta.height
          ? `${detailMeta.width} × ${detailMeta.height}`
          : detailLoading ? '正在读取…' : detailError ? '读取失败' : '未读取';
        const sizeText = detailMeta
          ? formatAdminMediaBytes(detailMeta.size)
          : detailLoading ? '正在读取…' : detailError ? '读取失败' : '未读取';
        const typeText = detailMeta?.mimeType
          ?? (detailLoading ? '正在读取…' : detailError ? '读取失败' : '未读取');

        const detailBadges = [
          `<span class="admin-media-browser__badge admin-media-browser__origin-badge" data-origin="${escapeHtml(item.origin)}">${escapeHtml(getOriginBadgeLabel(item.origin))}</span>`,
          item.ownerLabel
            ? `<span class="admin-media-browser__badge">Owner: ${escapeHtml(item.ownerLabel)}</span>`
            : '',
          item.browseSubgroupLabel
            && item.browseSubgroupLabel !== item.ownerLabel
            ? `<span class="admin-media-browser__badge">${escapeHtml(item.browseSubgroupLabel)}</span>`
            : '',
          detailMeta?.size && detailMeta.size >= LARGE_FILE_THRESHOLD
            ? '<span class="admin-media-browser__badge">大文件</span>'
            : ''
        ]
          .filter(Boolean)
          .join('');

        const copyIcon = getIconMarkup('copy');
        const linkIcon = getIconMarkup('link');
        const eyeIcon = getIconMarkup('eye');

        const hasPreferredValue = item.preferredValue && item.preferredValue !== item.path;
        const fieldValue = hasPreferredValue ? item.preferredValue! : item.path;
        const fieldLabel = hasPreferredValue ? '可用值 (field-compatible)' : '文件路径';
        const fieldCopyLabel = hasPreferredValue ? '可用值' : '文件路径';
        const valueFieldMarkup = `
          <div class="admin-media-browser__detail-field">
            <h4 class="admin-media-browser__detail-label">${escapeHtml(fieldLabel)}</h4>
            <div class="admin-media-browser__code-wrapper">
              <code class="admin-media-browser__detail-code">${escapeHtml(fieldValue)}</code>
              <button class="admin-media-copy-btn" type="button" data-action="copy-field-value" title="点击复制" aria-label="复制${escapeHtml(fieldCopyLabel)}">${copyIcon}</button>
            </div>
          </div>
        `;

        const markdownFieldMarkup = `
          <div class="admin-media-browser__detail-field">
            <h4 class="admin-media-browser__detail-label admin-media-browser__detail-label--disabled">Markdown 引用（待开发）</h4>
            <div class="admin-media-browser__code-wrapper admin-media-browser__code-wrapper--disabled">
              <code class="admin-media-browser__detail-code">—</code>
            </div>
          </div>
        `;

        const previewSrc = detailMeta?.previewSrc ?? item.previewSrc;
        const triggerInlineCopyFeedback = (button: HTMLButtonElement, copyLabel: string) => {
          const existingTimer = Number(button.dataset.feedbackTimer ?? '');
          if (Number.isFinite(existingTimer) && existingTimer > 0) {
            window.clearTimeout(existingTimer);
          }

          button.dataset.state = 'copied';
          button.setAttribute('aria-label', `已复制${copyLabel}`);
          button.setAttribute('title', `已复制${copyLabel}`);

          const timer = window.setTimeout(() => {
            if (!button.isConnected) return;
            delete button.dataset.state;
            delete button.dataset.feedbackTimer;
            button.setAttribute('aria-label', `复制${copyLabel}`);
            button.setAttribute('title', '点击复制');
          }, 1100);

          button.dataset.feedbackTimer = String(timer);
        };

        detailEl.hidden = false;
        detailEl.innerHTML = `
          <div class="admin-media-browser__detail-layout">
            <div class="admin-media-browser__detail-media">
              ${previewSrc
            ? `<img src="${escapeHtml(previewSrc)}" alt="${escapeHtml(item.fileName)}" loading="eager" decoding="async" />`
            : '<div class="admin-media-browser__detail-fallback">无预览</div>'}
            </div>

            <div class="admin-media-browser__detail-body">
              <div class="admin-media-browser__detail-header">
                <h3 class="admin-media-browser__detail-title">${escapeHtml(item.fileName)}</h3>
                <div class="admin-media-browser__detail-badges">${detailBadges}</div>
              </div>

              <dl class="admin-media-browser__detail-meta-list">
                <div><dt>Dimensions</dt><dd>${escapeHtml(dimensionsText)}</dd></div>
                <div><dt>Size</dt><dd>${escapeHtml(sizeText)}</dd></div>
                <div><dt>Type</dt><dd>${escapeHtml(typeText)}</dd></div>
              </dl>

              ${valueFieldMarkup}
              ${markdownFieldMarkup}

              <div class="admin-media-browser__detail-actions">
                <button class="admin-btn admin-btn--primary" type="button" data-action="copy-path">
                  ${linkIcon}
                  复制资源路径
                </button>
                ${previewSrc
            ? `<a class="admin-btn admin-btn--ghost" href="${escapeHtml(previewSrc)}" target="_blank" rel="noreferrer">
                      ${eyeIcon}
                      浏览器新标签中打开
                    </a>`
            : ''}
              </div>
            </div>
          </div>
        `;

        detailEl.querySelector<HTMLButtonElement>('[data-action="copy-path"]')?.addEventListener('click', async () => {
          try {
            await copyText(item.path);
            setStatus('ok', '已复制资源路径');
          } catch (error) {
            setStatus('error', error instanceof Error ? error.message : '复制资源路径失败');
          }
        });

        detailEl.querySelector<HTMLButtonElement>('[data-action="copy-field-value"]')?.addEventListener('click', async (event) => {
          const button = event.currentTarget instanceof HTMLButtonElement ? event.currentTarget : null;
          try {
            await copyText(fieldValue);
            setStatus('ok', `已复制${fieldCopyLabel}`);
            if (button) {
              triggerInlineCopyFeedback(button, fieldCopyLabel);
            }
          } catch (error) {
            setStatus('error', error instanceof Error ? error.message : `复制${fieldCopyLabel}失败`);
          }
        });
      };

      const focusSearchInput = (select = false) => {
        window.requestAnimationFrame(() => {
          queryInput.focus();
          if (select) {
            queryInput.select();
          }
        });
      };

      const syncControls = () => {
        const searchVisible = searchOpen;

        queryInput.value = draftQuery;
        queryInput.disabled = busy;
        queryInput.tabIndex = searchVisible ? 0 : -1;
        searchToggleBtn.disabled = busy;
        searchPanelEl.dataset.open = searchVisible ? 'true' : 'false';
        searchPanelEl.setAttribute('aria-hidden', searchVisible ? 'false' : 'true');
        searchToggleBtn.dataset.active = searchVisible ? 'true' : 'false';
        searchToggleBtn.setAttribute('aria-expanded', searchVisible ? 'true' : 'false');
        recentBtn.disabled = busy || !hasLocalBrowse;
        recentBtn.textContent = currentState.scope === 'recent' ? '返回分类' : ADMIN_MEDIA_SCOPE_LABELS.recent;
        recentBtn.setAttribute('aria-pressed', currentState.scope === 'recent' ? 'true' : 'false');
        refreshBtn.disabled = busy;
        prevBtn.disabled = busy || currentState.page <= 1;
        nextBtn.disabled = busy || currentState.page >= currentTotalPages;
        formEl.dataset.busy = busy ? 'true' : 'false';
        resultListEl.dataset.busy = busy ? 'true' : 'false';
        renderGroupButtons();
        renderSubgroupButtons();
      };

      const submitCurrentState = () => {
        const nextQuery = draftQuery.trim();
        currentState = {
          ...currentState,
          query: nextQuery,
          page: 1
        };
        draftQuery = nextQuery;
        searchOpen = nextQuery.length > 0;
        if (currentState.scope) {
          applyScopeState({ updateLocation: true });
          return;
        }
        if (hasLocalBrowse) {
          applyBrowseState({ updateLocation: true });
          return;
        }
        void loadList();
      };

      const clearCurrentSearch = () => {
        draftQuery = '';
        currentState = {
          ...currentState,
          query: '',
          page: 1
        };
        searchOpen = false;
        if (currentState.scope) {
          applyScopeState({ updateLocation: true });
          return;
        }
        if (hasLocalBrowse) {
          applyBrowseState({ updateLocation: true });
          return;
        }
        void loadList();
      };

      const syncSummary = () => {
        pageMetaEl.textContent = `第 ${currentState.page} / ${currentTotalPages} 页`;
      };

      const syncSelection = () => {
        if (selectedPath && currentItems.some((item) => item.path === selectedPath)) {
          return;
        }
        selectedPath = currentItems[0]?.path ?? null;
      };

      const ensureDetailMeta = (assetPath: string | null) => {
        if (!assetPath || detailMetaCache.has(assetPath) || detailMetaPending.has(assetPath)) {
          return;
        }

        detailMetaErrors.delete(assetPath);
        detailMetaPending.add(assetPath);
        if (selectedPath === assetPath) {
          renderDetail();
        }

        void fetchMetaByPath(bootstrap.metaEndpoint, assetPath)
          .then((meta) => {
            detailMetaCache.set(assetPath, meta);
            detailMetaErrors.delete(assetPath);
          })
          .catch((error) => {
            const message = error instanceof Error ? error.message : '媒体信息读取失败';
            detailMetaErrors.set(assetPath, message);
            if (selectedPath === assetPath) {
              setStatus('warn', message);
            }
          })
          .finally(() => {
            detailMetaPending.delete(assetPath);
            if (currentItems.some((item) => item.path === assetPath)) {
              syncRenderedCardMeta(assetPath);
            }
            if (selectedPath === assetPath) {
              renderDetail();
            }
          });
      };

      const applyListResult = (result: AdminMediaListResponse, { updateLocation }: { updateLocation: boolean }) => {
        currentTotalPages = result.totalPages;
        currentTotalCount = result.totalCount;
        currentGroupOptions = result.groupOptions;
        currentSubgroupOptions = result.subgroupOptions;
        currentItems = result.items.map((item) => {
          detailMetaCache.set(item.path, toCachedMeta(item));
          detailMetaErrors.delete(item.path);
          return toBrowseItem(item);
        });
        currentState = {
          scope: DEFAULT_SCOPE,
          group: result.group || DEFAULT_GROUP,
          subgroup: result.group === DEFAULT_GROUP ? '' : result.subgroup,
          query: currentState.query.trim(),
          page: result.page
        };
        draftQuery = currentState.query;
        showHiddenGroups = showHiddenGroups || currentState.group === 'uncategorized';
        syncSelection();
        if (updateLocation) {
          updateUrl(currentState);
        }
        syncControls();
        renderItems();
        renderDetail();
        syncSummary();
        ensureDetailMeta(selectedPath);
      };

      const applyScopeState = ({ updateLocation }: { updateLocation: boolean }) => {
        if (!bootstrap.browseIndex || !currentState.scope) return;

        const scopePool = buildAdminMediaScopeItems(currentState.scope, bootstrap.browseIndex, bootstrap.scopeIndex)
          .filter((item) => matchesAdminMediaQuery(item, currentState.query));
        const scopePage = paginateAdminMediaItems({
          items: scopePool,
          page: currentState.page,
          limit: PAGE_SIZE
        });

        currentTotalCount = scopePage.totalCount;
        currentGroupOptions = buildAdminMediaBrowseGroupOptions(scopePool);
        currentSubgroupOptions = [];
        currentTotalPages = scopePage.totalPages;
        currentItems = scopePage.items;
        currentState = {
          ...currentState,
          query: currentState.query.trim(),
          page: scopePage.page
        };
        draftQuery = currentState.query;
        syncSelection();
        if (updateLocation) {
          updateUrl(currentState);
        }
        syncControls();
        renderItems();
        renderDetail();
        syncSummary();
        ensureDetailMeta(selectedPath);
        setStatus('ok', scopePool.length > 0 ? `已加载最近修改中的 ${scopePool.length} 张图片` : '最近修改中没有符合条件的图片', false);
      };

      const applyBrowseState = ({ updateLocation }: { updateLocation: boolean }) => {
        if (!bootstrap.browseIndex) return;

        const browsePage = resolveAdminMediaBrowsePage({
          items: bootstrap.browseIndex,
          group: currentState.group,
          subgroup: currentState.subgroup,
          query: currentState.query,
          page: currentState.page,
          limit: PAGE_SIZE
        });

        currentGroupOptions = browsePage.groupOptions;
        currentSubgroupOptions = browsePage.subgroupOptions;
        currentTotalCount = browsePage.totalCount;
        currentTotalPages = browsePage.totalPages;
        currentItems = browsePage.items;
        currentState = {
          scope: DEFAULT_SCOPE,
          group: browsePage.activeGroup,
          subgroup: browsePage.activeGroup === DEFAULT_GROUP ? '' : browsePage.activeSubgroup,
          query: browsePage.query,
          page: browsePage.page
        };
        draftQuery = currentState.query;
        showHiddenGroups = showHiddenGroups || currentState.group === 'uncategorized';
        syncSelection();
        if (updateLocation) {
          updateUrl(currentState);
        }
        syncControls();
        renderItems();
        renderDetail();
        syncSummary();
        ensureDetailMeta(selectedPath);
        setStatus('ok', browsePage.totalCount > 0 ? `已匹配 ${browsePage.totalCount} 张图片` : '没有找到符合条件的图片', false);
      };

      const loadList = async () => {
        const token = ++requestToken;
        busy = true;
        syncControls();
        setStatus('loading', '正在加载图片...', false);

        try {
          const result = await fetchList(bootstrap.listEndpoint, currentState);
          if (token !== requestToken) return;

          applyListResult(result, { updateLocation: true });
          setStatus('ok', result.totalCount > 0 ? `已加载 ${result.totalCount} 张图片` : '没有找到符合条件的图片', false);
        } catch (error) {
          if (token !== requestToken) return;
          currentItems = [];
          selectedPath = null;
          currentTotalPages = 1;
          currentGroupOptions = [];
          currentSubgroupOptions = [];
          renderGroupButtons();
          renderSubgroupButtons();
          renderItems();
          renderDetail();
          syncSummary();
          setStatus('error', error instanceof Error ? error.message : '媒体列表读取失败');
        } finally {
          if (token === requestToken) {
            busy = false;
            syncControls();
          }
        }
      };

      formEl.addEventListener('submit', (event) => {
        event.preventDefault();
        if (busy) return;
        submitCurrentState();
      });

      queryInput.addEventListener('input', () => {
        draftQuery = queryInput.value;
      });

      searchToggleBtn.addEventListener('click', () => {
        if (busy) return;
        const draft = draftQuery.trim();
        const committed = currentState.query.trim();

        if (!searchOpen) {
          searchOpen = true;
          syncControls();
          focusSearchInput(true);
          return;
        }

        if (!draft && committed) {
          clearCurrentSearch();
          return;
        }

        if (draft !== committed) {
          submitCurrentState();
          return;
        }

        if (committed) {
          focusSearchInput(true);
          return;
        }

        searchOpen = false;
        syncControls();
        searchToggleBtn.focus();
      });

      queryInput.addEventListener('search', () => {
        if (busy) return;
        formEl.requestSubmit();
      });

      queryInput.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || busy) return;
        if (draftQuery.trim() || currentState.query.trim()) {
          event.preventDefault();
          clearCurrentSearch();
          return;
        }
        event.preventDefault();
        searchOpen = false;
        syncControls();
        searchToggleBtn.focus();
      });

      refreshBtn.addEventListener('click', () => {
        if (busy) return;
        navigateToRefresh({ resetState: true });
      });

      recentBtn.addEventListener('click', () => {
        if (busy || !hasLocalBrowse) return;
        currentState = {
          ...currentState,
          scope: currentState.scope === 'recent' ? DEFAULT_SCOPE : 'recent',
          page: 1
        };
        if (currentState.scope === 'recent') {
          applyScopeState({ updateLocation: true });
          return;
        }
        applyBrowseState({ updateLocation: true });
      });

      showUncategorizedBtn.addEventListener('click', () => {
        if (busy) return;
        if (currentState.group === 'uncategorized') {
          showHiddenGroups = false;
          currentState = {
            scope: DEFAULT_SCOPE,
            group: DEFAULT_GROUP,
            subgroup: '',
            query: currentState.query,
            page: 1
          };
          if (hasLocalBrowse) {
            applyBrowseState({ updateLocation: true });
            return;
          }
          void loadList();
          return;
        }

        showHiddenGroups = !showHiddenGroups;
        renderGroupButtons();
      });

      resultListEl.addEventListener('click', (event) => {
        if (busy) return;
        const target = event.target instanceof HTMLElement ? event.target.closest<HTMLButtonElement>('[data-path]') : null;
        const nextPath = target?.dataset.path?.trim() ?? '';
        if (!nextPath || nextPath === selectedPath) return;
        const previousPath = selectedPath;
        selectedPath = nextPath;
        syncRenderedSelection(previousPath, selectedPath);
        renderDetail();
        ensureDetailMeta(selectedPath);
      });

      prevBtn.addEventListener('click', () => {
        if (busy || currentState.page <= 1) return;
        currentState = {
          ...currentState,
          page: currentState.page - 1
        };
        if (currentState.scope) {
          applyScopeState({ updateLocation: true });
          return;
        }
        if (hasLocalBrowse) {
          applyBrowseState({ updateLocation: true });
          return;
        }
        void loadList();
      });

      nextBtn.addEventListener('click', () => {
        if (busy || currentState.page >= currentTotalPages) return;
        currentState = {
          ...currentState,
          page: currentState.page + 1
        };
        if (currentState.scope) {
          applyScopeState({ updateLocation: true });
          return;
        }
        if (hasLocalBrowse) {
          applyBrowseState({ updateLocation: true });
          return;
        }
        void loadList();
      });

      if (hasLocalBrowse) {
        syncControls();
        if (currentState.scope) {
          applyScopeState({ updateLocation: false });
        } else {
          applyBrowseState({ updateLocation: false });
        }
        if (bootstrap.didRefresh) {
          const resetToDefaultView = currentState.scope === DEFAULT_SCOPE
            && currentState.group === DEFAULT_GROUP
            && currentState.subgroup.length === 0
            && currentState.query.trim().length === 0
            && currentState.page === 1;
          updateUrl(currentState);
          setStatus(
            'ok',
            resetToDefaultView
              ? (currentTotalCount > 0 ? `媒体库已刷新，已返回全部资源（共 ${currentTotalCount} 张图片）` : '媒体库已刷新，已返回全部资源')
              : (currentTotalCount > 0 ? `媒体库已刷新，当前共 ${currentTotalCount} 张图片` : '媒体库已刷新')
          );
        }
      } else {
        syncControls();
        syncSummary();
        void loadList();
      }
    }
  }
}
