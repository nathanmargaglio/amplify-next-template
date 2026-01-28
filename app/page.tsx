"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useState, useEffect, useCallback } from "react";
import { generateClient } from "aws-amplify/data";
import { fetchAuthSession } from "aws-amplify/auth";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

  function listTodos() {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }

  useEffect(() => {
    listTodos();
  }, []);

  function createTodo() {
    client.models.Todo.create({
      content: window.prompt("Todo content"),
    });
  }


  function deleteTodo(id: string) {
    client.models.Todo.delete({ id })
  }

  const handleToken = useCallback(async () => {
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      const accessToken = session.tokens?.accessToken?.toString();

      console.log("ID Token:", idToken);
      console.log("Access Token:", accessToken);

      client.queries.sayHello({
        token: idToken,
      }).then((response) => {
        if (response.data) {
          console.log(response.data);
          // set the response on a cookie
          document.cookie = `sayHelloResponse=${response.data}; path=/`;
        } else if (response.errors) {
          console.log(`Error: ${response.errors.map(e => e.message).join(", ")}`);
        }
      });
    } catch (error) {
      console.error("Error fetching auth session:", error);
    }
  }, []);

  const { signOut } = useAuthenticator();

  return (
    <main>
      <h1>My todos</h1>
      <button onClick={createTodo}>+ new</button>
      <ul>
        {todos.map((todo) => (
          <li onClick={() => deleteTodo(todo.id)} key={todo.id}>{todo.content}</li>
        ))}
      </ul>
      <div>
        🥳 App successfully hosted. Try creating a new todo.
        <br />
        <a href="https://docs.amplify.aws/nextjs/start/quickstart/nextjs-app-router-client-components/">
          Review next steps of this tutorial.
        </a>
      </div>
      <br />
      <button onClick={() => handleToken()}>Handle Token</button>
      <br />
      <button onClick={signOut}>Sign out</button>
    </main>
  );
}
