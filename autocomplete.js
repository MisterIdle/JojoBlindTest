import { normalizeStr } from './utils.js';

export function setupAutocomplete(inputElement, suggElement, dataListCallback, isEnabledCallback) {
  inputElement.addEventListener('input', () => {
    suggElement.innerHTML = '';
    const val = inputElement.value;

    if (!val || !isEnabledCallback()) {
      suggElement.classList.remove('active');
      return;
    }

    const dataList = dataListCallback();
    const matches = dataList.filter(item => normalizeStr(item).includes(normalizeStr(val)));

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
          inputElement.dispatchEvent(new Event('input'));
        });
        
        suggElement.appendChild(div);
      });
      suggElement.classList.add('active');
    } else {
      suggElement.classList.remove('active');
    }
  });

  inputElement.addEventListener('focus', () => {
    if (inputElement.value && isEnabledCallback()) {
      inputElement.dispatchEvent(new Event('input'));
    }
  });

  inputElement.addEventListener('blur', () => {
    suggElement.classList.remove('active');
  });
}