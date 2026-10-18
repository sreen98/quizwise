import { Badge, Box, Flex, Paper, ThemeIcon, Title } from '@mantine/core';
import type { MessageCardProps } from './types';

export const MessageCard = ({ icon, color = 'blue', badge, title, children, actions }: MessageCardProps) => {
  return (
    <Flex align="center" justify="center" mih={{ base: 'calc(100dvh - 156px)', sm: 'calc(100dvh - 116px)' }}>
      <title>{`${title} - Quizwise`}</title>
      <Paper
        component="section"
        aria-labelledby="message-title"
        withBorder
        radius="lg"
        w="100%"
        maw={640}
        px={{ base: 24, sm: 48 }}
        py={{ base: 32, sm: 48 }}
        ta="center"
      >
        <ThemeIcon variant="light" color={color} size={72} radius="xl" mb={16} aria-hidden>
          {icon}
        </ThemeIcon>
        {badge && (
          <Box>
            <Badge color={color} mb={16}>
              {badge}
            </Badge>
          </Box>
        )}
        <Title id="message-title" order={1} fz={{ base: 26, sm: 30 }} lts="-0.01em" mb={12}>
          {title}
        </Title>
        <Box c="dimmed" fz={16} lh={1.6} mb={28}>
          {children}
        </Box>
        <Flex direction={{ base: 'column', sm: 'row' }} justify="center" gap={12}>
          {actions}
        </Flex>
      </Paper>
    </Flex>
  );
};
