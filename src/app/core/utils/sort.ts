/**
 * List ordering helper — every list in the app shows the most recently created record first.
 *
 * Entities carry different date fields depending on the module (some have a real `createdAt`,
 * others only a commercial date like `confirmedAt` / `issuedAt`). `createdOf()` picks the best
 * available creation date by probing fields in priority order; `newestFirst()` sorts descending.
 *
 * Dates are ISO strings (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm…`), so a plain `localeCompare` gives a
 * correct chronological sort. Records with no usable date are pushed to the end of the list.
 */

const CREATED_FIELDS = [
  'createdAt',
  'confirmedAt',
  'issuedAt',
  'releasedAt',
  'receivedAt',
  'sentAt',
  'date',
  'scheduledDate',
  'expectedDate',
  'actualDate',
  'validFrom',
] as const;

/** Best-effort creation date for any entity, or `''` when the entity has no date field. */
export function createdOf(entity: object): string {
  for (const field of CREATED_FIELDS) {
    const value = (entity as Record<string, unknown>)[field];
    if (typeof value === 'string' && value) return value;
  }
  return '';
}

/** Sorts a copy of `rows` newest-first by creation date; records without a date go last.
 * Pass `keyOf` when the rows wrap the entity (e.g. a row with a nested `ws`/`bom` object). */
export function newestFirst<T extends object>(rows: readonly T[], keyOf?: (row: T) => string): T[] {
  return [...rows].sort((a, b) => {
    const x = keyOf ? keyOf(a) : createdOf(a);
    const y = keyOf ? keyOf(b) : createdOf(b);
    if (!x && !y) return 0;
    if (!x) return 1;
    if (!y) return -1;
    return y.localeCompare(x);
  });
}