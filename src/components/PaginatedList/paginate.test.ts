import { describe, expect, it } from 'vitest';
import { paginate } from './paginate';

const items = Array.from({ length: 25 }, (_, index) => index + 1);

describe('paginate', () => {
  it('returns the items of the requested page', () => {
    expect(paginate(items, 2, 10)).toEqual({ page: 2, pageCount: 3, shown: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20] });
  });

  it('moves a page past the end back to the last page', () => {
    expect(paginate(items, 9, 10)).toMatchObject({ page: 3, shown: [21, 22, 23, 24, 25] });
  });

  it('treats a missing or invalid page as page 1', () => {
    expect(paginate(items, Number(null), 10).page).toBe(1);
    expect(paginate(items, Number('abc'), 10).page).toBe(1);
  });

  it('has one empty page for an empty list', () => {
    expect(paginate([], 1, 10)).toEqual({ page: 1, pageCount: 1, shown: [] });
  });
});
