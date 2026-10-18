import { ActionIcon, Box, Card, Flex, Group, Skeleton, Stack, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { Link } from 'react-router';
import type { QuizFormSkeletonProps } from './types';

const label = <Skeleton h={14} w={90} mt={4} mb={5} />;

const field = (inputHeight: number) => (
  <Box>
    {label}
    <Skeleton h={inputHeight} />
  </Box>
);

const limitRow = (key: string) => (
  <Group key={key} justify="space-between" wrap="nowrap" h={44}>
    <Skeleton h={20} w={130} />
    <Skeleton h={44} w={122} />
  </Group>
);

const details = (isNew: boolean) => (
  <Stack gap={20}>
    {field(44)}
    {field(79)}
    <Box h={isNew ? { base: 170, sm: 150 } : 170}>
      {label}
      <Stack gap={4}>
        {limitRow('quiz')}
        {limitRow('question')}
        <Skeleton h={13} w="85%" mt={4} />
      </Stack>
    </Box>
    <Group justify="space-between" h={44}>
      <Skeleton h={14} w={100} />
      <Skeleton h={24} w={42} radius="xl" />
    </Group>
    <Box>
      {field(44)}
      {!isNew && (
        <Group gap={8} mt={10}>
          <Skeleton h={44} w={110} radius="xl" />
          <Skeleton h={44} w={180} radius="xl" />
          <Skeleton h={44} w={150} radius="xl" />
        </Group>
      )}
    </Box>
  </Stack>
);

export const QuizFormSkeleton = ({ isNew }: QuizFormSkeletonProps) => {
  return (
    <Box aria-busy>
      <Flex wrap="wrap" align="center" justify="space-between" gap={12} py={12} mt={-12} mb={12}>
        <Group gap={8} wrap="nowrap">
          <ActionIcon
            component={Link}
            to="/admin"
            variant="subtle"
            color="gray"
            size={44}
            aria-label="Back to Manage quizzes"
          >
            <IconArrowLeft size={20} aria-hidden />
          </ActionIcon>
          <Title order={1} fz={{ base: 22, sm: 26 }} lts="-0.01em">
            {isNew ? 'New quiz' : 'Edit quiz'}
          </Title>
        </Group>
        <Group gap={12} justify="space-between" w={{ base: '100%', sm: 'auto' }}>
          <Skeleton h={44} w={82} />
          <Skeleton h={44} w={isNew ? 68 : 100} />
        </Group>
      </Flex>

      {isNew ? (
        <Card withBorder radius="lg" p={{ base: 16, sm: 24 }} maw={560} mx="auto" aria-hidden>
          {details(true)}
        </Card>
      ) : (
        <Flex wrap="wrap" gap={24} align="flex-start" aria-hidden>
          <Card withBorder radius="lg" p={{ base: 16, sm: 24 }} flex="1 1 340px">
            {details(false)}
          </Card>
          <Card withBorder radius="lg" p={{ base: 16, sm: 24 }} flex="999 1 560px" miw={0}>
            <Skeleton h={20} w={140} mt={2} mb={20} />
            <Stack gap={10}>
              {[1, 2, 3, 4, 5, 6].map(index => (
                <Skeleton key={index} h={{ base: 72, sm: 58 }} />
              ))}
            </Stack>
            <Box h={{ base: 70, sm: 74 }} pt={15}>
              <Skeleton h={44} w={190} />
            </Box>
          </Card>
        </Flex>
      )}
    </Box>
  );
};
