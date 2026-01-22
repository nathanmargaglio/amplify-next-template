"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useState, useEffect, useCallback } from "react";
import { generateClient } from "aws-amplify/data";
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

  const [responseText, setResponseText] = useState("");

  const loadContent = useCallback((path: string) => {
    client.queries.sayHello({
      path,
    }).then((response) => {
      if (response.data) {
        setResponseText(response.data);
      } else if (response.errors) {
        setResponseText(`Error: ${response.errors.map(e => e.message).join(", ")}`);
      }
    });
  }, []);

  // Listen for navigation messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "navigate" && event.data?.path) {
        loadContent(event.data.path);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [loadContent]);

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
      <button onClick={() => loadContent("index.html")}>Load HTML</button>
      {responseText && (
        <iframe
          srcDoc={responseText}
          style={{ width: "100%", height: "400px", border: "1px solid #ccc", marginTop: "10px" }}
          title="S3 HTML Content"
        />
      )}
      <button onClick={signOut}>Sign out</button>
    </main>
  );
}
