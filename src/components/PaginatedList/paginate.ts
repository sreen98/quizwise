export const paginate = <T>(items: T[], requestedPage: number, pageSize: number) => {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(Math.max(1, Math.floor(requestedPage) || 1), pageCount);
  return { page, pageCount, shown: items.slice((page - 1) * pageSize, page * pageSize) };
};
