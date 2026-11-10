export function normalizeStr(str) {
  if (!str) return '';
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
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
  return name.toLowerCase()
             .normalize('NFD')
             .replace(/[\u0300-\u036f]/g, '')
             .replace(/\s+/g, '_')
             .replace(/[^a-z0-9_]/g, '');
}

export function getCharacterImagePath(name) {
  if (!name) return '';
  return `img/characters/${formatName(name)}.jpg`;
}

export function getStandImagePath(name) {
  if (!name) return '';
  return `img/stands/${formatName(name)}.jpg`;
}

export function getCoverImagePath(songName) {
  if (!songName) return '';
  return `img/covers/cover_${formatName(songName)}.jpg`;
}

export function getAudioPath(audioValueFromJson) {
  if (!audioValueFromJson) return '';
  const filename = audioValueFromJson.replace("audio/", "").replace("audio/tracks/", "");
  return `audio/tracks/${filename}`;
}

export function getSimilarity(str1, str2) {
  const s1 = normalizeStr(str1);
  const s2 = normalizeStr(str2);
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;
  
  if (longerLength === 0) return 1.0;
  
  let matchingChars = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) {
      matchingChars++;
    }
  }
  return matchingChars / longerLength;
}