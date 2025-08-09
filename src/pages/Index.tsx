
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../components/Dashboard";
import Editor from "../components/Editor";
import LandingPage from "../components/LandingPage";
import { DocumentProvider } from "../contexts/DocumentContext";

const Index = () => {
  return (
    <DocumentProvider>
      <div className="min-h-screen bg-slate-50">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/editor/:id?" element={<Editor />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </DocumentProvider>
  );
};

export default Index;
