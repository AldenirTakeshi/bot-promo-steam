let promotions = [];

document.addEventListener('DOMContentLoaded', () => {
  loadPromotions();

  document.getElementById('refreshBtn').addEventListener('click', () => {
    updatePromotions();
  });

  document.getElementById('searchInput').addEventListener('input', filterGames);
  document.getElementById('sortSelect').addEventListener('change', filterGames);
  document
    .getElementById('genreSelect')
    .addEventListener('change', filterGames);
});

async function loadPromotions() {
  try {
    showLoading(true);
    const response = await fetch('/api/promotions');
    const data = await response.json();

    if (data.promotions && data.promotions.length > 0) {
      promotions = data.promotions;
      updateGenreFilter(promotions);
      displayGames(promotions);
      updateStats(promotions);
      updateLastUpdate(data.lastUpdate);
    } else {
      showEmptyState(true);
    }
  } catch (error) {
    console.error('Erro ao carregar promoções:', error);
    showEmptyState(true);
  } finally {
    showLoading(false);
  }
}

async function updatePromotions() {
  try {
    const btn = document.getElementById('refreshBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Atualizando...';

    await fetch('/api/update', { method: 'POST' });

    setTimeout(() => {
      loadPromotions();
      btn.disabled = false;
      btn.textContent = '🔄 Atualizar';
    }, 5000);
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    document.getElementById('refreshBtn').disabled = false;
    document.getElementById('refreshBtn').textContent = '🔄 Atualizar';
  }
}

function displayGames(games) {
  const container = document.getElementById('gamesContainer');
  container.innerHTML = '';

  if (games.length === 0) {
    showEmptyState(true);
    return;
  }

  showEmptyState(false);

  games.forEach((game) => {
    const card = createGameCard(game);
    container.appendChild(card);
  });
}

function createGameCard(game) {
  const card = document.createElement('div');
  card.className = 'game-card';

  const imageHtml = game.imageUrl
    ? `<div class="game-image-container">
              <img src="${game.imageUrl}" alt="${escapeHtml(
        game.name,
      )}" class="game-image" onerror="this.src='https://via.placeholder.com/460x215?text=Imagem+não+disponível'" />
              <div class="discount-badge-overlay">-${
                game.discountPercent
              }%</div>
            </div>`
    : '';

  const genresHtml =
    game.genres && game.genres.length > 0
      ? `<div class="game-genres">
          ${game.genres
            .slice(0, 3)
            .map(
              (genre) => `<span class="genre-tag">${escapeHtml(genre)}</span>`,
            )
            .join('')}
        </div>`
      : '';

  card.innerHTML = `
         ${imageHtml}
         <div class="game-content">
             <div class="game-name">${escapeHtml(game.name)}</div>
             ${genresHtml}
             <div class="price-info">
                 <div class="price-row">
                     <span class="price-label">Preço Original:</span>
                     <span class="original-price">${game.initialPrice}</span>
                 </div>
                 <div class="price-row">
                     <span class="price-label">Preço Final:</span>
                     <span class="final-price">${game.finalPrice}</span>
                 </div>
             </div>
             <a href="${game.link}" target="_blank" class="game-link">
                 ➜ Ver na Steam
             </a>
         </div>
     `;

  return card;
}

function updateGenreFilter(games) {
  const genreSelect = document.getElementById('genreSelect');
  const allGenres = new Set();

  games.forEach((game) => {
    if (game.genres && Array.isArray(game.genres)) {
      game.genres.forEach((genre) => allGenres.add(genre));
    }
  });

  while (genreSelect.children.length > 1) {
    genreSelect.removeChild(genreSelect.lastChild);
  }

  Array.from(allGenres)
    .sort()
    .forEach((genre) => {
      const option = document.createElement('option');
      option.value = genre;
      option.textContent = genre;
      genreSelect.appendChild(option);
    });
}

function filterGames() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const selectedGenre = document.getElementById('genreSelect').value;
  const sortBy = document.getElementById('sortSelect').value;

  let filtered = promotions.filter((game) => {
    const matchesName = game.name.toLowerCase().includes(searchTerm);

    let matchesGenre = true;
    if (selectedGenre) {
      matchesGenre = game.genres && game.genres.includes(selectedGenre);
    }

    return matchesName && matchesGenre;
  });

  switch (sortBy) {
    case 'discount-desc':
      filtered.sort((a, b) => b.discountPercent - a.discountPercent);
      break;
    case 'discount-asc':
      filtered.sort((a, b) => a.discountPercent - b.discountPercent);
      break;
    case 'name-asc':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      filtered.sort((a, b) => b.name.localeCompare(a.name));
      break;
  }

  displayGames(filtered);
  updateStats(filtered);
}

function updateStats(games) {
  if (games.length === 0) {
    document.getElementById('stats').style.display = 'none';
    return;
  }

  document.getElementById('stats').style.display = 'grid';
  document.getElementById('totalGames').textContent = games.length;

  const avgDiscount = Math.round(
    games.reduce((sum, g) => sum + g.discountPercent, 0) / games.length,
  );
  document.getElementById('avgDiscount').textContent = `${avgDiscount}%`;

  const maxDiscount = Math.max(...games.map((g) => g.discountPercent));
  document.getElementById('maxDiscount').textContent = `${maxDiscount}%`;
}

function updateLastUpdate(timestamp) {
  const element = document.getElementById('lastUpdate');
  if (timestamp) {
    const date = new Date(timestamp);
    const formatted = date.toLocaleString('pt-BR');
    element.textContent = `Última atualização: ${formatted}`;
  } else {
    element.textContent = 'Nunca atualizado';
  }
}

function showLoading(show) {
  document.getElementById('loading').style.display = show ? 'block' : 'none';
  document.getElementById('gamesContainer').style.display = show
    ? 'none'
    : 'grid';
  document.getElementById('filters').style.display = show ? 'none' : 'flex';
  document.getElementById('stats').style.display = show ? 'none' : 'grid';
}

function showEmptyState(show) {
  document.getElementById('emptyState').style.display = show ? 'block' : 'none';
  document.getElementById('gamesContainer').style.display = show
    ? 'none'
    : 'grid';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
