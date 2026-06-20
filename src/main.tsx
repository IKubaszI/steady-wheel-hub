import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const searchParams = new URLSearchParams(window.location.search);
const redirectPath = searchParams.get("p");
if (redirectPath) {
  const query = searchParams.get("q");
  const normalizedPath = redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`;
  const basePath = window.location.pathname.replace(/\/$/, "");
  const nextUrl =
    basePath +
    normalizedPath +
    (query ? `?${decodeURIComponent(query)}` : "") +
    window.location.hash;
  window.history.replaceState(null, "", nextUrl);
}

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then(() => {
        console.log("Service Worker unregistered.");
      });
    }
  });
}

