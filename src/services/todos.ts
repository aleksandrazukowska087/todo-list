import type { SupabaseClient } from '@supabase/supabase-js';
import type { Todo } from '@/types/todo';

export async function getTodos(supabase: SupabaseClient): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .order('position', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Todo[];
}
