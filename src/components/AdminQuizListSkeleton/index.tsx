import { Box, Divider, Flex, Group, Paper, Skeleton, Stack, Table, Title } from '@mantine/core';
import { AdminQuizTableHead } from '../AdminQuizTableHead';
import type { AdminQuizListSkeletonProps } from './types';

const ROWS = [1, 2, 3, 4, 5];

const field = (width: number | undefined) => (
  <Box flex={width ? undefined : 1} w={width ? { base: '100%', sm: width } : undefined}>
    <Skeleton h={14} w={70} mt={4} mb={5} />
    <Skeleton h={44} />
  </Box>
);

const row = (key: number) => (
  <Table.Tr key={key}>
    <Table.Td>
      <Skeleton h={16} w="55%" mb={7} />
      <Skeleton h={13} w="80%" />
    </Table.Td>
    <Table.Td>
      <Skeleton h={16} w={24} ml="auto" />
    </Table.Td>
    <Table.Td>
      <Skeleton h={16} w={90} />
    </Table.Td>
    <Table.Td>
      <Skeleton h={20} w={20} />
    </Table.Td>
    <Table.Td>
      <Skeleton h={20} w={68} radius="xl" />
    </Table.Td>
    <Table.Td>
      <Skeleton h={16} w={24} ml="auto" />
    </Table.Td>
    <Table.Td>
      <Skeleton h={44} w={136} ml="auto" />
    </Table.Td>
  </Table.Tr>
);

const card = (key: number) => (
  <Box component="li" key={key} display="block">
    {key > 1 && <Divider />}
    <Box px={16} py={14}>
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap={8}>
        <Box flex={1} h={{ base: 64, sm: 44 }}>
          <Skeleton h={16} w="60%" mt={4} mb={10} />
          <Skeleton h={13} w="90%" mb={7} />
          <Skeleton h={13} w="70%" hiddenFrom="sm" />
        </Box>
        <Skeleton h={44} w={136} />
      </Group>
      <Box h={{ base: 59, sm: 22 }} mt={10} pt={4}>
        <Skeleton h={14} w="75%" mb={24} />
        <Skeleton h={14} w="45%" hiddenFrom="sm" />
      </Box>
      <Skeleton h={20} w={68} radius="xl" mt={8} />
    </Box>
  </Box>
);

const list = (
  <Stack gap={20} aria-hidden>
    <Paper withBorder radius="lg">
      <Flex direction={{ base: 'column', sm: 'row' }} gap={12} p={16}>
        {field(undefined)}
        {field(220)}
        {field(150)}
        {field(220)}
      </Flex>
      <Box visibleFrom="lg">
        <Table layout="fixed" miw={1020} verticalSpacing={14} horizontalSpacing={16} fz={15}>
          <AdminQuizTableHead />
          <Table.Tbody>{ROWS.map(row)}</Table.Tbody>
        </Table>
      </Box>
      <Stack component="ul" gap={0} m={0} p={0} hiddenFrom="lg">
        {ROWS.map(card)}
      </Stack>
    </Paper>
    <Skeleton h={14} w={150} my={4} />
  </Stack>
);

export const AdminQuizListSkeleton = ({ withHeader }: AdminQuizListSkeletonProps) => {
  if (!withHeader) return list;

  return (
    <Stack gap={24}>
      <Flex wrap="wrap" justify="space-between" align="flex-end" gap={16} py={12} mt={-12}>
        <Box>
          <Title order={1} fz={{ base: 28, sm: 36 }} lts="-0.01em">
            Manage quizzes
          </Title>
          <Skeleton h={25} w={230} mt={8} />
        </Box>
        <Group gap={10} justify="space-between" w={{ base: '100%', sm: 'auto' }}>
          <Skeleton h={44} w={123} />
          <Skeleton h={44} w={98} />
        </Group>
      </Flex>
      {list}
    </Stack>
  );
};
