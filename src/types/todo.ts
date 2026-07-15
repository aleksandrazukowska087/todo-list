export type Priority = 'low' | 'medium' | 'high';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  deadline: string | null;
  tags: string[];
  position: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export type FilterType = 'all' | 'active' | 'completed';

export interface AppState {
  todos: Todo[];
  filter: FilterType;
  isLoading: boolean;
  error: string | null;
}
