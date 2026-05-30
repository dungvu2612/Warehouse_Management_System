/*
Senior Handover Note:
- Purpose: Shared frontend pagination helpers for WMS list/table pages.
- Dependencies: Pure TypeScript array utilities.
- HT730 scanner behavior: Not scanner-specific; keeps staff/admin lists predictable after scan workflows update data.
- API callback contract: No API calls; pagination is applied to already-fetched client data.
- Maintenance notes: Keep default page size fixed at 10 unless backend pagination is introduced.
*/

export const DEFAULT_PAGE_SIZE = 10

export function getPageCount(totalItems: number, pageSize = DEFAULT_PAGE_SIZE) {
  return Math.max(1, Math.ceil(totalItems / pageSize))
}

export function clampPage(page: number, totalItems: number, pageSize = DEFAULT_PAGE_SIZE) {
  const pageCount = getPageCount(totalItems, pageSize)
  return Math.min(Math.max(page, 1), pageCount)
}

export function paginateItems<T>(items: T[], currentPage: number, pageSize = DEFAULT_PAGE_SIZE) {
  // Senior Handover: Pagination is applied after filtering so page count matches visible data.
  const safePage = clampPage(currentPage, items.length, pageSize)
  const start = (safePage - 1) * pageSize
  return items.slice(start, start + pageSize)
}
