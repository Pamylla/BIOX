import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./ui/fonts";
import "./ui/tokens.css";
import "./ui/base.css";
import { ApiProvider, MockApiClient } from "./api";
import { AppLayout } from "./app/AppLayout";
import { ScreenPlaceholder } from "./app/ScreenPlaceholder";
import { DashboardScreen } from "./features/dashboard/DashboardScreen";
import { ReviewScreen } from "./features/ingestion/ReviewScreen";
import { UploadScreen } from "./features/ingestion/UploadScreen";
import { TimelineScreen } from "./features/timeline/TimelineScreen";
import { Playground } from "./playground/Playground";

const apiClient = new MockApiClient();

const router = createBrowserRouter([
  { path: "/login", element: <ScreenPlaceholder title="Login" /> },
  { path: "/playground", element: <Playground /> },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardScreen /> },
      { path: "timeline", element: <TimelineScreen /> },
      { path: "biomarkers", element: <ScreenPlaceholder title="Biomarkers" /> },
      { path: "scores", element: <ScreenPlaceholder title="Scores" /> },
      { path: "insights", element: <ScreenPlaceholder title="Insights" /> },
      { path: "upload", element: <UploadScreen /> },
      { path: "review/:extractionId", element: <ReviewScreen /> },
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
    <ApiProvider client={apiClient}>
      <RouterProvider router={router} />
    </ApiProvider>
  </StrictMode>,
);
