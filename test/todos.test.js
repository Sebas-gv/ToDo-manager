// Run with: npm test
// Uses Node's built-in test runner, so there's nothing extra to install.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

let server;
let baseUrl;

// Start the app on a random free port before the tests, and stop it after
before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

after(() => {
  server.close();
});

test('GET /todos returns a list of todos', async () => {
  const res = await fetch(`${baseUrl}/todos`);

  assert.equal(res.status, 200);
  const todos = await res.json();
  assert.ok(Array.isArray(todos));
});

// Optional: add your own tests below.

// Helper: sends a request and returns { status, body }
async function request(method, path, body) {
  const options = { method, headers: {} };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${baseUrl}${path}`, options);
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

// Helper: creates a todo and returns it, so each test has its own data
async function createTodo(title = 'Test todo') {
  const { body } = await request('POST', '/todos', { title });
  return body;
}

// ---------- POST /todos ----------

test('POST /todos creates a todo and trims the title', async () => {
  const { status, body } = await request('POST', '/todos', { title: '  Buy milk  ' });

  assert.equal(status, 201);
  assert.equal(body.title, 'Buy milk');
  assert.equal(body.done, false);
  assert.equal(typeof body.id, 'number');
});

test('POST /todos returns 400 for a bad title', async () => {
  for (const bad of [{}, { title: '' }, { title: '   ' }, { title: 123 }]) {
    const { status, body } = await request('POST', '/todos', bad);
    assert.equal(status, 400, `expected 400 for ${JSON.stringify(bad)}`);
    assert.ok(body.error);
  }
});

// ---------- PATCH /todos/:id ----------

test('PATCH /todos/:id updates only the fields sent', async () => {
  const todo = await createTodo('Original');

  const { status, body } = await request('PATCH', `/todos/${todo.id}`, { done: true });

  assert.equal(status, 200);
  assert.equal(body.done, true);
  assert.equal(body.title, 'Original'); // title untouched
});

test('PATCH /todos/:id returns 404 for a missing todo', async () => {
  const { status } = await request('PATCH', '/todos/999999', { done: true });
  assert.equal(status, 404);
});

// TODO: PATCH with title: '' or title: 5            -> 400
// TODO: PATCH with done: 'yes'                      -> 400

test('PATCH returns 400 for invalid title', async () => {
  const todo = await createTodo();

  for (const title of ['', '   ', 123]) {
    const { status } = await request(
      'PATCH',
      `/todos/${todo.id}`,
      { title }
    );

    assert.equal(status, 400);
  }
});

// ---------- DELETE /todos/:id ----------

test('DELETE /todos/:id removes the todo', async () => {
  const todo = await createTodo();

  const first = await request('DELETE', `/todos/${todo.id}`);
  assert.equal(first.status, 204);

  const second = await request('DELETE', `/todos/${todo.id}`);
  assert.equal(second.status, 404); // already gone
});

// ---------- GET /todos/:id (Part 2 fixes) ----------

test('GET /todos/:id returns the todo', async () => {
  const todo = await createTodo('Find me');
  const { status, body } = await request('GET', `/todos/${todo.id}`);

  assert.equal(status, 200);
  assert.equal(body.title, 'Find me');
});

test('GET /todos/:id returns 404 for a missing or invalid id', async () => {
  for (const id of ['999999', 'abc', '1abc']) {
    const { status, body } = await request('GET', `/todos/${id}`);
    assert.equal(status, 404, `expected 404 for id ${id}`);
    assert.ok(body.error);
  }
});

// ---------- GET /todos/stats (Part 2 fixes) ----------

test('GET /todos/stats returns counts and a whole-number percentage', async () => {
  const { status, body } = await request('GET', '/todos/stats');

  assert.equal(status, 200);
  assert.equal(typeof body.total, 'number');
  assert.ok(Number.isInteger(body.percentDone));
  assert.ok(body.percentDone >= 0 && body.percentDone <= 100);
});

// Keep this one LAST: it deletes everything to test the empty-list case
test('GET /todos/stats returns 0 percent when there are no todos', async () => {
  const { body: all } = await request('GET', '/todos');
  for (const todo of all) {
    await request('DELETE', `/todos/${todo.id}`);
  }

  const { status, body } = await request('GET', '/todos/stats');

  assert.equal(status, 200);
  assert.deepEqual(body, { total: 0, done: 0, percentDone: 0 });
});