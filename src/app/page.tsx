import { TodoApp } from '@/components/TodoApp/TodoApp';
import { createClient } from '@/lib/supabase/server';
import { getTodos } from '@/services/todos';
import type { Todo } from '@/types/todo';

async function loadInitialTodos(): Promise<Todo[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes('your-project') || key.includes('your-anon')) {
    return [];
  }

  try {
    const supabase = await createClient();
    return await getTodos(supabase);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const todos = await loadInitialTodos();

  return <TodoApp initialTodos={todos} />;
}
