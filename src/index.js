const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((user) => user.username === username);

  if (!user) {
    return response.status(404).json({ error: "User not found" });
  }

  request.user = user;

  next();
}

function checkIfTodoExists(request, response, next) {
  const { id } = request.params;
  const { user } = request;

  const todoExists = user.todos.some((todo) => todo.id === id);

  if (!todoExists) {
    return response.status(404).send({ error: "Todo don't exists" });
  }

  next()
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.some((user) => user.username === username);

  if (userAlreadyExists) {
    return response.status(400).send({ error: "User already exists" });
  }

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(newUser);

  return response.json(newUser);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  return response.json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const newToDo = {
    id: uuidv4(),
    title,
    deadline: new Date(deadline),
    done: false,
    created_at: new Date(),
  };

  user.todos.push(newToDo);

  return response.status(201).json(newToDo);
});

app.put(
  "/todos/:id",
  checksExistsUserAccount,
  checkIfTodoExists,
  (request, response) => {
    const { title, deadline } = request.body;
    const { id } = request.params;
    const { user } = request;

    let newTodo;

    user.todos.map((todo, index) => {
      if (todo.id === id) {
        newTodo = { ...user.todos[index], title, deadline }
        user.todos[index] = newTodo;
      }
    });

    return response.json(newTodo);
  }
);

app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,
  checkIfTodoExists,
  (request, response) => {
    const { id } = request.params;
    const { user } = request;

    let newTodo;

    user.todos.map((todo, index) => {
      if (todo.id === id) {
        newTodo = { ...user.todos[index], done: true }
        user.todos[index] = newTodo;
      }
    });

    return response.json(newTodo);
  }
);

app.delete("/todos/:id", checksExistsUserAccount, checkIfTodoExists, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  const todoToRemove = user.todos.find((todo) => todo.id === id);

  const newTodosArray = user.todos.filter(
    (todo) => todo.id !== todoToRemove.id
  );
  user.todos = newTodosArray;

  return response.status(204).json(user.todos);
});

module.exports = app;
