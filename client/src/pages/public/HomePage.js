import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { FlaskConical, BarChart3, Share2, Shield } from "lucide-react";
import { Link } from "wouter";
export default function HomePage() {
    const { isAuthenticated } = useAuth();
    return (_jsxs("div", { className: "min-h-screen bg-background flex flex-col", children: [_jsx("header", { className: "border-b border-border/60 bg-white/80 backdrop-blur-sm sticky top-0 z-50", children: _jsxs("div", { className: "container flex items-center justify-between h-16", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(FlaskConical, { className: "w-5 h-5 text-primary" }), _jsx("span", { className: "font-semibold text-lg tracking-tight", style: { fontFamily: "'Playfair Display', serif" }, children: "SensoPro" })] }), _jsx("div", { className: "flex items-center gap-3", children: _jsx(Link, { href: isAuthenticated ? "/admin" : "/admin/login", children: _jsx(Button, { size: "sm", className: "rounded-full px-5", children: "Painel Admin" }) }) })] }) }), _jsxs("main", { className: "flex-1", children: [_jsx("section", { className: "py-24 px-4 text-center", children: _jsxs("div", { className: "max-w-3xl mx-auto animate-fade-in", children: [_jsxs("div", { className: "inline-flex items-center gap-2 bg-primary/8 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-8", children: [_jsx(FlaskConical, { className: "w-3.5 h-3.5" }), "Plataforma de Avalia\u00E7\u00E3o Sensorial"] }), _jsxs("h1", { className: "text-5xl md:text-6xl font-semibold text-foreground leading-tight mb-6", style: { fontFamily: "'Playfair Display', serif" }, children: ["Avalia\u00E7\u00F5es sensoriais com", " ", _jsx("span", { className: "text-primary", children: "precis\u00E3o e eleg\u00E2ncia" })] }), _jsx("p", { className: "text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto", children: "Crie experimentos, gerencie amostras e atributos, compartilhe com avaliadores e visualize resultados em tempo real \u2014 tudo em um \u00FAnico lugar." }), _jsx("div", { className: "flex flex-col sm:flex-row items-center justify-center gap-3", children: _jsx(Link, { href: isAuthenticated ? "/admin" : "/admin/login", children: _jsx(Button, { size: "lg", className: "rounded-full px-8 h-12 text-base", children: isAuthenticated
                                                ? "Acessar Painel"
                                                : "Começar agora" }) }) })] }) }), _jsx("section", { className: "py-20 bg-muted/30", children: _jsx("div", { className: "container", children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [
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
                                ].map(({ icon: Icon, title, desc }) => (_jsxs("div", { className: "bg-white rounded-2xl p-6 border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200", children: [_jsx("div", { className: "w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4", children: _jsx(Icon, { className: "w-5 h-5 text-primary" }) }), _jsx("h3", { className: "font-semibold text-foreground mb-2", children: title }), _jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: desc })] }, title))) }) }) })] }), _jsx("footer", { className: "border-t border-border/60 py-8", children: _jsxs("div", { className: "container text-center text-sm text-muted-foreground", children: ["\u00A9 ", new Date().getFullYear(), " SensoPro \u2014 Plataforma de Avalia\u00E7\u00E3o Sensorial"] }) })] }));
}
