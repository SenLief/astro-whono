import {
  fetchAdminMediaJson,
  formatAdminMediaMetaSummary,
  parseAdminMediaListResponse,
  parseAdminMediaMetaResponse,
  type AdminMediaClientItem,
  type AdminMediaClientMeta
} from './media-client';

export type AdminMediaPickerField =
  | 'bits.images'
  | 'home.heroImageSrc'
  | 'page.bits.defaultAuthor.avatar';

type AdminMediaPickerOpenOptions = {
  field: AdminMediaPickerField;
  title: string;
  description?: string;
  query?: string;
  onSelect: (item: AdminMediaClientItem) => void;
};

export type AdminMediaPickerController = {
  open: (options: AdminMediaPickerOpenOptions) => void;
  close: () => void;
  readMeta: (options: {
    field: AdminMediaPickerField;
    value?: string;
    path?: string;
  }) => Promise<AdminMediaClientMeta>;
};

export const createAdminMediaPicker = (root: ParentNode = document): AdminMediaPickerController | null => {
  const dialog = root.querySelector<HTMLDialogElement>('[data-admin-media-picker]');
  if (!(dialog instanceof HTMLDialogElement)) return null;

  const listEndpoint = dialog.dataset.listEndpoint?.trim() ?? '';
  const metaEndpoint = dialog.dataset.metaEndpoint?.trim() ?? '';
  if (!listEndpoint || !metaEndpoint) return null;

  const titleEl = dialog.querySelector<HTMLElement>('[data-admin-media-picker-title]');
  const descriptionEl = dialog.querySelector<HTMLElement>('[data-admin-media-picker-description]');
  const queryInput = dialog.querySelector<HTMLInputElement>('[data-admin-media-picker-query]');
  const statusEl = dialog.querySelector<HTMLElement>('[data-admin-media-picker-status]');
  const resultsEl = dialog.querySelector<HTMLElement>('[data-admin-media-picker-results]');
  const pageEl = dialog.querySelector<HTMLElement>('[data-admin-media-picker-page]');
  const prevBtn = dialog.querySelector<HTMLButtonElement>('[data-admin-media-picker-prev]');
  const nextBtn = dialog.querySelector<HTMLButtonElement>('[data-admin-media-picker-next]');
  const closeBtn = dialog.querySelector<HTMLButtonElement>('[data-admin-media-picker-close]');
  if (
    !(titleEl instanceof HTMLElement)
    || !(descriptionEl instanceof HTMLElement)
    || !(queryInput instanceof HTMLInputElement)
    || !(statusEl instanceof HTMLElement)
    || !(resultsEl instanceof HTMLElement)
    || !(pageEl instanceof HTMLElement)
    || !(prevBtn instanceof HTMLButtonElement)
    || !(nextBtn instanceof HTMLButtonElement)
    || !(closeBtn instanceof HTMLButtonElement)
  ) {
    return null;
  }

  let currentOptions: AdminMediaPickerOpenOptions | null = null;
  let currentPage = 1;
  let totalPages = 1;
  let requestToken = 0;
  let searchTimer = 0;

  const syncPager = () => {
    pageEl.textContent = `第 ${currentPage} / ${totalPages} 页`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
  };

  const setStatus = (text: string) => {
    statusEl.textContent = text;
  };

  const renderItems = (items: readonly AdminMediaClientItem[], totalCount: number) => {
    resultsEl.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('li');
      empty.className = 'admin-media-picker__empty';
      empty.textContent = '没有匹配到可选图片。';
      resultsEl.appendChild(empty);
      setStatus(totalCount > 0 ? '当前页没有结果' : '没有匹配结果');
      return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      const row = document.createElement('li');
      row.className = 'admin-media-picker__item';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'admin-media-picker__item-button';
      button.addEventListener('click', () => {
        currentOptions?.onSelect(item);
        dialog.close();
      });

      const media = document.createElement('span');
      media.className = 'admin-media-picker__thumb';
      if (item.previewSrc) {
        const image = document.createElement('img');
        image.src = item.previewSrc;
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';
        media.appendChild(image);
      } else {
        const fallback = document.createElement('span');
        fallback.textContent = item.origin;
        media.appendChild(fallback);
      }

      const copy = document.createElement('span');
      copy.className = 'admin-media-picker__item-copy';

      const pathEl = document.createElement('span');
      pathEl.className = 'admin-media-picker__item-path';
      pathEl.textContent = item.value;

      const metaEl = document.createElement('span');
      metaEl.className = 'admin-media-picker__item-meta';
      metaEl.textContent = formatAdminMediaMetaSummary({
        kind: 'local',
        origin: item.origin,
        width: item.width,
        height: item.height,
        size: item.size
      });

      copy.append(pathEl, metaEl);
      button.append(media, copy);
      row.appendChild(button);
      fragment.appendChild(row);
    });

    resultsEl.appendChild(fragment);
    setStatus(`共 ${totalCount} 个可选文件`);
  };

  const loadList = async () => {
    if (!currentOptions) return;

    const token = ++requestToken;
    setStatus('正在加载媒体列表...');
    resultsEl.replaceChildren();

    const params = new URLSearchParams({
      field: currentOptions.field,
      page: String(currentPage),
      limit: '24'
    });
    const query = queryInput.value.trim();
    if (query) params.set('q', query);

    try {
      const payload = await fetchAdminMediaJson(`${listEndpoint}?${params.toString()}`, '媒体列表请求失败');
      if (token !== requestToken) return;

      const result = parseAdminMediaListResponse(payload);
      currentPage = result.page;
      totalPages = result.totalPages;
      syncPager();
      renderItems(result.items, result.totalCount);
    } catch (error) {
      if (token !== requestToken) return;
      totalPages = 1;
      syncPager();
      resultsEl.replaceChildren();
      setStatus(error instanceof Error ? error.message : '媒体列表加载失败');
    }
  };

  const close = () => {
    if (dialog.open) dialog.close();
  };

  const open = (options: AdminMediaPickerOpenOptions) => {
    currentOptions = options;
    currentPage = 1;
    totalPages = 1;
    titleEl.textContent = options.title;

    const description = options.description?.trim() ?? '';
    descriptionEl.textContent = description;
    descriptionEl.hidden = !description;

    queryInput.value = options.query?.trim() ?? '';
    syncPager();
    if (!dialog.open) dialog.showModal();
    void loadList();
    window.setTimeout(() => {
      queryInput.focus();
      queryInput.select();
    }, 0);
  };

  const readMeta = async ({
    field,
    value,
    path
  }: {
    field: AdminMediaPickerField;
    value?: string;
    path?: string;
  }): Promise<AdminMediaClientMeta> => {
    const params = new URLSearchParams();
    if (path?.trim()) {
      params.set('path', path.trim());
    } else {
      params.set('field', field);
      params.set('value', value?.trim() ?? '');
    }
    const payload = await fetchAdminMediaJson(`${metaEndpoint}?${params.toString()}`, '媒体元数据请求失败');
    return parseAdminMediaMetaResponse(payload);
  };

  closeBtn.addEventListener('click', close);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });

  queryInput.addEventListener('input', () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      currentPage = 1;
      void loadList();
    }, 180);
  });

  prevBtn.addEventListener('click', () => {
    if (currentPage <= 1) return;
    currentPage -= 1;
    void loadList();
  });

  nextBtn.addEventListener('click', () => {
    if (currentPage >= totalPages) return;
    currentPage += 1;
    void loadList();
  });

  syncPager();

  return {
    open,
    close,
    readMeta
  };
};
