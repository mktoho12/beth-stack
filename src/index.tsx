/// <reference types="@kitajs/html/htmx.d.ts" />

import Elysia, { t } from 'elysia'
import { html } from '@elysiajs/html'
import Html from '@kitajs/html'
import { db } from './db'
import { Todo, todos } from './db/schema'
import { eq } from 'drizzle-orm'

const app = new Elysia()
  .use(html())
  .get('/', () => (
    <Layout name="index">
      <body
        class="flex w-full h-screen justify-center items-center"
        hx-get="/todos"
        hx-trigger="load"
        hx-swap="innerHTML"
      ></body>
    </Layout>
  ))
  .post('/clicked', () => <div class="text-blue-600">I'm from the server!</div>)
  .get('/todos', async () => {
    const data = await db.select().from(todos).all()
    return (
      <>
        <main class="text-3xl leading-normal">
          <h1 class="text-4xl font-bold text-center">Todo List</h1>
          <TodoList todos={data} />
          <footer class="mt-8">
            <p class="text-base text-right">
              written by <a href="https://elysiajs.com">ElysiaJS</a>,{' '}
              <a href="https://htmx.org">htmx</a> and{' '}
              <a href="https://orm.drizzle.team">Drizzle ORM</a>. running on{' '}
              <a href="https://bun.sh">Bun</a>. Data Persistence by{' '}
              <a href="https://turso.tech">Turso</a>.
            </p>
            <div class="mt-2">
              <p class="text-base">I made it while watching this video.</p>
              <iframe
                width="400"
                height="225"
                src="https://www.youtube.com/embed/cpzowDDJj24?si=hIHzjRMMPIDPYTOt"
                title="YouTube video player"
                frame-border="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              ></iframe>
            </div>
          </footer>
        </main>
      </>
    )
  })
  .post(
    '/todos/toggle/:id',
    async ({ params: { id } }) => {
      const oldTodo = await db
        .select()
        .from(todos)
        .where(eq(todos.id, id))
        .get()
      const newTodo = await db
        .update(todos)
        .set({ completed: !oldTodo!.completed })
        .where(eq(todos.id, id))
        .returning()
        .get()
      return <TodoItem {...newTodo} />
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
    }
  )
  .delete(
    '/todos/:id',
    async ({ params: { id } }) => {
      await db.delete(todos).where(eq(todos.id, id)).run()
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
    }
  )
  .post(
    '/todos',
    async ({ body: { content } }) => {
      if (content.length === 0) {
        throw new Error('Content cannot be empty')
      }
      const newTodo = await db
        .insert(todos)
        .values({ content })
        .returning()
        .get()
      return <TodoItem {...newTodo} />
    },
    {
      body: t.Object({
        content: t.String(),
      }),
    }
  )
  .listen(3000)

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
)

const Layout = ({ children }: Html.PropsWithChildren<{ name: string }>) => (
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>The BETH Stack</title>
      <script src="https://unpkg.com/htmx.org@1.9.5"></script>
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://unpkg.com/hyperscript.org@0.9.11"></script>
      <style type="text/tailwindcss">
        {`
          @layer base {
            a {
              @apply text-blue-600;
            }
          }
        `}
      </style>
    </head>
    {children}
  </html>
)

const TodoItem = ({ content, completed, id }: Todo) => (
  <div class="flex gap-2">
    <p class="grow">{content}</p>
    <input
      type="checkbox"
      class="w-8"
      checked={completed}
      hx-post={`/todos/toggle/${id}`}
      hx-target="closest div"
      hx-swap="outerHTML"
    />
    <button
      hx-delete={`/todos/${id}`}
      hx-swap="outerHTML"
      hx-target="closest div"
    >
      ❌
    </button>
  </div>
)

const TodoList = ({ todos }: { todos: Todo[] }) => (
  <div class="mt-4">
    {todos.map(todo => (
      <TodoItem {...todo} />
    ))}
    <TodoForm />
  </div>
)

const TodoForm = () => (
  <form
    class="flex gap-2 mt-4"
    hx-post="/todos"
    hx-swap="beforebegin"
    _="on submit target.reset()"
  >
    <input type="text" name="content" class="border border-black px-1" />
    <button type="submit">Add</button>
  </form>
)
