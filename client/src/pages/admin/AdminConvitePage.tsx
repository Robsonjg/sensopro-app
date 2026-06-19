import { useState } from "react";
import { trpc } from "../../lib/trpc";

export default function AdminConvitePage() {
  const [codigo, setCodigo] = useState("");
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");

  const validarConvite = trpc.adminAuth.validateConvite.useQuery(
    { codigo },
    {
      enabled: !!codigo,
    }
  );

  const acceptMutation =
    trpc.adminAuth.acceptConviteAndRegister.useMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await acceptMutation.mutateAsync({
      codigo,
      email,
      nome,
      senha,
    });

    alert("Conta criada com sucesso!");
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1>Registro por convite</h1>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Código do convite"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
        />

        {validarConvite.data && (
          <p>Convite válido para: {validarConvite.data.email}</p>
        )}

        <input
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <button
          type="submit"
          disabled={acceptMutation.isPending}
        >
          Criar conta
        </button>

        {acceptMutation.error && (
          <p style={{ color: "red" }}>
            {acceptMutation.error.message}
          </p>
        )}
      </form>
    </div>
  );
}