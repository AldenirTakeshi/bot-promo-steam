const express = require('express');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { checkPromotions } = require('./bot');

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

app.post('/api/update', async (req, res) => {
  try {
    res.json({
      message: 'Atualização iniciada. Isso pode levar alguns minutos...',
    });

    const { savePromotionsToFile, sendEmail } = require('./bot');
    checkPromotions()
      .then(async (promos) => {
        await savePromotionsToFile(promos);
        await sendEmail(promos);
        console.log('Promoções atualizadas via API');
      })
      .catch((err) => {
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

// Função para executar a atualização de promoções
async function runScheduledUpdate() {
  console.log('🕘 Executando atualização agendada de promoções...');
  try {
    const { savePromotionsToFile, sendEmail } = require('./bot');
    const promos = await checkPromotions();
    await savePromotionsToFile(promos);
    await sendEmail(promos);
    console.log(
      `✅ Atualização agendada concluída. ${promos.length} promoções encontradas.`,
    );
  } catch (error) {
    console.error('❌ Erro na atualização agendada:', error);
  }
}

const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 10 * * *'; // 10h00 horário de Brasília
const ENABLE_CRON = process.env.ENABLE_CRON !== 'false'; // Ativo por padrão

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Acesse para ver as promoções!`);

  if (ENABLE_CRON) {
    try {
      cron.schedule(CRON_SCHEDULE, runScheduledUpdate, {
        scheduled: true,
        timezone: 'America/Sao_Paulo', // Timezone de Brasília
      });
      console.log(
        `⏰ Cron job configurado: execução diária às 10h (horário de Brasília)`,
      );
      console.log(`📅 Próxima execução agendada para 10h00 do dia seguinte`);
    } catch (error) {
      console.error('❌ Erro ao configurar cron job:', error);
      console.log('⚠️ Continuando sem cron job automático...');
    }
  } else {
    console.log('⚠️ Cron job desabilitado (ENABLE_CRON=false)');
  }
});

process.on('SIGTERM', () => {
  console.log('📴 SIGTERM recebido, encerrando graciosamente...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT recebido, encerrando graciosamente...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
});
