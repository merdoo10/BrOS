const coinsCount = document.getElementById('coins-count');
const clickPower = document.getElementById('click-power');
const idleRate = document.getElementById('idle-rate');
const clickButton = document.getElementById('click-button');
const buyAuto = document.getElementById('buy-auto');
const buyPower = document.getElementById('buy-power');
const resetButton = document.getElementById('reset-button');
const orbitContainer = document.querySelector('.cookie-orbit');

const STORAGE_KEY = 'bros-clicker-state';
const defaultState = {
  cookies: 0,
  clickPower: 1,
  autoClickers: 0,
};

let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || defaultState;

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  coinsCount.textContent = Math.floor(state.cookies);
  clickPower.textContent = state.clickPower;
  idleRate.textContent = state.autoClickers;
  buyAuto.textContent = `Buy (${20 + state.autoClickers * 10})`;
  buyPower.textContent = `Buy (${50 + state.clickPower * 15})`;

  orbitContainer.innerHTML = '';
  for (let index = 0; index < state.autoClickers; index += 1) {
    const orbiter = document.createElement('div');
    orbiter.className = 'orbiter';
    orbiter.textContent = '🍪';
    const angle = (index / Math.max(1, state.autoClickers)) * 360;
    const radius = 140;
    const x = Math.cos((angle - 90) * (Math.PI / 180)) * radius;
    const y = Math.sin((angle - 90) * (Math.PI / 180)) * radius;
    orbiter.style.transform = `translate(${x}px, ${y}px)`;
    orbitContainer.appendChild(orbiter);
  }
}

function addCookies(amount) {
  state.cookies += amount;
  saveState();
  render();
}

clickButton.addEventListener('click', () => {
  addCookies(state.clickPower);
  clickButton.classList.remove('is-pulse');
  void clickButton.offsetWidth;
  clickButton.classList.add('is-pulse');
  setTimeout(() => clickButton.classList.remove('is-pulse'), 140);
});

buyAuto.addEventListener('click', () => {
  const price = 20 + state.autoClickers * 10;
  if (state.cookies >= price) {
    state.cookies -= price;
    state.autoClickers += 1;
    saveState();
    render();
  } else {
    alert('Not enough cookies.');
  }
});

buyPower.addEventListener('click', () => {
  const price = 50 + state.clickPower * 15;
  if (state.cookies >= price) {
    state.cookies -= price;
    state.clickPower += 1;
    saveState();
    render();
  } else {
    alert('Not enough cookies.');
  }
});

resetButton.addEventListener('click', () => {
  if (confirm('Reset the game?')) {
    state = { ...defaultState };
    saveState();
    render();
  }
});

setInterval(() => {
  if (state.autoClickers > 0) {
    state.cookies += state.autoClickers;
    saveState();
    render();
  }
}, 2000);

window.addEventListener('load', render);