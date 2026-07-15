# Plan projektu: Todo List

## 1. Cel projektu

Stworzenie pełnej, nowoczesnej i responsywnej aplikacji do zarządzania zadaniami (todo list) z wykorzystaniem **Next.js**, **TypeScript**, **React**, **SCSS** i **Supabase**. Produkt obejmuje autentykację, synchronizację w czasie rzeczywistym i komplet funkcji do codziennego użytku.

---

## 2. Stack technologiczny

| Warstwa | Technologia | Uzasadnienie |
|---------|-------------|--------------|
| Framework | Next.js 15+ (App Router) | Routing, SSR/SSG, optymalizacja, deploy na Vercel |
| UI | React 19+ | Komponentowy model, Server/Client Components |
| Język | TypeScript | Bezpieczeństwo typów, lepsze DX |
| Stylowanie | SCSS | Zmienne, mixiny, BEM, importy partiali |
| Stan lokalny | React hooks (`useState`, `useReducer`) | Zarządzanie stanem UI, filtrami i optimistic updates |
| Autentykacja | Supabase Auth | Konta użytkowników, izolacja danych (RLS) |
| Baza danych | Supabase (PostgreSQL) | Trwała persystencja, realtime, skalowalność |
| Klient DB | `@supabase/supabase-js` + `@supabase/ssr` | Integracja z Next.js (Server + Client Components) |
| Testy | Vitest + React Testing Library | Szybkie testy jednostkowe i komponentów |
| Linting (TS/JS/JSON) | Biome | Lint + format w jednym narzędziu |
| Linting (SCSS) | Stylelint | Walidacja stylów, konwencje SCSS |

---

## 3. Zakres funkcjonalny

### CRUD i lista zadań

- [ ] Dodawanie nowego zadania (pole tekstowe + Enter / przycisk)
- [ ] Oznaczanie zadania jako ukończone / nieukończone
- [ ] Edycja istniejącego zadania (inline)
- [ ] Usuwanie pojedynczego zadania
- [ ] Filtrowanie listy: **Wszystkie** / **Aktywne** / **Ukończone**
- [ ] Licznik pozostałych aktywnych zadań
- [ ] Przycisk „Wyczyść ukończone"
- [ ] Wyszukiwarka zadań
- [ ] Drag & drop do zmiany kolejności

### Priorytety, terminy i organizacja

- [ ] Priorytety zadań (niski / średni / wysoki)
- [ ] Terminy (deadline) z wizualnym oznaczeniem przeterminowanych
- [ ] Kategorie / tagi

### Autentykacja i dane

- [ ] Rejestracja i logowanie (Supabase Auth — email)
- [ ] Każdy użytkownik widzi wyłącznie swoje zadania (RLS)
- [ ] Automatyczna synchronizacja z Supabase (PostgreSQL)
- [ ] Realtime — live sync listy między urządzeniami
- [ ] Ładowanie początkowych danych po stronie serwera (SSR)

### UI i UX

- [ ] Responsywny layout (mobile-first)
- [ ] Tryb ciemny / jasny
- [ ] Stany ładowania, błędów i pustej listy
- [ ] Wielojęzyczność (i18n — PL / EN)

---

## 4. Model danych

### 4.1 TypeScript (`types/todo.ts`)

```typescript
type Priority = 'low' | 'medium' | 'high';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  deadline: string | null;  // ISO 8601 lub null
  tags: string[];
  position: number;         // Kolejność (drag & drop)
  created_at: string;
  updated_at: string;
  user_id: string;          // Powiązanie z Supabase Auth
}

type FilterType = 'all' | 'active' | 'completed';

interface AppState {
  todos: Todo[];
  filter: FilterType;
  isLoading: boolean;
  error: string | null;
}
```

### 4.2 Schemat bazy (Supabase / PostgreSQL)

```sql
-- supabase/migrations/001_create_todos.sql

create type public.todo_priority as enum ('low', 'medium', 'high');

create table public.todos (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) <= 200),
  completed   boolean not null default false,
  priority    public.todo_priority not null default 'medium',
  deadline    timestamptz,
  tags        text[] not null default '{}',
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  user_id     uuid not null references auth.users(id) on delete cascade
);

-- Trigger: automatyczna aktualizacja updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger todos_updated_at
  before update on public.todos
  for each row execute function public.handle_updated_at();

-- Row Level Security — dostęp tylko do własnych zadań
alter table public.todos enable row level security;

create policy "Users can view own todos" on public.todos
  for select using (auth.uid() = user_id);

create policy "Users can insert own todos" on public.todos
  for insert with check (auth.uid() = user_id);

create policy "Users can update own todos" on public.todos
  for update using (auth.uid() = user_id);

create policy "Users can delete own todos" on public.todos
  for delete using (auth.uid() = user_id);
```

> **Uwaga:** Wymaga włączonego Supabase Auth. Przy `insert` pole `user_id` ustawiane na `auth.uid()`.

### 4.3 Zmienne środowiskowe (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

---

## 5. Struktura projektu

```
todo-list/
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout, metadata, globalne style
│   │   ├── page.tsx             # Server Component — fetch todos z Supabase
│   │   ├── login/
│   │   │   └── page.tsx         # Strona logowania
│   │   ├── register/
│   │   │   └── page.tsx         # Strona rejestracji
│   │   └── globals.scss         # Globalne style (import zmiennych + reset)
│   ├── middleware.ts            # Ochrona tras — redirect do /login
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # Klient Supabase (Client Components)
│   │   │   └── server.ts        # Klient Supabase (Server Components)
│   │   └── i18n/                # Tłumaczenia PL / EN
│   ├── services/
│   │   ├── todos.ts             # CRUD + realtime
│   │   └── auth.ts              # Logowanie, rejestracja, wylogowanie
│   ├── components/
│   │   ├── TodoApp/
│   │   │   ├── TodoApp.tsx      # 'use client' — główny kontener aplikacji
│   │   │   └── TodoApp.scss
│   │   ├── Header/
│   │   │   ├── Header.tsx
│   │   │   └── Header.scss
│   │   ├── TodoForm/
│   │   │   ├── TodoForm.tsx
│   │   │   └── TodoForm.scss
│   │   ├── TodoList/
│   │   │   ├── TodoList.tsx
│   │   │   └── TodoList.scss
│   │   ├── TodoItem/
│   │   │   ├── TodoItem.tsx
│   │   │   └── TodoItem.scss
│   │   ├── TodoFilter/
│   │   │   ├── TodoFilter.tsx
│   │   │   └── TodoFilter.scss
│   │   ├── TodoSearch/
│   │   │   ├── TodoSearch.tsx
│   │   │   └── TodoSearch.scss
│   │   ├── TodoFooter/
│   │   │   ├── TodoFooter.tsx
│   │   │   └── TodoFooter.scss
│   │   └── AuthForm/
│   │       ├── AuthForm.tsx
│   │       └── AuthForm.scss
│   ├── hooks/
│   │   ├── useTodos.ts          # CRUD + filtry + realtime + optimistic updates
│   │   └── useTheme.ts          # Tryb ciemny / jasny
│   ├── types/
│   │   └── todo.ts              # Interfejsy i typy
│   ├── utils/
│   │   └── validators.ts        # Walidacja tytułu zadania
│   └── styles/
│       ├── _variables.scss      # Kolory, fonty, breakpointy
│       ├── _mixins.scss         # Media queries, flex helpers
│       └── _reset.scss          # CSS reset / normalize
├── supabase/
│   └── migrations/
│       └── 001_create_todos.sql # Schemat tabeli + RLS
├── .env.local.example
├── next.config.ts
├── package.json
├── tsconfig.json
├── biome.json
├── .stylelintrc.json
└── PLAN.md
```

---

## 6. Architektura komponentów (Next.js App Router)

```
app/layout.tsx                # Server Component — HTML shell, metadata
app/page.tsx                  # Server Component — fetch todos → <TodoApp initialTodos={...} />
└── TodoApp ('use client')    # Client Component — stan, mutacje, hooki
    ├── Header
    ├── TodoForm
    ├── TodoFilter
    ├── TodoList
    │   └── TodoItem (×N)
    └── TodoFooter
```

### Server vs Client Components

| Plik | Typ | Powód |
|------|-----|-------|
| `layout.tsx` | Server | Metadata, `<html>`, `<body>`, globalne style |
| `page.tsx` | Server | Pobranie listy zadań z Supabase (SSR) |
| `TodoApp` + reszta UI | Client (`'use client'`) | Hooki, mutacje CRUD, interakcje użytkownika |

### Przepływ danych

```
page.tsx (Server)
    ↓ fetch — services/todos.getTodos()
Supabase (PostgreSQL)
    ↓ initialTodos
TodoApp (Client) → useTodos
    ↓ mutacje CRUD
services/todos → Supabase Client → PostgreSQL
```

Logika biznesowa pozostaje w hookach — komponenty są „głupie" i odpowiadają wyłącznie za renderowanie i przekazywanie zdarzeń.

---

## 7. Warstwa danych — `services/todos.ts` i `useTodos`

### 7.1 Serwis Supabase (`services/todos.ts`)

| Akcja | Funkcja | Opis |
|-------|---------|------|
| Pobierz wszystkie | `getTodos()` | `select * from todos order by created_at desc` |
| Dodaj | `createTodo(title)` | `insert` z walidacją tytułu |
| Edytuj | `updateTodo(id, title)` | `update` tytułu (trigger ustawia `updated_at`) |
| Toggle | `toggleTodo(id, completed)` | `update` pola `completed` |
| Usuń | `deleteTodo(id)` | `delete` pojedynczego rekordu |
| Wyczyść ukończone | `deleteCompletedTodos()` | `delete` where `completed = true` |

### 7.2 Hook `useTodos` — odpowiedzialności

| Akcja | Metoda | Opis |
|-------|--------|------|
| Inicjalizacja | `initialTodos` (prop) | Dane z SSR + lokalny stan |
| Dodaj | `addTodo(title)` | Optimistic update → `createTodo()` → rollback przy błędzie |
| Edytuj | `updateTodo(id, title)` | Optimistic update → `updateTodo()` |
| Toggle | `toggleTodo(id)` | Optimistic update → `toggleTodo()` |
| Usuń | `removeTodo(id)` | Optimistic update → `deleteTodo()` |
| Wyczyść | `clearCompleted()` | `deleteCompletedTodos()` |
| Filtruj | `setFilter(type)` | Lokalny filtr (bez requestu do API) |
| Pobierz | `filteredTodos` | Zwraca listę po filtrze |
| Stan UI | `isLoading`, `error` | Obsługa ładowania i błędów sieciowych |

---

## 8. Stylowanie (SCSS)

### 8.1 Zmienne (`_variables.scss`)

```scss
// Kolory
$color-primary: #646cff;
$color-danger: #e74c3c;
$color-success: #2ecc71;
$color-bg: #f8f9fa;
$color-text: #2c3e50;
$color-muted: #95a5a6;
$color-border: #dfe6e9;

// Typografia
$font-family: 'Inter', system-ui, sans-serif;
$font-size-base: 16px;
$font-size-sm: 14px;
$font-size-lg: 24px;

// Layout
$container-max-width: 600px;
$border-radius: 8px;
$spacing-unit: 8px;

// Breakpointy
$breakpoint-sm: 480px;
$breakpoint-md: 768px;
```

### 8.2 Konwencje SCSS

- Każdy komponent ma własny plik `*.scss` (zwykły SCSS, bez CSS Modules)
- Import w komponencie: `import './TodoItem.scss'`
- Globalne zmienne i mixiny importowane przez `@use`
- BEM w nazewnictwie klas (np. `.todo-item`, `.todo-item__title`, `.todo-item--completed`)
- Mobile-first: domyślne style na mobile, `@include respond-to(md)` dla większych ekranów

### 8.3 Mixin na media queries

```scss
@mixin respond-to($breakpoint) {
  @if $breakpoint == sm {
    @media (min-width: $breakpoint-sm) { @content; }
  } @else if $breakpoint == md {
    @media (min-width: $breakpoint-md) { @content; }
  }
}
```

---

## 9. Etapy realizacji

### Faza 1 — Inicjalizacja projektu (dzień 1)

- [ ] `npx create-next-app@latest . --typescript --app --src-dir --no-tailwind --import-alias "@/*"`
- [ ] Instalacja SCSS (`npm i -D sass`)
- [ ] Konfiguracja Biome (lint + format dla TS/TSX/JSON)
- [ ] Konfiguracja Stylelint (lint dla SCSS)
- [ ] Utworzenie projektu w [Supabase Dashboard](https://supabase.com/dashboard)
- [ ] Instalacja klienta Supabase (`npm i @supabase/supabase-js @supabase/ssr`)
- [ ] Plik `.env.local` + `.env.local.example`
- [ ] Migracja SQL: tabela `todos` + trigger `updated_at` + RLS
- [ ] `lib/supabase/client.ts` i `lib/supabase/server.ts`
- [ ] Utworzenie struktury folderów (`lib/`, `services/`, `components/`, `hooks/`, `types/`, `utils/`, `styles/`)
- [ ] Pliki globalnych stylów (`_variables`, `_mixins`, `_reset`) + `app/globals.scss`
- [ ] `layout.tsx` z metadata i importem `globals.scss`
- [ ] `page.tsx` — SSR fetch z Supabase + `TodoApp` z `initialTodos`

### Faza 2 — Autentykacja, typy i logika (dzień 2–3)

- [ ] Konfiguracja Supabase Auth (email + hasło)
- [ ] Strony `login` i `register` + middleware ochrony tras
- [ ] Definicja typów w `types/todo.ts`
- [ ] Serwis `services/todos.ts` — pełny CRUD na Supabase
- [ ] Hook `useTodos` z optimistic updates, realtime i obsługą błędów
- [ ] Utility: `validators`
- [ ] Testy jednostkowe serwisu i hooka (mock Supabase client)

### Faza 3 — Komponenty UI — rdzeń (dzień 4–5)

- [ ] `Header` — tytuł, przełącznik motywu, wylogowanie
- [ ] `TodoForm` — formularz z priorytetem, deadline i tagami
- [ ] `TodoItem` — checkbox, edycja inline, priorytet, deadline, tagi, usuń
- [ ] `TodoList` — drag & drop, mapowanie `filteredTodos` → `TodoItem`
- [ ] `TodoFilter` — przełączanie filtrów
- [ ] `TodoSearch` — wyszukiwarka zadań
- [ ] `TodoFooter` — licznik + czyszczenie ukończonych
- [ ] Stylowanie wszystkich komponentów

### Faza 4 — Realtime, i18n i UX (dzień 6–7)

- [ ] Subskrypcja Supabase Realtime na tabeli `todos`
- [ ] Tryb ciemny / jasny (CSS variables + `prefers-color-scheme`)
- [ ] Wielojęzyczność (i18n — PL / EN)
- [ ] Obsługa klawiatury (Enter, Escape, Tab)
- [ ] Stany ładowania, błędów i pustej listy
- [ ] Animacje przejść (fade in/out przy dodawaniu/usuwaniu)
- [ ] Dostępność (aria-labels, focus management)
- [ ] Testy komponentów (RTL)
- [ ] Responsywność — test na mobile i desktop

### Faza 5 — Build, testy i deploy (dzień 8–10)

- [ ] Testy E2E krytycznych ścieżek (logowanie, CRUD, filtry)
- [ ] `npm run build` — weryfikacja produkcyjnego buildu Next.js
- [ ] Deploy na Vercel z ustawionymi zmiennymi `NEXT_PUBLIC_SUPABASE_*`
- [ ] README z instrukcją uruchomienia

---

## 10. Wymagania niefunkcjonalne

| Wymaganie | Cel |
|-----------|-----|
| Czas ładowania (FCP) | < 1.5 s |
| Rozmiar bundla (gzip) | < 50 KB |
| Dostępność | WCAG 2.1 AA (minimum) |
| Przeglądarki | Chrome, Firefox, Safari, Edge (ostatnie 2 wersje) |
| TypeScript | `strict: true` w tsconfig |

---

## 11. Testy

### Testy jednostkowe (Vitest)

```
src/
├── services/
│   └── todos.test.ts
├── hooks/
│   └── useTodos.test.ts
├── utils/
│   └── validators.test.ts
└── components/
    ├── TodoForm.test.tsx
    ├── TodoItem.test.tsx
    └── TodoList.test.tsx
```

### Scenariusze testowe

| Scenariusz | Oczekiwany wynik |
|------------|------------------|
| Dodanie pustego zadania | Brak zmian w liście |
| Dodanie poprawnego zadania | Nowy element na liście |
| Toggle ukończenia | `completed` zmienia się na `true` |
| Filtrowanie „Active" | Ukryte ukończone zadania |
| `clearCompleted()` | Usunięte tylko ukończone |
| Reload strony | Dane pobrane z Supabase (SSR) |
| Błąd sieci przy zapisie | Rollback optimistic update + komunikat błędu |
| `clearCompleted()` | Usunięte rekordy w bazie Supabase |

---

## 12. Dostępność (a11y)

- `<label>` powiązany z inputem (lub `aria-label`)
- Checkboxy z `role="checkbox"` i `aria-checked`
- Przyciski usuwania z `aria-label="Usuń zadanie: {tytuł}"`
- Nawigacja klawiaturą (Tab, Enter, Escape)
- Wystarczający kontrast kolorów (min. 4.5:1)
- Focus visible na interaktywnych elementach

---

## 13. Komendy developerskie

```bash
# Instalacja zależności
npm install

# Dev server (http://localhost:3000)
npm run dev

# Build produkcyjny
npm run build

# Uruchomienie buildu produkcyjnego
npm run start

# Testy
npm run test

# Lint + format (Biome — TS/TSX/JSON)
npm run lint
npm run lint:fix
npm run format

# Lint stylów (Stylelint — SCSS)
npm run lint:styles
npm run lint:styles:fix
```

---

## 14. Konfiguracja lintingu

### 14.1 Biome (`biome.json`)

Biome zastępuje ESLint i Prettier — obsługuje linting i formatowanie w jednym narzędziu.

```bash
npm i -D @biomejs/biome
npx @biomejs/biome init
```

**Zakres:** pliki `.ts`, `.tsx`, `.json` w katalogu `src/` i plikach konfiguracyjnych.

**Skrypty w `package.json`:**

```json
{
  "scripts": {
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write ."
  }
}
```

**Kluczowe reguły:**

- `recommended: true` jako baza
- Włączone reguły React (hooki, JSX)
- Jednolity format: 2 spacje, single quotes, trailing commas
- Import type: `useImportType` — wymuszanie `import type` dla typów

### 14.2 Stylelint (`.stylelintrc.json`)

Stylelint pilnuje jakości i spójności plików SCSS.

```bash
npm i -D stylelint stylelint-config-standard-scss
```

**Przykładowa konfiguracja:**

```json
{
  "extends": ["stylelint-config-standard-scss"],
  "rules": {
    "selector-class-pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$",
    "custom-property-pattern": null,
    "scss/at-import-no-partial-leading-underscore": null,
    "declaration-block-no-redundant-longhand-properties": true,
    "no-descending-specificity": null
  }
}
```

**Skrypty w `package.json`:**

```json
{
  "scripts": {
    "lint:styles": "stylelint \"src/**/*.scss\"",
    "lint:styles:fix": "stylelint \"src/**/*.scss\" --fix"
  }
}
```

**Zakres:** wszystkie pliki `*.scss` w `src/`.

### 14.3 Integracja z edytorem

- **VS Code / Cursor:** rozszerzenie [Biome](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) — format on save
- **VS Code / Cursor:** rozszerzenie [Stylelint](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint) — podświetlanie błędów SCSS na żywo

---

## 15. Konfiguracja Next.js

### 15.1 `next.config.ts`

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // opcjonalnie: strict mode jest domyślnie włączony w React 19
};

export default nextConfig;
```

### 15.2 Metadata (`layout.tsx`)

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Todo List',
  description: 'Prosta aplikacja do zarządzania zadaniami',
};
```

### 15.3 Client Component — wzorzec

Komponenty używające hooków lub klienta Supabase muszą mieć dyrektywę `'use client'` na początku pliku:

```typescript
'use client';

import { useTodos } from '@/hooks/useTodos';
// ...
```

### 15.4 SCSS w Next.js

- Next.js obsługuje SCSS out of the box po instalacji `sass`
- Import styli komponentu: `import './TodoItem.scss'`
- Globalne style w `app/globals.scss` (importowane w `layout.tsx`)
- Partiale (`_variables.scss`) importowane przez `@use` w plikach komponentów
- Nazwy klas unikalne dzięki konwencji BEM (bez CSS Modules)

---

## 16. Konfiguracja Supabase

### 16.1 Instalacja

```bash
npm i @supabase/supabase-js @supabase/ssr
```

### 16.2 Klient serwerowy (`lib/supabase/server.ts`)

Używany w Server Components (`page.tsx`) do pobierania danych:

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### 16.3 Klient przeglądarkowy (`lib/supabase/client.ts`)

Używany w Client Components do mutacji CRUD:

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### 16.4 Fetch w `page.tsx` (SSR)

```typescript
import { createClient } from '@/lib/supabase/server';
import { getTodos } from '@/services/todos';
import { TodoApp } from '@/components/TodoApp/TodoApp';

export default async function HomePage() {
  const supabase = await createClient();
  const todos = await getTodos(supabase);

  return <TodoApp initialTodos={todos} />;
}
```

### 16.5 Przykład serwisu (`services/todos.ts`)

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Todo } from '@/types/todo';

export async function getTodos(supabase: SupabaseClient): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createTodo(
  supabase: SupabaseClient,
  title: string
): Promise<Todo> {
  const { data, error } = await supabase
    .from('todos')
    .insert({ title })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### 16.6 Setup w Supabase Dashboard

1. Utwórz nowy projekt na [supabase.com](https://supabase.com)
2. W **SQL Editor** uruchom migrację `001_create_todos.sql`
3. W **Settings → API** skopiuj `Project URL` i `anon public` key
4. Wklej do `.env.local`
5. Na Vercel dodaj te same zmienne w **Settings → Environment Variables**

---

## 17. Dalszy rozwój produktu

Po wdrożeniu pełnej wersji aplikacji można rozważyć:

| Potrzeba | Rozwiązanie |
|----------|-------------|
| Wiele list zadań | App Router — `app/lists/[id]/page.tsx` + tabela `lists` |
| OAuth (Google, GitHub) | Supabase Auth — dodatkowe providery |
| Powiadomienia | Supabase Edge Functions + email / push |
| Więcej stanu globalnego | Zustand lub Jotai |
| Formularze z walidacją | React Hook Form + Zod |
| Design system | Własna biblioteka komponentów |
| Aplikacja mobilna | React Native + wspólne typy i serwisy |

---

## 18. Podsumowanie

Projekt Todo List w Next.js + TypeScript + React + SCSS + Supabase to ~8–10 dni pracy dla jednego developera. Kluczowe decyzje:

1. **Next.js (App Router)** — routing, SSR fetch, middleware auth, deploy na Vercel
2. **Supabase (PostgreSQL + Auth + Realtime)** — pełna warstwa backendowa
3. **Server + Client Components** — dane z SSR, mutacje i realtime po stronie klienta
4. **RLS per użytkownik** — izolacja danych od pierwszego dnia
5. **SCSS + BEM** — style komponentów bez CSS Modules, tryb ciemny przez CSS variables
6. **Biome + Stylelint** — lint i format bez osobnego Prettiera i ESLinta
7. **Optimistic updates** — szybki UX przy zapisie do Supabase
8. **Mobile-first + i18n** — responsywność i wielojęzyczność od początku

Plan jest podzielony na 5 faz, każda z konkretnymi deliverables i checklistą. Po ukończeniu wszystkich faz aplikacja będzie gotowa do produkcyjnego deployu.
