import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import DueDates from "./pages/DueDates";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";
import People from "./pages/People";
import PersonDetail from "./pages/PersonDetail";
import AdminAccess from "./pages/AdminAccess";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div style={{ minHeight: "100vh" }}>
              <Navbar />
              <Routes>
                <Route path="/" element={<DueDates />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/companies/:id" element={<CompanyDetail />} />
                <Route path="/people" element={<People />} />
                <Route path="/people/:id" element={<PersonDetail />} />
                <Route path="/admin" element={<AdminAccess />} />
              </Routes>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
