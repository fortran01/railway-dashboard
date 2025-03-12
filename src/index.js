import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import reportWebVitals from "./reportWebVitals";

// Add a version query parameter to force cache invalidation
const appVersion = process.env.REACT_APP_VERSION || new Date().getTime();
document.documentElement.dataset.version = appVersion;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note that this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorker.register({
  onUpdate: (registration) => {
    // When a new version is detected, show a notification
    const waitingServiceWorker = registration.waiting;

    if (waitingServiceWorker) {
      waitingServiceWorker.addEventListener("statechange", (event) => {
        if (event.target.state === "activated") {
          window.location.reload();
        }
      });

      waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
    }
  },
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
