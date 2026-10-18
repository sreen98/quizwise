import { Button, Code, FileButton, Group, List, Modal, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useRef, useState } from 'react';
import { downloadJson, jsonFileName } from '../../download';
import { exampleQuiz, fieldNotes } from './data';
import type { ImportQuizButtonProps } from './types';

const MAX_FILE_BYTES = 1024 * 1024;

const showProblems = (problems: string[]) => {
  modals.open({
    title: "Couldn't import this file",
    children: (
      <List size="sm" spacing={6}>
        {problems.map(problem => (
          <List.Item key={problem}>{problem}</List.Item>
        ))}
      </List>
    )
  });
};

export const ImportQuizButton = ({ onImport }: ImportQuizButtonProps) => {
  const [importing, setImporting] = useState(false);
  const [opened, { open, close }] = useDisclosure();
  const resetRef = useRef<() => void>(null);

  const handleFile = async (file: File | null) => {
    resetRef.current?.();
    if (!file) return;
    close();
    if (file.size > MAX_FILE_BYTES) {
      showProblems(['This file is too large. The limit is 1 MB.']);
      return;
    }

    setImporting(true);
    try {
      const result = await onImport(await file.text());
      if (result.isImported) notifications.show({ message: `${result.title} imported` });
      else showProblems(result.problems);
    } catch {
      showProblems(["This file couldn't be read."]);
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Button variant="default" loading={importing} onClick={open}>
        Import JSON
      </Button>
      <Modal opened={opened} onClose={close} title="Import a quiz" size="lg">
        <Stack gap={14}>
          <Text size="sm">
            Upload a .json file with one quiz. It is added as a new quiz. The quickest start is to export a quiz and
            edit the file, or to download the example below.
          </Text>
          <List size="sm" spacing={4}>
            {fieldNotes.map(({ field, note }) => (
              <List.Item key={field}>
                <Code>{field}</Code> {note}
              </List.Item>
            ))}
          </List>
          <Text size="sm" fw={600} mb={-8}>
            Example file
          </Text>
          <Code block mah={220} fz={12}>
            {JSON.stringify(exampleQuiz, null, 2)}
          </Code>
          <Group justify="flex-end" gap={10}>
            <Button
              variant="default"
              onClick={() => {
                downloadJson(jsonFileName(exampleQuiz.title), exampleQuiz);
              }}
            >
              Download example
            </Button>
            <FileButton
              onChange={file => void handleFile(file)}
              accept="application/json,.json"
              resetRef={resetRef}
              inputProps={{ 'aria-label': 'Quiz file to import' }}
            >
              {props => <Button {...props}>Choose file</Button>}
            </FileButton>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};
