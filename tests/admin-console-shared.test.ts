import { describe, expect, it } from 'vitest';
import {
  canonicalizeAdminThemeSettings,
  createAdminThemeSettingsCanonicalMismatchIssues,
  getAdminNavOrderIssues,
  getAdminSocialOrderIssues,
  normalizeAdminBitsAvatarPath,
  normalizeAdminHeroImageSrc,
  validateAdminThemeSettings
} from '../src/lib/admin-console/shared';
import { getEditableThemeSettingsPayload } from '../src/lib/theme-settings';

describe('admin-console/shared', () => {
  it('reports duplicate and range issues for social orders', () => {
    expect(
      getAdminSocialOrderIssues(
        { github: 1, x: 1, email: 99 },
        [{ key: 'custom-1', order: 2 }, { key: 'custom-2', order: 2 }]
      )
    ).toEqual([
      { type: 'duplicate', scope: 'preset', key: 'github', order: 1 },
      { type: 'duplicate', scope: 'preset', key: 'x', order: 1 },
      { type: 'range', scope: 'preset', key: 'email', order: 99 },
      { type: 'duplicate', scope: 'custom', key: 'custom-1', order: 2 },
      { type: 'duplicate', scope: 'custom', key: 'custom-2', order: 2 }
    ]);
  });

  it('reports duplicate and range issues for nav orders', () => {
    expect(
      getAdminNavOrderIssues([
        { key: 'essay', order: 1 },
        { key: 'bits', order: 1 },
        { key: 'memo', order: 0 }
      ])
    ).toEqual([
      { type: 'duplicate', key: 'essay', order: 1 },
      { type: 'duplicate', key: 'bits', order: 1 },
      { type: 'range', key: 'memo', order: 0 }
    ]);
  });

  it('normalizes valid hero image sources and rejects invalid local paths', () => {
    expect(normalizeAdminHeroImageSrc('@/assets/hero/cover.webp')).toBe('src/assets/hero/cover.webp');
    expect(normalizeAdminHeroImageSrc('public/images/hero.png')).toBe('/images/hero.png');
    expect(normalizeAdminHeroImageSrc('https://example.com/hero.avif')).toBe('https://example.com/hero.avif');
    expect(normalizeAdminHeroImageSrc('/images/hero.png?size=2')).toBeUndefined();
    expect(normalizeAdminHeroImageSrc('../hero.png')).toBeUndefined();
  });

  it('normalizes bits avatar paths and rejects invalid values', () => {
    expect(normalizeAdminBitsAvatarPath(' author/avatar.webp ')).toBe('author/avatar.webp');
    expect(normalizeAdminBitsAvatarPath('')).toBe('');
    expect(normalizeAdminBitsAvatarPath('/author/avatar.webp')).toBeUndefined();
    expect(normalizeAdminBitsAvatarPath('public/author/avatar.webp')).toBeUndefined();
    expect(normalizeAdminBitsAvatarPath('https://example.com/avatar.webp')).toBeUndefined();
    expect(normalizeAdminBitsAvatarPath('author/avatar.webp?v=2')).toBeUndefined();
  });

  it('canonicalizes admin settings snapshots and reports contract mismatches', () => {
    const raw = structuredClone(getEditableThemeSettingsPayload().settings) as Record<string, any>;
    raw.site.title = `  ${raw.site.title}  `;
    raw.site.footer.startYear = String(raw.site.footer.startYear);
    raw.site.socialLinks.email = `mailto:${raw.site.socialLinks.email}`;
    raw.site.socialLinks.custom = [
      {
        id: 'custom-home',
        label: '',
        href: 'https://example.com',
        iconKey: 'globe',
        visible: 1,
        order: '4'
      }
    ];
    delete raw.page.about.subtitle;

    const canonical = canonicalizeAdminThemeSettings(raw, {
      footerStartYearMax: 2030,
      normalizeCustomSocialLabel: (value, iconKey) => String(value ?? '').trim() || iconKey
    });

    expect(canonical.site.title).toBe(getEditableThemeSettingsPayload().settings.site.title);
    expect(canonical.site.footer.startYear).toBe(getEditableThemeSettingsPayload().settings.site.footer.startYear);
    expect(canonical.site.socialLinks.email).toBe(getEditableThemeSettingsPayload().settings.site.socialLinks.email);
    expect(canonical.site.socialLinks.custom[0]).toMatchObject({
      iconKey: 'website',
      label: 'website',
      visible: true,
      order: 4
    });
    expect(validateAdminThemeSettings(canonical, { footerStartYearMax: 2030 })).toEqual([]);
    expect(
      createAdminThemeSettingsCanonicalMismatchIssues(raw, canonical).map((issue) => issue.path)
    ).toEqual(
      expect.arrayContaining([
        'site.title',
        'site.footer.startYear',
        'site.socialLinks.email',
        'site.socialLinks.custom[0].iconKey',
        'site.socialLinks.custom[0].label',
        'site.socialLinks.custom[0].visible',
        'site.socialLinks.custom[0].order',
        'page.about.subtitle'
      ])
    );
  });
});
