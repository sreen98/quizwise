import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Badge, Box, Button, Group, Stack, Text, Title, UnstyledButton } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Question } from '../../types/models';
import { QuestionEditor } from '../QuestionEditor';
import { SortableQuestion } from '../SortableQuestion';
import classes from './QuestionBuilder.module.css';
import type { QuestionBuilderProps } from './types';

const newQuestion = (): Question => ({
  id: crypto.randomUUID(),
  text: '',
  type: 'single',
  options: [
    { id: crypto.randomUUID(), text: '' },
    { id: crypto.randomUUID(), text: '' }
  ],
  correctOptionIds: []
});

const errorText = (error: unknown) => (typeof error === 'string' ? error : null);

const screenReaderInstructions = {
  draggable:
    'To move a question, press Space or Enter to pick it up, use the arrow keys to move it, then press Space or Enter to drop it. Press Escape to cancel.'
};

export const QuestionBuilder = ({ form }: QuestionBuilderProps) => {
  const [openIds, setOpenIds] = useState<string[]>([]);
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const pendingFocusId = useRef<string | null>(null);
  const { questions } = form.values;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!pendingFocusId.current) return;
    const input = document.getElementById(`${pendingFocusId.current}-text`);
    pendingFocusId.current = null;
    input?.scrollIntoView({ block: 'center' });
    input?.focus({ preventScroll: true });
  }, [questions.length]);

  const positionOf = (id: UniqueIdentifier) => questions.findIndex(question => question.id === id) + 1;

  const announcements: Announcements = {
    onDragStart: ({ active }) => {
      lastOverId.current = active.id;
      return `Picked up question ${String(positionOf(active.id))}.`;
    },
    onDragOver: ({ active, over }) => {
      if (!over || over.id === lastOverId.current) return undefined;
      lastOverId.current = over.id;
      return `Question ${String(positionOf(active.id))} is over position ${String(positionOf(over.id))}.`;
    },
    onDragEnd: ({ active, over }) =>
      over
        ? `Question ${String(positionOf(active.id))} dropped at position ${String(positionOf(over.id))}.`
        : `Question ${String(positionOf(active.id))} dropped.`,
    onDragCancel: ({ active }) => `Moving question ${String(positionOf(active.id))} was cancelled.`
  };

  const hasProblems = (index: number) =>
    Object.keys(form.errors).some(key => key.startsWith(`questions.${String(index)}.`));

  const toggle = (id: string) => {
    setOpenIds(ids => (ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id]));
  };

  const addQuestion = () => {
    const question = newQuestion();
    form.insertListItem('questions', question);
    setOpenIds(ids => [...ids, question.id]);
    pendingFocusId.current = question.id;
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    form.reorderListItem('questions', { from: positionOf(active.id) - 1, to: positionOf(over.id) - 1 });
  };

  const closedRow = (question: Question, index: number, handle: ReactNode) => (
    <Group gap={0} wrap="nowrap" pl={6}>
      {handle}
      <UnstyledButton
        onClick={() => {
          toggle(question.id);
        }}
        aria-expanded={false}
        aria-label={`Edit question ${String(index + 1)}`}
        flex={1}
        miw={0}
        pl={6}
        pr={14}
        py={12}
        mih={56}
      >
        <Group gap={12} wrap="nowrap">
          <Text ff="monospace" c="dimmed" fw={700} w={20}>
            {index + 1}
          </Text>
          <Text fw={600} flex={1} miw={0} lineClamp={2}>
            {question.text || 'Untitled question'}
          </Text>
          <Badge variant="default" w={84} visibleFrom="sm">
            {question.type === 'single' ? 'Single' : 'Multiple'}
          </Badge>
          <IconChevronDown size={18} aria-hidden />
        </Group>
      </UnstyledButton>
    </Group>
  );

  return (
    <>
      <Group justify="space-between" gap={12} mb={18}>
        <Title id="questions-title" order={2} fz={18}>
          Questions{' '}
          <Text component="span" c="dimmed" fw={600} inherit>
            ({questions.length})
          </Text>
        </Title>
        {questions.length > 1 && (
          <Text c="dimmed" fz={13}>
            Drag the handle to reorder
          </Text>
        )}
      </Group>
      {questions.length === 0 && <Text c="dimmed">No questions yet.</Text>}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        accessibility={{ announcements, screenReaderInstructions }}
      >
        <SortableContext items={questions.map(question => question.id)} strategy={verticalListSortingStrategy}>
          <Stack component="ol" gap={10} m={0} p={0}>
            {questions.map((question, index) => (
              <SortableQuestion key={question.id} id={question.id} number={index + 1}>
                {handle =>
                  openIds.includes(question.id) || hasProblems(index) ? (
                    <QuestionEditor
                      form={form}
                      question={question}
                      index={index}
                      total={questions.length}
                      onClose={() => {
                        toggle(question.id);
                      }}
                      handle={handle}
                    />
                  ) : (
                    closedRow(question, index, handle)
                  )
                }
              </SortableQuestion>
            ))}
          </Stack>
        </SortableContext>
      </DndContext>
      {errorText(form.errors.questions) && (
        <Text c="var(--mantine-color-error)" fz={13} mt={10} data-form-error>
          {errorText(form.errors.questions)}
        </Text>
      )}
      <Box
        pos="sticky"
        bottom={{ base: 64, sm: 0 }}
        bg="var(--mantine-color-body)"
        pt={14}
        pb={{ base: 12, sm: 16 }}
        className={classes.addBar}
      >
        <Button variant="default" onClick={addQuestion}>
          Add question
        </Button>
      </Box>
    </>
  );
};
