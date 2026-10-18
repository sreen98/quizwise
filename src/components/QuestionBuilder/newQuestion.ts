import type { Question } from '../../types/models';

export const newQuestion = (): Question => ({
  id: crypto.randomUUID(),
  text: '',
  type: 'single',
  options: [
    { id: crypto.randomUUID(), text: '' },
    { id: crypto.randomUUID(), text: '' }
  ],
  correctOptionIds: []
});
