import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Signup from "./components/Signup";
import Signin from "./components/Signin";
import Dashboard from "./components/Dashboard";
import ConfirmEmail from "./components/ConfirmEmail";
import SearchForRanking from "./components/SearchForRanking";
import CreateProfesor from "./components/CreateProfesor";
import PrivateRoute from "./components/PrivateRoute";
import AuthCallback from "./components/AuthCallback"; // 👈 NUEVO
import ProfComments from "./components/ProfComments"; 

const a = 1;

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/signup", element: <Signup /> },
  { path: "/signin", element: <Signin /> },
  { path: "/auth/callback", element: <AuthCallback /> }, // 👈 NUEVO
  {
    path: "/dashboard",
    element: (
      <PrivateRoute>
        <Dashboard />
      </PrivateRoute>
    ),
  },
  {
    path: "/prof-comments/:id", // Add the new route after dashboard
    element: (
      <PrivateRoute>
        <ProfComments />
      </PrivateRoute>
    ),
  },
  {
    path: "/search-ranking",
    element: (
      <PrivateRoute>
        <SearchForRanking />
      </PrivateRoute>
    ),
  },
  {
    path: "/create-profesor",
    element: (
      <PrivateRoute>
        <CreateProfesor />
      </PrivateRoute>
    ),
  },
  { path: "/confirm-email", element: <ConfirmEmail /> },
]);
