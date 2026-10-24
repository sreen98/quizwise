export interface GlobalBoardProps {
  limit: number;
  userId: string;
  page: number;
  onPageChange: (page: number) => void;
}
