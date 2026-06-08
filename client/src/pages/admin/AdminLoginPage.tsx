import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function AdminLoginPage() {
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const utils = trpc.useUtils();

  const loginMutation = trpc.adminAuth.login.useMutation();
  const registroMutation = trpc.adminAuth.registro.useMutation();
  const adminMeQuery = trpc.adminAuth.me.useQuery();

  // Redireciona se já estiver logado
  useEffect(() => {
    if (adminMeQuery.data?.email) {
      setLocation("/admin");
    }
  }, [adminMeQuery.data, setLocation]);

  // LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !senha) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsLoading(true);

    try {
      await loginMutation.mutateAsync({
        email,
        senha,
      });

      await utils.adminAuth.me.invalidate();
      await utils.adminAuth.me.refetch();

      toast.success("Login realizado com sucesso!");
      setLocation("/admin");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // REGISTRO
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !senha || !nome) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (senha.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      await registroMutation.mutateAsync({
        email,
        senha,
        nome,
      });

      toast.success("Conta criada com sucesso! Faça login agora.");

      setShowRegister(false);
      setEmail("");
      setSenha("");
      setNome("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao registrar");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fea-50 via-white to-fea-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-fea-600 mb-2">SensoPro</h1>
            <p className="text-gray-600">
              {showRegister ? "Criar conta de administrador" : "Painel Administrativo"}
            </p>
          </div>

          <form onSubmit={showRegister ? handleRegister : handleLogin} className="space-y-4">
            {showRegister && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <Input
                  type="text"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <Input
                type="password"
                placeholder={showRegister ? "Mínimo 6 caracteres" : "Sua senha"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                backgroundColor: "#e63e6d",
                color: "white",
                padding: "10px 16px",
                borderRadius: "8px",
                fontWeight: 500,
                fontSize: "14px",
                cursor: isLoading ? "not-allowed" : "pointer",
                border: "none",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </span>
              ) : showRegister ? (
                "Criar Conta"
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setShowRegister(!showRegister);
                setEmail("");
                setSenha("");
                setNome("");
              }}
              style={{
                color: "#e63e6d",
                fontSize: "14px",
                fontWeight: 500,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {showRegister ? "Já tem conta? Faça login" : "Não tem conta? Registre-se"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}