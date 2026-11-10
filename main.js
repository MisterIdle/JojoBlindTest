import { normalizeStr, shuffleArray, getCharacterImagePath, getStandImagePath, getCoverImagePath, getAudioPath, getSimilarity } from './utils.js';
import { setupAutocomplete } from './autocomplete.js';

let allData = [];
let playlist = [];
let currentIndex = 0;
let score = 0;
let maxTotalScore = 0;
let currentTrack = null;

let listStands = [];
let listUsers = [];
let listArtists = [];
let listSongs = [];

const menuScreen = document.getElementById('menu-screen');
const gameScreen = document.getElementById('game-screen');
const audioPlayer = document.getElementById('audio-player');
const quizForm = document.getElementById('quiz-form');
const scoreDisplay = document.getElementById('score-display');
const toggleSuggestions = document.getElementById('toggle-suggestions');

const inputs = {
  stand: document.getElementById('input-stand'),
  user: document.getElementById('input-user'),
  artist: document.getElementById('input-artist'),
  song: document.getElementById('input-song')
};

const groups = {
  stand: document.getElementById('group-stand'),
  user: document.getElementById('group-user'),
  artist: document.getElementById('group-artist'),
  song: document.getElementById('group-song')
};

const imgs = {
  stand: document.getElementById('img-stand'),
  user: document.getElementById('img-user'),
  cover: document.getElementById('img-cover')
};

const cards = {
  stand: document.getElementById('card-stand'),
  user: document.getElementById('card-user'),
  cover: document.getElementById('card-cover')
};

const suggs = {
  stand: document.getElementById('sugg-stand'),
  user: document.getElementById('sugg-user'),
  artist: document.getElementById('sugg-artist'),
  song: document.getElementById('sugg-song')
};

const corrs = {
  stand: document.getElementById('corr-stand'),
  user: document.getElementById('corr-user'),
  artist: document.getElementById('corr-artist'),
  song: document.getElementById('corr-song')
};

const btns = {
  start: document.getElementById('btn-start'),
  back: document.getElementById('btn-back'),
  submit: document.getElementById('btn-submit'),
  next: document.getElementById('btn-next')
};

fetch('./data.json')
  .then(response => response.json())
  .then(data => {
    allData = data;
    listStands = [...new Set(data.map(item => item.stand).filter(Boolean))].sort();
    listUsers = [...new Set(data.map(item => item.user).filter(Boolean))].sort();
    
    const allArtists = [];
    const allSongs = [];
    data.forEach(item => {
      if (item.tracks) {
        item.tracks.forEach(track => {
          if (track.artist) allArtists.push(track.artist);
          if (track.song) allSongs.push(track.song);
        });
      }
    });
    listArtists = [...new Set(allArtists.filter(Boolean))].sort();
    listSongs = [...new Set(allSongs.filter(Boolean))].sort();
  })
  .catch(console.error);

const isSuggestionsEnabled = () => toggleSuggestions.checked;

setupAutocomplete(inputs.stand, suggs.stand, () => listStands, isSuggestionsEnabled);
setupAutocomplete(inputs.user, suggs.user, () => listUsers, isSuggestionsEnabled);
setupAutocomplete(inputs.artist, suggs.artist, () => listArtists, isSuggestionsEnabled);
setupAutocomplete(inputs.song, suggs.song, () => listSongs, isSuggestionsEnabled);

btns.start.addEventListener('click', () => {
  const checkedParts = Array.from(document.querySelectorAll('.part-checkbox:checked')).map(cb => Number(cb.value));
  if (checkedParts.length === 0) return alert('Sélectionnez au moins une partie !');

  playlist = shuffleArray(allData.filter(item => item.part.some(p => checkedParts.includes(p))));
  if (playlist.length === 0) return alert('Aucune musique trouvée pour cette sélection.');

  maxTotalScore = playlist.reduce((acc, item) => {
    let pts = 0;
    if (item.stand) pts += 1;
    if (item.user) pts += 1;
    if (item.tracks && item.tracks.length > 0) {
      pts += 1;
      pts += item.tracks.length;
    }
    return acc + pts;
  }, 0);

  currentIndex = 0;
  score = 0;
  
  menuScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  loadRound();
});

btns.back.addEventListener('click', () => {
  audioPlayer.pause();
  gameScreen.classList.add('hidden');
  menuScreen.classList.remove('hidden');
});

// Affiche l'image de ce que l'utilisateur tape dynamiquement dans son propre champ
function setupImageDynamicDisplayForInput(inputElement, cardElement, imgElement, imagePathFn) {
  cardElement.style.display = 'none';
  
  const updateDisplay = () => {
    const val = inputElement.value;
    if (!val.trim()) {
      cardElement.style.display = 'none';
      return;
    }

    const typedImagePath = imagePathFn(val);
    if (!typedImagePath) {
      cardElement.style.display = 'none';
      return;
    }

    imgElement.src = typedImagePath;
    cardElement.style.display = 'block';
  };

  inputElement.addEventListener('input', updateDisplay);
  inputElement.addEventListener('keyup', updateDisplay);
  inputElement.addEventListener('change', updateDisplay);
}

function loadRound() {
  const currentItem = playlist[currentIndex];
  scoreDisplay.textContent = `Score : ${score} / ${maxTotalScore}`;

  const randomIndex = Math.floor(Math.random() * currentItem.tracks.length);
  currentTrack = currentItem.tracks[randomIndex];

  Object.values(inputs).forEach(input => {
    input.value = '';
    input.disabled = false;
    input.classList.remove('correct', 'wrong');
    const clone = input.cloneNode(true);
    input.parentNode.replaceChild(clone, input);
  });

  inputs.stand = document.getElementById('input-stand');
  inputs.user = document.getElementById('input-user');
  inputs.artist = document.getElementById('input-artist');
  inputs.song = document.getElementById('input-song');

  setupAutocomplete(inputs.stand, suggs.stand, () => listStands, isSuggestionsEnabled);
  setupAutocomplete(inputs.user, suggs.user, () => listUsers, isSuggestionsEnabled);
  setupAutocomplete(inputs.artist, suggs.artist, () => listArtists, isSuggestionsEnabled);
  setupAutocomplete(inputs.song, suggs.song, () => listSongs, isSuggestionsEnabled);

  Object.values(groups).forEach(g => g.style.display = 'flex');
  Object.values(corrs).forEach(span => { span.textContent = ''; });
  Object.values(suggs).forEach(sugg => { sugg.classList.remove('active'); });

  cards.stand.style.display = 'none';
  cards.user.style.display = 'none';
  cards.cover.style.display = 'none';

  if (currentItem.stand) {
    setupImageDynamicDisplayForInput(inputs.stand, cards.stand, imgs.stand, (val) => getStandImagePath(val));
  } else {
    groups.stand.style.display = 'none';
  }

  if (currentItem.user) {
    setupImageDynamicDisplayForInput(inputs.user, cards.user, imgs.user, (val) => getCharacterImagePath(val));
  } else {
    groups.user.style.display = 'none';
  }

  if (currentTrack && currentTrack.song) {
    setupImageDynamicDisplayForInput(inputs.song, cards.cover, imgs.cover, (val) => getCoverImagePath(val));
  }

  btns.submit.classList.remove('hidden');
  btns.next.classList.add('hidden');

  const resolvedAudioPath = getAudioPath(currentTrack.audio);
  audioPlayer.src = resolvedAudioPath;
  audioPlayer.load();
  audioPlayer.play().catch(() => {});
}

quizForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const currentItem = playlist[currentIndex];

  Object.values(suggs).forEach(sugg => sugg.classList.remove('active'));

  if (currentItem.stand) {
    checkField(inputs.stand, corrs.stand, currentItem.stand, 1, cards.stand, imgs.stand, getStandImagePath(currentItem.stand));
  }
  if (currentItem.user) {
    checkField(inputs.user, corrs.user, currentItem.user, 1, cards.user, imgs.user, getCharacterImagePath(currentItem.user));
  }
  checkField(inputs.artist, corrs.artist, currentTrack.artist, 1, null, null, null);
  
  const trackCount = currentItem.tracks ? currentItem.tracks.length : 1;
  checkField(inputs.song, corrs.song, currentTrack.song, trackCount, cards.cover, imgs.cover, getCoverImagePath(currentTrack.song));

  scoreDisplay.textContent = `Score : ${score} / ${maxTotalScore}`;
  btns.submit.classList.add('hidden');
  btns.next.classList.remove('hidden');
});

function checkField(inputElement, correctionSpan, expectedValue, pointsValue, cardElement, imgElement, expectedImagePath) {
  inputElement.disabled = true;
  const userVal = inputElement.value;
  const isAutoCompl = isSuggestionsEnabled();
  
  let isCorrect = false;

  if (isAutoCompl) {
    if (normalizeStr(userVal) === normalizeStr(expectedValue)) {
      isCorrect = true;
    }
  } else {
    const similarity = getSimilarity(userVal, expectedValue);
    if (similarity >= 0.9 || normalizeStr(userVal) === normalizeStr(expectedValue)) {
      isCorrect = true;
    }
  }

  if (isCorrect) {
    inputElement.classList.add('correct');
    score += pointsValue;
  } else {
    inputElement.classList.add('wrong');
    correctionSpan.textContent = expectedValue;
  }

  // À la validation, on force l'affichage de la VRAIE image correcte du round (qu'on ait bon ou tort)
  if (cardElement && imgElement && expectedImagePath) {
    imgElement.src = expectedImagePath;
    cardElement.style.display = 'block';
  }
}

btns.next.addEventListener('click', () => {
  currentIndex++;
  if (currentIndex < playlist.length) {
    loadRound();
  } else {
    audioPlayer.pause();
    alert(`Partie terminée ! Score final : ${score} / ${maxTotalScore}`);
    gameScreen.classList.add('hidden');
    menuScreen.classList.remove('hidden');
  }
});