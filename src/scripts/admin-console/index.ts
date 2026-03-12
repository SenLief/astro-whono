import type {
  HomeIntroLinkKey,
  SidebarDividerVariant,
  SidebarNavId,
  SiteSocialIconKey,
  SiteSocialPresetId,
  ThemeSettingsEditablePayload
} from '@/lib/theme-settings';
import {
  ADMIN_SOCIAL_ORDER_MAX,
  ADMIN_SOCIAL_ORDER_MIN,
  ADMIN_EMAIL_RE,
  ADMIN_FOOTER_COPYRIGHT_MAX_LENGTH,
  ADMIN_FOOTER_START_YEAR_MIN,
  ADMIN_GITHUB_HOSTS,
  ADMIN_HERO_IMAGE_ALT_DEFAULT,
  ADMIN_HERO_IMAGE_ALT_MAX_LENGTH,
  ADMIN_HERO_PRESET_SET,
  ADMIN_HOME_INTRO_LINK_DEFAULT,
  ADMIN_HOME_INTRO_LINK_LIMIT,
  ADMIN_HOME_INTRO_LINK_OPTIONS,
  ADMIN_HOME_INTRO_MAX_LENGTH,
  ADMIN_LOCALE_RE,
  ADMIN_NAV_IDS,
  ADMIN_NAV_ORNAMENT_DEFAULT,
  ADMIN_NAV_ORNAMENT_MAX_LENGTH,
  ADMIN_PAGE_TITLE_MAX_LENGTH,
  ADMIN_PAGE_SUBTITLE_MAX_LENGTH,
  ADMIN_SIDEBAR_DIVIDER_DEFAULT,
  ADMIN_SOCIAL_CUSTOM_LIMIT,
  ADMIN_SOCIAL_PRESET_IDS,
  ADMIN_SOCIAL_PRESET_ORDER_DEFAULT,
  ADMIN_X_HOSTS,
  getAdminSocialOrderIssues,
  getAdminFooterStartYearMax,
  isAdminHomeIntroLinkKey,
  isAdminSidebarDividerVariant,
  isAdminAllowedHttpsUrl,
  isAdminHeroPresetId,
  isAdminNavId,
  isAdminSocialIconKey,
  isAdminSocialPresetId,
  normalizeAdminSocialIconKey,
  normalizeAdminHeroImageSrc
} from '@/lib/admin-console/shared';

type EditableSettings = ThemeSettingsEditablePayload['settings'];
type RequiredElements<T extends Record<string, Element | null>> = { [K in keyof T]: NonNullable<T[K]> };
type EditableCustomSocialItem = EditableSettings['site']['socialLinks']['custom'][number];
type EditableNavItem = EditableSettings['shell']['nav'][number];
type SocialPresetOrder = Record<SiteSocialPresetId, number>;
type LoadSource = 'bootstrap' | 'remote';
type LooseRecord = Record<string, unknown>;
type ValidationIssue = {
  message: string;
  focusTarget?: () => HTMLElement | null;
};

const root = document.querySelector<HTMLElement>('[data-admin-root]');

if (!root) {
  // Current page does not use admin console.
} else {
  const byId = <T extends Element>(id: string): T | null => document.getElementById(id) as T | null;
  const query = <T extends Element>(parent: ParentNode, selector: string): T | null =>
    parent.querySelector(selector) as T | null;
  const queryAll = <T extends Element>(parent: ParentNode, selector: string): T[] =>
    Array.from(parent.querySelectorAll(selector)) as T[];
  const ensureElements = <T extends Record<string, Element | null>>(elements: T): RequiredElements<T> | null => {
    if (Object.values(elements).some((element) => element === null)) return null;
    return elements as RequiredElements<T>;
  };
  const isRecord = (value: unknown): value is LooseRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  const endpoint = root.getAttribute('data-settings-endpoint') || '/api/admin/settings/';
  const footerStartYearMax = getAdminFooterStartYearMax();

  const controls = ensureElements({
    form: byId<HTMLFormElement>('admin-form'),
    adminActions: byId<HTMLElement>('admin-actions'),
    adminActionsSentinel: byId<HTMLElement>('admin-actions-sentinel'),
    statusLiveEl: byId<HTMLElement>('admin-status-live'),
    statusEl: byId<HTMLElement>('admin-status'),
    statusInlineEl: byId<HTMLElement>('admin-status-inline'),
    dirtyBanner: byId<HTMLElement>('admin-dirty-banner'),
    errorBanner: byId<HTMLElement>('admin-error-banner'),
    validateBtn: byId<HTMLButtonElement>('admin-validate'),
    resetBtn: byId<HTMLButtonElement>('admin-reset'),
    saveBtn: byId<HTMLButtonElement>('admin-save'),
    bootstrapEl: byId<HTMLScriptElement>('admin-bootstrap'),
    footerPreviewValueEl: byId<HTMLElement>('site-footer-preview-value'),
    socialCustomList: byId<HTMLElement>('site-social-custom-list'),
    socialCustomHead: byId<HTMLElement>('site-social-custom-head'),
    socialCustomCountEl: byId<HTMLElement>('site-social-custom-count'),
    socialCustomAddBtn: byId<HTMLButtonElement>('site-social-custom-add'),
    socialCustomTemplate: byId<HTMLTemplateElement>('site-social-custom-row-template'),
    inputSiteTitle: byId<HTMLInputElement>('site-title'),
    inputSiteDescription: byId<HTMLTextAreaElement>('site-description'),
    inputSiteDefaultLocale: byId<HTMLInputElement>('site-default-locale'),
    inputSiteFooterStartYear: byId<HTMLInputElement>('site-footer-start-year'),
    inputSiteFooterShowCurrentYear: byId<HTMLInputElement>('site-footer-show-current-year'),
    inputSiteFooterCopyright: byId<HTMLInputElement>('site-footer-copyright'),
    inputSiteSocialGithubOrder: byId<HTMLInputElement>('site-social-github-order'),
    inputSiteSocialGithub: byId<HTMLInputElement>('site-social-github'),
    inputSiteSocialXOrder: byId<HTMLInputElement>('site-social-x-order'),
    inputSiteSocialX: byId<HTMLInputElement>('site-social-x'),
    inputSiteSocialEmailOrder: byId<HTMLInputElement>('site-social-email-order'),
    inputSiteSocialEmail: byId<HTMLInputElement>('site-social-email'),
    inputShellBrandTitle: byId<HTMLInputElement>('shell-brand-title'),
    inputShellQuote: byId<HTMLTextAreaElement>('shell-quote'),
    inputHomeShowIntroLead: byId<HTMLInputElement>('home-show-intro-lead'),
    inputHomeShowIntroMore: byId<HTMLInputElement>('home-show-intro-more'),
    inputHomeIntroLead: byId<HTMLTextAreaElement>('home-intro-lead'),
    inputHomeIntroMore: byId<HTMLTextAreaElement>('home-intro-more'),
    homeIntroMorePreviewEl: byId<HTMLElement>('home-intro-more-preview'),
    inputHomeIntroMoreLinkPrimary: byId<HTMLSelectElement>('home-intro-more-link-primary'),
    inputHomeIntroMoreLinkSecondaryEnabled: byId<HTMLInputElement>('home-intro-more-link-secondary-enabled'),
    homeIntroMoreLinkSecondaryGroupEl: byId<HTMLElement>('home-intro-more-link-secondary-group'),
    inputHomeIntroMoreLinkSecondary: byId<HTMLSelectElement>('home-intro-more-link-secondary'),
    inputPageEssayTitle: byId<HTMLInputElement>('page-essay-title'),
    inputPageEssaySubtitle: byId<HTMLInputElement>('page-essay-subtitle'),
    inputPageArchiveTitle: byId<HTMLInputElement>('page-archive-title'),
    inputPageArchiveSubtitle: byId<HTMLInputElement>('page-archive-subtitle'),
    inputPageBitsTitle: byId<HTMLInputElement>('page-bits-title'),
    inputPageBitsSubtitle: byId<HTMLInputElement>('page-bits-subtitle'),
    inputPageMemoTitle: byId<HTMLInputElement>('page-memo-title'),
    inputPageMemoSubtitle: byId<HTMLInputElement>('page-memo-subtitle'),
    inputPageAboutTitle: byId<HTMLInputElement>('page-about-title'),
    inputPageAboutSubtitle: byId<HTMLInputElement>('page-about-subtitle'),
    inputPageBitsAuthorName: byId<HTMLInputElement>('page-bits-author-name'),
    inputPageBitsAuthorAvatar: byId<HTMLInputElement>('page-bits-author-avatar'),
    inputHomeShowHero: byId<HTMLInputElement>('home-show-hero'),
    inputHeroImageSrc: byId<HTMLInputElement>('home-hero-image-src'),
    inputHeroImageAlt: byId<HTMLInputElement>('home-hero-image-alt'),
    inputCodeLineNumbers: byId<HTMLInputElement>('ui-code-line-numbers'),
    inputReadingEntry: byId<HTMLInputElement>('ui-reading-entry'),
    inputSidebarDividerDefault: byId<HTMLInputElement>('ui-layout-sidebar-divider-default'),
    inputSidebarDividerSubtle: byId<HTMLInputElement>('ui-layout-sidebar-divider-subtle'),
    inputSidebarDividerNone: byId<HTMLInputElement>('ui-layout-sidebar-divider-none')
  });

  if (!controls) {
    // Required controls are missing.
  } else {
    const {
      form,
      adminActions,
      adminActionsSentinel,
      statusLiveEl,
      statusEl,
      statusInlineEl,
      dirtyBanner,
      errorBanner,
      validateBtn,
      resetBtn,
      saveBtn,
      bootstrapEl,
      footerPreviewValueEl,
      socialCustomList,
      socialCustomHead,
      socialCustomCountEl,
      socialCustomAddBtn,
      socialCustomTemplate,
      inputSiteTitle,
      inputSiteDescription,
      inputSiteDefaultLocale,
      inputSiteFooterStartYear,
      inputSiteFooterShowCurrentYear,
      inputSiteFooterCopyright,
      inputSiteSocialGithubOrder,
      inputSiteSocialGithub,
      inputSiteSocialXOrder,
      inputSiteSocialX,
      inputSiteSocialEmailOrder,
      inputSiteSocialEmail,
      inputShellBrandTitle,
      inputShellQuote,
      inputHomeShowIntroLead,
      inputHomeShowIntroMore,
      inputHomeIntroLead,
      inputHomeIntroMore,
      homeIntroMorePreviewEl,
      inputHomeIntroMoreLinkPrimary,
      inputHomeIntroMoreLinkSecondaryEnabled,
      homeIntroMoreLinkSecondaryGroupEl,
      inputHomeIntroMoreLinkSecondary,
      inputPageEssayTitle,
      inputPageEssaySubtitle,
      inputPageArchiveTitle,
      inputPageArchiveSubtitle,
      inputPageBitsTitle,
      inputPageBitsSubtitle,
      inputPageMemoTitle,
      inputPageMemoSubtitle,
      inputPageAboutTitle,
      inputPageAboutSubtitle,
      inputPageBitsAuthorName,
      inputPageBitsAuthorAvatar,
      inputHomeShowHero,
      inputHeroImageSrc,
      inputHeroImageAlt,
      inputCodeLineNumbers,
      inputReadingEntry,
      inputSidebarDividerDefault,
      inputSidebarDividerSubtle,
      inputSidebarDividerNone
    } = controls;

    const getNavRows = (): HTMLElement[] => queryAll<HTMLElement>(root, '[data-nav-id]');
    const getPresetRows = (): HTMLElement[] => queryAll<HTMLElement>(socialCustomList, '[data-social-preset-row]');
    const getCustomRows = (): HTMLElement[] => queryAll<HTMLElement>(socialCustomList, '[data-social-custom-row]');
    const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
    const fallbackCustomSocialIconKey: SiteSocialIconKey = 'website';
    const customSocialOptionElements = queryAll<HTMLOptionElement>(
      socialCustomTemplate.content,
      '[data-social-custom-field="iconKey"] option'
    );
    const customSocialIconOrder = Array.from(
      new Set(
        customSocialOptionElements.map(
          (option) => normalizeAdminSocialIconKey(option.value) ?? fallbackCustomSocialIconKey
        )
      )
    ) as SiteSocialIconKey[];
    const defaultCustomSocialIconKey: SiteSocialIconKey =
      customSocialIconOrder[0] ?? fallbackCustomSocialIconKey;
    const customSocialIconKeys = new Set<SiteSocialIconKey>(
      customSocialOptionElements.map((option) => {
        return normalizeAdminSocialIconKey(option.value) ?? defaultCustomSocialIconKey;
      })
    );
    const customSocialIconLabels = new Map<SiteSocialIconKey, string>(
      customSocialOptionElements.map((option) => {
        const value = normalizeAdminSocialIconKey(option.value) ?? defaultCustomSocialIconKey;
        const label =
          option.getAttribute('data-social-default-label')?.trim() || option.textContent?.trim() || '链接';
        return [value, label];
      })
    );
    const getDefaultCustomSocialLabel = (iconKey: SiteSocialIconKey): string =>
      customSocialIconLabels.get(iconKey)
      || customSocialIconLabels.get(fallbackCustomSocialIconKey)
      || customSocialIconLabels.get(defaultCustomSocialIconKey)
      || '链接';
    const isEditableCustomLabelIconKey = (iconKey: SiteSocialIconKey): boolean =>
      iconKey === fallbackCustomSocialIconKey;

    const getPresetRowId = (row: Element | null): SiteSocialPresetId => {
      const value = row?.getAttribute('data-social-preset-id')?.trim() ?? 'github';
      return isAdminSocialPresetId(value) ? value : 'github';
    };

    const normalizeMultiline = (value: string): string => value.replace(/\r\n/g, '\n');
    const normalizeOptionalSingleLine = (value: string): string | null => {
      const normalized = normalizeMultiline(value).trim();
      return normalized || null;
    };
    const normalizeNavOrnament = (value: unknown): string | null => {
      if (value === null) return null;
      if (typeof value !== 'string') return ADMIN_NAV_ORNAMENT_DEFAULT;
      const normalized = normalizeMultiline(value).trim();
      return normalized || null;
    };
    const normalizeEmail = (value: string): string => value.replace(/^mailto:/i, '').trim();
    const parseOrder = (value: string | number | null | undefined, fallback: number): number => {
      const next = Number.parseInt(String(value ?? '').trim(), 10);
      return Number.isFinite(next) ? next : fallback;
    };
    const parseInteger = (value: string | number | null | undefined): number | null => {
      const next = Number.parseInt(String(value ?? '').trim(), 10);
      return Number.isFinite(next) ? next : null;
    };
    const normalizeTrimmed = (value: unknown): string => String(value ?? '').trim();
    const normalizeHeroImageSrc = (value: unknown): string | null => {
      const rawValue = normalizeTrimmed(value);
      if (!rawValue) return null;
      return normalizeAdminHeroImageSrc(rawValue) ?? rawValue;
    };
    const normalizeHeroImageAlt = (value: unknown): string => {
      const rawValue = normalizeTrimmed(value);
      return rawValue || ADMIN_HERO_IMAGE_ALT_DEFAULT;
    };
    const normalizeCustomSocialLabel = (value: unknown, iconKey: SiteSocialIconKey): string => {
      if (!isEditableCustomLabelIconKey(iconKey)) {
        return getDefaultCustomSocialLabel(iconKey);
      }
      const normalized = normalizeTrimmed(value);
      return normalized || getDefaultCustomSocialLabel(iconKey);
    };
    const getDisplayCustomSocialLabel = (value: unknown, iconKey: SiteSocialIconKey): string => {
      const normalized = normalizeTrimmed(value);
      if (!isEditableCustomLabelIconKey(iconKey)) {
        return normalized || getDefaultCustomSocialLabel(iconKey);
      }
      const defaultLabel = getDefaultCustomSocialLabel(iconKey);
      return normalized && normalized !== defaultLabel ? normalized : '';
    };
    const defaultHomeIntroLinks = [...ADMIN_HOME_INTRO_LINK_DEFAULT] as HomeIntroLinkKey[];
    const defaultPrimaryHomeIntroLink: HomeIntroLinkKey = ADMIN_HOME_INTRO_LINK_DEFAULT[0];
    const defaultSecondaryHomeIntroLink: HomeIntroLinkKey = ADMIN_HOME_INTRO_LINK_DEFAULT[1];
    const getFallbackSecondaryIntroLink = (primary: HomeIntroLinkKey): HomeIntroLinkKey =>
      defaultHomeIntroLinks.find((link) => link !== primary)
      || ADMIN_HOME_INTRO_LINK_OPTIONS.find((option) => option.id !== primary)?.id
      || defaultSecondaryHomeIntroLink
      || primary;
    const normalizeHomeIntroLinks = (value: unknown): HomeIntroLinkKey[] => {
      if (!Array.isArray(value)) return [...defaultHomeIntroLinks];

      const normalized: HomeIntroLinkKey[] = [];
      const seen = new Set<HomeIntroLinkKey>();

      value.forEach((item) => {
        const rawValue = normalizeTrimmed(item);
        if (!rawValue || !isAdminHomeIntroLinkKey(rawValue)) return;
        const linkKey = rawValue as HomeIntroLinkKey;
        if (seen.has(linkKey) || normalized.length >= ADMIN_HOME_INTRO_LINK_LIMIT) return;
        normalized.push(linkKey);
        seen.add(linkKey);
      });

      return normalized.length ? normalized : [...defaultHomeIntroLinks];
    };
    const getSelectedHomeIntroLink = (selectEl: HTMLSelectElement, fallback: HomeIntroLinkKey): HomeIntroLinkKey => {
      const rawValue = selectEl.value.trim();
      return isAdminHomeIntroLinkKey(rawValue) ? rawValue : fallback;
    };
    const HOME_INTRO_PREVIEW_EMPTY = '无首页补充导语';
    const getHomeIntroLinkLabel = (linkKey: HomeIntroLinkKey): string =>
      ADMIN_HOME_INTRO_LINK_OPTIONS.find((option) => option.id === linkKey)?.label || '链接';
    const getHomeIntroPreviewText = (): string => {
      if (!inputHomeShowIntroMore.checked) {
        return HOME_INTRO_PREVIEW_EMPTY;
      }
      const introText = normalizeMultiline(inputHomeIntroMore.value).trim() || '……';
      const [primary, secondary] = collectHomeIntroLinks();
      const primaryLabel = getHomeIntroLinkLabel(primary || defaultPrimaryHomeIntroLink);
      if (!secondary) {
        return `${introText} ${primaryLabel}。`;
      }
      const secondaryLabel = getHomeIntroLinkLabel(secondary);
      return `${introText} ${primaryLabel} 或 ${secondaryLabel}。`;
    };
    const refreshHomeIntroPreview = (): void => {
      homeIntroMorePreviewEl.textContent = getHomeIntroPreviewText();
    };
    const syncHomeIntroLinkControls = (): void => {
      const primary = getSelectedHomeIntroLink(inputHomeIntroMoreLinkPrimary, defaultPrimaryHomeIntroLink);
      const hasSecondary = Boolean(inputHomeIntroMoreLinkSecondaryEnabled.checked);
      inputHomeIntroMoreLinkSecondary.disabled = !hasSecondary;
      homeIntroMoreLinkSecondaryGroupEl.setAttribute('aria-disabled', String(!hasSecondary));

      if (hasSecondary) {
        const secondary = getSelectedHomeIntroLink(
          inputHomeIntroMoreLinkSecondary,
          getFallbackSecondaryIntroLink(primary)
        );

        if (secondary === primary) {
          inputHomeIntroMoreLinkSecondary.value = getFallbackSecondaryIntroLink(primary);
        }
      }

      refreshHomeIntroPreview();
    };
    const collectHomeIntroLinks = (): HomeIntroLinkKey[] => {
      const primary = getSelectedHomeIntroLink(inputHomeIntroMoreLinkPrimary, defaultPrimaryHomeIntroLink);
      if (!inputHomeIntroMoreLinkSecondaryEnabled.checked) {
        return [primary];
      }

      const secondary = getSelectedHomeIntroLink(
        inputHomeIntroMoreLinkSecondary,
        getFallbackSecondaryIntroLink(primary)
      );

      return secondary !== primary ? [primary, secondary] : [primary];
    };
    const syncHeroControls = (): void => {
      const isHidden = !inputHomeShowHero.checked;
      inputHeroImageSrc.disabled = isHidden;
      inputHeroImageAlt.disabled = isHidden;
    };
    const getSelectedSidebarDividerVariant = (): SidebarDividerVariant => {
      if (inputSidebarDividerSubtle.checked) return 'subtle';
      if (inputSidebarDividerNone.checked) return 'none';
      return ADMIN_SIDEBAR_DIVIDER_DEFAULT;
    };
    const applySidebarDividerVariant = (value: SidebarDividerVariant): void => {
      inputSidebarDividerDefault.checked = value === 'default';
      inputSidebarDividerSubtle.checked = value === 'subtle';
      inputSidebarDividerNone.checked = value === 'none';
    };

    const getPresetOrderInputs = (): Record<SiteSocialPresetId, HTMLInputElement> => ({
      github: inputSiteSocialGithubOrder,
      x: inputSiteSocialXOrder,
      email: inputSiteSocialEmailOrder
    });
    const getPresetSocialOrder = (): SocialPresetOrder => {
      const inputs = getPresetOrderInputs();
      return {
        github: parseOrder(inputs.github.value, ADMIN_SOCIAL_PRESET_ORDER_DEFAULT.github),
        x: parseOrder(inputs.x.value, ADMIN_SOCIAL_PRESET_ORDER_DEFAULT.x),
        email: parseOrder(inputs.email.value, ADMIN_SOCIAL_PRESET_ORDER_DEFAULT.email)
      };
    };

    let baseline: EditableSettings | null = null;
    let isDirty = false;
    let isSaving = false;
    let isAdminActionsNearViewport = false;
    const statusTargets = [statusEl, statusInlineEl];

    const createIssue = (message: string, focusTarget?: () => HTMLElement | null): ValidationIssue =>
      focusTarget ? { message, focusTarget } : { message };
    const resolveIssueField = (issue: ValidationIssue): HTMLElement | null => {
      const candidate = issue.focusTarget?.();
      return candidate instanceof HTMLElement ? candidate : null;
    };
    const clearInvalidFields = (): void => {
      queryAll<HTMLElement>(form, '[aria-invalid="true"]')
        .forEach((element) => element.removeAttribute('aria-invalid'));
    };
    const markInvalidFields = (issues: readonly ValidationIssue[]): void => {
      clearInvalidFields();
      const seen = new Set<HTMLElement>();
      issues.forEach((issue) => {
        const field = resolveIssueField(issue);
        if (!field || seen.has(field)) return;
        field.setAttribute('aria-invalid', 'true');
        seen.add(field);
      });
    };
    const scrollIntoViewWithOffset = (element: HTMLElement): void => {
      const top = element.getBoundingClientRect().top + window.scrollY - 24;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    };
    const revealErrorState = (issues: readonly ValidationIssue[] = []): void => {
      const firstField = issues
        .map((issue) => resolveIssueField(issue))
        .find((field): field is HTMLElement => field !== null);

      scrollIntoViewWithOffset(errorBanner);
      window.requestAnimationFrame(() => {
        if (!firstField) {
          errorBanner.focus({ preventScroll: true });
          return;
        }
        firstField.focus({ preventScroll: true });
        const { top, bottom } = firstField.getBoundingClientRect();
        if (top < 96 || bottom > window.innerHeight - 24) {
          scrollIntoViewWithOffset(firstField);
        }
      });
    };
    const getPresetFieldTarget = (id: SiteSocialPresetId, field: 'order' | 'href') => (): HTMLElement | null => {
      const row = getPresetRows().find((currentRow) => getPresetRowId(currentRow) === id) ?? null;
      return row ? query<HTMLElement>(row, `[data-social-preset-field="${field}"]`) : null;
    };
    const getCustomFieldTarget = (
      index: number,
      field: 'order' | 'iconKey' | 'id' | 'label' | 'href'
    ) => (): HTMLElement | null => {
      const row = getCustomRows()[index] ?? null;
      return row ? query<HTMLElement>(row, `[data-social-custom-field="${field}"]`) : null;
    };
    const getCustomVisibilityTarget = (index: number): (() => HTMLElement | null) => () => {
      const row = getCustomRows()[index] ?? null;
      return row ? query<HTMLElement>(row, '[data-social-custom-action="toggle-visible"]') : null;
    };
    const getNavFieldTarget = (
      id: SidebarNavId,
      field: 'label' | 'ornament' | 'order' | 'visible'
    ): (() => HTMLElement | null) => () => {
      const row = query<HTMLElement>(root, `[data-nav-id="${id}"]`);
      return row ? query<HTMLElement>(row, `[data-nav-field="${field}"]`) : null;
    };
    const getFirstNavLabelTarget = (): (() => HTMLElement | null) => () => {
      const firstNavId = ADMIN_NAV_IDS[0];
      return firstNavId ? getNavFieldTarget(firstNavId, 'label')() : null;
    };

    const STATUS_WAITING_SAVE = '等待保存';
    const STATUS_CLEAN = '当前配置无未保存更改';

    const setStatus = (state: string, message: string, options: { announce?: boolean } = {}): void => {
      const currentState = statusEl.dataset.state ?? '';
      const currentMessage = statusEl.textContent?.trim() || '';
      if (currentState !== state || currentMessage !== message) {
        statusTargets.forEach((target) => {
          target.dataset.state = state;
          target.textContent = message;
        });
      }

      if (options.announce === false) return;

      const liveState = statusLiveEl.dataset.state ?? '';
      const liveMessage = statusLiveEl.textContent?.trim() || '';
      if (liveState === state && liveMessage === message) return;
      statusLiveEl.dataset.state = state;
      statusLiveEl.textContent = message;
    };
    const syncDirtyStatus = (next: boolean): void => {
      const currentState = statusEl.dataset.state;
      const currentMessage = statusEl.textContent?.trim() || '';

      if (next) {
        if ((currentState === 'ready' || currentState === 'ok') && currentMessage !== STATUS_WAITING_SAVE) {
          setStatus('ready', STATUS_WAITING_SAVE);
        }
        return;
      }

      if (currentState === 'ready' && currentMessage === STATUS_WAITING_SAVE) {
        setStatus('ready', STATUS_CLEAN);
      }
    };

    const setErrors = (errors: string[]): void => {
      if (!errors.length) {
        errorBanner.hidden = true;
        errorBanner.textContent = '';
        return;
      }
      errorBanner.hidden = false;
      errorBanner.textContent = errors.join('；');
    };

    const setDirty = (next: boolean): void => {
      isDirty = next;
      dirtyBanner.hidden = !next;
      adminActions.dataset.dirty = String(next);
      adminActions.dataset.sticky = String(next && !isAdminActionsNearViewport);
      syncDirtyStatus(next);
    };

    const setSaving = (next: boolean): void => {
      isSaving = next;
      saveBtn.disabled = next;
      saveBtn.textContent = next ? '保存中...' : '保存';
    };
    const setValidationIssues = (issues: readonly ValidationIssue[]): void => {
      markInvalidFields(issues);
      setErrors(issues.map((issue) => issue.message));
    };

    const getFooterPreviewText = (): string => {
      const startYear = parseInteger(inputSiteFooterStartYear.value);
      const showCurrentYear = Boolean(inputSiteFooterShowCurrentYear.checked);
      const yearRange = showCurrentYear && startYear && startYear < footerStartYearMax
        ? `${startYear}-${footerStartYearMax}`
        : String(startYear || footerStartYearMax);
      const copyright = inputSiteFooterCopyright.value.trim() || 'Whono · Theme Demo · by cxro';
      return `页脚预览：© ${yearRange} ${copyright}`;
    };

    const refreshFooterPreview = (): void => {
      footerPreviewValueEl.textContent = getFooterPreviewText().replace(/^页脚预览：/, '').trim();
    };
    const syncFooterYearControls = (): void => {
      const footerYearRangeEl = inputSiteFooterShowCurrentYear.closest<HTMLElement>('.admin-year-range');
      if (!footerYearRangeEl) return;
      footerYearRangeEl.dataset.currentYearEnabled = String(Boolean(inputSiteFooterShowCurrentYear.checked));
    };

    const getCustomRowIconKey = (row: Element | null): SiteSocialIconKey => {
      const select = row ? query<HTMLSelectElement>(row, '[data-social-custom-field="iconKey"]') : null;
      const value = normalizeAdminSocialIconKey(select?.value);
      return value && customSocialIconKeys.has(value) ? value : defaultCustomSocialIconKey;
    };
    const getNextDefaultCustomSocialIconKey = (): SiteSocialIconKey => {
      const usedIconKeys = new Set(getCustomRows().map((row) => getCustomRowIconKey(row)));
      return customSocialIconOrder.find((iconKey) => !usedIconKeys.has(iconKey)) || defaultCustomSocialIconKey;
    };
    const getCustomRowLabelInput = (row: Element | null): HTMLInputElement | null =>
      row ? query<HTMLInputElement>(row, '[data-social-custom-field="label"]') : null;
    const getCustomRowLabelField = (row: Element | null): HTMLElement | null =>
      row ? query<HTMLElement>(row, '.admin-social-link-label') : null;

    const getPresetRowHrefInput = (row: Element | null): HTMLInputElement | null =>
      row ? query<HTMLInputElement>(row, '[data-social-preset-field="href"]') : null;
    const getPresetRowOrderInput = (row: Element | null): HTMLInputElement | null =>
      row ? query<HTMLInputElement>(row, '[data-social-preset-field="order"]') : null;
    const isPresetRowVisible = (row: Element | null): boolean => {
      const hrefInput = getPresetRowHrefInput(row);
      return hrefInput instanceof HTMLInputElement && hrefInput.value.trim().length > 0;
    };

    const syncPresetRow = (row: Element | null): void => {
      if (!row) return;
      const toggleBtn = query<HTMLButtonElement>(row, '[data-social-preset-action="toggle-visible"]');
      if (!(toggleBtn instanceof HTMLButtonElement)) return;

      const presetId = getPresetRowId(row);
      const label = presetId === 'x' ? 'X' : presetId === 'email' ? 'Email' : 'GitHub';
      const visible = isPresetRowVisible(row);
      toggleBtn.dataset.state = visible ? 'visible' : 'hidden';
      toggleBtn.setAttribute('aria-pressed', visible ? 'true' : 'false');
      toggleBtn.setAttribute('aria-label', visible ? `隐藏 ${label}` : `恢复 ${label}`);
      toggleBtn.setAttribute('title', visible ? `隐藏 ${label}` : `恢复 ${label}`);
    };

    const normalizeSocialOrders = (): void => {
      type SocialOrderItem = {
        row: HTMLElement;
        type: 'preset' | 'custom';
        visible: boolean;
        order: number;
        tie: number;
      };

      const presetRows = getPresetRows();
      const customRows = getCustomRows();
      const items: SocialOrderItem[] = [
        ...presetRows.map((row, index) => ({
          row,
          type: 'preset' as const,
          visible: isPresetRowVisible(row),
          order: parseOrder(
            getPresetRowOrderInput(row)?.value || '',
            ADMIN_SOCIAL_PRESET_ORDER_DEFAULT[getPresetRowId(row)]
          ),
          tie: index
        })),
        ...customRows.map((row, index) => ({
          row,
          type: 'custom' as const,
          visible: Boolean(query<HTMLInputElement>(row, '[data-social-custom-field="visible"]')?.checked),
          order: parseOrder(query<HTMLInputElement>(row, '[data-social-custom-field="order"]')?.value || '', index + 1),
          tie: presetRows.length + index
        }))
      ];

      const orderedItems = [
        ...items.filter((item) => item.visible).sort((a, b) => a.order - b.order || a.tie - b.tie),
        ...items.filter((item) => !item.visible).sort((a, b) => a.order - b.order || a.tie - b.tie)
      ];

      orderedItems.forEach((item, index) => {
        const nextValue = String(index + 1);
        if (item.type === 'preset') {
          const orderInput = getPresetRowOrderInput(item.row);
          if (orderInput instanceof HTMLInputElement) orderInput.value = nextValue;
        } else {
          const orderInput = query<HTMLInputElement>(item.row, '[data-social-custom-field="order"]');
          if (orderInput instanceof HTMLInputElement) orderInput.value = nextValue;
        }
      });
    };

    const slugifyIdPart = (value: unknown): string => {
      const slug = String(value ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      return slug || 'link';
    };

    const getCustomIdValues = (exceptRow?: Element | null): Set<string> =>
      new Set(
        getCustomRows()
          .filter((row) => row !== exceptRow)
          .map((row) => query<HTMLInputElement>(row, '[data-social-custom-field="id"]')?.value.trim() || '')
          .filter(Boolean)
      );

    const generateCustomId = (
      row: Element | null,
      iconKey: SiteSocialIconKey = getCustomRowIconKey(row)
    ): string => {
      const existingIds = getCustomIdValues(row);
      const base = `custom-${slugifyIdPart(iconKey)}`;
      let candidate = base;
      let suffix = 2;

      while (existingIds.has(candidate)) {
        candidate = `${base}-${suffix}`;
        suffix += 1;
      }

      return candidate;
    };

    const getStoredGeneratedCustomId = (row: HTMLElement | null): string => row?.dataset.generatedId?.trim() || '';
    const getStoredGeneratedCustomLabel = (row: HTMLElement | null): string =>
      row?.dataset.generatedLabel?.trim() || '';

    const applyGeneratedCustomId = (row: HTMLElement | null, nextId: string): void => {
      const idInput = row ? query<HTMLInputElement>(row, '[data-social-custom-field="id"]') : null;
      if (!(idInput instanceof HTMLInputElement) || !row) return;

      idInput.value = nextId;
      row.dataset.generatedId = nextId;
      row.dataset.idManual = 'false';
    };
    const applyGeneratedCustomLabel = (row: HTMLElement | null, nextLabel: string): void => {
      const labelInput = getCustomRowLabelInput(row);
      if (!(labelInput instanceof HTMLInputElement) || !row) return;

      labelInput.value = getDisplayCustomSocialLabel(nextLabel, getCustomRowIconKey(row));
      row.dataset.generatedLabel = nextLabel;
      row.dataset.labelManual = 'false';
    };

    const shouldAutoSyncCustomId = (row: HTMLElement | null): boolean => {
      const idInput = row ? query<HTMLInputElement>(row, '[data-social-custom-field="id"]') : null;
      if (!(idInput instanceof HTMLInputElement) || !row) return false;

      const trimmed = idInput.value.trim();
      const generatedId = getStoredGeneratedCustomId(row);
      return row.dataset.idManual !== 'true' || !trimmed || Boolean(generatedId && trimmed === generatedId);
    };
    const shouldAutoSyncCustomLabel = (row: HTMLElement | null): boolean => {
      const labelInput = getCustomRowLabelInput(row);
      if (!(labelInput instanceof HTMLInputElement) || !row) return false;

      const trimmed = labelInput.value.trim();
      const generatedLabel = getStoredGeneratedCustomLabel(row);
      return row.dataset.labelManual !== 'true' || !trimmed || Boolean(generatedLabel && trimmed === generatedLabel);
    };

    const getNextSocialOrder = (): number => {
      const presetOrders = Object.values(getPresetSocialOrder());
      const customOrders = getCustomRows()
        .map((row) => parseInteger(query<HTMLInputElement>(row, '[data-social-custom-field="order"]')?.value))
        .filter((value): value is number => value != null);
      const orders = [...presetOrders, ...customOrders];
      return orders.length ? Math.max(...orders) + 1 : 1;
    };

    const syncCustomIconPreview = (row: HTMLElement): void => {
      const iconKey = getCustomRowIconKey(row);
      queryAll<HTMLElement>(row, '[data-social-custom-icon-option]').forEach((node) => {
        const active = node.getAttribute('data-social-custom-icon-option') === iconKey;
        node.hidden = !active;
      });
    };

    const syncCustomVisibilityButton = (row: HTMLElement): void => {
      const visibleInput = query<HTMLInputElement>(row, '[data-social-custom-field="visible"]');
      const toggleBtn = query<HTMLButtonElement>(row, '[data-social-custom-action="toggle-visible"]');
      const toggleLabel = query<HTMLElement>(row, '[data-social-custom-visible-label]');
      if (
        !(visibleInput instanceof HTMLInputElement) ||
        !(toggleBtn instanceof HTMLButtonElement) ||
        !(toggleLabel instanceof HTMLElement)
      ) {
        return;
      }

      const visible = Boolean(visibleInput.checked);
      toggleBtn.dataset.state = visible ? 'visible' : 'hidden';
      toggleBtn.setAttribute('aria-pressed', visible ? 'true' : 'false');
      toggleBtn.setAttribute('aria-label', visible ? '隐藏链接' : '显示链接');
      toggleBtn.setAttribute('title', visible ? '隐藏链接' : '显示链接');
      toggleLabel.textContent = visible ? '隐藏链接' : '显示链接';
    };

    const finalizeCustomIdInput = (
      row: HTMLElement,
      options: { regenerateIfEmpty?: boolean } = {}
    ): void => {
      const { regenerateIfEmpty = true } = options;
      const idInput = query<HTMLInputElement>(row, '[data-social-custom-field="id"]');
      if (!(idInput instanceof HTMLInputElement)) return;

      const trimmed = idInput.value.trim();
      const generatedId = getStoredGeneratedCustomId(row);
      if (!trimmed && regenerateIfEmpty) {
        applyGeneratedCustomId(row, generateCustomId(row));
      } else {
        idInput.value = trimmed;
        row.dataset.idManual = trimmed && trimmed !== generatedId ? 'true' : 'false';
      }
    };

    const finalizeCustomLabelInput = (
      row: HTMLElement,
      options: { regenerateIfEmpty?: boolean } = {}
    ): void => {
      const { regenerateIfEmpty = true } = options;
      const labelInput = getCustomRowLabelInput(row);
      if (!(labelInput instanceof HTMLInputElement)) return;

      const trimmed = labelInput.value.trim();
      const nextGeneratedLabel = getDefaultCustomSocialLabel(getCustomRowIconKey(row));
      const generatedLabel = getStoredGeneratedCustomLabel(row) || nextGeneratedLabel;
      row.dataset.generatedLabel = nextGeneratedLabel;
      if (!trimmed && regenerateIfEmpty) {
        applyGeneratedCustomLabel(row, nextGeneratedLabel);
      } else {
        labelInput.value = getDisplayCustomSocialLabel(trimmed, getCustomRowIconKey(row));
        row.dataset.labelManual = trimmed && trimmed !== generatedLabel ? 'true' : 'false';
      }
    };

    const syncCustomLabelField = (
      row: HTMLElement,
      options: { syncValue?: boolean } = {}
    ): void => {
      const { syncValue = false } = options;
      const labelField = getCustomRowLabelField(row);
      const iconKey = getCustomRowIconKey(row);
      const editable = isEditableCustomLabelIconKey(iconKey);
      row.dataset.customLabelVisible = String(editable);
      if (labelField instanceof HTMLElement) {
        labelField.hidden = !editable;
      }

      if (!editable) {
        applyGeneratedCustomLabel(row, getDefaultCustomSocialLabel(iconKey));
        return;
      }

      if (syncValue) {
        const nextGeneratedLabel = getDefaultCustomSocialLabel(iconKey);
        if (shouldAutoSyncCustomLabel(row)) {
          applyGeneratedCustomLabel(row, nextGeneratedLabel);
        } else {
          row.dataset.generatedLabel = nextGeneratedLabel;
        }
      }
    };

    const syncCustomRow = (row: HTMLElement, options: { syncId?: boolean; syncLabel?: boolean } = {}): void => {
      const { syncId = false, syncLabel = false } = options;
      const idInput = query<HTMLInputElement>(row, '[data-social-custom-field="id"]');
      if (!(idInput instanceof HTMLInputElement)) return;
      const iconKey = getCustomRowIconKey(row);

      if (syncId && shouldAutoSyncCustomId(row)) {
        applyGeneratedCustomId(row, generateCustomId(row, iconKey));
      }

      syncCustomLabelField(row, { syncValue: syncLabel });

      syncCustomIconPreview(row);
      syncCustomVisibilityButton(row);
    };

    const updateCustomRowsUi = (): void => {
      const rows = getCustomRows();
      socialCustomHead.hidden = false;
      socialCustomCountEl.textContent = `(新增 ${rows.length} / ${ADMIN_SOCIAL_CUSTOM_LIMIT})`;
      socialCustomAddBtn.disabled = rows.length >= ADMIN_SOCIAL_CUSTOM_LIMIT;
    };

    const createCustomRow = (
      item: Partial<EditableCustomSocialItem> | null | undefined,
      index: number,
      options: { manualId?: boolean } = {}
    ): HTMLElement | null => {
      const { manualId = false } = options;
      const fragment = socialCustomTemplate.content.cloneNode(true) as DocumentFragment;
      const row = query<HTMLElement>(fragment, '[data-social-custom-row]');
      if (!(row instanceof HTMLElement)) return null;

      const idInput = query<HTMLInputElement>(row, '[data-social-custom-field="id"]');
      const labelInput = getCustomRowLabelInput(row);
      const hrefInput = query<HTMLInputElement>(row, '[data-social-custom-field="href"]');
      const iconInput = query<HTMLSelectElement>(row, '[data-social-custom-field="iconKey"]');
      const orderInput = query<HTMLInputElement>(row, '[data-social-custom-field="order"]');
      const visibleInput = query<HTMLInputElement>(row, '[data-social-custom-field="visible"]');

      if (
        !(idInput instanceof HTMLInputElement) ||
        !(labelInput instanceof HTMLInputElement) ||
        !(hrefInput instanceof HTMLInputElement) ||
        !(iconInput instanceof HTMLSelectElement) ||
        !(orderInput instanceof HTMLInputElement) ||
        !(visibleInput instanceof HTMLInputElement)
      ) {
        return null;
      }

      row.dataset.idManual = manualId ? 'true' : 'false';
      const initialIconKey =
        typeof item?.iconKey === 'string'
          ? normalizeAdminSocialIconKey(item.iconKey) ?? fallbackCustomSocialIconKey
          : getNextDefaultCustomSocialIconKey();
      const initialLabel = normalizeCustomSocialLabel(item?.label, initialIconKey);
      const initialDisplayLabel = getDisplayCustomSocialLabel(initialLabel, initialIconKey);
      idInput.value = item?.id ? String(item.id).trim() : '';
      labelInput.value = initialDisplayLabel;
      hrefInput.value = item?.href ? String(item.href).trim() : '';
      iconInput.value = initialIconKey;
      orderInput.value = String(parseOrder(item?.order, index + 1));
      visibleInput.checked = item?.visible !== false;
      row.dataset.generatedLabel = getDefaultCustomSocialLabel(initialIconKey);
      row.dataset.labelManual =
        isEditableCustomLabelIconKey(initialIconKey)
        && initialDisplayLabel
        && initialLabel !== row.dataset.generatedLabel
          ? 'true'
          : 'false';
      syncCustomRow(row, {
        syncId: !item?.id,
        syncLabel: isEditableCustomLabelIconKey(initialIconKey) && !item?.label
      });
      row.dataset.generatedId = idInput.value.trim();

      return row;
    };

    const replaceCustomRows = (items: EditableCustomSocialItem[]): void => {
      getCustomRows().forEach((row) => row.remove());
      items.forEach((item, index) => {
        const row = createCustomRow(item, index, { manualId: false });
        if (row) socialCustomList.appendChild(row);
      });
      updateCustomRowsUi();
    };

    const canonicalize = (settings: unknown): EditableSettings => {
      type SortableCustomItem = EditableCustomSocialItem & { __index: number };

      const next = isRecord(settings) ? settings : {};
      const site = isRecord(next.site) ? next.site : {};
      const shell = isRecord(next.shell) ? next.shell : {};
      const home = isRecord(next.home) ? next.home : {};
      const page = isRecord(next.page) ? next.page : {};
      const ui = isRecord(next.ui) ? next.ui : {};
      const siteFooter = isRecord(site.footer) ? site.footer : {};
      const socialLinks = isRecord(site.socialLinks) ? site.socialLinks : {};
      const customItems = Array.isArray(socialLinks.custom) ? socialLinks.custom : [];
      const bitsPage = isRecord(page.bits) ? page.bits : {};
      const bitsDefaultAuthor = isRecord(bitsPage.defaultAuthor) ? bitsPage.defaultAuthor : {};

      const normalizedCustom: EditableCustomSocialItem[] = customItems
        .map((item, index) => {
          const record = isRecord(item) ? item : {};
          const iconKey = normalizeAdminSocialIconKey(record.iconKey) ?? defaultCustomSocialIconKey;
          const sortableItem: SortableCustomItem = {
            id: normalizeTrimmed(record.id),
            label: normalizeCustomSocialLabel(record.label, iconKey),
            href: normalizeTrimmed(record.href),
            iconKey,
            visible: Boolean(record.visible),
            order: parseOrder(record.order as string | number | null | undefined, index + 1),
            __index: index
          };
          return sortableItem;
        })
        .sort((a, b) => {
          if (a.order !== b.order) return a.order - b.order;
          const idCompare = a.id.localeCompare(b.id);
          if (idCompare !== 0) return idCompare;
          return a.__index - b.__index;
        })
        .map(({ __index, ...item }) => item);

      const normalizedNav = (Array.isArray(shell.nav) ? shell.nav : [])
        .map((item) => {
          const record = isRecord(item) ? item : null;
          if (!record) return null;
          const id = normalizeTrimmed(record.id);
          if (!isAdminNavId(id)) return null;
          return {
            id,
            label: normalizeTrimmed(record.label),
            ornament: normalizeNavOrnament(record.ornament),
            order: parseOrder(record.order as string | number | null | undefined, ADMIN_NAV_IDS.indexOf(id) + 1),
            visible: Boolean(record.visible)
          };
        })
        .filter((item): item is EditableNavItem => item !== null)
        .sort((a, b) => {
          if (a.order !== b.order) return a.order - b.order;
          return ADMIN_NAV_IDS.indexOf(a.id) - ADMIN_NAV_IDS.indexOf(b.id);
        });

      const rawHeroPresetId = normalizeTrimmed(home.heroPresetId);
      const heroImageSrc = normalizeHeroImageSrc(home.heroImageSrc);
      const heroImageAlt = normalizeHeroImageAlt(home.heroImageAlt);
      const rawPresetOrder = isRecord(socialLinks.presetOrder) ? socialLinks.presetOrder : {};
      const showIntroLead =
        typeof home.showIntroLead === 'boolean' ? home.showIntroLead : true;
      const showIntroMore =
        typeof home.showIntroMore === 'boolean' ? home.showIntroMore : true;
      const introMoreLinks = normalizeHomeIntroLinks(home.introMoreLinks);
      const rawUiLayout: LooseRecord = isRecord(ui.layout) ? ui.layout : {};
      const rawSidebarDivider = normalizeTrimmed(rawUiLayout.sidebarDivider);

      return {
        site: {
          title: normalizeTrimmed(site.title),
          description: normalizeMultiline(String(site.description ?? '')).trim(),
          defaultLocale: normalizeTrimmed(site.defaultLocale),
          footer: {
            startYear: parseInteger(siteFooter.startYear as string | number | null | undefined) ?? footerStartYearMax,
            showCurrentYear: Boolean(siteFooter.showCurrentYear),
            copyright: normalizeTrimmed(siteFooter.copyright)
          },
          socialLinks: {
            github: normalizeTrimmed(socialLinks.github) || null,
            x: normalizeTrimmed(socialLinks.x) || null,
            email: normalizeEmail(normalizeTrimmed(socialLinks.email)) || null,
            presetOrder: {
              github: parseOrder(rawPresetOrder.github as string | number | null | undefined, ADMIN_SOCIAL_PRESET_ORDER_DEFAULT.github),
              x: parseOrder(rawPresetOrder.x as string | number | null | undefined, ADMIN_SOCIAL_PRESET_ORDER_DEFAULT.x),
              email: parseOrder(rawPresetOrder.email as string | number | null | undefined, ADMIN_SOCIAL_PRESET_ORDER_DEFAULT.email)
            },
            custom: normalizedCustom
          }
        },
        shell: {
          brandTitle: normalizeTrimmed(shell.brandTitle),
          quote: normalizeMultiline(String(shell.quote ?? '')).trim(),
          nav: normalizedNav
        },
        home: {
          introLead: normalizeMultiline(String(home.introLead ?? '')).trim(),
          introMore: normalizeMultiline(String(home.introMore ?? '')).trim(),
          introMoreLinks,
          showIntroLead,
          showIntroMore,
          heroPresetId: isAdminHeroPresetId(rawHeroPresetId) ? rawHeroPresetId : 'default',
          heroImageSrc,
          heroImageAlt
        },
        page: {
          essay: {
            title: normalizeOptionalSingleLine(String(isRecord(page.essay) ? page.essay.title ?? '' : '')),
            subtitle: normalizeOptionalSingleLine(String(isRecord(page.essay) ? page.essay.subtitle ?? '' : ''))
          },
          archive: {
            title: normalizeOptionalSingleLine(String(isRecord(page.archive) ? page.archive.title ?? '' : '')),
            subtitle: normalizeOptionalSingleLine(String(isRecord(page.archive) ? page.archive.subtitle ?? '' : ''))
          },
          bits: {
            title: normalizeOptionalSingleLine(String(bitsPage.title ?? '')),
            subtitle: normalizeOptionalSingleLine(String(bitsPage.subtitle ?? '')),
            defaultAuthor: {
              name: normalizeTrimmed(bitsDefaultAuthor.name),
              avatar: normalizeTrimmed(bitsDefaultAuthor.avatar)
            }
          },
          memo: {
            title: normalizeOptionalSingleLine(String(isRecord(page.memo) ? page.memo.title ?? '' : '')),
            subtitle: normalizeOptionalSingleLine(String(isRecord(page.memo) ? page.memo.subtitle ?? '' : ''))
          },
          about: {
            title: normalizeOptionalSingleLine(String(isRecord(page.about) ? page.about.title ?? '' : '')),
            subtitle: normalizeOptionalSingleLine(String(isRecord(page.about) ? page.about.subtitle ?? '' : ''))
          }
        },
        ui: {
          codeBlock: {
            showLineNumbers: Boolean(isRecord(ui.codeBlock) ? ui.codeBlock.showLineNumbers : false)
          },
          readingMode: {
            showEntry: Boolean(isRecord(ui.readingMode) ? ui.readingMode.showEntry : false)
          },
          layout: {
            sidebarDivider: isAdminSidebarDividerVariant(rawSidebarDivider)
              ? rawSidebarDivider
              : ADMIN_SIDEBAR_DIVIDER_DEFAULT
          }
        }
      };
    };

    const collectSettings = (): EditableSettings => {
      const nav = getNavRows().map((row, index): EditableNavItem => {
        const idRaw = row.getAttribute('data-nav-id')?.trim() ?? '';
        const id = isAdminNavId(idRaw) ? idRaw : ADMIN_NAV_IDS[index] ?? 'essay';
        const labelInput = query<HTMLInputElement>(row, '[data-nav-field="label"]');
        const ornamentInput = query<HTMLInputElement>(row, '[data-nav-field="ornament"]');
        const orderInput = query<HTMLInputElement>(row, '[data-nav-field="order"]');
        const visibleInput = query<HTMLInputElement>(row, '[data-nav-field="visible"]');
        const fallbackOrder = index + 1;
        return {
          id,
          label: labelInput?.value.trim() || '',
          ornament: ornamentInput ? normalizeOptionalSingleLine(ornamentInput.value) : ADMIN_NAV_ORNAMENT_DEFAULT,
          order: parseOrder(orderInput?.value || '', fallbackOrder),
          visible: Boolean(visibleInput?.checked)
        };
      });

      const custom = getCustomRows().map((row, index): EditableCustomSocialItem => {
        const idInput = query<HTMLInputElement>(row, '[data-social-custom-field="id"]');
        const labelInput = getCustomRowLabelInput(row);
        const hrefInput = query<HTMLInputElement>(row, '[data-social-custom-field="href"]');
        const iconInput = query<HTMLSelectElement>(row, '[data-social-custom-field="iconKey"]');
        const orderInput = query<HTMLInputElement>(row, '[data-social-custom-field="order"]');
        const visibleInput = query<HTMLInputElement>(row, '[data-social-custom-field="visible"]');
        const iconKey = normalizeAdminSocialIconKey(iconInput?.value) ?? defaultCustomSocialIconKey;
        return {
          id: idInput?.value.trim() || '',
          label: normalizeCustomSocialLabel(labelInput?.value, iconKey),
          href: hrefInput?.value.trim() || '',
          iconKey,
          order: parseOrder(orderInput?.value || '', index + 1),
          visible: Boolean(visibleInput?.checked)
        };
      });

      return {
        site: {
          title: inputSiteTitle.value.trim(),
          description: normalizeMultiline(inputSiteDescription.value).trim(),
          defaultLocale: inputSiteDefaultLocale.value.trim(),
          footer: {
            startYear: parseInteger(inputSiteFooterStartYear.value) ?? footerStartYearMax,
            showCurrentYear: Boolean(inputSiteFooterShowCurrentYear.checked),
            copyright: inputSiteFooterCopyright.value.trim()
          },
          socialLinks: {
            github: inputSiteSocialGithub.value.trim() || null,
            x: inputSiteSocialX.value.trim() || null,
            email: normalizeEmail(inputSiteSocialEmail.value.trim()) || null,
            presetOrder: getPresetSocialOrder(),
            custom
          }
        },
        shell: {
          brandTitle: inputShellBrandTitle.value.trim(),
          quote: normalizeMultiline(inputShellQuote.value).trim(),
          nav
        },
        home: {
          introLead: normalizeMultiline(inputHomeIntroLead.value).trim(),
          introMore: normalizeMultiline(inputHomeIntroMore.value).trim(),
          introMoreLinks: collectHomeIntroLinks(),
          showIntroLead: Boolean(inputHomeShowIntroLead.checked),
          showIntroMore: Boolean(inputHomeShowIntroMore.checked),
          heroPresetId: inputHomeShowHero.checked ? 'default' : 'none',
          heroImageSrc: normalizeHeroImageSrc(inputHeroImageSrc.value),
          heroImageAlt: normalizeHeroImageAlt(inputHeroImageAlt.value)
        },
        page: {
          essay: {
            title: normalizeOptionalSingleLine(inputPageEssayTitle.value),
            subtitle: normalizeOptionalSingleLine(inputPageEssaySubtitle.value)
          },
          archive: {
            title: normalizeOptionalSingleLine(inputPageArchiveTitle.value),
            subtitle: normalizeOptionalSingleLine(inputPageArchiveSubtitle.value)
          },
          bits: {
            title: normalizeOptionalSingleLine(inputPageBitsTitle.value),
            subtitle: normalizeOptionalSingleLine(inputPageBitsSubtitle.value),
            defaultAuthor: {
              name: inputPageBitsAuthorName.value.trim(),
              avatar: inputPageBitsAuthorAvatar.value.trim()
            }
          },
          memo: {
            title: normalizeOptionalSingleLine(inputPageMemoTitle.value),
            subtitle: normalizeOptionalSingleLine(inputPageMemoSubtitle.value)
          },
          about: {
            title: normalizeOptionalSingleLine(inputPageAboutTitle.value),
            subtitle: normalizeOptionalSingleLine(inputPageAboutSubtitle.value)
          }
        },
        ui: {
          codeBlock: {
            showLineNumbers: Boolean(inputCodeLineNumbers.checked)
          },
          readingMode: {
            showEntry: Boolean(inputReadingEntry.checked)
          },
          layout: {
            sidebarDivider: getSelectedSidebarDividerVariant()
          }
        }
      };
    };

    const applySettings = (settings: EditableSettings): void => {
      inputSiteTitle.value = settings.site.title || '';
      inputSiteDescription.value = settings.site.description || '';
      inputSiteDefaultLocale.value = settings.site.defaultLocale || '';
      inputSiteFooterStartYear.value = String(settings.site.footer?.startYear ?? '');
      inputSiteFooterShowCurrentYear.checked = Boolean(settings.site.footer?.showCurrentYear);
      inputSiteFooterCopyright.value = settings.site.footer?.copyright || '';
      inputSiteSocialGithubOrder.value = String(
        settings.site.socialLinks?.presetOrder?.github ?? ADMIN_SOCIAL_PRESET_ORDER_DEFAULT.github
      );
      inputSiteSocialGithub.value = settings.site.socialLinks?.github || '';
      inputSiteSocialXOrder.value = String(
        settings.site.socialLinks?.presetOrder?.x ?? ADMIN_SOCIAL_PRESET_ORDER_DEFAULT.x
      );
      inputSiteSocialX.value = settings.site.socialLinks?.x || '';
      inputSiteSocialEmailOrder.value = String(
        settings.site.socialLinks?.presetOrder?.email ?? ADMIN_SOCIAL_PRESET_ORDER_DEFAULT.email
      );
      inputSiteSocialEmail.value = settings.site.socialLinks?.email || '';
      getPresetRows().forEach((row) => {
        delete row.dataset.stashedHref;
        delete row.dataset.stashedOrder;
        syncPresetRow(row);
      });
      replaceCustomRows(settings.site.socialLinks?.custom || []);
      normalizeSocialOrders();
      inputShellBrandTitle.value = settings.shell.brandTitle || '';
      inputShellQuote.value = settings.shell.quote || '';
      inputHomeShowIntroLead.checked = settings.home.showIntroLead !== false;
      inputHomeShowIntroMore.checked = settings.home.showIntroMore !== false;
      inputHomeIntroLead.value = settings.home.introLead || '';
      inputHomeIntroMore.value = settings.home.introMore || '';
      const introMoreLinks = normalizeHomeIntroLinks(settings.home.introMoreLinks);
      const primaryIntroLink = introMoreLinks[0] || defaultPrimaryHomeIntroLink;
      inputHomeIntroMoreLinkPrimary.value = primaryIntroLink;
      inputHomeIntroMoreLinkSecondaryEnabled.checked = introMoreLinks.length > 1;
      inputHomeIntroMoreLinkSecondary.value =
        introMoreLinks[1] || getFallbackSecondaryIntroLink(primaryIntroLink);
      syncHomeIntroLinkControls();
      refreshHomeIntroPreview();
      inputPageEssayTitle.value = settings.page.essay?.title || '';
      inputPageEssaySubtitle.value = settings.page.essay?.subtitle || '';
      inputPageArchiveTitle.value = settings.page.archive?.title || '';
      inputPageArchiveSubtitle.value = settings.page.archive?.subtitle || '';
      inputPageBitsTitle.value = settings.page.bits?.title || '';
      inputPageBitsSubtitle.value = settings.page.bits?.subtitle || '';
      inputPageMemoTitle.value = settings.page.memo?.title || '';
      inputPageMemoSubtitle.value = settings.page.memo?.subtitle || '';
      inputPageAboutTitle.value = settings.page.about?.title || '';
      inputPageAboutSubtitle.value = settings.page.about?.subtitle || '';
      inputPageBitsAuthorName.value = settings.page.bits?.defaultAuthor?.name || '';
      inputPageBitsAuthorAvatar.value = settings.page.bits?.defaultAuthor?.avatar || '';
      inputHomeShowHero.checked = (settings.home.heroPresetId || 'default') !== 'none';
      inputHeroImageSrc.value = settings.home.heroImageSrc || '';
      inputHeroImageAlt.value = settings.home.heroImageAlt || ADMIN_HERO_IMAGE_ALT_DEFAULT;
      syncHeroControls();
      syncFooterYearControls();
      inputCodeLineNumbers.checked = Boolean(settings.ui?.codeBlock?.showLineNumbers);
      inputReadingEntry.checked = Boolean(settings.ui?.readingMode?.showEntry);
      applySidebarDividerVariant(settings.ui?.layout?.sidebarDivider || ADMIN_SIDEBAR_DIVIDER_DEFAULT);
      refreshFooterPreview();

      const navMap = new Map<SidebarNavId, EditableNavItem>(settings.shell.nav.map((item) => [item.id, item]));
      getNavRows().forEach((row, index) => {
        const rawId = row.getAttribute('data-nav-id')?.trim() ?? '';
        const id = isAdminNavId(rawId) ? rawId : ADMIN_NAV_IDS[index] ?? 'essay';
        const current = navMap.get(id);
        const labelInput = query<HTMLInputElement>(row, '[data-nav-field="label"]');
        const ornamentInput = query<HTMLInputElement>(row, '[data-nav-field="ornament"]');
        const orderInput = query<HTMLInputElement>(row, '[data-nav-field="order"]');
        const visibleInput = query<HTMLInputElement>(row, '[data-nav-field="visible"]');
        if (labelInput) labelInput.value = current?.label?.trim() || '';
        if (ornamentInput) ornamentInput.value = current?.ornament ?? '';
        if (orderInput) orderInput.value = String(current?.order ?? (index + 1));
        if (visibleInput) visibleInput.checked = Boolean(current?.visible);
      });
    };

    const validateSettings = (settings: EditableSettings): ValidationIssue[] => {
      const issues: ValidationIssue[] = [];
      const pushIssue = (message: string, focusTarget?: () => HTMLElement | null): void => {
        issues.push(createIssue(message, focusTarget));
      };

      if (!settings.site.title) pushIssue('站点标题不能为空', () => inputSiteTitle);
      if (!settings.site.description) pushIssue('站点描述不能为空', () => inputSiteDescription);
      if (!settings.site.defaultLocale) {
        pushIssue('默认语言不能为空', () => inputSiteDefaultLocale);
      } else if (!ADMIN_LOCALE_RE.test(settings.site.defaultLocale)) {
        pushIssue('默认语言格式无效（示例：zh-CN）', () => inputSiteDefaultLocale);
      }

      if (!Number.isInteger(settings.site.footer?.startYear)) {
        pushIssue('页脚起始年份必须是整数', () => inputSiteFooterStartYear);
      } else if (
        settings.site.footer.startYear < ADMIN_FOOTER_START_YEAR_MIN ||
        settings.site.footer.startYear > footerStartYearMax
      ) {
        pushIssue('页脚起始年份超出允许范围', () => inputSiteFooterStartYear);
      }

      if (typeof settings.site.footer?.showCurrentYear !== 'boolean') {
        pushIssue('是否显示当前年必须是布尔值', () => inputSiteFooterShowCurrentYear);
      }

      if (!settings.site.footer?.copyright) {
        pushIssue('页脚版权行不能为空', () => inputSiteFooterCopyright);
      } else if (
        settings.site.footer.copyright.includes('\n') ||
        settings.site.footer.copyright.includes('\r')
      ) {
        pushIssue('页脚版权行只允许单行文本', () => inputSiteFooterCopyright);
      } else if (settings.site.footer.copyright.length > ADMIN_FOOTER_COPYRIGHT_MAX_LENGTH) {
        pushIssue(`页脚版权行不能超过 ${ADMIN_FOOTER_COPYRIGHT_MAX_LENGTH} 个字符`, () => inputSiteFooterCopyright);
      }

      if (
        settings.site.socialLinks?.github &&
        !isAdminAllowedHttpsUrl(settings.site.socialLinks.github, ADMIN_GITHUB_HOSTS)
      ) {
        pushIssue('GitHub 链接只允许 https://github.com/... ', () => inputSiteSocialGithub);
      }
      if (
        settings.site.socialLinks?.x &&
        !isAdminAllowedHttpsUrl(settings.site.socialLinks.x, ADMIN_X_HOSTS)
      ) {
        pushIssue('X / Twitter 链接只允许 https://x.com/... 或 https://twitter.com/... ', () => inputSiteSocialX);
      }
      if (
        settings.site.socialLinks?.email &&
        !ADMIN_EMAIL_RE.test(normalizeEmail(settings.site.socialLinks.email))
      ) {
        pushIssue('Email 必须是合法邮箱地址', () => inputSiteSocialEmail);
      }

      const presetOrder = settings.site.socialLinks.presetOrder;
      const customLinks = Array.isArray(settings.site.socialLinks?.custom) ? settings.site.socialLinks.custom : [];
      const socialOrderIssues = getAdminSocialOrderIssues(
        presetOrder,
        customLinks.map((item, index) => ({
          key: String(index),
          order: item.order
        }))
      );
      const presetOrderIssues = new Map<SiteSocialPresetId, 'range' | 'duplicate'>();
      const customOrderIssues = new Map<number, 'range' | 'duplicate'>();

      socialOrderIssues.forEach((issue) => {
        if (issue.scope === 'preset') {
          if (isAdminSocialPresetId(issue.key)) {
            presetOrderIssues.set(issue.key, issue.type);
          }
          return;
        }

        const index = Number.parseInt(issue.key, 10);
        if (Number.isInteger(index)) {
          customOrderIssues.set(index, issue.type);
        }
      });

      ADMIN_SOCIAL_PRESET_IDS.forEach((id) => {
        const order = presetOrder[id];
        const rowLabel = id === 'github' ? 'GitHub' : id === 'x' ? 'X / Twitter' : 'Email';
        const orderIssue = presetOrderIssues.get(id);
        if (orderIssue === 'range') {
          pushIssue(
            `${rowLabel} 的位置排序必须为 ${ADMIN_SOCIAL_ORDER_MIN}-${ADMIN_SOCIAL_ORDER_MAX} 的整数`,
            getPresetFieldTarget(id, 'order')
          );
          return;
        }
        if (orderIssue === 'duplicate') {
          pushIssue(`社交链接位置排序不能重复：${order}`, getPresetFieldTarget(id, 'order'));
        }
      });

      if (customLinks.length > ADMIN_SOCIAL_CUSTOM_LIMIT) {
        pushIssue(`自定义链接最多只能添加 ${ADMIN_SOCIAL_CUSTOM_LIMIT} 条`, () => socialCustomAddBtn);
      }

      const seenCustomIds = new Set<string>();
      customLinks.forEach((item, index) => {
        const rowLabel = `自定义链接 #${index + 1}`;
        if (!item.id) {
          pushIssue(`${rowLabel} 的 ID 不能为空`, getCustomFieldTarget(index, 'id'));
        } else {
          if (item.id.includes('\n') || item.id.includes('\r')) {
            pushIssue(`${rowLabel} 的 ID 只允许单行文本`, getCustomFieldTarget(index, 'id'));
          }
          if (seenCustomIds.has(item.id)) {
            pushIssue(`自定义链接 ID 重复：${item.id}`, getCustomFieldTarget(index, 'id'));
          }
          seenCustomIds.add(item.id);
        }

        if (!item.label) {
          pushIssue(`${rowLabel} 的显示名称不能为空`, getCustomFieldTarget(index, 'label'));
        } else if (item.label.includes('\n') || item.label.includes('\r')) {
          pushIssue(`${rowLabel} 的显示名称只允许单行文本`, getCustomFieldTarget(index, 'label'));
        }

        if (!item.href || !isAdminAllowedHttpsUrl(item.href)) {
          pushIssue(`${rowLabel} 的链接必须是合法 https:// 地址`, getCustomFieldTarget(index, 'href'));
        }
        if (!isAdminSocialIconKey(item.iconKey)) {
          pushIssue(`${rowLabel} 的图标必须从白名单中选择`, getCustomFieldTarget(index, 'iconKey'));
        }
        const orderIssue = customOrderIssues.get(index);
        if (orderIssue === 'range') {
          pushIssue(
            `${rowLabel} 的位置排序必须为 ${ADMIN_SOCIAL_ORDER_MIN}-${ADMIN_SOCIAL_ORDER_MAX} 的整数`,
            getCustomFieldTarget(index, 'order')
          );
        } else if (orderIssue === 'duplicate') {
          pushIssue(`社交链接位置排序不能重复：${item.order}`, getCustomFieldTarget(index, 'order'));
        }
        if (typeof item.visible !== 'boolean') {
          pushIssue(`${rowLabel} 的 visible 必须是布尔值`, getCustomVisibilityTarget(index));
        }
      });

      if (!settings.shell.brandTitle) pushIssue('侧栏站点名不能为空', () => inputShellBrandTitle);
      if (!settings.shell.quote) pushIssue('侧栏引用文案不能为空', () => inputShellQuote);

      if (!settings.home.introLead) {
        pushIssue('首页导语主文案不能为空', () => inputHomeIntroLead);
      } else if (settings.home.introLead.length > ADMIN_HOME_INTRO_MAX_LENGTH) {
        pushIssue(`首页导语主文案不能超过 ${ADMIN_HOME_INTRO_MAX_LENGTH} 个字符`, () => inputHomeIntroLead);
      }

      if (typeof settings.home.showIntroLead !== 'boolean') {
        pushIssue('首页导语主文案展示开关必须是布尔值', () => inputHomeShowIntroLead);
      }

      if (!settings.home.introMore) {
        pushIssue('首页导语补充文案不能为空', () => inputHomeIntroMore);
      } else if (settings.home.introMore.length > ADMIN_HOME_INTRO_MAX_LENGTH) {
        pushIssue(`首页导语补充文案不能超过 ${ADMIN_HOME_INTRO_MAX_LENGTH} 个字符`, () => inputHomeIntroMore);
      }

      if (typeof settings.home.showIntroMore !== 'boolean') {
        pushIssue('首页导语补充文案展示开关必须是布尔值', () => inputHomeShowIntroMore);
      }

      if (!Array.isArray(settings.home.introMoreLinks)) {
        pushIssue('首页导语补充链接必须是数组', () => inputHomeIntroMoreLinkPrimary);
      } else if (
        settings.home.introMoreLinks.length < 1 ||
        settings.home.introMoreLinks.length > ADMIN_HOME_INTRO_LINK_LIMIT
      ) {
        pushIssue(`首页导语补充链接必须选择 1-${ADMIN_HOME_INTRO_LINK_LIMIT} 个入口`, () => inputHomeIntroMoreLinkPrimary);
      } else {
        const seenHomeIntroLinks = new Set<HomeIntroLinkKey>();
        settings.home.introMoreLinks.forEach((linkKey, index) => {
          if (!isAdminHomeIntroLinkKey(linkKey)) {
            pushIssue(`首页导语补充链接 #${index + 1} 非法：${String(linkKey)}`, () => inputHomeIntroMoreLinkPrimary);
            return;
          }
          if (seenHomeIntroLinks.has(linkKey)) {
            pushIssue(`首页导语补充链接不能重复：${linkKey}`, () => inputHomeIntroMoreLinkPrimary);
            return;
          }
          seenHomeIntroLinks.add(linkKey);
        });
      }

      if (!ADMIN_HERO_PRESET_SET.has(settings.home.heroPresetId)) {
        pushIssue('Hero 展示模式只允许 default/none', () => inputHomeShowHero);
      }

      if (
        settings.home.heroImageSrc !== null &&
        normalizeAdminHeroImageSrc(settings.home.heroImageSrc) === undefined
      ) {
        pushIssue(
          'Hero 图片地址只允许 src/assets/**、public/**（或 / 开头路径）以及 https:// 图片地址',
          () => inputHeroImageSrc
        );
      }

      if (!settings.home.heroImageAlt) {
        pushIssue('Hero 图片说明不能为空', () => inputHeroImageAlt);
      } else if (
        settings.home.heroImageAlt.includes('\n') ||
        settings.home.heroImageAlt.includes('\r')
      ) {
        pushIssue('Hero 图片说明只允许单行文本', () => inputHeroImageAlt);
      } else if (settings.home.heroImageAlt.length > ADMIN_HERO_IMAGE_ALT_MAX_LENGTH) {
        pushIssue(`Hero 图片说明不能超过 ${ADMIN_HERO_IMAGE_ALT_MAX_LENGTH} 个字符`, () => inputHeroImageAlt);
      }

      const pageTitleMap: Array<[string | null, string, () => HTMLElement | null]> = [
        [settings.page.essay?.title, '/essay/ 页面主标题', () => inputPageEssayTitle],
        [settings.page.archive?.title, '/archive/ 页面主标题', () => inputPageArchiveTitle],
        [settings.page.bits?.title, '/bits/ 页面主标题', () => inputPageBitsTitle],
        [settings.page.memo?.title, '/memo/ 页面主标题', () => inputPageMemoTitle],
        [settings.page.about?.title, '/about/ 页面主标题', () => inputPageAboutTitle]
      ];

      pageTitleMap.forEach(([title, label, focusTarget]) => {
        if (title == null) return;
        if (typeof title !== 'string') {
          pushIssue(`${label} 必须是字符串或留空`, focusTarget);
          return;
        }
        if (title.includes('\n') || title.includes('\r')) {
          pushIssue(`${label} 只允许单行文本`, focusTarget);
        }
        if (title.length > ADMIN_PAGE_TITLE_MAX_LENGTH) {
          pushIssue(`${label} 不能超过 ${ADMIN_PAGE_TITLE_MAX_LENGTH} 个字符`, focusTarget);
        }
      });

      const pageSubtitleMap: Array<[string | null, string, () => HTMLElement | null]> = [
        [settings.page.essay?.subtitle, '/essay/ 页面副标题', () => inputPageEssaySubtitle],
        [settings.page.archive?.subtitle, '/archive/ 页面副标题', () => inputPageArchiveSubtitle],
        [settings.page.bits?.subtitle, '/bits/ 页面副标题', () => inputPageBitsSubtitle],
        [settings.page.memo?.subtitle, '/memo/ 页面副标题', () => inputPageMemoSubtitle],
        [settings.page.about?.subtitle, '/about/ 页面副标题', () => inputPageAboutSubtitle]
      ];

      pageSubtitleMap.forEach(([subtitle, label, focusTarget]) => {
        if (subtitle == null) return;
        if (typeof subtitle !== 'string') {
          pushIssue(`${label} 必须是字符串或留空`, focusTarget);
          return;
        }
        if (subtitle.includes('\n') || subtitle.includes('\r')) {
          pushIssue(`${label} 只允许单行文本`, focusTarget);
        }
        if (subtitle.length > ADMIN_PAGE_SUBTITLE_MAX_LENGTH) {
          pushIssue(`${label} 不能超过 ${ADMIN_PAGE_SUBTITLE_MAX_LENGTH} 个字符`, focusTarget);
        }
      });

      if (!settings.page.bits?.defaultAuthor?.name) {
        pushIssue('Bits 默认作者名不能为空', () => inputPageBitsAuthorName);
      }
      if (settings.page.bits?.defaultAuthor?.avatar) {
        if (settings.page.bits.defaultAuthor.avatar.startsWith('/')) {
          pushIssue('Bits 默认头像必须是相对路径，不要以 / 开头', () => inputPageBitsAuthorAvatar);
        }
        if (/^[A-Za-z]+:\/\//.test(settings.page.bits.defaultAuthor.avatar)) {
          pushIssue('Bits 默认头像当前仅允许相对路径，不允许 URL', () => inputPageBitsAuthorAvatar);
        }
      }

      if (!isAdminSidebarDividerVariant(settings.ui?.layout?.sidebarDivider ?? '')) {
        pushIssue('侧栏分隔线只允许 默认 / 弱化 / 隐藏', () => inputSidebarDividerDefault);
      }

      const nav = Array.isArray(settings.shell.nav) ? settings.shell.nav : [];
      if (nav.length !== ADMIN_NAV_IDS.length) {
        pushIssue('Sidebar 导航项数量必须与既有导航一致', getFirstNavLabelTarget());
      }

      const seenIds = new Set<SidebarNavId>();
      const seenOrders = new Set<number>();
      nav.forEach((item) => {
        const navId = isAdminNavId(item.id) ? item.id : null;
        if (!navId) {
          pushIssue(`存在非法导航项 ID：${item.id}`, getFirstNavLabelTarget());
        } else if (seenIds.has(navId)) {
          pushIssue(`导航项 ID 重复：${navId}`, getNavFieldTarget(navId, 'label'));
        }
        if (navId) seenIds.add(navId);

        if (!item.label) {
          pushIssue(
            `导航项 ${item.id} 的显示名称不能为空`,
            navId ? getNavFieldTarget(navId, 'label') : getFirstNavLabelTarget()
          );
        }
        if (item.ornament !== null) {
          if (typeof item.ornament !== 'string') {
            pushIssue(
              `导航项 ${item.id} 的点缀必须是字符串或留空`,
              navId ? getNavFieldTarget(navId, 'ornament') : getFirstNavLabelTarget()
            );
          } else if (item.ornament.includes('\n') || item.ornament.includes('\r')) {
            pushIssue(
              `导航项 ${item.id} 的点缀只允许单行文本`,
              navId ? getNavFieldTarget(navId, 'ornament') : getFirstNavLabelTarget()
            );
          } else if (item.ornament.length > ADMIN_NAV_ORNAMENT_MAX_LENGTH) {
            pushIssue(
              `导航项 ${item.id} 的点缀不能超过 ${ADMIN_NAV_ORNAMENT_MAX_LENGTH} 个字符`,
              navId ? getNavFieldTarget(navId, 'ornament') : getFirstNavLabelTarget()
            );
          }
        }
        if (!Number.isInteger(item.order) || item.order < 1 || item.order > 999) {
          pushIssue(
            `导航项 ${item.id} 的位置排序必须为 1-999 的整数`,
            navId ? getNavFieldTarget(navId, 'order') : getFirstNavLabelTarget()
          );
        }
        if (seenOrders.has(item.order)) {
          pushIssue(
            `位置排序不能重复：${item.order}`,
            navId ? getNavFieldTarget(navId, 'order') : getFirstNavLabelTarget()
          );
        }
        seenOrders.add(item.order);
        if (typeof item.visible !== 'boolean') {
          pushIssue(
            `导航项 ${item.id} 的 visible 必须是布尔值`,
            navId ? getNavFieldTarget(navId, 'visible') : getFirstNavLabelTarget()
          );
        }
      });

      return issues;
    };

    const refreshDirty = (): void => {
      if (!baseline) return;
      const current = canonicalize(collectSettings());
      setDirty(JSON.stringify(current) !== JSON.stringify(baseline));
    };

    const extractSettingsPayload = (payload: unknown): ThemeSettingsEditablePayload | null => {
      if (!isRecord(payload)) return null;
      if (isRecord(payload.settings)) return payload as unknown as ThemeSettingsEditablePayload;

      const nestedPayload = payload.payload;
      if (payload.ok === true && isRecord(nestedPayload) && isRecord(nestedPayload.settings)) {
        return nestedPayload as unknown as ThemeSettingsEditablePayload;
      }
      return null;
    };

    const getPayloadMessage = (payload: unknown): string | null =>
      isRecord(payload) && typeof payload.message === 'string' ? payload.message : null;

    const getPayloadErrors = (payload: unknown): string[] => {
      if (!isRecord(payload) || !Array.isArray(payload.errors)) return [];
      return payload.errors.filter((error): error is string => typeof error === 'string' && error.length > 0);
    };

    const loadPayload = (
      payload: unknown,
      source: LoadSource,
      options: { announceStatus?: boolean } = {}
    ): void => {
      const resolvedPayload = extractSettingsPayload(payload);
      if (!resolvedPayload) {
        clearInvalidFields();
        setStatus('error', '返回数据格式无效');
        return;
      }
      const normalized = canonicalize(resolvedPayload.settings);
      applySettings(normalized);
      baseline = canonicalize(collectSettings());
      clearInvalidFields();
      setErrors([]);
      setDirty(false);
      setStatus(
        'ready',
        source === 'remote' ? '已同步最新配置' : '已载入初始配置',
        { announce: options.announceStatus ?? source === 'remote' }
      );
    };

    const loadBootstrap = (): void => {
      try {
        const payload = JSON.parse(bootstrapEl.textContent || '{}') as unknown;
        loadPayload(payload, 'bootstrap', { announceStatus: false });
      } catch (error) {
        setStatus('error', '初始化数据解析失败');
        console.error(error);
      }
    };

    const loadFromApi = async (): Promise<void> => {
      setStatus('loading', '正在读取 /api/admin/settings', { announce: false });
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store'
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = (await response.json()) as unknown;
        if (!extractSettingsPayload(payload)) {
          throw new Error(getPayloadMessage(payload) || '返回数据格式无效');
        }
        loadPayload(payload, 'remote');
      } catch (error) {
        setStatus('warn', '接口读取失败，继续使用初始配置');
        console.warn(error);
      }
    };

    form.addEventListener('input', (event) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        target.removeAttribute('aria-invalid');
      }
      refreshDirty();
    });
    form.addEventListener('change', (event) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        target.removeAttribute('aria-invalid');
      }
      refreshDirty();
    });
    inputSiteFooterStartYear.addEventListener('input', refreshFooterPreview);
    inputSiteFooterShowCurrentYear.addEventListener('change', () => {
      syncFooterYearControls();
      refreshFooterPreview();
    });
    inputSiteFooterCopyright.addEventListener('input', refreshFooterPreview);
    inputHomeIntroMore.addEventListener('input', refreshHomeIntroPreview);
    inputHomeShowIntroMore.addEventListener('change', refreshHomeIntroPreview);
    inputHomeIntroMoreLinkPrimary.addEventListener('change', () => {
      syncHomeIntroLinkControls();
      refreshDirty();
    });
    inputHomeIntroMoreLinkSecondaryEnabled.addEventListener('change', () => {
      syncHomeIntroLinkControls();
      refreshDirty();
    });
    inputHomeIntroMoreLinkSecondary.addEventListener('change', () => {
      syncHomeIntroLinkControls();
      refreshDirty();
    });
    inputHomeShowHero.addEventListener('change', () => {
      syncHeroControls();
      refreshDirty();
    });

    if ('IntersectionObserver' in window) {
      const adminActionsObserver = new IntersectionObserver(
        (entries) => {
          isAdminActionsNearViewport = entries.some((entry) => entry.isIntersecting);
          adminActions.dataset.sticky = String(isDirty && !isAdminActionsNearViewport);
        },
        {
          root: null,
          threshold: 0,
          rootMargin: '0px 0px -96px 0px'
        }
      );
      adminActionsObserver.observe(adminActionsSentinel);
    }

    socialCustomAddBtn.addEventListener('click', () => {
      if (getCustomRows().length >= ADMIN_SOCIAL_CUSTOM_LIMIT) {
        setStatus('warn', '自定义链接已达到上限');
        return;
      }
      const row = createCustomRow(
        {
          href: '',
          order: getNextSocialOrder(),
          visible: true
        },
        getCustomRows().length,
        { manualId: false }
      );
      if (!row) return;
      socialCustomList.appendChild(row);
      updateCustomRowsUi();
      refreshDirty();
      query<HTMLSelectElement>(row, '[data-social-custom-field="iconKey"]')?.focus();
    });

    socialCustomList.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const presetRow = target.closest('[data-social-preset-row]');
      if (presetRow) {
        if (target.matches('[data-social-preset-field="order"], [data-social-preset-field="href"]')) {
          normalizeSocialOrders();
        }
        syncPresetRow(presetRow);
        return;
      }

      const row = target.closest('[data-social-custom-row]');
      if (!(row instanceof HTMLElement)) return;

      if (target.matches('[data-social-custom-field="iconKey"]')) {
        syncCustomRow(row, { syncId: true, syncLabel: true });
        return;
      }

      if (target.matches('[data-social-custom-field="order"]')) {
        normalizeSocialOrders();
      }
    });

    socialCustomList.addEventListener('input', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const presetRow = target.closest('[data-social-preset-row]');
      if (presetRow) {
        syncPresetRow(presetRow);
        return;
      }

      if (!(target instanceof HTMLInputElement)) return;
      const row = target.closest('[data-social-custom-row]');
      if (!(row instanceof HTMLElement)) return;
      if (target.matches('[data-social-custom-field="id"]')) {
        const trimmed = target.value.trim();
        const generatedId = getStoredGeneratedCustomId(row);
        row.dataset.idManual = trimmed && trimmed !== generatedId ? 'true' : 'false';
        return;
      }
      if (target.matches('[data-social-custom-field="label"]')) {
        const trimmed = target.value.trim();
        const generatedLabel = getStoredGeneratedCustomLabel(row);
        row.dataset.labelManual = trimmed && trimmed !== generatedLabel ? 'true' : 'false';
      }
    });

    socialCustomList.addEventListener('focusout', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }
      const row = target.closest('[data-social-custom-row]');
      if (!(row instanceof HTMLElement)) return;
      if (target.matches('[data-social-custom-field="id"]')) {
        finalizeCustomIdInput(row);
      } else if (target.matches('[data-social-custom-field="label"]')) {
        finalizeCustomLabelInput(row);
      } else {
        return;
      }
      refreshDirty();
    });

    socialCustomList.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const presetActionBtn = target.closest('[data-social-preset-action]');
      if (presetActionBtn instanceof HTMLButtonElement) {
        const presetRow = presetActionBtn.closest('[data-social-preset-row]');
        if (!(presetRow instanceof HTMLElement)) return;
        const action = presetActionBtn.getAttribute('data-social-preset-action');

        if (action === 'toggle-visible') {
          const hrefInput = getPresetRowHrefInput(presetRow);
          const orderInput = getPresetRowOrderInput(presetRow);
          if (!(hrefInput instanceof HTMLInputElement) || !(orderInput instanceof HTMLInputElement)) return;

          const visible = hrefInput.value.trim().length > 0;
          if (visible) {
            presetRow.dataset.stashedHref = hrefInput.value.trim();
            presetRow.dataset.stashedOrder = orderInput.value.trim();
            hrefInput.value = '';
          } else {
            hrefInput.value = presetRow.dataset.stashedHref || '';
            orderInput.value = presetRow.dataset.stashedOrder || String(getNextSocialOrder());
          }

          normalizeSocialOrders();
          syncPresetRow(presetRow);
          refreshDirty();
        }
        return;
      }

      const actionBtn = target.closest('[data-social-custom-action]');
      if (!(actionBtn instanceof HTMLButtonElement)) return;
      const row = actionBtn.closest('[data-social-custom-row]');
      if (!(row instanceof HTMLElement)) return;
      const action = actionBtn.getAttribute('data-social-custom-action');

      if (action === 'remove') {
        row.remove();
        getCustomRows().forEach((item) => syncCustomRow(item));
        normalizeSocialOrders();
        updateCustomRowsUi();
        refreshDirty();
        return;
      }

      if (action === 'toggle-visible') {
        const visibleInput = query<HTMLInputElement>(row, '[data-social-custom-field="visible"]');
        if (!(visibleInput instanceof HTMLInputElement)) return;
        visibleInput.checked = !visibleInput.checked;
        syncCustomVisibilityButton(row);
        normalizeSocialOrders();
        refreshDirty();
      }
    });

    validateBtn.addEventListener('click', () => {
      const current = canonicalize(collectSettings());
      const issues = validateSettings(current);
      setValidationIssues(issues);
      if (issues.length) {
        setStatus('error', '校验未通过', { announce: false });
        revealErrorState(issues);
        return;
      }
      setStatus('ok', '校验通过，可直接保存');
    });

    resetBtn.addEventListener('click', () => {
      if (!baseline) return;
      applySettings(deepClone(baseline));
      clearInvalidFields();
      setErrors([]);
      setDirty(false);
      setStatus('ready', '已重置为最近一次加载值');
    });

    saveBtn.addEventListener('click', async () => {
      if (isSaving) return;
      const current = canonicalize(collectSettings());
      const issues = validateSettings(current);
      setValidationIssues(issues);
      if (issues.length) {
        setStatus('error', '保存前校验失败', { announce: false });
        revealErrorState(issues);
        return;
      }

      setSaving(true);
      setStatus('loading', '正在保存到 src/data/settings/*.json');

      try {
        const requestBody = JSON.stringify(current);
        if (!requestBody) {
          clearInvalidFields();
          setErrors(['保存请求体为空，请刷新页面后重试']);
          setStatus('error', '保存失败', { announce: false });
          revealErrorState();
          return;
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json; charset=utf-8'
          },
          cache: 'no-store',
          body: requestBody
        });

        const payload = (await response.json().catch(() => null)) as unknown;
        if (!response.ok || !isRecord(payload) || payload.ok !== true) {
          clearInvalidFields();
          const serverErrors = getPayloadErrors(payload);
          setErrors(serverErrors.length ? serverErrors : ['保存失败，请稍后重试']);
          if (response.status === 404) {
            setStatus('error', '当前环境不允许写入（仅 DEV 可写）', { announce: false });
          } else {
            setStatus('error', '保存失败', { announce: false });
          }
          revealErrorState();
          return;
        }

        if (extractSettingsPayload(payload)) {
          loadPayload(payload, 'remote', { announceStatus: false });
          setStatus('ok', '保存成功，请刷新目标页面查看效果');
        } else {
          baseline = current;
          setDirty(false);
          setStatus('ok', '保存成功');
        }
        clearInvalidFields();
        setErrors([]);
      } catch (error) {
        console.error(error);
        clearInvalidFields();
        setErrors(['保存请求失败，请检查本地服务日志']);
        setStatus('error', '保存失败', { announce: false });
        revealErrorState();
      } finally {
        setSaving(false);
      }
    });

    window.addEventListener('beforeunload', (event) => {
      if (!isDirty) return;
      event.preventDefault();
      Reflect.set(event, 'returnValue', '');
    });

    loadBootstrap();
    void loadFromApi();
  }
}
