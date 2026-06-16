import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";

export default function AdminConvitePage() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const codigo = params.get("codigo") || "";

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [credenciaisRegistradas, setCredenciaisRegistradas] = useState<{ email: string; senha: string } | null>(null);

  const validateConviteQuery = trpc.adminAuth.validateConvite.useQuery(
    { codigo },
    { enabled: !!codigo }
  );
  const acceptMutation = trpc.adminAuth.acceptConviteAndRegister.useMutation();
  const loginMutation = trpc.adminAuth.login.useMutation();

  // Se convite é inválido
  useEffect(() => {
    if (validateConviteQuery.isError) {
      const error = validateConviteQuery.error as TRPCClientError<any>;
      setErro(error.message || "Convite inválido ou expirado");
    }
  }, [validateConviteQuery.isError, validateConviteQuery.error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    if (!nome || !email || !senha || !confirmaSenha) {
      setErro("Todos os campos são obrigatórios");
      return;
    }

    if (senha !== confirmaSenha) {
      setErro("As senhas não coincidem");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsLoading(true);
    try {
      await acceptMutation.mutateAsync({
        codigo,
        email,
        senha,
        nome,
      });
      setSucesso(true);
      setCredenciaisRegistradas({ email, senha });
    } catch (err) {
      const error = err as TRPCClientError<any>;
      setErro(error.message || "Erro ao registrar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEntrarPainel = async () => {
    if (!credenciaisRegistradas) return;
    
    setIsLoading(true);
    try {
      await loginMutation.mutateAsync({
        email: credenciaisRegistradas.email,
        senha: credenciaisRegistradas.senha
      });
      setLocation("/admin");
    } catch (err) {
      const error = err as TRPCClientError<any>;
      setErro(error.message || "Erro ao entrar no painel");
      setIsLoading(false);
    }
  };

  if (!codigo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-md">
          <div className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Convite inválido ou não fornecido</AlertDescription>
            </Alert>
            <Button onClick={() => setLocation("/")} className="w-full mt-4">
              Voltar para Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (validateConviteQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (validateConviteQuery.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-md">
          <div className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
            <Button onClick={() => setLocation("/")} className="w-full mt-4">
              Voltar para Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-2 text-center">Criar Conta Admin</h1>
          <p className="text-gray-600 text-center mb-6">
            Você foi convidado para ser administrador do SensoPro
          </p>

          {sucesso && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Conta criada com sucesso! Você já pode entrar no painel.
              </AlertDescription>
            </Alert>
          )}

          {erro && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          {!sucesso ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <Input
                  type="text"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Senha</label>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Confirmar Senha</label>
                <Input
                  type="password"
                  placeholder="Confirme a senha"
                  value={confirmaSenha}
                  onChange={(e) => setConfirmaSenha(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Criar Conta"
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-3">
              <Button
                type="button"
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleEntrarPainel}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar no Painel"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/admin/login")}
              >
                Voltar para Login
              </Button>
            </div>
          )}

          {!sucesso && (
            <p className="text-center text-sm text-gray-600 mt-4">
              Já tem uma conta?{" "}
              <a
                href="/admin/login"
                className="text-red-600 hover:underline"
              >
                Faça login
              </a>
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
