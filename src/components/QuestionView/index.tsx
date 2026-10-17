import { Card, Fieldset, Text, Title } from '@mantine/core';
import { useEffect, useRef } from 'react';
import { OptionList } from '../OptionList';
import classes from './QuestionView.module.css';
import type { QuestionViewProps } from './types';

export const QuestionView = ({ question, value, onChange }: QuestionViewProps) => {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <Card
      component="section"
      aria-labelledby="question-text"
      className={classes.card}
      withBorder
      radius="lg"
      p={{ base: 20, sm: 36 }}
    >
      <Fieldset
        variant="unstyled"
        p={0}
        legend={
          <Title
            ref={headingRef}
            id="question-text"
            className={classes.heading}
            order={1}
            tabIndex={-1}
            fz={{ base: 22, sm: 28 }}
            lh={1.25}
            lts="-0.01em"
          >
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
