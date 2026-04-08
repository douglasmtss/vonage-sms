# Vonage SMS Webhook

Aplicação web em Next.js para enviar e receber SMS pelo número Vonage comprado na plataforma, com interface de caixa de entrada em tempo real e suporte a **PWA** (instalável como app no celular e desktop).

## Funcionalidades

- **Receber SMS:** webhook que o Vonage chama ao receber uma mensagem no seu número
- **Enviar SMS:** formulário para enviar mensagens para qualquer número
- **Caixa de mensagens:** exibe enviadas e recebidas em ordem cronológica, atualizada automaticamente a cada 3 segundos
- **Interface responsiva** com Tailwind CSS
- **PWA (Progressive Web App):** instalável como app nativo no Android, iOS e desktop (Chrome/Edge)

## Pré-requisitos

- Node.js **20+** (use `nvm use 20`)
- Conta na [Vonage](https://dashboard.nexmo.com) com número virtual ativo
- API Key e API Secret do painel Vonage

## Estrutura do projeto

```
├── app/
│   ├── layout.tsx                  # Root layout + metadados PWA
│   ├── page.tsx                    # Interface principal (Client Component)
│   ├── globals.css                 # Tailwind CSS v4
│   ├── install-prompt.tsx          # Modal de instalação do PWA
│   ├── sw-register.tsx             # Registra o Service Worker
│   └── api/
│       ├── webhook/route.ts        # Recebe SMS inbound do Vonage (POST/GET)
│       ├── send-sms/route.ts       # Envia SMS via SDK Vonage (POST)
│       └── messages/route.ts       # Retorna histórico de mensagens (GET)
├── lib/
│   └── store.ts                    # Store de mensagens em memória
├── public/
│   ├── manifest.json               # Web App Manifest (PWA — arquivo estático)
│   ├── favicon.png                 # Favicon da aplicação
│   ├── sw.js                       # Service Worker (cache do app shell)
│   └── icons/
│       ├── icon.svg                # Ícone fonte
│       ├── icon-192.png            # Ícone PWA 192×192
│       └── icon-512.png            # Ícone PWA 512×512
├── .env.local.example              # Template das variáveis de ambiente
├── .nvmrc                          # Versão do Node (20)
├── eslint.config.mjs               # Configuração ESLint (flat config)
├── .prettierrc                     # Configuração Prettier
├── next.config.ts
├── vercel.json
├── package.json
└── tsconfig.json
```

## Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd vonage-sms-webhook

# Use Node 20+
nvm use 20

# Instale as dependências
npm install
```

## Configuração

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.local.example .env.local
```

Edite `.env.local`:

```env
# Credenciais Vonage — dashboard.nexmo.com → API Settings
VONAGE_API_KEY=sua_api_key_aqui
VONAGE_API_SECRET=seu_api_secret_aqui
VONAGE_FROM_NUMBER=55219XXXXXXXX
# Exibido na interface do usuário
NEXT_PUBLIC_FROM_NUMBER=55219XXXXXXXX

# Segredo adicionado à URL do webhook: /api/webhook?secret=<valor>
# Gere com: openssl rand -hex 32
WEBHOOK_SECRET=gere_um_valor_aleatorio

# Token Bearer exigido pelo frontend para chamar /api/send-sms e /api/messages
# Ambas as variáveis devem ter o MESMO valor
# Gere com: openssl rand -hex 32
API_SECRET=gere_um_valor_aleatorio
NEXT_PUBLIC_API_SECRET=gere_um_valor_aleatorio

# Origens de desenvolvimento permitidas, ex: tunnel do ngrok (somente dev)
# Use APENAS O HOSTNAME, sem https:// e sem barra no final
# Exemplo: ALLOWED_DEV_ORIGINS=xxxx.ngrok-free.app
# ALLOWED_DEV_ORIGINS=
```

As credenciais Vonage estão disponíveis em: [dashboard.nexmo.com](https://dashboard.nexmo.com) → API Settings.

## Rodando localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Configurando o webhook no Vonage

Para receber SMS localmente, exponha o servidor com **ngrok**:

```bash
# Em outro terminal
ngrok http 3000
```

O ngrok exibirá uma URL pública como `https://xxxx.ngrok-free.app`. Configure-a no painel Vonage:

1. Acesse [dashboard.nexmo.com](https://dashboard.nexmo.com)
2. Vá em **Phone Numbers → Your Numbers → Manage**
3. Em **Inbound Webhook URL**, coloque:
   ```
   https://xxxx.ngrok-free.app/api/webhook?secret=SEU_WEBHOOK_SECRET
   ```
4. Método: **POST**
5. Salve

Agora qualquer SMS enviado para o seu número Vonage aparecerá na caixa de mensagens.

## Deploy na Vercel

1. Faça push do código para um repositório GitHub/GitLab/Bitbucket
2. Acesse [vercel.com](https://vercel.com) → **New Project** → importe o repositório
3. Na etapa de configuração, adicione as variáveis de ambiente:

   | Nome                        | Valor                                        |
   | --------------------------- | -------------------------------------------- |
   | `VONAGE_API_KEY`            | sua api key                                  |
   | `VONAGE_API_SECRET`         | seu api secret                               |
   | `VONAGE_FROM_NUMBER`        | seu número Vonage (só dígitos, ex: `5521XXXXXXXXX`) |
   | `NEXT_PUBLIC_FROM_NUMBER`   | mesmo valor de `VONAGE_FROM_NUMBER`          |
   | `WEBHOOK_SECRET`            | resultado de `openssl rand -hex 32`          |
   | `API_SECRET`                | resultado de `openssl rand -hex 32`          |
   | `NEXT_PUBLIC_API_SECRET`    | mesmo valor de `API_SECRET`                  |

4. Clique em **Deploy**
5. Após o deploy, configure o webhook no Vonage com a URL de produção (inclua o `secret`):
   ```
   https://seu-projeto.vercel.app/api/webhook?secret=SEU_WEBHOOK_SECRET
   ```

## Rotas da API

Todas as rotas que modificam ou retornam dados exigem autenticação.

| Método | Rota            | Autenticação              | Descrição                                              |
| ------ | --------------- | ------------------------- | ------------------------------------------------------ |
| `POST` | `/api/webhook`  | `?secret=WEBHOOK_SECRET`  | Recebe SMS inbound do Vonage                           |
| `GET`  | `/api/webhook`  | `?secret=WEBHOOK_SECRET`  | Recebe SMS inbound via querystring (fallback)          |
| `POST` | `/api/send-sms` | `Bearer API_SECRET`       | Envia SMS. Body: `{ "to": "5511...", "text": "Olá" }`  |
| `GET`  | `/api/messages` | `Bearer API_SECRET`       | Retorna todas as mensagens em ordem cronológica (JSON) |

### Exemplo: enviar SMS via curl

```bash
curl -X POST https://seu-projeto.vercel.app/api/send-sms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_API_SECRET" \
  -d '{"to":"5511999999999","text":"Olá, tudo bem?"}'
```

### Exemplo: consultar mensagens via curl

```bash
curl https://seu-projeto.vercel.app/api/messages \
  -H "Authorization: Bearer SEU_API_SECRET"
```

## Sobre a persistência de mensagens

As mensagens são armazenadas em memória (`lib/store.ts`). Isso significa:

- **Desenvolvimento:** funcionamento perfeito, dados persistem enquanto o servidor está rodando
- **Vercel (produção):** os dados persistem dentro da mesma instância serverless; um novo deploy ou cold start limpa o histórico

Para persistência permanente em produção, substitua o `lib/store.ts` por:

- [Vercel KV](https://vercel.com/storage/kv) (Redis gerenciado pela Vercel)
- [Vercel Postgres](https://vercel.com/storage/postgres)
- Qualquer banco de dados de sua preferência

## Instalando como app (PWA)

A aplicação é uma **Progressive Web App** e pode ser instalada diretamente pelo browser, sem loja de aplicativos.

### Android (Chrome)

1. Acesse a URL da aplicação no Chrome
2. Toque no menu **⋮ → Adicionar à tela inicial**
3. Confirme e o ícone aparecerá na sua home

### iOS (Safari)

1. Acesse a URL no Safari
2. Toque em **Compartilhar → Adicionar à Tela de Início**
3. Confirme o nome e toque em **Adicionar**

### Desktop (Chrome / Edge)

1. Acesse a URL no Chrome ou Edge
2. Clique no ícone **➕** na barra de endereço (à direita)
3. Clique em **Instalar**

Após instalado, o app abre em janela própria (sem barra do navegador), como um app nativo.

> O Service Worker em `public/sw.js` faz cache do app shell, permitindo que a interface carregue mesmo offline. As chamadas à API (`/api/*`) sempre vão para a rede.

## Segurança

- **Webhook:** protegido por secret na querystring (`?secret=`)
- **API de envio e leitura:** protegida por Bearer token (`Authorization` header)
- **Headers HTTP:** `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy` configurados em `next.config.ts`
- **Tamanho máximo de SMS:** 1600 caracteres (10 partes concatenadas)
- **Sanitização de número:** apenas dígitos são aceitos, entre 10 e 15 dígitos

## Scripts disponíveis

| Comando                 | Descrição                            |
| ----------------------- | ------------------------------------ |
| `npm run dev`           | Inicia o servidor de desenvolvimento |
| `npm run build`         | Gera o build de produção             |
| `npm run start`         | Inicia o servidor de produção        |
| `npm run lint`          | Executa o ESLint                     |
| `npm run lint:fix`      | Corrige erros de lint automaticamente|
| `npm run format`        | Formata o código com Prettier         |
| `npm run format:check`  | Verifica a formatação sem alterar     |
