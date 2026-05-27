# SensoPro — TODO

## Backend / Schema
- [x] Schema: tabelas experimentos, amostras, atributos, sessoes, respostas
- [x] Migração SQL aplicada via webdev_execute_sql
- [x] Helpers de DB em server/db.ts
- [x] Routers tRPC: experimentos CRUD, amostras CRUD, atributos CRUD, sessoes, respostas, dashboard

## Painel Administrativo
- [x] Login admin (role-based via Manus OAuth)
- [x] Listagem de experimentos com status ativo/inativo
- [x] Criar/editar/excluir experimento
- [x] Ativar/desativar experimento (apenas um ativo por vez)
- [x] Gerenciar amostras por experimento (adicionar, editar, reordenar, remover)
- [x] Gerenciar atributos por experimento (adicionar, editar, reordenar, remover)
- [x] Geração de link único de compartilhamento por experimento
- [x] Dashboard com tabela de respostas por experimento
- [x] Gráficos por atributo e por amostra (recharts)
- [x] Exportação para Excel (XLSX)

## Formulário Público
- [x] Rota pública /avaliar/:slug com formulário de avaliação
- [x] Tela de entrada: nome + e-mail
- [x] Controle de duplicidade (mesmo e-mail não responde duas vezes)
- [x] Fluxo de avaliação: slider/régua por atributo, uma amostra por vez
- [x] Barra de progresso visível
- [x] Tela de confirmação/agradecimento após envio

## Design & UX
- [x] Tema elegante e refinado (tipografia, espaçamentos, cores)
- [x] Layout responsivo mobile-first
- [x] Animações suaves e micro-interações
- [x] Estados de loading, erro e vazio
- [x] Reordenação de amostras e atributos com botões subir/descer
- [x] Tratamento robusto de erros no formulário de avaliação (sem avanço em caso de falha)
- [x] Salvamento garantido antes de cada avanço e finalização

## Melhorias Solicitadas
- [x] Carregar dados de carnes dos arquivos originais como experimento pré-pronto
- [x] Customizar slider com 1 reta horizontal e 3 marcas verticais (2 nas pontas + 1 no meio)
- [x] Bolinha no slider que se move com porcentagem exibida
- [x] Adicionar cronômetro de avaliação (tempo total gasto)
- [x] Exibir tempo final na tela de agradecimento

## Melhorias Solicitadas (Fase 2)
- [x] Aplicar cores FEA (rosa #E63E6D e azul marinho #1A2B5E) em todo o site
- [x] Slider começar zerado (não em 50%)
- [x] Remover linha azul pré-preenchida do slider
- [x] Remover exibição de porcentagem durante clique (só mostra no resultado final)
- [x] Implementar anonimato: não armazenar nome/email, dashboard mostra apenas resultados
- [x] Adicionar campos: cidade, estado, país, idade na tela de entrada
- [x] Permitir repetição de avaliação (sem bloqueio por email)
- [x] Preparar projeto para deploy no Vercel


## Melhorias Finais (Fase 3)
- [x] Adicionar azul FEA em mais elementos da interface (bolinha rosa FEA)
- [x] Remover escala visual (labels e 3 marcas verticais) do slider
- [x] Permitir avaliação livre (qualquer valor, não apenas 0/50/100)
- [x] Fluxo automático: salvar e avançar ao soltar a bolinha


## Correções Solicitadas (Fase 4)
- [x] Restaurar 3 marcas verticais no slider (2 nas laterais + 1 no meio)
- [x] Remover exibição de porcentagem (bolinha aparece sem %)
- [x] Adicionar azul FEA em mais elementos da interface
- [x] Implementar sistema de múltiplos admins (promover usuários no painel)
- [x] Separar dados demográficos em abas (idade, cidade, estado, país)


## Autenticação de Admins (Email/Senha)
- [x] Adicionar tabela de admins com email, senha hash e criação
- [x] Instalar bcrypt para hash de senhas
- [x] Criar routers tRPC: login, registro, verificar autenticação
- [x] Criar tela de login para admins
- [x] Criar tela de registro para admins (primeira vez)
- [x] Integrar autenticação no painel administrativo
- [x] Melhorar visibilidade do slider (linha horizontal mais escura)
- [x] Adicionar animações nas abas de dados demográficos


## Melhorias Solicitadas (Fase 6 - Multi-tenancy e UX)
- [x] Slider com 2 marcas verticais (apenas pontas, sem meio)
- [x] Traço azul ao clicar (indicador visual de seleção)
- [x] Permitir alterar clicando em qualquer ponto da linha
- [x] Bloquear avanço automático - só avança com botão Próximo
- [x] Implementar multi-tenancy: cada admin tem painel independente com seus experimentos
- [x] Permitir múltiplas avaliações ativas simultaneamente (remover limite de 1)
- [x] Labels "Pouco" (esquerda) e "Muito" (direita) embaixo dos traços
- [x] Campo de nome do provador antes de iniciar o teste
- [x] Número da amostra em cima de cada avaliação
- [x] Campo de atributos adicionais na última avaliação (opcional)
- [x] Compartilhamento de acesso admin: ativar admins por email
- [x] Painel de gerenciamento de admins com ativar/desativar


## Sistema de Convites (Fase 7 - Compartilhamento com Código Único)
- [x] Criar tabela de convites com código único e expiração
- [x] Implementar routers de convite (criar, validar, aceitar)
- [x] Criar página de registro via convite (AdminConvitePage)
- [x] Adicionar interface de geração de convites no painel (ConviteManagement)
- [x] Integrar ConviteManagement no AdminPage com seção "Gerar Convites"
- [x] Suporte a convites com expiração de 30 dias
- [x] Validação de convites (não usado, não expirado)
- [x] Botão "Entrar no Painel" após criar conta via convite
- [x] Login automático após registro via convite
- [x] Testes passando


## Problemas Identificados (Fase 8 - Correção Mobile/Desktop)
- [x] Desktop não deixa criar experimento (diz "não é administrador") - CORRIGIDO: emailPasswordAdminProcedure agora aceita ambos tipos de autenticação
- [x] Desktop não mostra "Gerar Convites" - CORRIGIDO: agora aparece para ambos tipos de admin
- [x] Mobile não mostra análise/dashboard - CORRIGIDO: adicionado suporte responsivo com min-height para gráficos


## Correção de Autenticação e Compartilhamento (Fase 9 - Cookie Parser)
- [x] Adicionar cookie-parser ao Express para parsear cookies corretamente
- [x] Corrigir adminAuth.login para usar res.cookie() em vez de setHeader manual
- [x] Corrigir adminAuth.logout para usar res.clearCookie()
- [x] Remover verificações de propriedade (criadoPor) em getById, update, desativar
- [x] Garantir que todos os admins vejam e possam gerenciar todos os experimentos
- [x] Resolver erro "You do not have required permission (10002)" ao criar experimento
- [x] Testes passando (7/7)


## Correção de Redirecionamento após Login (Fase 10)
- [x] Adicionar invalidate() e refetch() após login bem-sucedido
- [x] Garantir que o cookie admin_session seja processado antes de redirecionar
- [x] Usuário é redirecionado para /admin após login com sucesso
- [x] Testes passando (7/7)
