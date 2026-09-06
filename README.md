# DinDin

Aplicacao web para controle financeiro pessoal e familiar. Permite registrar fontes de renda, organizar gastos por categoria com limites percentuais configuráveis, gerenciar transacoes de cartao de crédito e visualizar tudo em um dashboard intuitivo.

## Sobre o projeto

Este projeto foi construído quase inteiramente com o [Claude Code](https://claude.com/claude-code), com dois objetivos:

1. **Resolver um problema pessoal** — eu precisava de uma ferramenta simples para organizar minhas próprias finanças (rendas, gastos por categoria e cartão de crédito), sem depender de planilhas ou apps de terceiros.
2. **Estudar o uso de agentes de IA no desenvolvimento de software** — o repositório serve como estudo de caso de como conduzir um projeto real (arquitetura, regras de negócio, testes, CI/CD) usando Claude Code como principal ferramenta de implementação.

O código é disponibilizado publicamente para fins de estudo e portfólio. Fique à vontade para explorar, sugerir melhorias ou usar como referência — mas tenha em mente que decisões de arquitetura e negócio foram guiadas por mim e implementadas com apoio de IA, não o contrário.

## Funcionalidades

- **Dashboard** — visao geral de receitas, despesas do mes e saldo mensal com alertas visuais por categoria
- **Rendas** — cadastro de receitas com recorrência (mensal, semanal ou eventual)
- **Gastos** — registro de despesas avulsas classificadas por categoria
- **Cartoes** — gerenciamento de cartoes de crédito com suporte a parcelamento e recorrência
- **Categorias** — categorias de gastos personalizáveis com limite percentual da renda
- **Casa (House)** — contexto compartilhado entre múltiplos usuários via código de convite
- **Autenticacao** — login com conta Google via Auth.js v5

### Categorias padrão

| Categoria            | Limite |
| -------------------- | ------ |
| Custo Fixo           | 40%    |
| Metas                | 5%     |
| Conforto             | 20%    |
| Prazer               | 5%     |
| Liberdade Financeira | 25%    |
| Conhecimento         | 5%     |

## Stack

| Camada       | Tecnologia                           |
| ------------ | ------------------------------------ |
| Framework    | Next.js 14 (App Router)              |
| Linguagem    | TypeScript (strict)                  |
| Estilizacao  | Tailwind CSS + shadcn/ui             |
| Banco (dev)  | SQLite via Prisma ORM                |
| Banco (prd)  | PostgreSQL via Supabase + Prisma     |
| Autenticacao | Auth.js v5 (NextAuth) + Google OAuth |
| Validacao    | Zod                                  |
| Graficos     | Recharts                             |
| Deploy       | Vercel (CI/CD via GitHub Actions)    |

---

## Setup — Desenvolvimento

### Pre-requisitos

- Node.js >= 20
- npm >= 10

### 1. Clonar e instalar

```bash
git clone <url-do-repo>
cd dindin
npm install
```

### 2. Variaveis de ambiente

Copie o arquivo de exemplo e edite os valores:

```bash
cp .env.example .env.local
```

Em desenvolvimento, apenas `NEXTAUTH_URL` e `AUTH_SECRET` sao necessários:

```env
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="gere-com-npx-auth-secret"
```

Para gerar o `AUTH_SECRET`:

```bash
npx auth secret
```

> **Nota:** Em dev o banco é SQLite local — nao é necessário configurar `DATABASE_URL` nem credenciais do Google OAuth.

### 3. Inicializar banco e seed

```bash
npm run dev:setup
```

Esse comando executa em sequência:

1. `prisma generate` com o schema SQLite de desenvolvimento
2. `prisma db push` para criar as tabelas
3. `prisma db seed` para popular as categorias padrão

### 4. Rodar o servidor

```bash
npm run dev
```

Acesse em [http://localhost:3000](http://localhost:3000).

### Comandos uteis

| Comando             | Descricao                              |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Inicia o servidor de desenvolvimento   |
| `npm run dev:setup` | Gera client, cria tabelas e roda seed  |
| `npm run db:studio` | Abre o Prisma Studio (UI do banco)     |
| `npm test`          | Roda a suite de testes com coverage    |
| `npm run lint`      | Verifica estilo de codigo              |
| `npm run lint:fix`  | Corrige issues de lint automaticamente |
| `npm run format`    | Formata todos os arquivos com Prettier |

---

## Setup — Producao

### Servicos necessários

| Servico      | Finalidade                   |
| ------------ | ---------------------------- |
| Vercel       | Hospedagem e deploy continuo |
| Supabase     | Banco PostgreSQL gerenciado  |
| Google Cloud | OAuth 2.0 para autenticacao  |

### 1. Banco de dados (Supabase)

1. Crie um projeto no [Supabase](https://supabase.com)
2. Vá em **Project Settings > Database** e copie:
   - **Connection pooler URI** (porta `6543`, modo Transaction) → `DATABASE_URL`
   - **Direct connection URI** (porta `5432`) → `DIRECT_URL`
3. Rode as migrations no banco de producao:

```bash
npx prisma migrate deploy
```

### 2. Google OAuth

1. Acesse o [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto e habilite a **Google+ API**
3. Em **Credenciais > Criar credenciais > ID do cliente OAuth 2.0**, configure:
   - Tipo: Aplicativo Web
   - URIs de redirecionamento autorizados: `https://<seu-app>.vercel.app/api/auth/callback/google`
4. Copie o **Client ID** e o **Client Secret**

### 3. Variaveis de ambiente no Vercel

Configure as seguintes variaveis no painel da Vercel (**Settings > Environment Variables**):

```env
NEXTAUTH_URL=https://<seu-app>.vercel.app
AUTH_SECRET=<gerado-com-npx-auth-secret>

DATABASE_URL=postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://USER:PASSWORD@HOST:5432/postgres

AUTH_GOOGLE_ID=<seu-google-client-id>
AUTH_GOOGLE_SECRET=<seu-google-client-secret>
```

### 4. Deploy

O deploy é feito automaticamente via GitHub Actions ao fazer push na branch `main`.

O pipeline executa:

1. Lint + type check
2. Testes com coverage
3. Build e deploy na Vercel (somente na branch `main`)

Para configurar o pipeline, adicione os seguintes secrets no repositório GitHub (**Settings > Secrets**):

| Secret              | Valor                       |
| ------------------- | --------------------------- |
| `VERCEL_TOKEN`      | Token de acesso da Vercel   |
| `VERCEL_ORG_ID`     | ID da organizacao na Vercel |
| `VERCEL_PROJECT_ID` | ID do projeto na Vercel     |

---

## Estrutura do projeto

```
dindin/
├── prisma/
│   ├── schema.prisma          # Schema de producao (PostgreSQL)
│   ├── schema.dev.prisma      # Schema de desenvolvimento (SQLite)
│   └── seed.ts                # Seed das categorias padrão
├── src/
│   ├── app/                   # Rotas Next.js (App Router)
│   │   ├── dashboard/
│   │   ├── rendas/
│   │   ├── gastos/
│   │   ├── cartoes/
│   │   └── categorias/
│   ├── components/            # Componentes React por dominio
│   │   ├── ui/                # Componentes base (shadcn/ui)
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── rendas/
│   │   ├── gastos/
│   │   ├── cartoes/
│   │   └── categorias/
│   ├── server/
│   │   └── actions/           # Server Actions por dominio
│   │       ├── income.ts
│   │       ├── expense.ts
│   │       ├── card.ts
│   │       ├── category.ts
│   │       └── dashboard.ts
│   ├── lib/
│   │   ├── prisma.ts          # Instancia do Prisma Client
│   │   ├── utils.ts           # cn() e utilitários
│   │   └── validators/        # Schemas Zod
│   ├── hooks/                 # Custom React hooks
│   └── types/                 # Tipos TypeScript globais
└── .github/
    └── workflows/
        └── ci.yml             # Pipeline CI/CD
```
