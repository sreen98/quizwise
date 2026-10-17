import { Button, FileButton, List } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useRef, useState } from 'react';
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
  const resetRef = useRef<() => void>(null);

  const handleFile = async (file: File | null) => {
    resetRef.current?.();
    if (!file) return;
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
    <FileButton
      onChange={file => void handleFile(file)}
      accept="application/json,.json"
      resetRef={resetRef}
      inputProps={{ 'aria-label': 'Quiz file to import' }}
    >
      {props => (
        <Button variant="default" loading={importing} {...props}>
          Import JSON
        </Button>
      )}
    </FileButton>
  );
};
