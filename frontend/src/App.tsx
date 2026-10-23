import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Home from "@/pages/Home";
import Agendar from "@/pages/Agendar";
import Orcamento from "@/pages/Orcamento";
import OrcamentoStatus from "@/pages/OrcamentoStatus";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/agendar" element={<Agendar />} />
        <Route path="/orcamento" element={<Orcamento />} />
        <Route path="/orcamento/:id" element={<OrcamentoStatus />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/painel" element={<AdminDashboard />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <Toaster richColors />
    </>
  );
}
