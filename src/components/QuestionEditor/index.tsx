import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  Fieldset,
  Group,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconChevronUp, IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { formatCount } from '../../format';
import type { QuestionType } from '../../types/models';
import type { QuestionEditorProps } from './types';

const errorText = (error: unknown) => (typeof error === 'string' ? error : null);

export const QuestionEditor = ({ form, question, index, onClose, handle }: QuestionEditorProps) => {
  const number = String(index + 1);
  const path = `questions.${String(index)}`;
  const problems = Object.keys(form.errors).filter(key => key.startsWith(`${path}.`)).length;
  const canRemoveOption = question.options.length > 2;

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

  const deleteQuestion = () => {
    const hasContent = question.text.trim() !== '' || question.options.some(option => option.text.trim() !== '');
    if (!hasContent) {
      form.removeListItem('questions', index);
      return;
    }
    modals.openConfirmModal({
      title: 'Delete question?',
      children: <Text size="sm">Its text, options and correct answers will be removed.</Text>,
      labels: { confirm: 'Yes', cancel: 'Cancel' },
      confirmProps: { color: 'orange' },
      onConfirm: () => {
        form.removeListItem('questions', index);
      }
    });
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
          aria-label={`Delete question ${number}`}
          onClick={deleteQuestion}
        >
          <IconTrash size={18} aria-hidden />
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          color="gray"
          size={44}
          aria-label={`Collapse question ${number}`}
          onClick={onClose}
        >
          <IconChevronUp size={18} aria-hidden />
        </ActionIcon>
      </Group>

      <Stack gap={18} px={{ base: 14, sm: 20 }} pt={8} pb={{ base: 14, sm: 20 }}>
        <TextInput id={`${question.id}-text`} label="Question text" {...form.getInputProps(`${path}.text`)} />
        <Switch
          label="Allow multiple answers"
          checked={question.type === 'multiple'}
          onChange={event => {
            changeType(event.currentTarget.checked ? 'multiple' : 'single');
          }}
        />

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
                  <Group component="label" gap={8} wrap="nowrap" justify="center" mih={44} miw={44}>
                    <Checkbox
                      aria-label={`Option ${optionNumber} is correct`}
                      checked={question.correctOptionIds.includes(option.id)}
                      onChange={event => {
                        toggleCorrect(option.id, event.currentTarget.checked);
                      }}
                    />
                    <Text fz={14} visibleFrom="sm">
                      Correct
                    </Text>
                  </Group>
                  <Tooltip
                    label="A question needs at least 2 options"
                    disabled={canRemoveOption}
                    events={{ hover: true, focus: true, touch: false }}
                  >
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size={44}
                      aria-label={`Remove option ${optionNumber}`}
                      aria-disabled={!canRemoveOption}
                      data-disabled={!canRemoveOption || undefined}
                      onClick={() => {
                        if (canRemoveOption) removeOption(optionIndex, option.id);
                      }}
                    >
                      <IconX size={18} aria-hidden />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              );
            })}
          </Stack>
          {[errorText(form.errors[`${path}.options`]), errorText(form.errors[`${path}.correctOptionIds`])]
            .filter(message => message !== null)
            .map(message => (
              <Text key={message} c="var(--mantine-color-error)" fz={13} mt={6} data-form-error>
                {message}
              </Text>
            ))}
          <Button
            variant="default"
            mt={12}
            leftSection={<IconPlus size={16} aria-hidden />}
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
