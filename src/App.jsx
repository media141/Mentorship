import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Layout from "./components/Layout.jsx";
import Mentors from "./pages/Mentors.jsx";
import Bookings from "./pages/Bookings.jsx";

function Protected({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading&hellip;</div>;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { session, loading } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={loading ? <div className="page-loading">Loading&hellip;</div> : session ? <Navigate to="/mentors" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Navigate to="/mentors" replace />} />
        <Route path="mentors" element={<Mentors />} />
        <Route path="bookings" element={<Bookings />} />
      </Route>
      <Route path="*" element={<Navigate to="/mentors" replace />} />
    </Routes>
  );
}
