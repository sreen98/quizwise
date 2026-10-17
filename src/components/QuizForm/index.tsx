import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
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
import { useState } from 'react';
import { Link } from 'react-router';
import { quizInputSchema } from '../../data/schema';
import type { QuizInput } from '../../types/models';
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

export const QuizForm = ({ initialValues, countries, isNew, onSubmit }: QuizFormProps) => {
  const [saving, setSaving] = useState(false);
  const form = useForm<QuizInput>({
    mode: 'controlled',
    initialValues,
    validate: schemaResolver(quizInputSchema, { sync: true })
  });

  const handleSubmit = async (values: QuizInput) => {
    setSaving(true);
    try {
      await onSubmit(values);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box component="form" noValidate onSubmit={form.onSubmit(values => void handleSubmit(values))}>
      <Text component="nav" aria-label="Breadcrumb" fz={14} mb={6}>
        <Anchor component={Link} to="/admin" fw={600} display="inline-block" lh="44px">
          Manage quizzes
        </Anchor>{' '}
        <Text component="span" c="dimmed" inherit>
          / {isNew ? 'New quiz' : 'Edit quiz'}
        </Text>
      </Text>
      <Group gap={14} mb={24}>
        <Title order={1} fz={{ base: 28, sm: 32 }} lts="-0.01em">
          {isNew ? 'New quiz' : 'Edit quiz'}
        </Title>
        {form.isDirty() && <Badge color="orange">Unsaved changes</Badge>}
      </Group>

      <Flex wrap="wrap" gap={24} align="flex-start">
        <Card component="section" aria-labelledby="details-title" withBorder radius="lg" p={24} flex="1 1 340px">
          <Title id="details-title" order={2} fz={18} mb={20}>
            Details
          </Title>
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
            <Fieldset legend="Available in" variant="unstyled" p={0}>
              <Chip.Group
                multiple
                value={form.values.countries}
                onChange={value => {
                  form.setFieldValue('countries', value);
                }}
              >
                <Group gap={8}>
                  {countries.map(country => (
                    <Chip key={country.code} value={country.code}>
                      {country.name}
                    </Chip>
                  ))}
                </Group>
              </Chip.Group>
              {form.errors.countries && (
                <Text c="var(--mantine-color-error)" fz={13} mt={6}>
                  {form.errors.countries}
                </Text>
              )}
            </Fieldset>
          </Stack>
        </Card>

        <Card
          component="section"
          aria-labelledby="questions-title"
          withBorder
          radius="lg"
          p={24}
          flex="999 1 560px"
          miw={0}
        >
          <Title id="questions-title" order={2} fz={18} mb={18}>
            Questions{' '}
            <Text component="span" c="dimmed" fw={600} inherit>
              ({form.values.questions.length})
            </Text>
          </Title>
          {form.values.questions.length === 0 ? (
            <Text c="dimmed">No questions yet.</Text>
          ) : (
            <Stack component="ol" gap={10} m={0} p={0}>
              {form.values.questions.map((question, index) => (
                <Group
                  component="li"
                  key={question.id}
                  display="flex"
                  gap={12}
                  wrap="nowrap"
                  px={14}
                  py={12}
                  bd="1px solid var(--mantine-color-default-border)"
                  bdrs="md"
                >
                  <Text ff="monospace" c="dimmed" fw={700} w={24}>
                    {index + 1}
                  </Text>
                  <Text fw={600} flex={1} miw={0}>
                    {question.text}
                  </Text>
                  <Badge variant="default">{question.type === 'single' ? 'Single' : 'Multiple'}</Badge>
                </Group>
              ))}
            </Stack>
          )}
          {form.errors.questions && (
            <Text c="var(--mantine-color-error)" fz={13} mt={10}>
              {form.errors.questions}
            </Text>
          )}
        </Card>
      </Flex>

      <Group justify="flex-end" gap={12} mt={24} mb={8}>
        <Button component={Link} to="/admin" variant="default">
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {isNew ? 'Create quiz' : 'Save quiz'}
        </Button>
      </Group>
    </Box>
  );
};
