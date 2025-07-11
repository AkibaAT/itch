// This file is the entry point for renderer processes

import { parse as parseQueryString } from "querystring";

import env from "renderer/env";

env.setNodeEnv();

if (process.env.NODE_ENV === "production") {
  // cf. https://electronjs.org/docs/tutorial/security
  (window as any).eval = global.eval = function () {
    throw new Error(`Sorry, this app does not support window.eval().`);
  };
}

import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
    console.error("Error stack:", error.stack);
    console.error("Component stack:", errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "20px",
            color: "white",
            backgroundColor: "#333",
            fontFamily: "monospace",
          }}
        >
          <h1>React Error Occurred</h1>
          <p>
            <strong>Error:</strong>{" "}
            {this.state.error?.message || "Unknown error"}
          </p>
          <p>
            <strong>Type:</strong> {this.state.error?.name || "Unknown"}
          </p>
          <details style={{ marginTop: "10px" }}>
            <summary>Stack Trace</summary>
            <pre
              style={{ fontSize: "12px", overflow: "auto", maxHeight: "300px" }}
            >
              {this.state.error?.stack || "No stack trace available"}
            </pre>
          </details>
          <p style={{ marginTop: "10px" }}>
            Check the console for more details.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

import store from "renderer/store";

import App from "renderer/App";
import { actions } from "common/actions";
import { ExtendedWindow } from "common/types";
import { ambientWind } from "common/util/navigation";

let appNode: Element | null;
let root: any = null;

function render(RealApp: typeof App) {
  try {
    document.querySelector("body")!.classList.remove("loading");
    appNode = document.querySelector("#app");

    if (!appNode) {
      console.error("Could not find #app element");
      return;
    }

    if (!root) {
      root = createRoot(appNode);
    }

    const rootComponent = (
      <ErrorBoundary>
        <Provider store={store}>
          <RealApp />
        </Provider>
      </ErrorBoundary>
    );

    root.render(rootComponent);
  } catch (error) {
    console.error("Error in render function:", error);
    console.error("Error stack:", error.stack);
  }
}

window.addEventListener("beforeunload", () => {
  if (root) {
    root.unmount();
    root = null;
    appNode = null;
  }
});

async function start() {
  const opts = parseQueryString(location.search.replace(/^\?/, ""));
  const extWindow = window as unknown as ExtendedWindow;
  extWindow.windSpec = {
    wind: String(opts.wind),
    role: String(opts.role) as any,
  };

  // Wait for electron-redux to sync state from main process
  await new Promise<void>((resolve) => {
    const checkState = () => {
      const state = store.getState();
      if (state.winds && Object.keys(state.winds).length > 0) {
        resolve();
      }
    };
    checkState();
    const unsubscribe = store.subscribe(() => {
      checkState();
      if (
        store.getState().winds &&
        Object.keys(store.getState().winds).length > 0
      ) {
        unsubscribe();
      }
    });
  });

  render(App);

  // it isn't a guarantee that this code will run
  // after the main process starts listening for
  // this event. Keep sending it so that the main
  // process is sure to receive it
  const intervalId = setInterval(() => {
    store.dispatch(actions.rootWindowReady({}));
  }, 500);

  store.watcher.on(actions.boot, () => {
    clearInterval(intervalId);
  });
}

start();

document.addEventListener("drop", (event) => {
  event.preventDefault();
  const urls = event.dataTransfer.getData("text/uri-list");
  if (urls) {
    urls.split("\n").forEach((url) => {
      store.dispatch(actions.navigate({ wind: ambientWind(), url }));
    });
  }
});

// Catch unhandled form submissions that would navigate away from the app
document.addEventListener("submit", (event) => {
  console.error(
    "Unhandled form submission intercepted. This likely indicates a button " +
      'inside a form is missing type="button". Form:',
    event.target
  );
  event.preventDefault();
});
