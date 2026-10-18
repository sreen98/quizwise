import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Fieldset,
  Flex,
  Group,
  NumberInput,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
  Title
} from '@mantine/core';
import { schemaResolver, useForm, type UseFormReturnType } from '@mantine/form';
import { IconArrowLeft } from '@tabler/icons-react';
import { useState, type SubmitEvent } from 'react';
import { Link } from 'react-router';
import { quizInputSchema } from '../../data/schema';
import { useUnsavedChangesPrompt } from '../../hooks/useUnsavedChangesPrompt';
import type { QuizInput } from '../../types/models';
import { ChipMultiSelect } from '../ChipMultiSelect';
import { Flag } from '../Flag';
import { QuestionBuilder } from '../QuestionBuilder';
import { newQuestion } from '../QuestionBuilder/newQuestion';
import classes from './QuizForm.module.css';
import type { QuizFormProps } from './types';

type LimitField = 'timeLimitSeconds' | 'perQuestionSeconds';

interface LimitRow {
  field: LimitField;
  label: string;
  unit: string;
  inputLabel: string;
  secondsPerUnit: number;
  defaultSeconds: number;
}

const limitRows: LimitRow[] = [
  {
    field: 'timeLimitSeconds',
    label: 'Whole quiz',
    unit: 'min',
    inputLabel: 'Minutes for the whole quiz',
    secondsPerUnit: 60,
    defaultSeconds: 300
  },
  {
    field: 'perQuestionSeconds',
    label: 'Each question',
    unit: 'sec',
    inputLabel: 'Seconds for each question',
    secondsPerUnit: 1,
    defaultSeconds: 30
  }
];

const limitInput = (form: UseFormReturnType<QuizInput>, row: LimitRow) => {
  const seconds = form.values[row.field];

  return (
    <Box key={row.field}>
      <Group gap={12} wrap="nowrap" mih={44}>
        <Checkbox
          label={row.label}
          checked={seconds !== null}
          onChange={event => {
            form.setFieldValue(row.field, event.currentTarget.checked ? row.defaultSeconds : null);
          }}
          flex={1}
        />
        <NumberInput
          aria-label={row.inputLabel}
          value={seconds === null ? '' : seconds / row.secondsPerUnit}
          onChange={value => {
            form.setFieldValue(row.field, typeof value === 'number' ? value * row.secondsPerUnit : 0);
          }}
          disabled={seconds === null}
          error={Boolean(form.errors[row.field])}
          allowDecimal={false}
          allowNegative={false}
          hideControls
          w={80}
          ff="monospace"
        />
        <Text c="dimmed" fz={14} w={30}>
          {row.unit}
        </Text>
      </Group>
      {form.errors[row.field] && (
        <Text c="var(--mantine-color-error)" fz={13}>
          {form.errors[row.field]}
        </Text>
      )}
    </Box>
  );
};

const DETAIL_FIELDS = ['title', 'description', 'countries', 'timeLimitSeconds', 'perQuestionSeconds'];

const showFirstError = (formElement: HTMLFormElement | null) => {
  setTimeout(() => {
    const target = formElement?.querySelector<HTMLElement>('[aria-invalid="true"], [data-form-error]');
    if (target?.matches('[aria-invalid="true"]')) target.focus();
    else target?.scrollIntoView({ block: 'center' });
  }, 0);
};

export const QuizForm = ({ initialValues, countries, isNew, onSubmit }: QuizFormProps) => {
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'details' | 'questions'>(isNew ? 'details' : 'questions');
  const form = useForm<QuizInput>({
    mode: 'controlled',
    initialValues,
    validate: schemaResolver(quizInputSchema, { sync: true })
  });
  useUnsavedChangesPrompt(form.isDirty() && !saving);

  const handleSubmit = async (values: QuizInput) => {
    setSaving(true);
    try {
      await onSubmit(values);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const hasErrors = DETAIL_FIELDS.map(field => form.validateField(field).hasError).some(Boolean);
    if (hasErrors) {
      showFirstError(formElement);
      return;
    }
    if (form.values.questions.length === 0) form.insertListItem('questions', newQuestion());
    setStep('questions');
  };

  const handleSave = form.onSubmit(
    values => void handleSubmit(values),
    (_errors, _values, event) => {
      showFirstError(event?.target instanceof HTMLFormElement ? event.target : null);
    }
  );

  const details = (
    <Stack gap={20}>
      <TextInput label="Title" withAsterisk {...form.getInputProps('title')} />
      <Textarea label="Description" autosize minRows={3} {...form.getInputProps('description')} />
      <Fieldset legend="Time limit" variant="unstyled" p={0}>
        <Stack gap={4}>
          {limitRows.map(row => limitInput(form, row))}
          <Text c="dimmed" fz={13}>
            Use one or both. With both, a question ends when either runs out.
          </Text>
        </Stack>
      </Fieldset>
      <Switch
        label="Allow retakes"
        labelPosition="left"
        {...form.getInputProps('retakesAllowed', { type: 'checkbox' })}
      />
      <ChipMultiSelect
        label="Available in"
        placeholder="Search countries"
        data={countries.map(country => ({ value: country.code, label: country.name }))}
        nothingFoundMessage="No countries found"
        {...form.getInputProps('countries')}
        value={form.values.countries}
        renderIcon={code => <Flag code={code} />}
      />
    </Stack>
  );

  return (
    <Box component="form" noValidate onSubmit={step === 'details' ? handleNext : handleSave}>
      <Flex
        pos="sticky"
        top={{ base: 60, sm: 68 }}
        bg="var(--bg)"
        wrap="wrap"
        align="center"
        justify="space-between"
        gap={12}
        py={12}
        mt={-12}
        mb={12}
        className={classes.toolbar}
      >
        <Group gap={8} wrap="nowrap" miw={0}>
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
          {form.isDirty() && <Badge color="orange">Unsaved changes</Badge>}
        </Group>
        <Group gap={12} justify="space-between" w={{ base: '100%', sm: 'auto' }}>
          <Button component={Link} to="/admin" variant="default">
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {step === 'details' ? 'Next' : isNew ? 'Create quiz' : 'Save quiz'}
          </Button>
        </Group>
      </Flex>

      {step === 'details' ? (
        <Card
          component="section"
          aria-label="Details"
          withBorder
          radius="lg"
          p={{ base: 16, sm: 24 }}
          maw={560}
          mx="auto"
        >
          {details}
        </Card>
      ) : (
        <Flex wrap="wrap" gap={24} align="flex-start">
          <Card
            component="section"
            aria-label="Details"
            withBorder
            radius="lg"
            p={{ base: 16, sm: 24 }}
            flex="1 1 340px"
          >
            {details}
          </Card>
          <Card
            component="section"
            aria-labelledby="questions-title"
            className={classes.questions}
            withBorder
            radius="lg"
            p={{ base: 16, sm: 24 }}
            flex="999 1 560px"
            miw={0}
          >
            <QuestionBuilder form={form} />
          </Card>
        </Flex>
      )}
    </Box>
  );
};
