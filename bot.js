const nodemailer = require('nodemailer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let Resend;
try {
  Resend = require('resend').Resend;
} catch (e) {}

const COUNTRY_CODE = 'br';
const CURRENCY_ID = 20;
const MAX_PROMOTIONS_TO_CHECK = 100;
const CONCURRENT_REQUESTS = 10;
const DELAY_BETWEEN_BATCHES = 100;

/**
 * @returns {Array<string>}
 */

async function searchTerm(term) {
  try {
    const searchUrl = `https://store.steampowered.com/search/?cc=${COUNTRY_CODE}&l=brazilian&specials=1&term=${encodeURIComponent(
      term,
    )}&page=1`;

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: 15000,
    });

    const appIds = new Set();

    if (response.data && typeof response.data === 'string') {
      const htmlContent = response.data;

      const dataAppIdPattern = /data-ds-appid="(\d+)"/g;
      let match;
      while ((match = dataAppIdPattern.exec(htmlContent)) !== null) {
        const appId = match[1];
        const numId = parseInt(appId, 10);
        if (numId > 10) {
          appIds.add(appId);
        }
      }

      const appLinkPattern = /href="[^"]*\/app\/(\d+)[^"]*"/g;
      while ((match = appLinkPattern.exec(htmlContent)) !== null) {
        const appId = match[1];
        const numId = parseInt(appId, 10);
        if (numId > 10) {
          appIds.add(appId);
        }
      }

      const rgMatch = htmlContent.match(
        /rgSearchResults\s*=\s*(\{[\s\S]*?\});/,
      );
      if (rgMatch && rgMatch[1]) {
        try {
          let jsonStr = rgMatch[1].trim();
          jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
          const data = JSON.parse(jsonStr);

          if (data && typeof data === 'object') {
            const keys = Object.keys(data);
            keys.forEach((appId) => {
              const numId = parseInt(appId, 10);
              if (!isNaN(numId) && numId > 10 && appId === String(numId)) {
                appIds.add(appId);
              }
            });
          }
        } catch (e) {}
      }
    }

    return Array.from(appIds);
  } catch (error) {
    console.error(`Erro ao buscar termo "${term}":`, error.message);
    return [];
  }
}

async function getGamesOnSale() {
  try {
    console.log('Buscando jogos em promoção na Steam...');

    const searchTerms = ['', 'action', 'rpg', 'strategy', 'adventure', 'indie'];

    console.log(`Buscando ${searchTerms.length} categorias em paralelo...`);
    const results = await Promise.all(
      searchTerms.map((term) => searchTerm(term)),
    );

    const appIds = new Set();
    results.forEach((ids, index) => {
      ids.forEach((id) => appIds.add(id));
      console.log(
        `  ✓ ${searchTerms[index] || 'geral'}: ${
          ids.length
        } App IDs encontrados`,
      );
    });

    const appIdsArray = Array.from(appIds).slice(0, MAX_PROMOTIONS_TO_CHECK);
    console.log(`✓ Total: ${appIdsArray.length} App IDs únicos encontrados`);

    return appIdsArray;
  } catch (error) {
    console.error('Erro ao buscar jogos em promoção:', error.message);
    if (error.response && error.response.status === 429) {
      console.error(
        'Rate limit atingido. Aguarde alguns minutos e tente novamente.',
      );
    }
    return [];
  }
}

/**
 * @param {string} appId
 * @returns {object|null}
 */
async function getGamePrice(appId) {
  try {
    const url = `http://store.steampowered.com/api/appdetails?appids=${appId}&cc=${COUNTRY_CODE}&l=brazilian&currency=${CURRENCY_ID}`;

    const response = await axios.get(url);

    const success = response.data[appId].success;
    const data = success ? response.data[appId].data : null;

    if (!data || !data.price_overview) {
      return null;
    }

    const priceData = data.price_overview;

    if (priceData.discount_percent <= 0) {
      return null;
    }

    let imageUrl = null;
    if (data.header_image) {
      imageUrl = data.header_image;
    } else if (data.capsule_image) {
      imageUrl = data.capsule_image;
    } else if (data.capsule_imagev5) {
      imageUrl = data.capsule_imagev5;
    }

    let genres = [];
    if (data.genres && Array.isArray(data.genres)) {
      genres = data.genres
        .map((genre) => genre.description || genre)
        .filter(Boolean);
    } else if (data.genres && typeof data.genres === 'object') {
      genres = Object.values(data.genres)
        .map((genre) => genre.description || genre)
        .filter(Boolean);
    }

    return {
      name: data.name,
      initialPrice: priceData.initial_formatted,
      finalPrice: priceData.final_formatted,
      discountPercent: priceData.discount_percent,
      isPromo: true,
      link: `https://store.steampowered.com/app/${appId}/`,
      imageUrl:
        imageUrl ||
        `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
      genres: genres,
    };
  } catch (error) {
    if (error.response && error.response.status === 400) {
      return null;
    }
    return null;
  }
}

async function processBatch(appIds) {
  const promises = appIds.map((appId) => getGamePrice(appId));
  const results = await Promise.allSettled(promises);

  const promotions = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value && result.value.isPromo) {
      promotions.push(result.value);
      console.log(
        `✓ Promoção: ${result.value.name} - ${result.value.discountPercent}% OFF`,
      );
    }
  });

  return promotions;
}

/**
 * @returns {Array<object>}
 */
async function checkPromotions() {
  const appIds = await getGamesOnSale();

  if (appIds.length === 0) {
    console.log('Nenhum jogo encontrado na página de promoções');
    return [];
  }

  console.log(
    `Verificando detalhes de ${appIds.length} jogos em promoção (processamento paralelo)...`,
  );

  const allPromotions = [];
  const totalBatches = Math.ceil(appIds.length / CONCURRENT_REQUESTS);

  for (let i = 0; i < appIds.length; i += CONCURRENT_REQUESTS) {
    const batch = appIds.slice(i, i + CONCURRENT_REQUESTS);
    const batchNumber = Math.floor(i / CONCURRENT_REQUESTS) + 1;

    console.log(
      `Processando lote ${batchNumber}/${totalBatches} (${batch.length} jogos)...`,
    );

    const batchPromotions = await processBatch(batch);
    allPromotions.push(...batchPromotions);

    if (i + CONCURRENT_REQUESTS < appIds.length) {
      await new Promise((resolve) =>
        setTimeout(resolve, DELAY_BETWEEN_BATCHES),
      );
    }
  }

  console.log(
    `✅ Verificação concluída: ${allPromotions.length} promoções encontradas`,
  );

  return allPromotions;
}

/**
 * @param {Array<object>} promotions
 */
/**
 * @param {number} port - Porta SMTP (465 ou 587)
 * @returns {object} Transporter configurado
 */
function createTransporter(port = 465) {
  const isSecure = port === 465;

  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: port,
    secure: isSecure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    debug: false,
    logger: false,
  });
}

/**
 * Gera o HTML do e-mail com as promoções
 */
function generateEmailHtml(promotions) {
  promotions.sort((a, b) => b.discountPercent - a.discountPercent);

  let emailHtml = '<h1>🎮 Jogos em Promoção na Steam! 🥳</h1>';
  emailHtml += `<p><strong>Total de ${promotions.length} jogos em promoção encontrados!</strong></p>`;
  emailHtml += '<ul style="list-style: none; padding: 0;">';

  promotions.forEach((promo) => {
    emailHtml += `
            <li style="margin-bottom: 20px; border-left: 5px solid #1b2838; padding-left: 10px;">
                <h3 style="color: #66c0f4;">${promo.name}</h3>
                <p>Desconto: <strong style="color: #4CAF50;">-${promo.discountPercent}%</strong></p>
                <p>Preço Original: <del>${promo.initialPrice}</del></p>
                <p>Preço Final: <span style="color: red; font-weight: bold; font-size: 1.2em;">${promo.finalPrice}</span></p>
                <a href="${promo.link}" style="color: #4CAF50; text-decoration: none; font-weight: bold;">➜ Ver na Steam</a>
            </li>
        `;
  });

  emailHtml += '</ul>';
  return emailHtml;
}

/**
 * Envia e-mail usando Resend (API moderna - funciona no Railway)
 */
async function sendEmailWithResend(promotions) {
  if (!Resend) {
    throw new Error('Resend não está disponível');
  }

  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY não configurada');
  }

  if (!process.env.DESTINATION_EMAIL) {
    throw new Error('DESTINATION_EMAIL não configurada');
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const emailHtml = generateEmailHtml(promotions);

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    to: process.env.DESTINATION_EMAIL,
    subject: `[Steam Bot] ${promotions.length} Jogos em Promoção na Steam!`,
    html: emailHtml,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Envia e-mail usando Nodemailer (SMTP tradicional)
 */
async function sendEmailWithSMTP(promotions) {
  if (
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS ||
    !process.env.DESTINATION_EMAIL
  ) {
    throw new Error('Variáveis SMTP não configuradas');
  }

  let transporter = createTransporter(465);
  const emailHtml = generateEmailHtml(promotions);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.DESTINATION_EMAIL,
    subject: `[Steam Bot] ${promotions.length} Jogos em Promoção na Steam!`,
    html: emailHtml,
  };

  try {
    await transporter.verify();
    console.log('✅ Servidor SMTP verificado');
  } catch (verifyError) {
    console.log('⚠️ Porta 465 falhou, tentando porta 587 (TLS)...');
    transporter = createTransporter(587);
    await transporter.verify();
    console.log('✅ Servidor SMTP verificado na porta 587');
  }

  const info = await transporter.sendMail(mailOptions);
  return info;
}

async function sendEmail(promotions) {
  // Verificar se o envio de e-mail está desativado
  if (process.env.DISABLE_EMAIL === 'true') {
    console.log('📧 Envio de e-mail desativado (DISABLE_EMAIL=true)');
    return;
  }

  if (promotions.length === 0) {
    console.log('Nenhuma promoção encontrada. E-mail não enviado.');
    return;
  }

  // Prioridade 1: Tentar Resend (API moderna, funciona no Railway)
  if (process.env.RESEND_API_KEY && Resend) {
    try {
      console.log('📧 Tentando enviar e-mail via Resend...');
      const result = await sendEmailWithResend(promotions);
      console.log('✅ E-mail enviado com sucesso via Resend!');
      console.log('📧 E-mail ID:', result.id);
      return;
    } catch (error) {
      console.error('❌ Erro ao enviar via Resend:', error.message);
      console.log('⚠️ Tentando fallback para SMTP...');
    }
  }

  // Prioridade 2: Tentar SMTP (Gmail, etc.)
  try {
    console.log('📧 Tentando enviar e-mail via SMTP...');
    const info = await sendEmailWithSMTP(promotions);
    console.log('✅ E-mail enviado com sucesso via SMTP!');
    console.log('📧 Mensagem ID:', info.messageId);
    return;
  } catch (error) {
    console.error('❌ Erro ao enviar via SMTP:', error.message);

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('💡 O Railway bloqueia conexões SMTP');
      console.error(
        '💡 Configure RESEND_API_KEY para usar Resend (recomendado)',
      );
    }

    if (error.code === 'EAUTH') {
      console.error(
        '💡 Dica: Verifique se EMAIL_USER e EMAIL_PASS estão corretos',
      );
      console.error('💡 Dica: EMAIL_PASS deve ser a Senha de App do Google');
    }
  }

  // Se chegou aqui, nenhum método funcionou
  console.error(
    '❌ Nenhum método de envio de e-mail configurado ou funcionando',
  );
  console.error('💡 Configure RESEND_API_KEY no Railway para usar Resend');
  console.error(
    '💡 Ou configure EMAIL_USER, EMAIL_PASS e DESTINATION_EMAIL para SMTP',
  );
}

async function savePromotionsToFile(promotions) {
  try {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    const filePath = path.join(dataDir, 'promotions.json');
    const data = {
      lastUpdate: new Date().toISOString(),
      total: promotions.length,
      promotions: promotions,
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✓ Dados salvos em ${filePath}`);
  } catch (error) {
    console.error('Erro ao salvar dados:', error.message);
  }
}

async function main() {
  console.log('Iniciando verificação de promoções do Steam...');
  const promos = await checkPromotions();
  await sendEmail(promos);
  await savePromotionsToFile(promos);
  console.log(`Verificação concluída. ${promos.length} promoções encontradas.`);
}

if (require.main === module) {
  main();
}

module.exports = {
  checkPromotions,
  getGamesOnSale,
  savePromotionsToFile,
  sendEmail,
};
