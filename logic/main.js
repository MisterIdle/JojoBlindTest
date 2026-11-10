import { GameController } from './game.js';
import { CodexController } from './codex.js';
import { isMainThemeTrack } from './utils.js';

let allData = [];
const catalogs = {
  stands: [],
  users: [],
  artists: [],
  songs: []
};

const screens = {
  menu: document.getElementById('menu-screen'),
  game: document.getElementById('game-screen'),
  codex: document.getElementById('codex-screen'),
  result: document.getElementById('result-screen')
};

const menuControls = {
  optFieldUser: document.getElementById('opt-field-user'),
  optFieldStand: document.getElementById('opt-field-stand'),
  optFieldArtist: document.getElementById('opt-field-artist'),
  optFieldSong: document.getElementById('opt-field-song'),
  optAutocomplete: document.getElementById('opt-autocomplete'),
  optNoOst: document.getElementById('opt-no-ost'),
  badgeAutocomplete: document.getElementById('badge-autocomplete'),
  badgeNoOst: document.getElementById('badge-no-ost'),
  btnSelectAll: document.getElementById('btn-select-all'),
  btnDeselectAll: document.getElementById('btn-deselect-all'),
  roundSlider: document.getElementById('round-slider'),
  sliderValDisplay: document.getElementById('slider-val-display'),
  btnStart: document.getElementById('btn-start'),
  btnOpenCodex: document.getElementById('btn-open-codex'),
  partCheckboxes: document.querySelectorAll('.part-checkbox')
};

const resultControls = {
  message: document.getElementById('result-message'),
  finalScore: document.getElementById('final-score'),
  finalMax: document.getElementById('final-max-score'),
  btnReplay: document.getElementById('btn-replay'),
  btnCodex: document.getElementById('btn-result-codex')
};

const gameDom = {
  audioPlayer: document.getElementById('audio-player'),
  quizForm: document.getElementById('quiz-form'),
  roundDisplay: document.getElementById('round-display'),
  scoreDisplay: document.getElementById('score-display'),
  roundBreakdown: document.getElementById('round-breakdown'),
  inputs: {
    stand: document.getElementById('input-stand'),
    user: document.getElementById('input-user'),
    artist: document.getElementById('input-artist'),
    song: document.getElementById('input-song')
  },
  groups: {
    stand: document.getElementById('group-stand'),
    user: document.getElementById('group-user'),
    artist: document.getElementById('group-artist'),
    song: document.getElementById('group-song')
  },
  imgs: {
    stand: document.getElementById('img-stand'),
    user: document.getElementById('img-user'),
    cover: document.getElementById('img-cover')
  },
  cards: {
    stand: document.getElementById('card-stand'),
    user: document.getElementById('card-user'),
    cover: document.getElementById('card-cover')
  },
  suggs: {
    stand: document.getElementById('sugg-stand'),
    user: document.getElementById('sugg-user'),
    artist: document.getElementById('sugg-artist'),
    song: document.getElementById('sugg-song')
  },
  corrs: {
    stand: document.getElementById('corr-stand'),
    user: document.getElementById('corr-user'),
    artist: document.getElementById('corr-artist'),
    song: document.getElementById('corr-song')
  },
  btns: {
    back: document.getElementById('btn-back'),
    submit: document.getElementById('btn-submit'),
    next: document.getElementById('btn-next')
  },
  onGameEnd: (score, maxScore) => {
    // Affichage des scores sur l'écran de résultat
    resultControls.finalScore.textContent = score;
    resultControls.finalMax.textContent = maxScore;
    
    // Calcul du ratio pour un message personnalisé
    const ratio = maxScore > 0 ? score / maxScore : 0;
    let msg = "C'est la fin du combat !";
    if (ratio === 1) msg = "PERFECT ! WRYYYYYYYYYY !";
    else if (ratio >= 0.8) msg = "Gureto daze ! Excellent score.";
    else if (ratio >= 0.5) msg = "Pas mal ! Mais vous pouvez faire mieux.";
    else msg = "Yare yare daze... Il va falloir réviser vos classiques.";
    
    resultControls.message.textContent = msg;
    showScreen('result');
  }
};

const codexDom = {
  btnBack: document.getElementById('btn-codex-back'),
  searchInput: document.getElementById('codex-search'),
  partFilters: document.getElementById('codex-part-filters'),
  countDisplay: document.getElementById('codex-count'),
  audioBar: document.getElementById('codex-audio-bar'),
  playingTitle: document.getElementById('codex-playing-title'),
  audioPlayer: document.getElementById('codex-audio-player'),
  grid: document.getElementById('codex-grid')
};

const gameController = new GameController(gameDom, catalogs);
const codexController = new CodexController(codexDom);

function showScreen(target) {
  Object.keys(screens).forEach(key => {
    if (screens[key]) {
      screens[key].classList.toggle('hidden', key !== target);
    }
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateRuleBadges() {
  const autoOn = menuControls.optAutocomplete.checked;
  menuControls.badgeAutocomplete.textContent = autoOn ? '+0 pt' : '+5 pts';
  menuControls.badgeAutocomplete.className = `pts-pill ${autoOn ? 'muted' : 'bonus'}`;

  const noOstOn = menuControls.optNoOst.checked;
  menuControls.badgeNoOst.textContent = noOstOn ? '+2 pts' : '+0 pt';
  menuControls.badgeNoOst.className = `pts-pill ${noOstOn ? 'bonus' : 'muted'}`;
}

function updateMaxAvailableRounds() {
  const checkedParts = Array.from(document.querySelectorAll('.part-checkbox:checked')).map(cb => Number(cb.value));
  const excludeOst = menuControls.optNoOst.checked;

  let maxRounds = 0;
  allData.forEach(item => {
    if (!item.part.some(p => checkedParts.includes(p))) return;
    if (!item.tracks || item.tracks.length === 0) return;

    const validTracks = excludeOst ? item.tracks.filter(t => !isMainThemeTrack(t)) : item.tracks;
    if (validTracks.length > 0) {
      maxRounds++;
    }
  });

  const slider = menuControls.roundSlider;
  if (maxRounds === 0) {
    slider.max = 0;
    slider.value = 0;
    slider.disabled = true;
    menuControls.sliderValDisplay.textContent = '0 Manche (Aucune musique)';
  } else {
    slider.disabled = false;
    slider.max = maxRounds;
    if (parseInt(slider.value) > maxRounds || parseInt(slider.value) === 0) {
      slider.value = maxRounds;
    }
    menuControls.sliderValDisplay.textContent = `${slider.value} Manche${slider.value > 1 ? 's' : ''} (Max: ${maxRounds})`;
  }
}

menuControls.optAutocomplete.addEventListener('change', updateRuleBadges);
menuControls.optNoOst.addEventListener('change', () => {
  updateRuleBadges();
  updateMaxAvailableRounds();
});

menuControls.roundSlider.addEventListener('input', () => {
  const val = menuControls.roundSlider.value;
  const max = menuControls.roundSlider.max;
  menuControls.sliderValDisplay.textContent = `${val} Manche${val > 1 ? 's' : ''} (Max: ${max})`;
});

menuControls.partCheckboxes.forEach(cb => {
  cb.addEventListener('change', updateMaxAvailableRounds);
});

menuControls.btnOpenCodex.addEventListener('click', () => {
  codexController.render();
  showScreen('codex');
});

codexDom.btnBack.addEventListener('click', () => {
  codexController.stopAudio();
  showScreen('menu');
});

gameDom.btns.back.addEventListener('click', () => {
  gameController.stopAudio();
  showScreen('menu');
});

// Boutons de l'écran de résultat
resultControls.btnReplay.addEventListener('click', () => {
  showScreen('menu');
});

resultControls.btnCodex.addEventListener('click', () => {
  codexController.render();
  showScreen('codex');
});

menuControls.btnSelectAll.addEventListener('click', () => {
  document.querySelectorAll('.part-checkbox').forEach(cb => { cb.checked = true; });
  updateMaxAvailableRounds();
});

menuControls.btnDeselectAll.addEventListener('click', () => {
  document.querySelectorAll('.part-checkbox').forEach(cb => { cb.checked = false; });
  updateMaxAvailableRounds();
});

menuControls.btnStart.addEventListener('click', () => {
  const checkedParts = Array.from(document.querySelectorAll('.part-checkbox:checked')).map(cb => Number(cb.value));
  if (checkedParts.length === 0) {
    alert('Sélectionnez au moins une partie de JoJo.');
    return;
  }

  const options = {
    enableUser: menuControls.optFieldUser.checked,
    enableStand: menuControls.optFieldStand.checked,
    enableArtist: menuControls.optFieldArtist.checked,
    enableSong: menuControls.optFieldSong.checked,
    autocompleteEnabled: menuControls.optAutocomplete.checked,
    excludeMainThemes: menuControls.optNoOst.checked,
    roundLimit: parseInt(menuControls.roundSlider.value) || 10
  };

  if (!options.enableUser && !options.enableStand && !options.enableArtist && !options.enableSong) {
    alert('Cochez au moins un champ à deviner (Porteur, Stand, Groupe ou Musique).');
    return;
  }

  if (options.roundLimit <= 0) {
    alert("Aucune manche n'est disponible avec ces filtres.");
    return;
  }

  const started = gameController.startNewGame(allData, checkedParts, options);
  if (started) {
    showScreen('game');
  }
});

fetch('./data/data.json')
  .then(res => res.json())
  .then(data => {
    allData = data;
    catalogs.stands = [...new Set(data.map(item => item.stand).filter(Boolean))].sort();

    const usersAcc = [];
    const artistsAcc = [];
    const songsAcc = [];

    data.forEach(item => {
      if (item.user) usersAcc.push(item.user);
      if (Array.isArray(item.users)) usersAcc.push(...item.users);
      if (Array.isArray(item.tracks)) {
        item.tracks.forEach(track => {
          if (track.artist) artistsAcc.push(track.artist);
          if (track.song) songsAcc.push(track.song);
        });
      }
    });

    catalogs.users = [...new Set(usersAcc.filter(Boolean))].sort();
    catalogs.artists = [...new Set(artistsAcc.filter(Boolean))].sort();
    catalogs.songs = [...new Set(songsAcc.filter(Boolean))].sort();

    codexController.setData(data);
    updateRuleBadges();
    updateMaxAvailableRounds();
  })
  .catch(err => {
    console.error('Erreur de chargement data.json :', err);
  });