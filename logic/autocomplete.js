import { normalizeStr, findBestMatchInList, displayImageIfAvailable } from './utils.js';

export function bindInputFeatures({
  inputElement,
  suggElement,
  dataListGetter,
  isAutocompleteEnabledGetter,
  cardElement,
  imgElement,
  imagePathBuilder
}) {
  const updateDynamicConfirmationImage = () => {
    if (!cardElement || !imgElement || !imagePathBuilder) return;

    const rawVal = inputElement.value.trim();
    if (!rawVal) {
      displayImageIfAvailable(cardElement, imgElement, '');
      return;
    }

    const useFuzzy = !isAutocompleteEnabledGetter();
    const matchedEntity = findBestMatchInList(rawVal, dataListGetter(), useFuzzy);

    if (!matchedEntity) {
      displayImageIfAvailable(cardElement, imgElement, '');
      return;
    }

    const path = imagePathBuilder(matchedEntity);
    displayImageIfAvailable(cardElement, imgElement, path);
  };

  inputElement.addEventListener('input', () => {
    suggElement.innerHTML = '';
    const val = inputElement.value;

    updateDynamicConfirmationImage();

    if (!val.trim() || !isAutocompleteEnabledGetter()) {
      suggElement.classList.remove('active');
      return;
    }

    const dataList = dataListGetter();
    const cleanVal = normalizeStr(val);
    const matches = dataList.filter(item => normalizeStr(item).includes(cleanVal));

    if (matches.length > 0) {
      matches.forEach(match => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = match;

        div.addEventListener('mousedown', (e) => {
          e.preventDefault();
        });

        div.addEventListener('click', () => {
          inputElement.value = match;
          suggElement.classList.remove('active');
          updateDynamicConfirmationImage();
        });

        suggElement.appendChild(div);
      });
      suggElement.classList.add('active');
    } else {
      suggElement.classList.remove('active');
    }
  });

  inputElement.addEventListener('focus', () => {
    if (inputElement.value.trim() && isAutocompleteEnabledGetter()) {
      inputElement.dispatchEvent(new Event('input'));
    }
  });

  inputElement.addEventListener('blur', () => {
    suggElement.classList.remove('active');
  });
}