import { Text, Tooltip } from '@mantine/core';
import { useState, type SyntheticEvent } from 'react';
import type { TruncatedTextProps } from './types';

export const TruncatedText = ({ children, ...textProps }: TruncatedTextProps) => {
  const [showFull, setShowFull] = useState(false);

  const handleEnter = (event: SyntheticEvent<HTMLElement>) => {
    const text = event.currentTarget;
    setShowFull(text.scrollWidth > text.clientWidth);
  };

  const handleLeave = () => {
    setShowFull(false);
  };

  return (
    <Tooltip label={children} opened={showFull} multiline maw={360}>
      <Text truncate="end" onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...textProps}>
        {children}
      </Text>
    </Tooltip>
  );
};
