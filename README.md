# 🎮 Steam Promo Bot

Bot automatizado que monitora jogos em promoção na Steam e envia notificações por e-mail.

## 📋 Sobre o Projeto

Este bot busca automaticamente jogos em promoção na Steam e envia um e-mail com a lista completa de jogos em promoção, ordenados por maior desconto.

## 🚀 Funcionalidades

- ✅ Busca jogos em promoção na Steam usando a página de busca
- ✅ Verifica detalhes de preço e desconto de cada jogo
- ✅ Filtra apenas jogos realmente em promoção (desconto > 0%)
- ✅ Ordena os jogos por maior desconto
- ✅ Envia e-mail com a lista completa de promoções
- ✅ Suporta preços em Real Brasileiro (R$)

## 📦 Pré-requisitos

- Node.js (versão 14 ou superior)
- npm (geralmente vem com Node.js)
- Conta Gmail para envio de e-mails
- Senha de aplicativo do Gmail (não use sua senha normal)

## 🔧 Instalação

1. **Clone ou baixe este repositório**

2. **Instale as dependências:**

   ```bash
   npm install
   ```

3. **Configure o arquivo `.env`:**

   Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

   ```env
   EMAIL_USER=seu_email@gmail.com
   EMAIL_PASS=sua_senha_de_app_do_google
   DESTINATION_EMAIL=destinatario@gmail.com
   ```

   **Importante sobre a senha:**

   - Não use sua senha normal do Gmail
   - Você precisa criar uma "Senha de App" no Google
   - Acesse: https://myaccount.google.com/apppasswords
   - Gere uma senha de 16 caracteres para "Mail"
   - Use essa senha no campo `EMAIL_PASS`

## ⚙️ Configuração

### Configuração de E-mail

1. **Ative a verificação em duas etapas no Google:**

   - Acesse: https://myaccount.google.com/security
   - Ative a verificação em duas etapas

2. **Gere uma Senha de App:**

   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "Mail" e "Outro (nome personalizado)"
   - Digite "Steam Bot" como nome
   - Clique em "Gerar"
   - Copie a senha de 16 caracteres gerada

3. **Configure o `.env`:**
   ```env
   EMAIL_USER=seu_email@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx  # Senha de 16 caracteres (sem espaços)
   DESTINATION_EMAIL=destinatario@gmail.com
   ```

## 🎯 Como Usar

### Executar o Bot

```bash
node bot.js
```

### O que o Bot Faz

1. **Busca jogos em promoção:**

   - Acessa a página de busca da Steam com filtro de promoções
   - Busca em várias categorias (geral, action, rpg, strategy, adventure, indie)
   - Extrai os App IDs dos jogos encontrados

2. **Verifica detalhes:**

   - Para cada jogo, verifica preço, desconto e detalhes
   - Filtra apenas jogos realmente em promoção
   - Limita a 100 jogos para evitar muitas requisições

3. **Envia e-mail:**
   - Monta um e-mail HTML com a lista de promoções
   - Ordena por maior desconto primeiro
   - Envia para o e-mail configurado em `DESTINATION_EMAIL`

## 📧 Exemplo de E-mail

O e-mail enviado contém:

- Título: `[Steam Bot] X Jogos em Promoção na Steam!`
- Lista de jogos com:
  - Nome do jogo
  - Percentual de desconto
  - Preço original (riscado)
  - Preço final (em destaque)
  - Link para a página na Steam

## 🔄 Automação (Opcional)

Para executar o bot automaticamente, você pode usar:

### Windows (Task Scheduler)

1. Abra o Agendador de Tarefas
2. Crie uma nova tarefa
3. Configure para executar: `node C:\caminho\para\steam-promo-bot\bot.js`
4. Configure o agendamento desejado (ex: diariamente às 9h)

### Linux/Mac (Cron)

Adicione ao crontab:

```bash
# Executar diariamente às 9h
0 9 * * * cd /caminho/para/steam-promo-bot && node bot.js
```

## 📁 Estrutura do Projeto

```
steam-promo-bot/
├── bot.js              # Código principal do bot
├── package.json        # Dependências do projeto
├── .env               # Configurações (não versionado)
└── README.md          # Este arquivo
```

## 🔒 Segurança

- ⚠️ **NUNCA** compartilhe seu arquivo `.env`
- ⚠️ **NUNCA** faça commit do `.env` no Git
- ✅ Use senha de app do Google (não sua senha normal)
- ✅ O `.env` já está no `.gitignore` por padrão

## 🐛 Resolução de Problemas

### Erro: "Rate limit atingido"

- **Solução:** Aguarde alguns minutos antes de executar novamente
- O bot já tem delays entre requisições para evitar isso

### Erro: "Erro ao enviar e-mail"

- **Verifique:**
  - Se a verificação em duas etapas está ativada
  - Se você está usando a senha de app (não a senha normal)
  - Se o `EMAIL_PASS` está correto no `.env`

### Nenhum jogo encontrado

- A Steam pode estar bloqueando requisições
- Tente executar novamente após alguns minutos
- Verifique sua conexão com a internet

## 📝 Dependências

- `axios` - Para fazer requisições HTTP
- `nodemailer` - Para envio de e-mails
- `dotenv` - Para gerenciar variáveis de ambiente

## 🤝 Contribuindo

Sinta-se à vontade para abrir issues ou pull requests!

## 📄 Licença

Este projeto é livre para uso pessoal.

## ⚠️ Avisos

- Este bot é apenas para uso pessoal
- Respeite os termos de serviço da Steam
- Não abuse das requisições à API da Steam
- O bot tem limites de segurança para evitar rate limiting

---

**Desenvolvido com ❤️ para gamers que querem pegar as melhores promoções!**
