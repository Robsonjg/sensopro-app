import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { FlaskConical, BarChart3, Share2, Shield } from "lucide-react";
import { Link } from "wouter";

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/60 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" />
            <span
              className="font-semibold text-lg tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              SensoPro
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/admin">
                <Button size="sm" className="rounded-full px-5">
                  Painel Admin
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="sm" className="rounded-full px-5">
                  Painel Admin
                </Button>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="py-24 px-4 text-center">
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/8 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-8">
              <FlaskConical className="w-3.5 h-3.5" />
              Plataforma de Avaliação Sensorial
            </div>
            <h1
              className="text-5xl md:text-6xl font-semibold text-foreground leading-tight mb-6"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Avaliações sensoriais com{" "}
              <span className="text-primary">precisão e elegância</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
              Crie experimentos, gerencie amostras e atributos, compartilhe com avaliadores e
              visualize resultados em tempo real — tudo em um único lugar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {isAuthenticated ? (
                <Link href="/admin">
                  <Button size="lg" className="rounded-full px-8 h-12 text-base">
                    Acessar Painel
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="lg" className="rounded-full px-8 h-12 text-base">
                    Começar agora
                  </Button>
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-muted/30">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: FlaskConical,
                  title: "Experimentos",
                  desc: "Crie e gerencie experimentos com amostras e atributos personalizados.",
                },
                {
                  icon: Share2,
                  title: "Compartilhamento",
                  desc: "Gere links únicos para enviar aos avaliadores com um clique.",
                },
                {
                  icon: BarChart3,
                  title: "Dashboard",
                  desc: "Visualize resultados com gráficos e tabelas detalhadas por atributo.",
                },
                {
                  icon: Shield,
                  title: "Controle",
                  desc: "Evite duplicidades: cada e-mail responde apenas uma vez por experimento.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-white rounded-2xl p-6 border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} SensoPro — Plataforma de Avaliação Sensorial
        </div>
      </footer>
    </div>
  );
}
