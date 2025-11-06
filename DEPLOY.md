# 🚀 Guia de Deploy - Steam Promo Bot

Este guia explica como colocar seu bot Steam Promo na web usando diferentes plataformas.

## 📋 Pré-requisitos

Antes de fazer o deploy, você precisa:

1. ✅ Ter uma conta GitHub/GitLab/Bitbucket (para hospedar o código)
2. ✅ Ter o arquivo `.env` configurado localmente
3. ✅ Ter o código commitado no Git

## 🌐 Opções de Plataforma

### 1. Railway (Recomendado - Mais Fácil) ⭐

**Railway** é uma das opções mais simples e gratuitas para começar.

#### Passos:

1. **Acesse:** https://railway.app
2. **Crie uma conta** (pode usar GitHub)
3. **Clique em "New Project"**
4. **Selecione "Deploy from GitHub repo"**
5. **Conecte seu repositório** e selecione o projeto
6. **Configure as variáveis de ambiente:**
   - Clique em seu projeto → Settings → Variables
   - Adicione:
     ```
     EMAIL_USER=seu_email@gmail.com
     EMAIL_PASS=sua_senha_de_app
     DESTINATION_EMAIL=destinatario@gmail.com
     PORT=3000
     ```
7. **Railway detecta automaticamente** e inicia o servidor
8. **Configure o domínio:**
   - Settings → Networking → Generate Domain
   - Ou use seu próprio domínio

#### Vantagens:

- ✅ Grátis até certo limite
- ✅ Deploy automático do GitHub
- ✅ Fácil configuração
- ✅ Suporta Node.js nativamente

---

### 2. Render

**Render** é outra opção excelente e gratuita.

#### Passos:

1. **Acesse:** https://render.com
2. **Crie uma conta** (pode usar GitHub)
3. **Clique em "New +" → "Web Service"**
4. **Conecte seu repositório**
5. **Configure:**
   - **Name:** `steam-promo-bot`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (ou escolha outro)
6. **Adicione as variáveis de ambiente:**
   - Environment Variables → Add:
     ```
     EMAIL_USER=seu_email@gmail.com
     EMAIL_PASS=sua_senha_de_app
     DESTINATION_EMAIL=destinatario@gmail.com
     PORT=3000
     ```
7. **Clique em "Create Web Service"**
8. **Aguarde o deploy** (pode levar alguns minutos)

#### Vantagens:

- ✅ Plano gratuito disponível
- ✅ Deploy automático
- ✅ SSL automático
- ✅ Fácil de usar

---

### 3. Heroku

**Heroku** é uma plataforma tradicional e confiável.

#### Passos:

1. **Instale o Heroku CLI:** https://devcenter.heroku.com/articles/heroku-cli
2. **Faça login:**
   ```bash
   heroku login
   ```
3. **Crie o app:**
   ```bash
   heroku create seu-app-steam-bot
   ```
4. **Configure as variáveis:**
   ```bash
   heroku config:set EMAIL_USER=seu_email@gmail.com
   heroku config:set EMAIL_PASS=sua_senha_de_app
   heroku config:set DESTINATION_EMAIL=destinatario@gmail.com
   ```
5. **Faça o deploy:**
   ```bash
   git push heroku main
   ```
6. **Abra o app:**
   ```bash
   heroku open
   ```

#### Vantagens:

- ✅ Gratuito (com limitações)
- ✅ Muito popular
- ✅ Boa documentação

#### ⚠️ Nota:

Heroku encerrou o plano gratuito, então você precisará de um cartão de crédito para o plano básico.

---

### 4. Fly.io

**Fly.io** é moderno e oferece boa performance.

#### Passos:

1. **Instale o Fly CLI:**
   ```bash
   # Windows
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```
2. **Faça login:**
   ```bash
   fly auth login
   ```
3. **Inicialize o projeto:**
   ```bash
   fly launch
   ```
4. **Configure as variáveis:**
   ```bash
   fly secrets set EMAIL_USER=seu_email@gmail.com
   fly secrets set EMAIL_PASS=sua_senha_de_app
   fly secrets set DESTINATION_EMAIL=destinatario@gmail.com
   ```
5. **Deploy:**
   ```bash
   fly deploy
   ```

---

### 5. DigitalOcean App Platform

**DigitalOcean** oferece uma plataforma simples similar ao Heroku.

#### Passos:

1. **Acesse:** https://cloud.digitalocean.com
2. **Crie uma conta** (pode usar GitHub)
3. **Vá em "Apps" → "Create App"**
4. **Conecte seu repositório**
5. **Configure:**
   - Detecta automaticamente Node.js
   - Build Command: `npm install`
   - Run Command: `npm start`
6. **Adicione variáveis de ambiente** na seção Environment
7. **Escolha o plano** (há um plano básico)
8. **Deploy**

---

## 🔧 Configurações Importantes

### Variáveis de Ambiente Necessárias

Em todas as plataformas, você precisa configurar:

```env
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app_do_google
DESTINATION_EMAIL=destinatario@gmail.com
PORT=3000
```

### ⚠️ Importante sobre a Senha de App do Google

1. **Ative a verificação em duas etapas** no Google
2. **Gere uma Senha de App:**
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "Mail" e "Outro (nome personalizado)"
   - Digite "Steam Bot" como nome
   - Copie a senha de 16 caracteres
3. **Use essa senha** no campo `EMAIL_PASS` (não use sua senha normal)

---

## 📝 Checklist de Deploy

Antes de fazer o deploy, verifique:

- [ ] Código commitado no Git
- [ ] `.env` NÃO está no repositório (já está no `.gitignore`)
- [ ] Variáveis de ambiente configuradas na plataforma
- [ ] `package.json` tem o script `"start": "node server.js"`
- [ ] Testou localmente com `npm start`

---

## 🌐 Após o Deploy

### 1. Teste a Aplicação

Acesse a URL fornecida pela plataforma (ex: `https://seu-app.railway.app`)

### 2. Teste a API

- `GET /api/promotions` - Deve retornar as promoções
- `POST /api/update` - Deve iniciar a atualização

### 3. Configure Automação (Opcional)

Muitas plataformas permitem agendar tarefas:

- **Railway:** Use cron jobs ou serviços externos
- **Render:** Use cron jobs
- **Heroku:** Use Heroku Scheduler (add-on)

### 4. Monitoramento

- Verifique os logs da aplicação regularmente
- Configure alertas se a plataforma oferecer

---

## 🔄 Atualizações

Após fazer o deploy, quando você fizer alterações:

1. **Commit suas alterações:**

   ```bash
   git add .
   git commit -m "Minhas alterações"
   git push
   ```

2. **A plataforma faz deploy automático** (se configurado)
   - Railway: Deploy automático
   - Render: Deploy automático
   - Heroku: `git push heroku main`

---

## 🐛 Troubleshooting

### Erro: "Cannot find module"

- Verifique se todas as dependências estão no `package.json`
- Execute `npm install` localmente e verifique

### Erro: "Port already in use"

- A plataforma define automaticamente a porta via `process.env.PORT`
- Não precisa configurar manualmente

### App não inicia

- Verifique os logs na plataforma
- Verifique se todas as variáveis de ambiente estão configuradas
- Teste localmente primeiro

### E-mails não são enviados

- Verifique se `EMAIL_PASS` é a senha de app (não a senha normal)
- Verifique se a verificação em duas etapas está ativada
- Verifique os logs para erros específicos

---

## 💡 Dica: Usar Cron Jobs para Atualização Automática

Você pode usar serviços gratuitos como:

- **cron-job.org** - Agende requisições HTTP
- **EasyCron** - Similar
- Configure para chamar `POST /api/update` periodicamente

Exemplo:

- URL: `https://seu-app.railway.app/api/update`
- Método: POST
- Frequência: Diariamente às 9h

---

## 📊 Comparação de Plataformas

| Plataforma   | Grátis?  | Dificuldade    | Deploy Auto | Recomendado |
| ------------ | -------- | -------------- | ----------- | ----------- |
| Railway      | ✅ Sim   | ⭐ Fácil       | ✅ Sim      | ⭐⭐⭐⭐⭐  |
| Render       | ✅ Sim   | ⭐ Fácil       | ✅ Sim      | ⭐⭐⭐⭐⭐  |
| Heroku       | ❌ Não\* | ⭐⭐ Médio     | ✅ Sim      | ⭐⭐⭐⭐    |
| Fly.io       | ✅ Sim   | ⭐⭐⭐ Difícil | ✅ Sim      | ⭐⭐⭐      |
| DigitalOcean | ⚠️ Trial | ⭐⭐ Médio     | ✅ Sim      | ⭐⭐⭐      |

\*Heroku requer cartão de crédito mesmo para planos básicos

---

## 🎯 Recomendação Final

Para começar rápido e fácil, recomendo:

1. **Railway** - Mais simples e gratuito
2. **Render** - Alternativa igualmente simples

Ambas são gratuitas, fáceis de configurar e têm deploy automático do GitHub!

---

**Boa sorte com o deploy! 🚀**
