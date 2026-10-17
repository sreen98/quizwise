import { Box, Card, Divider, Group, Skeleton, Stack } from '@mantine/core';

const detailSkeleton = (key: string, lines: number, grow = false) => (
  <Box key={key} flex={grow ? 1 : undefined}>
    <Skeleton h={15} w={64} mb={6} />
    <Skeleton h={22} w={72} />
    {lines === 2 && <Skeleton h={14} w={110} mt={6} />}
  </Box>
);

export const QuizCardSkeleton = () => {
  return (
    <Card withBorder radius="lg" p={{ base: 20, sm: 24 }} h="100%" aria-hidden>
      <Stack gap={18} h="100%">
        <Group justify="space-between">
          <Skeleton h={26} w={130} />
          <Skeleton h={26} w={110} />
        </Group>
        <Box>
          <Skeleton h={27} w="60%" mb={6} />
          <Skeleton h={16} w="92%" mb={13} />
          <Skeleton h={16} w="55%" />
        </Box>
        <Group gap={24} wrap="nowrap" align="flex-start">
          {detailSkeleton('questions', 1)}
          {detailSkeleton('limit', 2, true)}
          {detailSkeleton('score', 1)}
        </Group>
        <Stack mt="auto" gap={18}>
          <Skeleton h={6} radius="xl" />
          <Divider />
          <Group justify="space-between">
            <Skeleton h={14} w={110} />
            <Skeleton h={44} w={96} />
          </Group>
        </Stack>
      </Stack>
    </Card>
  );
};
