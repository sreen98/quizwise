import { Card, Fieldset, Text, Title } from '@mantine/core';
import { OptionList } from '../OptionList';
import type { QuestionViewProps } from './types';

export const QuestionView = ({ question, value, onChange }: QuestionViewProps) => {
  return (
    <Card component="section" aria-labelledby="question-text" withBorder radius="lg" p={{ base: 20, sm: 36 }}>
      <Fieldset
        variant="unstyled"
        p={0}
        legend={
          <Title id="question-text" order={1} tabIndex={-1} fz={{ base: 22, sm: 28 }} lh={1.25} lts="-0.01em">
            {question.text}
          </Title>
        }
      >
        <Text c="dimmed" fz={{ base: 14, sm: 15 }} mt={10} mb={24}>
          {question.type === 'multiple' ? 'Multiple choice · Select all that apply' : 'Single choice · Pick one'}
        </Text>
        <OptionList type={question.type} options={question.options} value={value} onChange={onChange} />
      </Fieldset>
    </Card>
  );
};
