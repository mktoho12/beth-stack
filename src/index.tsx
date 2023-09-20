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
        <main class="px-4 text-xl md:text-3xl leading-normal">
          <h1 class="text-4xl font-bold text-center">Todo List</h1>
          <TodoList todos={data} />
          <Footer />
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
      class="w-6 md:w-8"
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

const Footer = () => (
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
        src="https://www.youtube.com/embed/cpzowDDJj24?si=hIHzjRMMPIDPYTOt"
        title="YouTube video player"
        frame-border="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        class="w-full md:w-[400px] aspect-video"
      ></iframe>
    </div>
    <div class="absolute right-4 bottom-4">
      <a href="https://github.com/mktoho12/beth-stack">
        <svg
          width="32"
          viewBox="0 0 98 96"
          class="aspect-[98/96]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
            fill="#24292f"
          />
        </svg>
      </a>
    </div>
  </footer>
)
