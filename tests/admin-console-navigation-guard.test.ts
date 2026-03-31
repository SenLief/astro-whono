import { describe, expect, it } from 'vitest';
import { shouldGuardAdminNavigation } from '../src/scripts/admin-console/navigation-guard';

describe('admin-console/navigation-guard', () => {
  it('guards same-origin route switches when the form is dirty', () => {
    expect(
      shouldGuardAdminNavigation({
        isDirty: true,
        currentUrl: 'http://localhost:4321/admin/theme/',
        nextUrl: 'http://localhost:4321/admin/'
      })
    ).toBe(true);
  });

  it('ignores hash-only jumps on the same document', () => {
    expect(
      shouldGuardAdminNavigation({
        isDirty: true,
        currentUrl: 'http://localhost:4321/admin/theme/',
        nextUrl: 'http://localhost:4321/admin/theme/#site'
      })
    ).toBe(false);
  });

  it('ignores modified clicks and non-self targets', () => {
    expect(
      shouldGuardAdminNavigation({
        isDirty: true,
        currentUrl: 'http://localhost:4321/admin/theme/',
        nextUrl: 'http://localhost:4321/admin/',
        metaKey: true
      })
    ).toBe(false);

    expect(
      shouldGuardAdminNavigation({
        isDirty: true,
        currentUrl: 'http://localhost:4321/admin/theme/',
        nextUrl: 'http://localhost:4321/admin/',
        target: '_blank'
      })
    ).toBe(false);
  });

  it('ignores clean state and cross-origin jumps', () => {
    expect(
      shouldGuardAdminNavigation({
        isDirty: false,
        currentUrl: 'http://localhost:4321/admin/theme/',
        nextUrl: 'http://localhost:4321/admin/'
      })
    ).toBe(false);

    expect(
      shouldGuardAdminNavigation({
        isDirty: true,
        currentUrl: 'http://localhost:4321/admin/theme/',
        nextUrl: 'https://example.com/admin/'
      })
    ).toBe(false);
  });
});
