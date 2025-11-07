const express = require('express');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const axios = require('axios');
const { checkPromotions, getTopSellingGames } = require('./bot');

const app = express();
const PORT = process.env.PORT || 3000;

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Pasta data criada');
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/promotions', (req, res) => {
  try {
    const dataPath = path.join(__dirname, 'data', 'promotions.json');

    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      res.json(data);
    } else {
      res.json({
        lastUpdate: null,
        total: 0,
        promotions: [],
        message: 'Nenhum dado encontrado. Execute o bot primeiro.',
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/topsellers', (req, res) => {
  try {
    const dataPath = path.join(__dirname, 'data', 'topsellers.json');

    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      res.json(data);
    } else {
      res.json({
        lastUpdate: null,
        total: 0,
        games: [],
        message: 'Nenhum dado encontrado. Execute a atualização primeiro.',
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/update', async (req, res) => {
  try {
    res.json({
      message: 'Atualização iniciada. Isso pode levar alguns minutos...',
    });

    const {
      savePromotionsToFile,
      saveTopSellersToFile,
      sendEmail,
    } = require('./bot');

    Promise.all([
      checkPromotions().then(async (promos) => {
        await savePromotionsToFile(promos);
        try {
          await sendEmail(promos);
        } catch (emailError) {
          console.error(
            '⚠️ Erro ao enviar e-mail (continuando...):',
            emailError.message,
          );
        }
        console.log('Promoções atualizadas via API');
        return promos;
      }),
      getTopSellingGames().then(async (games) => {
        await saveTopSellersToFile(games);
        console.log('Mais vendidos atualizados via API');
        return games;
      }),
    ]).catch((err) => {
      console.error('Erro ao atualizar:', err);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function updateDataOnly() {
  console.log('🔄 Atualizando dados das promoções...');
  try {
    const { savePromotionsToFile, saveTopSellersToFile } = require('./bot');

    const [promos, topSellers] = await Promise.all([
      checkPromotions().then(async (promos) => {
        await savePromotionsToFile(promos);
        return promos;
      }),
      getTopSellingGames().then(async (games) => {
        await saveTopSellersToFile(games);
        return games;
      }),
    ]);

    console.log(
      `✅ Dados atualizados: ${promos.length} promoções e ${topSellers.length} mais vendidos encontrados.`,
    );
  } catch (error) {
    console.error('❌ Erro ao atualizar dados:', error);
  }
}

async function sendScheduledEmail() {
  console.log('📧 Enviando email agendado...');
  try {
    const {
      savePromotionsToFile,
      saveTopSellersToFile,
      sendEmail,
    } = require('./bot');

    const [promos, topSellers] = await Promise.all([
      checkPromotions().then(async (promos) => {
        await savePromotionsToFile(promos);
        return promos;
      }),
      getTopSellingGames().then(async (games) => {
        await saveTopSellersToFile(games);
        return games;
      }),
    ]);

    try {
      await sendEmail(promos);
      console.log(
        `✅ Email enviado com sucesso! ${promos.length} promoções encontradas.`,
      );
    } catch (emailError) {
      console.error(
        '⚠️ Erro ao enviar e-mail (continuando...):',
        emailError.message,
      );
    }

    console.log(
      `✅ Atualização e envio de email concluídos. ${promos.length} promoções e ${topSellers.length} mais vendidos encontrados.`,
    );
  } catch (error) {
    console.error('❌ Erro no envio agendado de email:', error);
  }
}

const DATA_UPDATE_SCHEDULE = process.env.DATA_UPDATE_SCHEDULE || '*/5 * * * *';
const EMAIL_SCHEDULE = process.env.EMAIL_SCHEDULE || '0 7 * * *';
const ENABLE_DATA_UPDATE = process.env.ENABLE_DATA_UPDATE !== 'false';
const ENABLE_EMAIL_CRON = process.env.ENABLE_EMAIL_CRON !== 'false';

const ENABLE_KEEP_ALIVE = process.env.ENABLE_KEEP_ALIVE !== 'false';
const KEEP_ALIVE_INTERVAL = parseInt(
  process.env.KEEP_ALIVE_INTERVAL || '300000',
  10,
);

let server;
let dataUpdateTask = null;
let emailTask = null;
let keepAliveInterval = null;

function startKeepAlive() {
  if (!ENABLE_KEEP_ALIVE) {
    console.log('⚠️ Keep-alive desabilitado (ENABLE_KEEP_ALIVE=false)');
    return;
  }

  const keepAliveUrl = `http://localhost:${PORT}/health`;

  console.log(
    `💓 Keep-alive ativado: ping a cada ${KEEP_ALIVE_INTERVAL / 1000}s`,
  );
  console.log(`🌐 URL do keep-alive: ${keepAliveUrl}`);

  setTimeout(async () => {
    try {
      const response = await axios.get(keepAliveUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Steam-Bot-KeepAlive/1.0',
        },
      });
      console.log(`💓 Keep-alive ping inicial: ${response.status}`);
    } catch (error) {}
  }, 3000);

  keepAliveInterval = setInterval(async () => {
    try {
      const response = await axios.get(keepAliveUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Steam-Bot-KeepAlive/1.0',
        },
      });
      console.log(
        `💓 Keep-alive ping: ${
          response.status
        } - ${new Date().toLocaleTimeString('pt-BR')}`,
      );
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        console.error(`⚠️ Erro no keep-alive: ${error.message}`);
      }
    }
  }, KEEP_ALIVE_INTERVAL);
}

server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Acesse para ver as promoções!`);

  if (ENABLE_DATA_UPDATE) {
    try {
      dataUpdateTask = cron.schedule(DATA_UPDATE_SCHEDULE, updateDataOnly, {
        scheduled: true,
        timezone: 'America/Sao_Paulo',
      });
      console.log(
        `🔄 Atualização de dados configurada: a cada 5 minutos (horário de Brasília)`,
      );
    } catch (error) {
      console.error('❌ Erro ao configurar atualização de dados:', error);
      console.log('⚠️ Continuando sem atualização automática...');
    }
  } else {
    console.log(
      '⚠️ Atualização de dados desabilitada (ENABLE_DATA_UPDATE=false)',
    );
  }

  if (ENABLE_EMAIL_CRON) {
    try {
      emailTask = cron.schedule(EMAIL_SCHEDULE, sendScheduledEmail, {
        scheduled: true,
        timezone: 'America/Sao_Paulo', // Timezone de Brasília
      });
      console.log(
        `📧 Envio de email configurado: diariamente às 7h (horário de Brasília)`,
      );
      console.log(`📅 Próximo envio agendado para 7h00 do dia seguinte`);
    } catch (error) {
      console.error('❌ Erro ao configurar envio de email:', error);
      console.log('⚠️ Continuando sem envio automático de email...');
    }
  } else {
    console.log('⚠️ Envio de email desabilitado (ENABLE_EMAIL_CRON=false)');
  }

  startKeepAlive();
});

function gracefulShutdown(signal) {
  console.log(`📴 ${signal} recebido, encerrando graciosamente...`);

  if (keepAliveInterval) {
    console.log('💓 Parando keep-alive...');
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }

  if (dataUpdateTask) {
    console.log('🔄 Parando atualização de dados...');
    dataUpdateTask.stop();
    dataUpdateTask = null;
  }

  if (emailTask) {
    console.log('📧 Parando envio de email...');
    emailTask.stop();
    emailTask = null;
  }

  if (server) {
    console.log('🔌 Fechando servidor HTTP...');
    server.close(() => {
      console.log('✅ Servidor HTTP fechado com sucesso');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('⚠️ Timeout no encerramento gracioso, forçando saída...');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
  console.error('⚠️ Continuando execução...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  console.error('⚠️ Continuando execução...');
});

process.on('exit', (code) => {
  console.log(`Processo encerrando com código: ${code}`);
});
