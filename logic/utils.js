export function normalizeStr(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function phoneticNormalize(str) {
  return normalizeStr(str)
    .replace(/qu/g, 'k')
    .replace(/c(?=[aou])/g, 'k')
    .replace(/c(?=[ei])/g, 's')
    .replace(/ph/g, 'f')
    .replace(/y/g, 'i')
    .replace(/w/g, 'v')
    .replace(/(.)\1+/g, '$1');
}

export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function formatName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function getCharacterImagePath(name) {
  if (!name) return '';
  return `./img/characters/${formatName(name)}.jpg`;
}

export function getStandImagePath(name) {
  if (!name) return '';
  return `./img/stands/${formatName(name)}.jpg`;
}

export function getCoverImagePath(songName) {
  if (!songName) return '';
  return `./img/covers/cover_${formatName(songName)}.jpg`;
}

export function getAudioPath(audioValueFromJson) {
  if (!audioValueFromJson) return '';
  const filename = audioValueFromJson.replace('audio/tracks/', '').replace('audio/', '');
  return `./audio/tracks/${filename}`;
}

export function isMainThemeTrack(track) {
  if (!track) return false;
  const audio = (track.audio || '').toLowerCase();
  const song = normalizeStr(track.song || '');
  const artist = normalizeStr(track.artist || '');
  const ostComposers = ['hayato matsuo', 'taku iwasaki', 'yugo kanno'];
  return audio.includes('_theme') || song.includes('theme') || ostComposers.includes(artist);
}

function computeLevenshteinRatio(a, b) {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return 1 - matrix[a.length][b.length] / Math.max(a.length, b.length);
}

function computeCommonLettersRatio(a, b) {
  const cleanA = a.replace(/\s+/g, '');
  const cleanB = b.replace(/\s+/g, '');
  if (!cleanA || !cleanB) return 0;

  const freq = {};
  for (const ch of cleanA) {
    freq[ch] = (freq[ch] || 0) + 1;
  }

  let shared = 0;
  for (const ch of cleanB) {
    if (freq[ch] > 0) {
      shared++;
      freq[ch]--;
    }
  }

  const targetCoverage = shared / cleanB.length;
  const lengthBalance = Math.min(cleanA.length, cleanB.length) / Math.max(cleanA.length, cleanB.length);
  if (lengthBalance < 0.65) return 0;

  return targetCoverage * (0.65 + 0.35 * lengthBalance);
}

export function getSimilarity(inputStr, expectedStr) {
  const s1 = normalizeStr(inputStr);
  const s2 = normalizeStr(expectedStr);
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;

  const p1 = phoneticNormalize(inputStr);
  const p2 = phoneticNormalize(expectedStr);
  if (p1 && p1 === p2) return 0.96;

  const levRaw = computeLevenshteinRatio(s1, s2);
  const levPhonetic = computeLevenshteinRatio(p1, p2) * 0.97;
  const commonLetters = computeCommonLettersRatio(s1, s2);

  return Math.max(levRaw, levPhonetic, commonLetters);
}

export function findBestMatchInList(userInput, candidateList, useFuzzy) {
  const cleanInput = normalizeStr(userInput);
  if (!cleanInput) return null;

  for (const item of candidateList) {
    if (normalizeStr(item) === cleanInput) {
      return item;
    }
  }

  if (!useFuzzy) return null;

  let bestCandidate = null;
  let bestScore = 0;

  for (const item of candidateList) {
    const score = getSimilarity(userInput, item);
    if (score >= 0.9 && score > bestScore) {
      bestScore = score;
      bestCandidate = item;
    }
  }

  return bestCandidate;
}

export function displayImageIfAvailable(cardElement, imgElement, imagePath) {
  if (!cardElement || !imgElement) return;
  if (!imagePath) {
    cardElement.classList.add('hidden');
    imgElement.removeAttribute('src');
    return;
  }

  imgElement.onload = () => {
    cardElement.classList.remove('hidden');
  };
  imgElement.onerror = () => {
    cardElement.classList.add('hidden');
    imgElement.removeAttribute('src');
  };
  imgElement.src = imagePath;
}