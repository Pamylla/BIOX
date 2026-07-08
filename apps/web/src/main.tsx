import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./ui/fonts";
import "./ui/tokens.css";
import "./ui/base.css";
import { ApiProvider, MockApiClient } from "./api";
import { AppLayout } from "./app/AppLayout";
import { AuthProvider } from "./features/auth/AuthProvider";
import { LoginScreen } from "./features/auth/LoginScreen";
import { RequireAuth } from "./features/auth/RequireAuth";
import { BiomarkerDetailScreen } from "./features/biomarkers/BiomarkerDetailScreen";
import { BiomarkersScreen } from "./features/biomarkers/BiomarkersScreen";
import { DashboardScreen } from "./features/dashboard/DashboardScreen";
import { ReviewScreen } from "./features/ingestion/ReviewScreen";
import { UploadScreen } from "./features/ingestion/UploadScreen";
import { InsightDetailScreen } from "./features/insights/InsightDetailScreen";
import { InsightsScreen } from "./features/insights/InsightsScreen";
import { ScoreDetailScreen } from "./features/scores/ScoreDetailScreen";
import { ScoresScreen } from "./features/scores/ScoresScreen";
import { SettingsScreen } from "./features/settings/SettingsScreen";
import { TimelineScreen } from "./features/timeline/TimelineScreen";
import { Playground } from "./playground/Playground";

const apiClient = new MockApiClient();

const router = createBrowserRouter([
  { path: "/login", element: <LoginScreen /> },
  { path: "/playground", element: <Playground /> },
  {
    element: <RequireAuth />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardScreen /> },
          { path: "timeline", element: <TimelineScreen /> },
          { path: "biomarkers", element: <BiomarkersScreen /> },
          { path: "biomarkers/:biomarkerKey", element: <BiomarkerDetailScreen /> },
          { path: "scores", element: <ScoresScreen /> },
          { path: "scores/:system", element: <ScoreDetailScreen /> },
          { path: "insights", element: <InsightsScreen /> },
          { path: "insights/:insightId", element: <InsightDetailScreen /> },
          { path: "upload", element: <UploadScreen /> },
          { path: "review/:extractionId", element: <ReviewScreen /> },
          { path: "settings", element: <SettingsScreen /> },
        ],
      },
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
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ApiProvider>
  </StrictMode>,
);
