import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Budgets from "./pages/Budgets";
import Settings from "./pages/Settings";
import Transaction from "./pages/Transaction";
import InsightsDashboard from "./pages/InsightsDashboard"; 
import Layout from "./components/layout/Layout";
import { AppContext } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import { ModalProvider } from "./context/ModalContext";
import Modal from "./components/Modal";
import ProtectedRoute from "./components/ProtectedRoute";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";

export default function App() {
  return (
    <>
      <AuthProvider>
        <AppContext>
          <ModalProvider>
            <BrowserRouter>
              <Routes>
                {/* ── Public auth routes (no Layout / sidebar) ──────── */}
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />

                {/* ── Protected routes (with Layout / sidebar) ─────── */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="budgets" element={<Budgets />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="transaction" element={<Transaction />} />
                  <Route path="insights" element={<InsightsDashboard />} />
                </Route>
              </Routes>
            </BrowserRouter>
            <Modal />
          </ModalProvider>
        </AppContext>
      </AuthProvider>
    </>
  );
}