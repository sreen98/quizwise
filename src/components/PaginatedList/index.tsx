import { Box, Button, Flex, Group, Pagination, Stack, Text } from '@mantine/core';
import { useIntersection, useMediaQuery } from '@mantine/hooks';
import { useEffect, useEffectEvent, useRef } from 'react';
import { paginate } from './paginate';
import classes from './PaginatedList.module.css';
import type { PaginatedListProps } from './types';

const HEADER_OFFSET = 84;
const DESKTOP_QUERY = '(min-width: 48em)';

export const PaginatedList = <T,>({
  items,
  page: requestedPage,
  pageSize,
  itemName,
  itemsName,
  onPageChange,
  children
}: PaginatedListProps<T>) => {
  const isDesktop = useMediaQuery(DESKTOP_QUERY, true, { getInitialValueInEffect: false });
  const rootRef = useRef<HTMLDivElement>(null);
  const isScrollPending = useRef(false);
  const { ref: sentinelRef, entry } = useIntersection({ rootMargin: '200px' });
  const { page, pageCount, shown } = paginate(items, requestedPage, pageSize);
  const loaded = items.slice(0, page * pageSize);
  const total = items.length;
  const hasMore = !isDesktop && page < pageCount;

  const loadMore = useEffectEvent(() => {
    if (hasMore) onPageChange(page + 1);
  });

  useEffect(() => {
    if (entry?.isIntersecting) loadMore();
  }, [entry]);

  useEffect(() => {
    if (!isScrollPending.current) return;
    isScrollPending.current = false;
    const root = rootRef.current;
    if (root && root.getBoundingClientRect().top < HEADER_OFFSET) root.scrollIntoView({ block: 'start' });
  }, [page]);

  const handlePageChange = (value: number) => {
    isScrollPending.current = true;
    onPageChange(value);
  };

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const desktopSummary =
    pageCount > 1
      ? `Showing ${String(first)} to ${String(last)} of ${String(total)} ${itemsName}`
      : `Showing ${String(total)} ${total === 1 ? itemName : itemsName}`;
  const mobileSummary =
    pageCount > 1
      ? `Showing ${String(loaded.length)} of ${String(total)} ${itemsName}`
      : `Showing ${String(total)} ${total === 1 ? itemName : itemsName}`;

  return (
    <Stack ref={rootRef} gap={20} className={classes.root}>
      {children(isDesktop ? shown : loaded)}
      {total > 0 && isDesktop && (
        <Flex justify="space-between" align="center" gap={12}>
          <Text c="dimmed" fz={14} role="status">
            {desktopSummary}
          </Text>
          {pageCount > 1 && (
            <Pagination
              total={pageCount}
              value={page}
              onChange={handlePageChange}
              getControlProps={control => ({ 'aria-label': `${control} page` })}
              getItemProps={pageNumber => ({ 'aria-label': `Page ${String(pageNumber)}` })}
              size="lg"
            />
          )}
        </Flex>
      )}
      {total > 0 && !isDesktop && (
        <Group justify="space-between" gap={12}>
          <Text c="dimmed" fz={14} role="status">
            {mobileSummary}
          </Text>
          {hasMore && (
            <Button
              variant="default"
              onClick={() => {
                onPageChange(page + 1);
              }}
            >
              Show more
            </Button>
          )}
          <Box ref={sentinelRef} w="100%" h={1} />
        </Group>
      )}
    </Stack>
  );
};
