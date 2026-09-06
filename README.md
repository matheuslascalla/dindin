# DinDin

🇧🇷 [Português](#português---dindin) | 🇺🇸 [English](#english---dindin)

---

## Português - DinDin

Aplicacao web para controle financeiro pessoal e familiar. Permite registrar fontes de renda, organizar gastos por categoria com limites percentuais configuráveis, gerenciar transacoes de cartao de crédito e visualizar tudo em um dashboard intuitivo.

### Sobre o projeto

Este projeto foi construído quase inteiramente com o [Claude Code](https://claude.com/claude-code), com dois objetivos:

1. **Resolver um problema pessoal** — eu precisava de uma ferramenta simples para organizar minhas próprias finanças (rendas, gastos por categoria e cartão de crédito), sem depender de planilhas ou apps de terceiros.
2. **Estudar o uso de agentes de IA no desenvolvimento de software** — o repositório serve como estudo de caso de como conduzir um projeto real (arquitetura, regras de negócio, testes, CI/CD) usando Claude Code como principal ferramenta de implementação.

O código é disponibilizado publicamente para fins de estudo e portfólio. Fique à vontade para explorar, sugerir melhorias ou usar como referência — mas tenha em mente que decisões de arquitetura e negócio foram guiadas por mim e implementadas com apoio de IA, não o contrário.

### Funcionalidades

- **Dashboard** — visao geral de receitas, despesas do mes e saldo mensal com alertas visuais por categoria
- **Rendas** — cadastro de receitas com recorrência (mensal, semanal ou eventual)
- **Gastos** — registro de despesas avulsas classificadas por categoria
- **Cartoes** — gerenciamento de cartoes de crédito com suporte a parcelamento e recorrência
- **Categorias** — categorias de gastos personalizáveis com limite percentual da renda
- **Casa (House)** — contexto compartilhado entre múltiplos usuários via código de convite
- **Autenticacao** — login com conta Google via Auth.js v5

#### Categorias padrão

| Categoria            | Limite |
| -------------------- | ------ |
| Custo Fixo           | 40%    |
| Metas                | 5%     |
| Conforto             | 20%    |
| Prazer               | 5%     |
| Liberdade Financeira | 25%    |
| Conhecimento         | 5%     |

### Stack

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

### Setup — Desenvolvimento

#### Pre-requisitos

- Node.js >= 20
- npm >= 10

#### 1. Clonar e instalar

```bash
git clone <url-do-repo>
cd dindin
npm install
```

#### 2. Variaveis de ambiente

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

#### 3. Inicializar banco e seed

```bash
npm run dev:setup
```

Esse comando executa em sequência:

1. `prisma generate` com o schema SQLite de desenvolvimento
2. `prisma db push` para criar as tabelas
3. `prisma db seed` para popular as categorias padrão

#### 4. Rodar o servidor

```bash
npm run dev
```

Acesse em [http://localhost:3000](http://localhost:3000).

#### Comandos uteis

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

### Setup — Producao

#### Servicos necessários

| Servico      | Finalidade                   |
| ------------ | ---------------------------- |
| Vercel       | Hospedagem e deploy continuo |
| Supabase     | Banco PostgreSQL gerenciado  |
| Google Cloud | OAuth 2.0 para autenticacao  |

#### 1. Banco de dados (Supabase)

1. Crie um projeto no [Supabase](https://supabase.com)
2. Vá em **Project Settings > Database** e copie:
   - **Connection pooler URI** (porta `6543`, modo Transaction) → `DATABASE_URL`
   - **Direct connection URI** (porta `5432`) → `DIRECT_URL`
3. Rode as migrations no banco de producao:

```bash
npx prisma migrate deploy
```

#### 2. Google OAuth

1. Acesse o [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto e habilite a **Google+ API**
3. Em **Credenciais > Criar credenciais > ID do cliente OAuth 2.0**, configure:
   - Tipo: Aplicativo Web
   - URIs de redirecionamento autorizados: `https://<seu-app>.vercel.app/api/auth/callback/google`
4. Copie o **Client ID** e o **Client Secret**

#### 3. Variaveis de ambiente no Vercel

Configure as seguintes variaveis no painel da Vercel (**Settings > Environment Variables**):

```env
NEXTAUTH_URL=https://<seu-app>.vercel.app
AUTH_SECRET=<gerado-com-npx-auth-secret>

DATABASE_URL=postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://USER:PASSWORD@HOST:5432/postgres

AUTH_GOOGLE_ID=<seu-google-client-id>
AUTH_GOOGLE_SECRET=<seu-google-client-secret>
```

#### 4. Deploy

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

### Estrutura do projeto

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

---

## English - DinDin

Web application for personal and household financial management. Lets you register income sources, organize expenses by category with configurable percentage limits, manage credit card transactions, and view everything in a clean, intuitive dashboard.

### About the project

This project was built almost entirely with [Claude Code](https://claude.com/claude-code), with two goals in mind:

1. **Solve a personal problem** — I needed a simple tool to organize my own finances (income, categorized expenses, and credit card bills) without relying on spreadsheets or third-party apps.
2. **Study the use of AI agents in software development** — the repository serves as a case study on how to drive a real project (architecture, business rules, tests, CI/CD) using Claude Code as the main implementation tool.

The code is made public for study and portfolio purposes. Feel free to explore it, suggest improvements, or use it as a reference — but keep in mind that architecture and business decisions were guided by me and implemented with AI assistance, not the other way around.

### Features

- **Dashboard** — overview of income, monthly expenses, and monthly balance, with visual alerts per category
- **Income** — register income with recurrence (monthly, weekly, or one-off)
- **Expenses** — record standalone expenses classified by category
- **Cards** — manage credit cards with support for installments and recurrence
- **Categories** — customizable expense categories with a percentage limit of income
- **House** — shared context between multiple users via an invite code
- **Authentication** — login with a Google account via Auth.js v5

#### Default categories

| Category          | Limit |
| ----------------- | ----- |
| Fixed Cost        | 40%   |
| Goals             | 5%    |
| Comfort           | 20%   |
| Pleasures         | 5%    |
| Financial Freedom | 25%   |
| Knowledge         | 5%    |

### Stack

| Layer           | Technology                           |
| --------------- | ------------------------------------ |
| Framework       | Next.js 14 (App Router)              |
| Language        | TypeScript (strict)                  |
| Styling         | Tailwind CSS + shadcn/ui             |
| Database (dev)  | SQLite via Prisma ORM                |
| Database (prod) | PostgreSQL via Supabase + Prisma     |
| Auth            | Auth.js v5 (NextAuth) + Google OAuth |
| Validation      | Zod                                  |
| Charts          | Recharts                             |
| Deploy          | Vercel (CI/CD via GitHub Actions)    |

---

### Setup — Development

#### Prerequisites

- Node.js >= 20
- npm >= 10

#### 1. Clone and install

```bash
git clone <repo-url>
cd dindin
npm install
```

#### 2. Environment variables

Copy the example file and edit the values:

```bash
cp .env.example .env.local
```

In development, only `NEXTAUTH_URL` and `AUTH_SECRET` are required:

```env
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="generate-with-npx-auth-secret"
```

To generate the `AUTH_SECRET`:

```bash
npx auth secret
```

> **Note:** In dev the database is local SQLite — there's no need to configure `DATABASE_URL` or Google OAuth credentials.

#### 3. Initialize the database and seed

```bash
npm run dev:setup
```

This command runs, in order:

1. `prisma generate` with the development SQLite schema
2. `prisma db push` to create the tables
3. `prisma db seed` to populate the default categories

#### 4. Run the server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

#### Useful commands

| Command             | Description                             |
| ------------------- | --------------------------------------- |
| `npm run dev`       | Starts the development server           |
| `npm run dev:setup` | Generates client, creates tables, seeds |
| `npm run db:studio` | Opens Prisma Studio (database UI)       |
| `npm test`          | Runs the test suite with coverage       |
| `npm run lint`      | Checks code style                       |
| `npm run lint:fix`  | Auto-fixes lint issues                  |
| `npm run format`    | Formats all files with Prettier         |

---

### Setup — Production

#### Required services

| Service      | Purpose                       |
| ------------ | ----------------------------- |
| Vercel       | Hosting and continuous deploy |
| Supabase     | Managed PostgreSQL database   |
| Google Cloud | OAuth 2.0 for authentication  |

#### 1. Database (Supabase)

1. Create a project on [Supabase](https://supabase.com)
2. Go to **Project Settings > Database** and copy:
   - **Connection pooler URI** (port `6543`, Transaction mode) → `DATABASE_URL`
   - **Direct connection URI** (port `5432`) → `DIRECT_URL`
3. Run the migrations against the production database:

```bash
npx prisma migrate deploy
```

#### 2. Google OAuth

1. Go to the [Google Cloud Console](https://console.cloud.google.com)
2. Create a project and enable the **Google+ API**
3. Under **Credentials > Create credentials > OAuth 2.0 Client ID**, configure:
   - Type: Web application
   - Authorized redirect URIs: `https://<your-app>.vercel.app/api/auth/callback/google`
4. Copy the **Client ID** and **Client Secret**

#### 3. Environment variables on Vercel

Configure the following variables in the Vercel dashboard (**Settings > Environment Variables**):

```env
NEXTAUTH_URL=https://<your-app>.vercel.app
AUTH_SECRET=<generated-with-npx-auth-secret>

DATABASE_URL=postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://USER:PASSWORD@HOST:5432/postgres

AUTH_GOOGLE_ID=<your-google-client-id>
AUTH_GOOGLE_SECRET=<your-google-client-secret>
```

#### 4. Deploy

Deployment happens automatically via GitHub Actions on every push to the `main` branch.

The pipeline runs:

1. Lint + type check
2. Tests with coverage
3. Build and deploy to Vercel (only on the `main` branch)

To set up the pipeline, add the following secrets to the GitHub repository (**Settings > Secrets**):

| Secret              | Value                  |
| ------------------- | ---------------------- |
| `VERCEL_TOKEN`      | Vercel access token    |
| `VERCEL_ORG_ID`     | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID      |

---

### Project structure

```
dindin/
├── prisma/
│   ├── schema.prisma          # Production schema (PostgreSQL)
│   ├── schema.dev.prisma      # Development schema (SQLite)
│   └── seed.ts                # Default category seed
├── src/
│   ├── app/                   # Next.js routes (App Router)
│   │   ├── dashboard/
│   │   ├── rendas/
│   │   ├── gastos/
│   │   ├── cartoes/
│   │   └── categorias/
│   ├── components/            # React components by domain
│   │   ├── ui/                # Base components (shadcn/ui)
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── rendas/
│   │   ├── gastos/
│   │   ├── cartoes/
│   │   └── categorias/
│   ├── server/
│   │   └── actions/           # Server Actions by domain
│   │       ├── income.ts
│   │       ├── expense.ts
│   │       ├── card.ts
│   │       ├── category.ts
│   │       └── dashboard.ts
│   ├── lib/
│   │   ├── prisma.ts          # Prisma Client instance
│   │   ├── utils.ts           # cn() and utilities
│   │   └── validators/        # Zod schemas
│   ├── hooks/                 # Custom React hooks
│   └── types/                 # Global TypeScript types
└── .github/
    └── workflows/
        └── ci.yml             # CI/CD pipeline
```
