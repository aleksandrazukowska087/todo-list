'use client';

import type { Todo } from '@/types/todo';
import './TodoApp.scss';

interface TodoAppProps {
  initialTodos: Todo[];
}

export function TodoApp({ initialTodos }: TodoAppProps) {
  return (
    <div className="todo-app">
      <header className="todo-app__header">
        <h1 className="todo-app__title">Todo List</h1>
        <p className="todo-app__subtitle">
          {initialTodos.length === 0
            ? 'Brak zadań — dodaj pierwsze w kolejnych fazach'
            : `Załadowano ${initialTodos.length} zadań`}
        </p>
      </header>

      {initialTodos.length > 0 && (
        <ul className="todo-app__list">
          {initialTodos.map((todo) => (
            <li key={todo.id} className="todo-app__item">
              <span className="todo-app__item-title">{todo.title}</span>
              {todo.completed && <span className="todo-app__item-badge">ukończone</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
