import type { ImportResult } from '../../service/types';

export interface ImportQuizButtonProps {
  onImport: (json: string) => Promise<ImportResult>;
}
