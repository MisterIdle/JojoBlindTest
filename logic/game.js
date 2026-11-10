import {
  shuffleArray,
  getCharacterImagePath,
  getStandImagePath,
  getCoverImagePath,
  getAudioPath,
  isMainThemeTrack,
  displayImageIfAvailable
} from './utils.js';
import { bindInputFeatures } from './autocomplete.js';
import { getRoundMaxPoints, evaluateRound } from './scoring.js';

export class GameController {
  constructor(dom, catalogs) {
    this.dom = dom;
    this.catalogs = catalogs;
    this.playlist = [];
    this.currentIndex = 0;
    this.score = 0;
    this.maxTotalScore = 0;
    this.currentTrack = null;
    this.options = {
      enableUser: true,
      enableStand: true,
      enableArtist: true,
      enableSong: true,
      autocompleteEnabled: true,
      excludeMainThemes: false
    };

    this.initEvents();
  }

  initEvents() {
    this.dom.quizForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.validateCurrentRound();
    });

    this.dom.btns.next.addEventListener('click', () => {
      this.nextRound();
    });
  }

  startNewGame(allData, selectedParts, options) {
    this.options = options;

    const preparedItems = [];
    allData.forEach(item => {
      if (!item.part.some(p => selectedParts.includes(p))) return;
      if (!item.tracks || item.tracks.length === 0) return;

      const availableTracks = options.excludeMainThemes
        ? item.tracks.filter(t => !isMainThemeTrack(t))
        : item.tracks;

      if (availableTracks.length === 0) return;

      const hasUser = Boolean(item.user || (item.users && item.users.length > 0));
      const hasAtLeastOneActiveField =
        (options.enableUser && hasUser) ||
        (options.enableStand && Boolean(item.stand)) ||
        options.enableArtist ||
        options.enableSong;

      if (hasAtLeastOneActiveField) {
        preparedItems.push({
          ...item,
          playableTracks: availableTracks
        });
      }
    });

    if (preparedItems.length === 0) {
      alert('Aucune manche disponible avec cette combinaison de parties et de catégories.');
      return false;
    }

    this.playlist = shuffleArray(preparedItems).slice(0, options.roundLimit);

    this.maxTotalScore = this.playlist.reduce(
      (sum, item) => sum + getRoundMaxPoints(item, this.options),
      0
    );

    this.currentIndex = 0;
    this.score = 0;
    this.loadRound();
    return true;
  }

  rebindInputs() {
    Object.keys(this.dom.inputs).forEach(key => {
      const oldInput = this.dom.inputs[key];
      const clone = oldInput.cloneNode(true);
      clone.value = '';
      clone.disabled = false;
      clone.classList.remove('correct', 'wrong');
      oldInput.parentNode.replaceChild(clone, oldInput);
      this.dom.inputs[key] = clone;
    });

    bindInputFeatures({
      inputElement: this.dom.inputs.user,
      suggElement: this.dom.suggs.user,
      dataListGetter: () => this.catalogs.users,
      isAutocompleteEnabledGetter: () => this.options.autocompleteEnabled,
      cardElement: this.dom.cards.user,
      imgElement: this.dom.imgs.user,
      imagePathBuilder: getCharacterImagePath
    });

    bindInputFeatures({
      inputElement: this.dom.inputs.stand,
      suggElement: this.dom.suggs.stand,
      dataListGetter: () => this.catalogs.stands,
      isAutocompleteEnabledGetter: () => this.options.autocompleteEnabled,
      cardElement: this.dom.cards.stand,
      imgElement: this.dom.imgs.stand,
      imagePathBuilder: getStandImagePath
    });

    bindInputFeatures({
      inputElement: this.dom.inputs.artist,
      suggElement: this.dom.suggs.artist,
      dataListGetter: () => this.catalogs.artists,
      isAutocompleteEnabledGetter: () => this.options.autocompleteEnabled,
      cardElement: null,
      imgElement: null,
      imagePathBuilder: null
    });

    bindInputFeatures({
      inputElement: this.dom.inputs.song,
      suggElement: this.dom.suggs.song,
      dataListGetter: () => this.catalogs.songs,
      isAutocompleteEnabledGetter: () => this.options.autocompleteEnabled,
      cardElement: this.dom.cards.cover,
      imgElement: this.dom.imgs.cover,
      imagePathBuilder: getCoverImagePath
    });
  }

  loadRound() {
    const currentItem = this.playlist[this.currentIndex];
    const randomTrackIndex = Math.floor(Math.random() * currentItem.playableTracks.length);
    this.currentTrack = currentItem.playableTracks[randomTrackIndex];

    this.dom.roundDisplay.textContent = `Manche ${this.currentIndex + 1} / ${this.playlist.length}`;
    this.dom.scoreDisplay.textContent = `Score : ${this.score} / ${this.maxTotalScore}`;
    this.dom.roundBreakdown.classList.add('hidden');
    this.dom.roundBreakdown.textContent = '';

    this.rebindInputs();

    Object.values(this.dom.corrs).forEach(el => { el.textContent = ''; });
    Object.values(this.dom.suggs).forEach(el => { el.classList.remove('active'); });

    displayImageIfAvailable(this.dom.cards.user, this.dom.imgs.user, '');
    displayImageIfAvailable(this.dom.cards.stand, this.dom.imgs.stand, '');
    displayImageIfAvailable(this.dom.cards.cover, this.dom.imgs.cover, '');

    const hasUser = Boolean(currentItem.user || (currentItem.users && currentItem.users.length > 0));
    const showUser = this.options.enableUser && hasUser;
    const showStand = this.options.enableStand && Boolean(currentItem.stand);

    this.dom.groups.user.classList.toggle('hidden', !showUser);
    this.dom.groups.stand.classList.toggle('hidden', !showStand);
    this.dom.groups.artist.classList.toggle('hidden', !this.options.enableArtist);
    this.dom.groups.song.classList.toggle('hidden', !this.options.enableSong);

    this.dom.btns.submit.classList.remove('hidden');
    this.dom.btns.next.classList.add('hidden');

    this.dom.audioPlayer.src = getAudioPath(this.currentTrack.audio);
    this.dom.audioPlayer.load();
    this.dom.audioPlayer.play().catch(() => {});
  }

  validateCurrentRound() {
    if (this.dom.btns.submit.classList.contains('hidden')) return;

    const currentItem = this.playlist[this.currentIndex];
    Object.values(this.dom.suggs).forEach(el => el.classList.remove('active'));
    Object.values(this.dom.inputs).forEach(input => { input.disabled = true; });

    const evaluation = evaluateRound(
      currentItem,
      this.currentTrack,
      {
        user: this.dom.inputs.user.value,
        stand: this.dom.inputs.stand.value,
        artist: this.dom.inputs.artist.value,
        song: this.dom.inputs.song.value
      },
      this.options
    );

    this.score += evaluation.earnedPoints;
    this.dom.scoreDisplay.textContent = `Score : ${this.score} / ${this.maxTotalScore}`;

    const expectedUsers = currentItem.users ? currentItem.users : (currentItem.user ? [currentItem.user] : []);
    if (evaluation.results.user) {
      this.applyFieldFeedback(
        this.dom.inputs.user,
        this.dom.corrs.user,
        evaluation.results.user.isCorrect,
        expectedUsers.join(' / ')
      );
      const userForImg = evaluation.results.user.matchedValue || expectedUsers[0];
      displayImageIfAvailable(this.dom.cards.user, this.dom.imgs.user, getCharacterImagePath(userForImg));
    } else if (expectedUsers[0]) {
      displayImageIfAvailable(this.dom.cards.user, this.dom.imgs.user, getCharacterImagePath(expectedUsers[0]));
    }

    if (evaluation.results.stand) {
      this.applyFieldFeedback(
        this.dom.inputs.stand,
        this.dom.corrs.stand,
        evaluation.results.stand.isCorrect,
        currentItem.stand
      );
      displayImageIfAvailable(this.dom.cards.stand, this.dom.imgs.stand, getStandImagePath(currentItem.stand));
    } else if (currentItem.stand) {
      displayImageIfAvailable(this.dom.cards.stand, this.dom.imgs.stand, getStandImagePath(currentItem.stand));
    }

    if (evaluation.results.artist) {
      this.applyFieldFeedback(
        this.dom.inputs.artist,
        this.dom.corrs.artist,
        evaluation.results.artist.isCorrect,
        this.currentTrack.artist
      );
    }

    if (evaluation.results.song) {
      this.applyFieldFeedback(
        this.dom.inputs.song,
        this.dom.corrs.song,
        evaluation.results.song.isCorrect,
        this.currentTrack.song
      );
    }
    displayImageIfAvailable(this.dom.cards.cover, this.dom.imgs.cover, getCoverImagePath(this.currentTrack.song));

    if (evaluation.details.length > 0) {
      this.dom.roundBreakdown.textContent = `Points gagnés : +${evaluation.earnedPoints} pts (${evaluation.details.join(' • ')})`;
    } else {
      this.dom.roundBreakdown.textContent = 'Aucun point gagné sur cette manche.';
    }
    this.dom.roundBreakdown.classList.remove('hidden');

    this.dom.btns.submit.classList.add('hidden');
    this.dom.btns.next.classList.remove('hidden');
  }

  applyFieldFeedback(inputEl, corrEl, isCorrect, expectedText) {
    if (isCorrect) {
      inputEl.classList.add('correct');
    } else {
      inputEl.classList.add('wrong');
      corrEl.textContent = `Réponse : ${expectedText}`;
    }
  }

  nextRound() {
    this.currentIndex++;
    if (this.currentIndex < this.playlist.length) {
      this.loadRound();
    } else {
      this.stopAudio();
      // On déclenche l'écran de fin en envoyant le score actuel et le max
      this.dom.onGameEnd(this.score, this.maxTotalScore);
    }
  }

  stopAudio() {
    this.dom.audioPlayer.pause();
  }
}