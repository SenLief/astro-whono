import type {
  HomeIntroLinkKey,
  SidebarDividerVariant,
  SidebarNavId,
  SiteSocialIconKey,
  SiteSocialPresetId,
  ThemeSettingsEditablePayload
} from '@/lib/theme-settings';
import {
  ADMIN_HERO_IMAGE_ALT_DEFAULT,
  ADMIN_HOME_INTRO_LINK_DEFAULT,
  ADMIN_HOME_INTRO_LINK_LIMIT,
  ADMIN_HOME_INTRO_LINK_OPTIONS,
  ADMIN_NAV_IDS,
  ADMIN_NAV_ORNAMENT_DEFAULT,
  ADMIN_SIDEBAR_DIVIDER_DEFAULT,
  ADMIN_SOCIAL_PRESET_ORDER_DEFAULT,
  isAdminHomeIntroLinkKey,
  isAdminHeroPresetId,
  isAdminNavId,
  isAdminSidebarDividerVariant,
  normalizeAdminHeroImageSrc,
  normalizeAdminSocialIconKey
} from '@/lib/admin-console/shared';

export type EditableSettings = ThemeSettingsEditablePayload['settings'];
export type EditableCustomSocialItem = EditableSettings['site']['socialLinks']['custom'][number];
export type EditableNavItem = EditableSettings['shell']['nav'][number];
export type SocialPresetOrder = Record<SiteSocialPresetId, number>;

type Query = <T extends Element>(parent: ParentNode, selector: string) => T | null;
type LooseRecord = Record<string, unknown>;

type FormCodecContext = {
  footerStartYearMax: number;
  query: Query;
  getNavRows: () => HTMLElement[];
  getCustomRows: () => HTMLElement[];
  getCustomRowLabelInput: (row: Element | null) => HTMLInputElement | null;
  defaultCustomSocialIconKey: SiteSocialIconKey;
  normalizeCustomSocialLabel: (value: unknown, iconKey: SiteSocialIconKey) => string;
  replaceCustomRows: (items: EditableCustomSocialItem[]) => void;
  normalizeSocialOrders: () => void;
  getPresetSocialOrder: () => SocialPresetOrder;
  footerPreviewValueEl: HTMLElement;
  homeIntroMorePreviewEl: HTMLElement;
  homeIntroMoreLinkSecondaryGroupEl: HTMLElement;
  inputSiteTitle: HTMLInputElement;
  inputSiteDescription: HTMLTextAreaElement;
  inputSiteDefaultLocale: HTMLInputElement;
  inputSiteFooterStartYear: HTMLInputElement;
  inputSiteFooterShowCurrentYear: HTMLInputElement;
  inputSiteFooterCopyright: HTMLInputElement;
  inputSiteSocialGithubOrder: HTMLInputElement;
  inputSiteSocialGithub: HTMLInputElement;
  inputSiteSocialXOrder: HTMLInputElement;
  inputSiteSocialX: HTMLInputElement;
  inputSiteSocialEmailOrder: HTMLInputElement;
  inputSiteSocialEmail: HTMLInputElement;
  inputShellBrandTitle: HTMLInputElement;
  inputShellQuote: HTMLTextAreaElement;
  inputHomeShowIntroLead: HTMLInputElement;
  inputHomeShowIntroMore: HTMLInputElement;
  inputHomeIntroLead: HTMLTextAreaElement;
  inputHomeIntroMore: HTMLTextAreaElement;
  inputHomeIntroMoreLinkPrimary: HTMLSelectElement;
  inputHomeIntroMoreLinkSecondaryEnabled: HTMLInputElement;
  inputHomeIntroMoreLinkSecondary: HTMLSelectElement;
  inputPageEssayTitle: HTMLInputElement;
  inputPageEssaySubtitle: HTMLInputElement;
  inputPageArchiveTitle: HTMLInputElement;
  inputPageArchiveSubtitle: HTMLInputElement;
  inputPageBitsTitle: HTMLInputElement;
  inputPageBitsSubtitle: HTMLInputElement;
  inputPageMemoTitle: HTMLInputElement;
  inputPageMemoSubtitle: HTMLInputElement;
  inputPageAboutTitle: HTMLInputElement;
  inputPageAboutSubtitle: HTMLInputElement;
  inputPageBitsAuthorName: HTMLInputElement;
  inputPageBitsAuthorAvatar: HTMLInputElement;
  inputHomeShowHero: HTMLInputElement;
  inputHeroImageSrc: HTMLInputElement;
  inputHeroImageAlt: HTMLInputElement;
  inputCodeLineNumbers: HTMLInputElement;
  inputReadingEntry: HTMLInputElement;
  inputSidebarDividerDefault: HTMLInputElement;
  inputSidebarDividerSubtle: HTMLInputElement;
  inputSidebarDividerNone: HTMLInputElement;
};

const isRecord = (value: unknown): value is LooseRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

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

export const normalizeEmail = (value: string): string => value.replace(/^mailto:/i, '').trim();

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

export const createFormCodec = ({
  footerStartYearMax,
  query,
  getNavRows,
  getCustomRows,
  getCustomRowLabelInput,
  defaultCustomSocialIconKey,
  normalizeCustomSocialLabel,
  replaceCustomRows,
  normalizeSocialOrders,
  getPresetSocialOrder,
  footerPreviewValueEl,
  homeIntroMorePreviewEl,
  homeIntroMoreLinkSecondaryGroupEl,
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
  inputHomeIntroMoreLinkPrimary,
  inputHomeIntroMoreLinkSecondaryEnabled,
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
}: FormCodecContext) => {
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

  const getSelectedHomeIntroLink = (
    selectEl: HTMLSelectElement,
    fallback: HomeIntroLinkKey
  ): HomeIntroLinkKey => {
    const rawValue = selectEl.value.trim();
    return isAdminHomeIntroLinkKey(rawValue) ? rawValue : fallback;
  };

  const HOME_INTRO_PREVIEW_EMPTY = '无首页补充导语';
  const getHomeIntroLinkLabel = (linkKey: HomeIntroLinkKey): string =>
    ADMIN_HOME_INTRO_LINK_OPTIONS.find((option) => option.id === linkKey)?.label || '链接';

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
            github: parseOrder(
              rawPresetOrder.github as string | number | null | undefined,
              ADMIN_SOCIAL_PRESET_ORDER_DEFAULT.github
            ),
            x: parseOrder(
              rawPresetOrder.x as string | number | null | undefined,
              ADMIN_SOCIAL_PRESET_ORDER_DEFAULT.x
            ),
            email: parseOrder(
              rawPresetOrder.email as string | number | null | undefined,
              ADMIN_SOCIAL_PRESET_ORDER_DEFAULT.email
            )
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

  return {
    canonicalize,
    collectSettings,
    applySettings,
    collectHomeIntroLinks,
    refreshHomeIntroPreview,
    syncHomeIntroLinkControls,
    syncHeroControls,
    refreshFooterPreview,
    syncFooterYearControls
  };
};
