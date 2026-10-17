import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  Fieldset,
  Group,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  UnstyledButton
} from '@mantine/core';
import { IconArrowDown, IconArrowUp, IconTrash, IconX } from '@tabler/icons-react';
import { formatCount } from '../../format';
import type { QuestionType } from '../../types/models';
import type { QuestionEditorProps } from './types';

const typeOptions: { value: QuestionType; label: string }[] = [
  { value: 'single', label: 'Single choice' },
  { value: 'multiple', label: 'Multiple choice' }
];

const isQuestionType = (value: string): value is QuestionType => value === 'single' || value === 'multiple';

const errorText = (error: unknown) => (typeof error === 'string' ? error : null);

export const QuestionEditor = ({ form, question, index, total, onClose, handle }: QuestionEditorProps) => {
  const number = String(index + 1);
  const path = `questions.${String(index)}`;
  const problems = Object.keys(form.errors).filter(key => key.startsWith(`${path}.`)).length;

  const changeType = (type: QuestionType) => {
    form.setFieldValue(`${path}.type`, type);
    if (type === 'single') form.setFieldValue(`${path}.correctOptionIds`, question.correctOptionIds.slice(0, 1));
  };

  const toggleCorrect = (optionId: string, isCorrect: boolean) => {
    const others = question.correctOptionIds.filter(id => id !== optionId);
    form.setFieldValue(
      `${path}.correctOptionIds`,
      isCorrect ? [...(question.type === 'single' ? [] : others), optionId] : others
    );
  };

  const removeOption = (optionIndex: number, optionId: string) => {
    form.removeListItem(`${path}.options`, optionIndex);
    form.setFieldValue(
      `${path}.correctOptionIds`,
      question.correctOptionIds.filter(id => id !== optionId)
    );
  };

  return (
    <Box>
      <Group gap={0} wrap="nowrap" px={4} py={6}>
        {handle}
        <UnstyledButton onClick={onClose} aria-expanded flex={1} mih={44} px={6} miw={0}>
          <Group gap={10} wrap="nowrap">
            <Text fw={700}>Question {number}</Text>
            {problems > 0 && <Badge color="orange">{formatCount(problems, 'problem')}</Badge>}
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
          disabled={index === total - 1}
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

      <Stack gap={18} px={{ base: 14, sm: 20 }} pt={8} pb={{ base: 14, sm: 20 }}>
        <Group gap={16} align="flex-start" wrap="wrap">
          <TextInput label="Question text" flex="1 1 260px" {...form.getInputProps(`${path}.text`)} />
          <Fieldset legend="Answer type" variant="unstyled" p={0} w={{ base: '100%', sm: 'auto' }}>
            <SegmentedControl
              fullWidth
              data={typeOptions}
              value={question.type}
              onChange={value => {
                if (isQuestionType(value)) changeType(value);
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
                        toggleCorrect(option.id, event.currentTarget.checked);
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
                      removeOption(optionIndex, option.id);
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
              form.insertListItem(`${path}.options`, { id: crypto.randomUUID(), text: '' });
            }}
          >
            Add option
          </Button>
        </Fieldset>
      </Stack>
    </Box>
  );
};
