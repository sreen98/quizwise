export interface UserOption {
  value: string;
  label: string;
}

export interface UserSelectProps {
  userOptions: UserOption[];
  onDone?: () => void;
}
