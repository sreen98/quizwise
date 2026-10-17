import { useSortable } from '@dnd-kit/sortable';
import { ActionIcon, Paper } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import { IconGripVertical } from '@tabler/icons-react';
import classes from './SortableQuestion.module.css';
import type { SortableQuestionProps } from './types';

export const SortableQuestion = ({ id, number, children }: SortableQuestionProps) => {
  const reduceMotion = useReducedMotion();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id
  });

  return (
    <Paper
      component="li"
      ref={setNodeRef}
      display="block"
      withBorder
      radius="md"
      opacity={isDragging ? 0.6 : 1}
      pos="relative"
      style={{
        transform: transform ? `translate3d(${String(transform.x)}px, ${String(transform.y)}px, 0)` : undefined,
        transition: reduceMotion ? undefined : transition,
        zIndex: isDragging ? 1 : undefined
      }}
    >
      {children(
        <ActionIcon
          ref={setActivatorNodeRef}
          className={classes.handle}
          variant="subtle"
          color="gray"
          size={44}
          {...attributes}
          {...listeners}
          aria-label={`Reorder question ${String(number)}`}
        >
          <IconGripVertical size={18} aria-hidden />
        </ActionIcon>
      )}
    </Paper>
  );
};
