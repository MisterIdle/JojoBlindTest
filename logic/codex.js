import {
  normalizeStr,
  getCharacterImagePath,
  getStandImagePath,
  getCoverImagePath,
  getAudioPath
} from './utils.js';

export class CodexController {
  constructor(dom) {
    this.dom = dom;
    this.allData = [];
    this.activePart = 'all';
    this.searchQuery = '';
    this.initEvents();
  }

  setData(data) {
    this.allData = Array.isArray(data) ? data : [];
    this.render();
  }

  initEvents() {
    if (this.dom.searchInput) {
      this.dom.searchInput.addEventListener('input', () => {
        this.searchQuery = normalizeStr(this.dom.searchInput.value);
        this.render();
      });
    }

    if (this.dom.partFilters) {
      this.dom.partFilters.querySelectorAll('.pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.dom.partFilters.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.activePart = btn.dataset.part;
          this.render();
        });
      });
    }
  }

  stopAudio() {
    if (this.dom.audioPlayer) {
      this.dom.audioPlayer.pause();
    }
    if (this.dom.audioBar) {
      this.dom.audioBar.classList.add('hidden');
    }
  }

  playTrack(track, ownerLabel) {
    this.dom.playingTitle.textContent = `${ownerLabel} — ${track.artist} : ${track.song}`;
    this.dom.audioPlayer.src = getAudioPath(track.audio);
    this.dom.audioBar.classList.remove('hidden');
    this.dom.audioPlayer.load();
    this.dom.audioPlayer.play().catch(() => {});
  }

  createSafeThumbnail(path, altText) {
    const img = document.createElement('img');
    img.className = 'codex-thumb hidden';
    img.alt = altText;
    if (!path) return img;

    img.onload = () => {
      img.classList.remove('hidden');
    };
    img.onerror = () => {
      img.classList.add('hidden');
    };
    img.src = path;
    return img;
  }

  render() {
    if (!this.dom.grid) return;
    this.dom.grid.innerHTML = '';

    const filtered = this.allData.filter(item => {
      if (this.activePart !== 'all') {
        const partNum = Number(this.activePart);
        if (!item.part || !item.part.includes(partNum)) return false;
      }

      if (!this.searchQuery) return true;

      const usersList = item.users ? item.users : (item.user ? [item.user] : []);
      const userMatch = usersList.some(u => normalizeStr(u).includes(this.searchQuery));
      const standMatch = item.stand && normalizeStr(item.stand).includes(this.searchQuery);
      const trackMatch = (item.tracks || []).some(
        t => normalizeStr(t.artist).includes(this.searchQuery) || normalizeStr(t.song).includes(this.searchQuery)
      );

      return userMatch || standMatch || trackMatch;
    });

    if (this.dom.countDisplay) {
      this.dom.countDisplay.textContent = `${filtered.length} entrées`;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'codex-card-item';

      const usersList = item.users ? item.users : (item.user ? [item.user] : []);
      const userDisplay = usersList.length > 0 ? usersList.join(', ') : 'Inconnu';
      const standDisplay = item.stand ? `Stand : ${item.stand}` : 'Pas de Stand';

      const top = document.createElement('div');
      top.className = 'codex-card-top';

      const titleWrap = document.createElement('div');
      const h4 = document.createElement('h4');
      h4.textContent = userDisplay;
      const pStand = document.createElement('p');
      pStand.textContent = standDisplay;
      titleWrap.appendChild(h4);
      titleWrap.appendChild(pStand);

      const partBadge = document.createElement('span');
      partBadge.className = 'part-badge';
      partBadge.textContent = `Part ${(item.part || []).join(', ')}`;

      top.appendChild(titleWrap);
      top.appendChild(partBadge);

      const thumbs = document.createElement('div');
      thumbs.className = 'codex-thumbs';
      if (usersList[0]) {
        thumbs.appendChild(this.createSafeThumbnail(getCharacterImagePath(usersList[0]), userDisplay));
      }
      if (item.stand) {
        thumbs.appendChild(this.createSafeThumbnail(getStandImagePath(item.stand), item.stand));
      }
      if (item.tracks && item.tracks[0]) {
        thumbs.appendChild(this.createSafeThumbnail(getCoverImagePath(item.tracks[0].song), item.tracks[0].song));
      }

      const trackList = document.createElement('div');
      trackList.className = 'codex-track-list';

      (item.tracks || []).forEach(track => {
        const row = document.createElement('div');
        row.className = 'codex-track-row';

        const meta = document.createElement('div');
        meta.className = 'codex-track-meta';
        const strong = document.createElement('strong');
        strong.textContent = track.song;
        const span = document.createElement('span');
        span.textContent = track.artist;
        meta.appendChild(strong);
        meta.appendChild(span);

        const playBtn = document.createElement('button');
        playBtn.type = 'button';
        playBtn.className = 'btn-play-track';
        playBtn.textContent = 'Écouter';
        playBtn.addEventListener('click', () => {
          this.playTrack(track, userDisplay);
        });

        row.appendChild(meta);
        row.appendChild(playBtn);
        trackList.appendChild(row);
      });

      card.appendChild(top);
      card.appendChild(thumbs);
      card.appendChild(trackList);
      this.dom.grid.appendChild(card);
    });
  }
}