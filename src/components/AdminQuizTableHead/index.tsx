import { Table, VisuallyHidden } from '@mantine/core';

const columns = [
  { label: 'Title', width: undefined, isNumber: false },
  { label: 'Questions', width: 110, isNumber: true },
  { label: 'Timer', width: 160, isNumber: false },
  { label: 'Retakes', width: 90, isNumber: false },
  { label: 'Countries', width: 150, isNumber: false },
  { label: 'Attempts', width: 100, isNumber: true }
];

export const AdminQuizTableHead = () => {
  return (
    <Table.Thead>
      <Table.Tr>
        {columns.map(({ label, width, isNumber }) => (
          <Table.Th
            key={label}
            w={width}
            ta={isNumber ? 'right' : undefined}
            fz={12}
            fw={700}
            tt="uppercase"
            lts="0.06em"
            c="dimmed"
          >
            {label}
          </Table.Th>
        ))}
        <Table.Th w={170}>
          <VisuallyHidden>Actions</VisuallyHidden>
        </Table.Th>
      </Table.Tr>
    </Table.Thead>
  );
};
