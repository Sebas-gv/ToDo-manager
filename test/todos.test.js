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
