import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/Navbar";
import { apiGet, apiPost, errorMessage } from "@/lib/api";
import { beginSession } from "@/lib/session";
import type { AdminUser, LoginRequest, SessionInfo } from "@/lib/types";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const me = useQuery({ queryKey: ["session"], queryFn: () => apiGet<SessionInfo>("/auth/session") });

  const login = useMutation({
    mutationFn: (body: LoginRequest) => apiPost<AdminUser>("/auth/login", body),
    onSuccess: () => {
      beginSession();
      toast.success("Bem-vindo ao painel!");
      navigate("/admin/painel");
    },
    onError: (err) => toast.error(errorMessage(err, "Não foi possível entrar.")),
  });

  if (me.data?.authenticated && !me.isError) return <Navigate to="/admin/painel" replace />;

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute -left-40 top-10 size-[28rem] rounded-full bg-amber-500/10 blur-3xl" />
      <div className="relative w-full max-w-md">
        <BrandMark className="mb-8" />
        <form
          onSubmit={(e) => { e.preventDefault(); login.mutate({ email, password }); }}
          className="rounded-2xl border border-line bg-panel/90 p-8 shadow-2xl backdrop-blur"
          data-testid="admin-login-form"
        >
          <span className="grid size-11 place-items-center rounded-lg bg-amber-500/15 text-amber-400"><Lock className="size-5" /></span>
          <h1 className="mt-5 font-heading text-2xl font-bold text-white">Área do funileiro</h1>
          <p className="mt-1 text-sm text-neutral-400">Gerencie agendamentos, galeria e integrações.</p>
          <div className="mt-7 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="a-email">E-mail</Label>
              <Input id="a-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="admin-login-email-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-pass">Senha</Label>
              <Input id="a-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="admin-login-password-input" />
            </div>
          </div>
          <Button type="submit" className="mt-7 h-11 w-full font-semibold" disabled={login.isPending} data-testid="admin-login-submit-button">
            {login.isPending && <Loader2 className="size-4 animate-spin" />} Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
