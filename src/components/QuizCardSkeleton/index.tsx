import { Box, Card, Group, Skeleton, Stack } from '@mantine/core';

export const QuizCardSkeleton = () => {
  return (
    <Card withBorder radius="lg" p={{ base: 16, sm: 20 }} h="100%" aria-hidden>
      <Stack gap={14} h="100%">
        <Group justify="space-between" align="flex-start" gap={12} wrap="nowrap" h={27}>
          <Skeleton h={20} w="60%" mt={4} />
          <Group gap={6} wrap="nowrap">
            <Skeleton h={20} w={20} circle />
            <Skeleton h={20} w={20} circle />
          </Group>
        </Group>
        <Skeleton h={26} w={100} />
        <Group justify="space-between" gap={12} wrap="nowrap" h={72} mt="auto">
          <Group gap={14} wrap="nowrap" flex={1}>
            <Skeleton h={72} w={72} circle />
            <Box flex={1}>
              <Skeleton h={16} w="70%" mb={10} />
              <Skeleton h={13} w="50%" />
            </Box>
          </Group>
          <Skeleton h={44} w={96} />
        </Group>
      </Stack>
    </Card>
  );
};
