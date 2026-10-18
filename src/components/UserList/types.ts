import type { UserOption } from '../UserSelect/types';

export interface UserListProps {
  userOptions: UserOption[];
  onDone: () => void;
}
