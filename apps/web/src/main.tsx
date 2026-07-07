import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./ui/fonts";
import "./ui/tokens.css";
import "./ui/base.css";
import { AppLayout } from "./app/AppLayout";
import { ScreenPlaceholder } from "./app/ScreenPlaceholder";
import { Playground } from "./playground/Playground";

const router = createBrowserRouter([
  { path: "/login", element: <ScreenPlaceholder title="Login" /> },
  { path: "/playground", element: <Playground /> },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <ScreenPlaceholder title="Dashboard" /> },
      { path: "timeline", element: <ScreenPlaceholder title="Timeline" /> },
      { path: "biomarkers", element: <ScreenPlaceholder title="Biomarkers" /> },
      { path: "scores", element: <ScreenPlaceholder title="Scores" /> },
      { path: "insights", element: <ScreenPlaceholder title="Insights" /> },
      { path: "upload", element: <ScreenPlaceholder title="Upload" /> },
      { path: "settings", element: <ScreenPlaceholder title="Settings" /> },
    ],
  },
]);

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found");
}

createRoot(rootEl).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
