import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2, Shield, Plus, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminManagement() {
  const adminMeQuery = trpc.adminAuth.me.useQuery();
  const isEmailPasswordAdmin = !!adminMeQuery.data?.email;

  // Só carregar lista de admins se for admin email/senha
  const { data: admins, isLoading, refetch } = trpc.adminAuth.listAll.useQuery(undefined, {
    enabled: isEmailPasswordAdmin,
  });

  const promoteByEmailMut = trpc.adminAuth.promoteByEmail.useMutation();
  const deactivateByEmailMut = trpc.adminAuth.deactivateByEmail.useMutation();
  const [emailInput, setEmailInput] = useState("");
  const [promotingEmail, setPromotingEmail] = useState<string | null>(null);
  const [deactivatingEmail, setDeactivatingEmail] = useState<string | null>(null);

  async function handlePromoteByEmail() {
    if (!emailInput.trim()) {
      toast.error("Digite um email válido");
      return;
    }

    setPromotingEmail(emailInput);
    try {
      await promoteByEmailMut.mutateAsync({ email: emailInput });
      toast.success("Admin ativado com sucesso");
      setEmailInput("");
      refetch();
    } catch (error: any) {
      if (error.message?.includes("nao encontrado")) {
        toast.error("Admin não encontrado. Ele precisa se registrar primeiro.");
      } else {
        toast.error("Erro ao ativar admin");
      }
      console.error(error);
    } finally {
      setPromotingEmail(null);
    }
  }

  async function handleDeactivateByEmail(email: string) {
    // Impedir que o admin desative a si mesmo
    if (email === adminMeQuery.data?.email) {
      toast.error("Você não pode desativar sua própria conta");
      return;
    }
    
    // Confirmar antes de desativar
    if (!confirm(`Tem certeza que deseja desativar ${email}? Ele não conseguirá fazer login.`)) {
      return;
    }
    
    setDeactivatingEmail(email);
    try {
      await deactivateByEmailMut.mutateAsync({ email });
      toast.success("Admin desativado com sucesso");
      refetch();
    } catch (error) {
      toast.error("Erro ao desativar admin");
      console.error(error);
    } finally {
      setDeactivatingEmail(null);
    }
  }

  // Se for admin Manus OAuth, mostrar mensagem diferente
  if (!isEmailPasswordAdmin) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Gerenciar Admins</h1>
          <p className="text-muted-foreground">Controle quem tem acesso ao painel administrativo</p>
        </div>

        <Card className="border-border/60 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Acesso via Manus OAuth
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>Você está autenticado via <strong>Manus OAuth</strong>. O gerenciamento de admins está disponível apenas para admins registrados com email/senha.</p>
            <p>Para compartilhar acesso com outra pessoa:</p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Compartilhe o link de registro: <strong className="text-foreground">{window.location.origin}/admin/registro</strong></li>
              <li>A outra pessoa se registra com email e senha</li>
              <li>Ela faz login com email/senha e acessa o painel "Gerenciar Admins"</li>
              <li>Lá ela pode ativar outros admins digitando seus emails</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Gerenciar Admins</h1>
        <p className="text-muted-foreground">Controle quem tem acesso ao painel administrativo</p>
      </div>

      {/* Seção para adicionar novo admin */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Ativar Novo Admin
          </CardTitle>
          <CardDescription>
            Digite o email de um admin registrado para ativá-lo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="exemplo@email.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePromoteByEmail()}
              className="flex-1 rounded-lg"
            />
            <Button
              onClick={handlePromoteByEmail}
              disabled={promotingEmail !== null || !emailInput.trim()}
              className="rounded-lg gap-2"
            >
              {promotingEmail ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Ativar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Seção de lista de admins */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Admins Ativos
          </CardTitle>
          <CardDescription>
            {admins?.length ?? 0} admin{admins && admins.length !== 1 ? "s" : ""} registrado{admins && admins.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Carregando admins…</span>
              </div>
            </div>
          ) : !admins || admins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum admin encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-muted-foreground">Email</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Nome</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Cadastro</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id} className="border-border/40 hover:bg-muted/30">
                      <TableCell className="text-sm font-medium text-foreground">
                        {admin.email}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {admin.nome || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={admin.ativo ? "default" : "secondary"}
                          className={`rounded-full text-xs font-medium ${
                            admin.ativo
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {admin.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(admin.criadoEm).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {admin.ativo && admin.email !== adminMeQuery.data?.email && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeactivateByEmail(admin.email)}
                              disabled={deactivatingEmail === admin.email}
                              className="text-xs rounded-lg h-8 text-destructive hover:text-destructive"
                            >
                              {deactivatingEmail === admin.email ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="w-3 h-3" />
                                  Desativar
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card className="border-border/60 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-sm">Como compartilhar acesso?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Compartilhe o link de registro: <strong className="text-foreground">{window.location.origin}/admin/registro</strong></p>
          <p>2. A outra pessoa se registra com email e senha</p>
          <p>3. Volte aqui e digite o email dela para ativá-la como admin</p>
          <p>4. Pronto! Ela agora tem acesso ao painel administrativo</p>
        </CardContent>
      </Card>
    </div>
  );
}
