import { normalizeStr, getSimilarity } from './utils.js';

export const POINTS_CONFIG = {
  USER: 1,
  STAND: 1,
  ARTIST: 1,
  SONG_BASE: 2,
  NO_AUTOCOMPLETE_BONUS: 5,
  NO_MAIN_THEME_BONUS: 2,
  SIMILARITY_THRESHOLD: 0.9
};

export function getRoundMaxPoints(item, options) {
  let total = 0;
  let activeFields = 0;

  const hasUser = Boolean(item.user || (item.users && item.users.length > 0));
  if (options.enableUser && hasUser) {
    total += POINTS_CONFIG.USER;
    activeFields++;
  }
  if (options.enableStand && item.stand) {
    total += POINTS_CONFIG.STAND;
    activeFields++;
  }
  if (options.enableArtist) {
    total += POINTS_CONFIG.ARTIST;
    activeFields++;
  }
  if (options.enableSong) {
    total += POINTS_CONFIG.SONG_BASE;
    activeFields++;
  }

  if (activeFields > 0) {
    if (!options.autocompleteEnabled) {
      total += POINTS_CONFIG.NO_AUTOCOMPLETE_BONUS;
    }
    if (options.excludeMainThemes) {
      total += POINTS_CONFIG.NO_MAIN_THEME_BONUS;
    }
  }

  return total;
}

export function isAnswerValid(userValue, expectedValues, autocompleteEnabled) {
  const candidates = Array.isArray(expectedValues) ? expectedValues : [expectedValues];
  const cleanUser = normalizeStr(userValue);
  if (!cleanUser) return { isCorrect: false, matchedValue: candidates[0] || '' };

  for (const expected of candidates) {
    if (!expected) continue;
    if (normalizeStr(expected) === cleanUser) {
      return { isCorrect: true, matchedValue: expected };
    }
    if (!autocompleteEnabled) {
      const similarity = getSimilarity(userValue, expected);
      if (similarity >= POINTS_CONFIG.SIMILARITY_THRESHOLD) {
        return { isCorrect: true, matchedValue: expected };
      }
    }
  }

  return { isCorrect: false, matchedValue: candidates[0] || '' };
}

export function evaluateRound(item, currentTrack, userInputs, options) {
  let earnedPoints = 0;
  let activeFields = 0;
  let correctFields = 0;
  const details = [];

  const hasUser = Boolean(item.user || (item.users && item.users.length > 0));
  const expectedUsers = item.users ? item.users : (item.user ? [item.user] : []);

  let userResult = null;
  if (options.enableUser && hasUser) {
    activeFields++;
    userResult = isAnswerValid(userInputs.user, expectedUsers, options.autocompleteEnabled);
    if (userResult.isCorrect) {
      correctFields++;
      earnedPoints += POINTS_CONFIG.USER;
      details.push(`+${POINTS_CONFIG.USER} Porteur`);
    }
  }

  let standResult = null;
  if (options.enableStand && item.stand) {
    activeFields++;
    standResult = isAnswerValid(userInputs.stand, item.stand, options.autocompleteEnabled);
    if (standResult.isCorrect) {
      correctFields++;
      earnedPoints += POINTS_CONFIG.STAND;
      details.push(`+${POINTS_CONFIG.STAND} Stand`);
    }
  }

  let artistResult = null;
  if (options.enableArtist) {
    activeFields++;
    artistResult = isAnswerValid(userInputs.artist, currentTrack.artist, options.autocompleteEnabled);
    if (artistResult.isCorrect) {
      correctFields++;
      earnedPoints += POINTS_CONFIG.ARTIST;
      details.push(`+${POINTS_CONFIG.ARTIST} Groupe`);
    }
  }

  let songResult = null;
  if (options.enableSong) {
    activeFields++;
    songResult = isAnswerValid(userInputs.song, currentTrack.song, options.autocompleteEnabled);
    if (songResult.isCorrect) {
      correctFields++;
      earnedPoints += POINTS_CONFIG.SONG_BASE;
      details.push(`+${POINTS_CONFIG.SONG_BASE} Musique`);
    }
  }

  if (correctFields > 0 && activeFields > 0) {
    const ratio = correctFields / activeFields;
    if (!options.autocompleteEnabled) {
      const noAutoPts = Math.round(POINTS_CONFIG.NO_AUTOCOMPLETE_BONUS * ratio);
      if (noAutoPts > 0) {
        earnedPoints += noAutoPts;
        details.push(`+${noAutoPts} Sans Auto-complétion`);
      }
    }
    if (options.excludeMainThemes) {
      const noOstPts = Math.round(POINTS_CONFIG.NO_MAIN_THEME_BONUS * ratio);
      if (noOstPts > 0) {
        earnedPoints += noOstPts;
        details.push(`+${noOstPts} Sans Main Theme`);
      }
    }
  }

  return {
    earnedPoints,
    details,
    results: {
      user: userResult,
      stand: standResult,
      artist: artistResult,
      song: songResult
    }
  };
}