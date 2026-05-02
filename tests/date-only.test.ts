import { describe, expect, it } from 'vitest';
import {
  parseDateOnlyInput,
  parseDateOnlyUtc,
  parseEssayDateInput,
  parseEssayPublishedAtInput
} from '../src/utils/date-only';

describe('date-only utils', () => {
  it('accepts valid YYYY-MM-DD dates as UTC date-only values', () => {
    expect(parseDateOnlyUtc('2026-01-01')?.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });

  it('keeps strict date-only parsing separate from essay datetime compatibility', () => {
    expect(parseDateOnlyUtc('2026-01-01T23:30:00-08:00')).toBeNull();
    expect(parseDateOnlyInput(new Date('2026-01-01T23:30:00-08:00'))).toBeNull();
  });

  it('rejects impossible calendar dates', () => {
    expect(parseDateOnlyUtc('2026-02-31')).toBeNull();
  });

  it('accepts ISO 8601 datetime as essay date compatibility input', () => {
    const parsed = parseEssayDateInput('2024-11-23T18:00:00+08:00');

    expect(parsed?.dateText).toBe('2024-11-23');
    expect(parsed?.date.toISOString()).toBe('2024-11-23T00:00:00.000Z');
    expect(parsed?.publishedAtText).toBe('2024-11-23T18:00:00+08:00');
    expect(parsed?.publishedAt?.toISOString()).toBe('2024-11-23T10:00:00.000Z');
  });

  it('keeps the source calendar date instead of converting across UTC day boundaries', () => {
    const parsed = parseEssayDateInput('2026-01-01T00:30:00+08:00');

    expect(parsed?.dateText).toBe('2026-01-01');
    expect(parsed?.date.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(parsed?.publishedAt?.toISOString()).toBe('2025-12-31T16:30:00.000Z');
  });

  it('falls back to the UTC date when a YAML datetime was already parsed as Date', () => {
    const parsed = parseEssayDateInput(new Date('2026-01-01T00:30:00+08:00'));

    expect(parsed?.dateText).toBe('2025-12-31');
    expect(parsed?.date.toISOString()).toBe('2025-12-31T00:00:00.000Z');
    expect(parsed?.publishedAtText).toBe('2025-12-31T16:30:00.000Z');
  });

  it('rejects invalid essay date and publishedAt inputs', () => {
    expect(parseEssayDateInput('2024-02-31')).toBeNull();
    expect(parseEssayDateInput('2024-02-31T18:00:00+08:00')).toBeNull();
    expect(parseEssayDateInput('2024-11-23T18:00:00')).toBeNull();
    expect(parseEssayPublishedAtInput('2024-11-23')).toBeNull();
    expect(parseEssayPublishedAtInput('2024-02-31T18:00:00+08:00')).toBeNull();
  });
});
