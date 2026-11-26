const express = require('express');

const router = express.Router();

const fs = require('node:fs');
const path = require('node:path');

// The todos are kept in memory, so they reset every time the server restarts.
// Each todo looks like this: { id: 1, title: 'Read the README', done: true }
// Location of the JSON file
const DATA_FILE = process.env.TODOS_FILE || path.join(__dirname, '..', 'data', 'todos.json');

const SEED_TODOS = [
  { id: 1, title: 'Read the README', done: true },
  { id: 2, title: 'Build the todo API', done: false }
];

// Load todos from the JSON file
let todos = loadTodos();

// Generate the next ID
let nextId = todos.reduce((max, todo) => Math.max(max, todo.id), 0) + 1;

function loadTodos() {
  // try to read + JSON.parse; return the seed list if the file doesn't exist
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(data);

    if (!Array.isArray(parsed)) {
      throw new Error(`${DATA_FILE} should contain a JSON array of todos`);
    }

    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [...SEED_TODOS];
    }

    throw error;
  }
}

function saveTodos() {
  // make sure the data/ folder exists, then write JSON.stringify(todos, null, 2)
  const directory = path.dirname(DATA_FILE);

  fs.mkdirSync(directory, { recursive: true });

  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2));
}

// =====================================================================
// PART 1: build these (see "Part 1: Build the API" in README.md)
// =====================================================================

// GET /todos: list all todos.
// This one is done for you, as an example.
router.get('/', (req, res) => {
  res.json(todos);
});

// POST /todos: create a todo.
// TODO: see "1. Create a todo" in README.md
router.post('/', (req, res) => {

  const title = req.body.title;
  //console.log('Request body:', req.body);
  //console.log('Received title:', title);

  //We check if the tittle of the new ToDo is a string and is not empty
  if(typeof title !== 'string' || title.trim() === ''){
    return res.status(400).json({
      //throwing an according error message
      error: 'Title is required and cannot be an empty script'
    });
  }

  const newToDo= {
    id: nextId++,
    title: title.trim(),
    done: false
  };

  //saving the todo:
  todos.push(newToDo);
  saveTodos();

  //sending confirmation response
  res.status(201).json(newToDo)
});

// PATCH /todos/:id: change a todo's title and/or mark it done.
// TODO: see "2. Update a todo" in README.md
router.patch('/:id', (req, res) => {
  const title = req.body.title;
  const done = req.body.done;
  const id = Number(req.params.id);
  const todo = todos.find((t) => t.id === id);

  //if doesn't exist:
  if (!todo) {
    return res.status(404).json({
      error: 'Todo not found'
    });
  }

  // Check if at least one field was provided
  if (title === undefined && done === undefined) {
    return res.status(400).json({
      error: 'At least one field is required'
    });
  }

  // Validate title
  if (title !== undefined &&
      (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({
      error: 'Title must be a non-empty string'
    });
  }

  // Validate done
  if (done !== undefined && typeof done !== 'boolean') {
    return res.status(400).json({
      error: 'Done must be a boolean'
    });
  }

  // Update only the fields provided
  if (title !== undefined) {
    todo.title = title.trim();
  }

  if (done !== undefined) {
    todo.done = done;
  }

  saveTodos();
  // Return the updated todo
  res.status(200).json(todo);
});

// DELETE /todos/:id: delete a todo.
// TODO: see "3. Delete a todo" in README.md
router.delete('/:id', (req, res) => {

    const id = Number(req.params.id);

    // Find the position of the todo in the array
    const index = todos.findIndex((t) => t.id === id);

    // Check if the todo exists
    if (index === -1) {
        return res.status(404).json({ error: 'Todo not found' });
    }

    // Remove the todo from the array
    todos.splice(index, 1);
    saveTodos();

    // Send a response with no content
    res.sendStatus(204);
});

// =====================================================================
// PART 2: review this (see "Part 2: Review the AI's code" in README.md)
//
// We asked an AI assistant:
//   "Add an endpoint that returns one todo by its id, and an endpoint that
//    returns stats: how many todos there are, how many are done, and the
//    percentage that are done."
//
// This is the code it wrote. It looks reasonable, but it has at least
// three bugs. Find them, fix them, and describe each one in your notes.
// =====================================================================

// GET /todos/:id: get one todo
router.get('/stats', (req, res) => {
  const done = todos.filter((t) => t.done).length;
  res.json({
    total: todos.length,
    done: done,
    percentDone: todos.length === 0 ? 0 : Math.round((done / todos.length) * 100),
  });
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const todo = todos.find((t) => t.id === id);
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  res.json({ id: todo.id, title: todo.title, done: todo.done });
});

// GET /todos/stats: count the todos
module.exports = router;
