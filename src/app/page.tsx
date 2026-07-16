import { TodoApp } from '@/components/TodoApp/TodoApp';
import { createClient } from '@/lib/supabase/server';
import { getTodos } from '@/services/todos';
import type { Todo } from '@/types/todo';

async function loadInitialTodos(): Promise<{ todos: Todo[]; error: string | null }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes('your-project') || key.includes('your-anon')) {
    return { todos: [], error: 'Brak konfiguracji Supabase w .env.local' };
  }

  try {
    const supabase = await createClient();
    const todos = await getTodos(supabase);
    return { todos, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Nieznany błąd pobierania zadań';
    console.error('[todos] SSR fetch failed:', message);
    return { todos: [], error: message };
  }
}

export default async function HomePage() {
  const { todos, error } = await loadInitialTodos();

  return <TodoApp initialTodos={todos} error={error} />;
}
