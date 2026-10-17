import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  Fieldset,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton
} from '@mantine/core';
import { IconArrowDown, IconArrowUp, IconChevronDown, IconTrash, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import type { Question, QuestionType } from '../../types/models';
import type { QuestionBuilderProps } from './types';

const newOption = () => ({ id: crypto.randomUUID(), text: '' });

const newQuestion = (): Question => ({
  id: crypto.randomUUID(),
  text: '',
  type: 'single',
  options: [newOption(), newOption()],
  correctOptionIds: []
});

const typeOptions: { value: QuestionType; label: string }[] = [
  { value: 'single', label: 'Single choice' },
  { value: 'multiple', label: 'Multiple choice' }
];

const isQuestionType = (value: string): value is QuestionType => value === 'single' || value === 'multiple';

const errorText = (error: unknown) => (typeof error === 'string' ? error : null);

export const QuestionBuilder = ({ form }: QuestionBuilderProps) => {
  const [openIds, setOpenIds] = useState<string[]>([]);
  const { questions } = form.values;

  const problemCount = (index: number) =>
    Object.keys(form.errors).filter(key => key.startsWith(`questions.${String(index)}.`)).length;

  const toggle = (id: string) => {
    setOpenIds(ids => (ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id]));
  };

  const addQuestion = () => {
    const question = newQuestion();
    form.insertListItem('questions', question);
    setOpenIds(ids => [...ids, question.id]);
  };

  const changeType = (index: number, question: Question, type: QuestionType) => {
    form.setFieldValue(`questions.${String(index)}.type`, type);
    if (type === 'single') {
      form.setFieldValue(`questions.${String(index)}.correctOptionIds`, question.correctOptionIds.slice(0, 1));
    }
  };

  const toggleCorrect = (index: number, question: Question, optionId: string, isCorrect: boolean) => {
    const others = question.correctOptionIds.filter(id => id !== optionId);
    const next = isCorrect ? [...(question.type === 'single' ? [] : others), optionId] : others;
    form.setFieldValue(`questions.${String(index)}.correctOptionIds`, next);
  };

  const removeOption = (index: number, question: Question, optionIndex: number, optionId: string) => {
    form.removeListItem(`questions.${String(index)}.options`, optionIndex);
    form.setFieldValue(
      `questions.${String(index)}.correctOptionIds`,
      question.correctOptionIds.filter(id => id !== optionId)
    );
  };

  const closedRow = (question: Question, index: number) => (
    <UnstyledButton
      onClick={() => {
        toggle(question.id);
      }}
      aria-expanded={false}
      aria-label={`Edit question ${String(index + 1)}`}
      w="100%"
      px={14}
      py={12}
      mih={56}
    >
      <Group gap={12} wrap="nowrap">
        <Text ff="monospace" c="dimmed" fw={700} w={24}>
          {index + 1}
        </Text>
        <Text fw={600} flex={1} miw={0} truncate>
          {question.text || 'Untitled question'}
        </Text>
        <Badge variant="default" w={84}>
          {question.type === 'single' ? 'Single' : 'Multiple'}
        </Badge>
        <IconChevronDown size={18} aria-hidden />
      </Group>
    </UnstyledButton>
  );

  const openEditor = (question: Question, index: number) => {
    const number = String(index + 1);
    const path = `questions.${String(index)}`;
    const problems = problemCount(index);

    return (
      <Box>
        <Group gap={6} wrap="nowrap" px={8} py={6} bg="var(--surface-2)">
          <UnstyledButton
            onClick={() => {
              toggle(question.id);
            }}
            aria-expanded
            flex={1}
            mih={44}
            px={6}
          >
            <Group gap={10} wrap="nowrap">
              <Text ff="monospace" c="dimmed" fw={700}>
                {number}
              </Text>
              <Text fw={700} truncate>
                Question {number}
              </Text>
              {problems > 0 && (
                <Badge color="orange">{problems === 1 ? '1 problem' : `${String(problems)} problems`}</Badge>
              )}
            </Group>
          </UnstyledButton>
          <ActionIcon
            variant="subtle"
            color="gray"
            size={44}
            aria-label={`Move question ${number} up`}
            disabled={index === 0}
            onClick={() => {
              form.reorderListItem('questions', { from: index, to: index - 1 });
            }}
          >
            <IconArrowUp size={18} aria-hidden />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            size={44}
            aria-label={`Move question ${number} down`}
            disabled={index === questions.length - 1}
            onClick={() => {
              form.reorderListItem('questions', { from: index, to: index + 1 });
            }}
          >
            <IconArrowDown size={18} aria-hidden />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            size={44}
            aria-label={`Delete question ${number}`}
            onClick={() => {
              form.removeListItem('questions', index);
            }}
          >
            <IconTrash size={18} aria-hidden />
          </ActionIcon>
        </Group>

        <Stack gap={18} p={{ base: 14, sm: 20 }}>
          <Group gap={16} align="flex-start" wrap="wrap">
            <TextInput label="Question text" flex="1 1 260px" {...form.getInputProps(`${path}.text`)} />
            <Fieldset legend="Answer type" variant="unstyled" p={0}>
              <SegmentedControl
                data={typeOptions}
                value={question.type}
                onChange={value => {
                  if (isQuestionType(value)) changeType(index, question, value);
                }}
              />
            </Fieldset>
          </Group>

          <Fieldset
            legend={
              question.type === 'single' ? 'Options · mark the correct answer' : 'Options · mark every correct answer'
            }
            variant="unstyled"
            p={0}
          >
            <Stack gap={8}>
              {question.options.map((option, optionIndex) => {
                const optionNumber = String(optionIndex + 1);
                return (
                  <Group key={option.id} gap={10} wrap="nowrap">
                    <TextInput
                      aria-label={`Option ${optionNumber}`}
                      flex={1}
                      {...form.getInputProps(`${path}.options.${String(optionIndex)}.text`)}
                    />
                    <Group gap={8} wrap="nowrap">
                      <Checkbox
                        id={`${option.id}-correct`}
                        aria-label={`Option ${optionNumber} is correct`}
                        checked={question.correctOptionIds.includes(option.id)}
                        onChange={event => {
                          toggleCorrect(index, question, option.id, event.currentTarget.checked);
                        }}
                      />
                      <Text component="label" htmlFor={`${option.id}-correct`} fz={14} visibleFrom="sm">
                        Correct
                      </Text>
                    </Group>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size={44}
                      aria-label={`Remove option ${optionNumber}`}
                      disabled={question.options.length <= 2}
                      onClick={() => {
                        removeOption(index, question, optionIndex, option.id);
                      }}
                    >
                      <IconX size={18} aria-hidden />
                    </ActionIcon>
                  </Group>
                );
              })}
            </Stack>
            {[errorText(form.errors[`${path}.options`]), errorText(form.errors[`${path}.correctOptionIds`])]
              .filter(message => message !== null)
              .map(message => (
                <Text key={message} c="var(--mantine-color-error)" fz={13} mt={6}>
                  {message}
                </Text>
              ))}
            <Button
              variant="subtle"
              mt={8}
              px={10}
              onClick={() => {
                form.insertListItem(`${path}.options`, newOption());
              }}
            >
              Add option
            </Button>
          </Fieldset>
        </Stack>
      </Box>
    );
  };

  return (
    <>
      <Title id="questions-title" order={2} fz={18} mb={18}>
        Questions{' '}
        <Text component="span" c="dimmed" fw={600} inherit>
          ({questions.length})
        </Text>
      </Title>
      {questions.length === 0 && <Text c="dimmed">No questions yet.</Text>}
      <Stack component="ol" gap={10} m={0} p={0}>
        {questions.map((question, index) => (
          <Paper component="li" key={question.id} display="block" withBorder radius="md">
            {openIds.includes(question.id) || problemCount(index) > 0
              ? openEditor(question, index)
              : closedRow(question, index)}
          </Paper>
        ))}
      </Stack>
      {errorText(form.errors.questions) && (
        <Text c="var(--mantine-color-error)" fz={13} mt={10}>
          {errorText(form.errors.questions)}
        </Text>
      )}
      <Button variant="default" mt={14} onClick={addQuestion}>
        Add question
      </Button>
    </>
  );
};
