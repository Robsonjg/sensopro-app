import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ConviteManagementProps {
  adminId: number;
}

export default function ConviteManagement({ adminId }: ConviteManagementProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conviteGerado, setConviteGerado] = useState<{ codigo: string; link: string } | null>(null);

  const createConviteMutation = trpc.adminAuth.createConvite.useMutation();

  const handleCreateConvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const resultado = await createConviteMutation.mutateAsync({
        email: email || undefined,
      });
      setConviteGerado(resultado);
      setEmail("");
      toast.success("Convite gerado com sucesso!");
    } catch (err) {
      toast.error("Erro ao gerar convite");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Gerar Convite para Admin</h2>
        <p className="text-gray-600 mb-6">
          Crie um convite único para que outra pessoa se registre como administrador. Ela receberá um link para se registrar com email e senha.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleCreateConvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email (opcional)</label>
            <Input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Se preenchido, o convite será associado a este email
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando convite...
              </>
            ) : (
              "Gerar Convite"
            )}
          </Button>
        </form>
      </Card>

      {conviteGerado && (
        <Card className="p-6 border-green-200 bg-green-50">
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900">Convite Gerado com Sucesso!</h3>
                <p className="text-sm text-green-800 mt-1">
                  Compartilhe o link abaixo com a pessoa que deseja adicionar como admin
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Código do Convite</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={conviteGerado.codigo}
                    readOnly
                    className="bg-white"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(conviteGerado.codigo)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Link de Registro</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={conviteGerado.link}
                    readOnly
                    className="bg-white text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(conviteGerado.link)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Alert className="border-green-200 bg-white">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800">
                O convite expira em 30 dias. A pessoa que usar o convite precisará ser ativada por você no painel "Gerenciar Admins" antes de acessar o painel.
              </AlertDescription>
            </Alert>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setConviteGerado(null)}
            >
              Gerar Outro Convite
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
