
      const displayEl = document.getElementById('expression');
      const buttons = document.querySelectorAll('.calc-btn');

      let currentValue = '0';
      let previousValue = null;
      let operator = null;
      let shouldResetScreen = false;

      function updateDisplay() {
        displayEl.textContent = currentValue;
      }

      function resetScreen() {
        currentValue = '0';
        shouldResetScreen = false;
      }

      function appendNumber(number) {
        if (shouldResetScreen || currentValue === 'Error') {
          currentValue = number === '.' ? '0.' : number;
          shouldResetScreen = false;
          return;
        }
        if (number === '.' && currentValue.includes('.')) return;
        if (currentValue === '0' && number !== '.') {
          currentValue = number;
          return;
        }
        currentValue += number;
      }

      function chooseOperator(nextOperator) {
        if (operator !== null) {
          calculate();
        }
        previousValue = currentValue;
        operator = nextOperator;
        shouldResetScreen = true;
      }

      function calculate() {
        if (operator === null || previousValue === null) return;
        const first = parseFloat(previousValue);
        const second = parseFloat(currentValue);
        let result = 0;

        switch (operator) {
          case '+':
            result = first + second;
            break;
          case '-':
            result = first - second;
            break;
          case '*':
            result = first * second;
            break;
          case '/':
            result = second === 0 ? 'Error' : first / second;
            break;
        }

        currentValue = String(result);
        operator = null;
        previousValue = null;
        shouldResetScreen = true;
      }

      function clearAll() {
        currentValue = '0';
        previousValue = null;
        operator = null;
        shouldResetScreen = false;
      }

      function deleteLast() {
        if (currentValue === 'Error' || currentValue.length === 1) {
          currentValue = '0';
          return;
        }
        currentValue = currentValue.slice(0, -1);
      }

      function toggleSign() {
        if (currentValue === '0' || currentValue === 'Error') return;
        currentValue = currentValue.startsWith('-') ? currentValue.slice(1) : `-${currentValue}`;
      }

      function percent() {
        const value = parseFloat(currentValue);
        currentValue = String(value / 100);
      }

      buttons.forEach((button) => {
        button.addEventListener('click', () => {
          const action = button.dataset.action;
          const value = button.dataset.value;

          switch (action) {
            case 'number':
              appendNumber(value);
              break;
            case 'operator':
              chooseOperator(value);
              break;
            case 'equals':
              calculate();
              break;
            case 'clear':
              clearAll();
              break;
            case 'toggle-sign':
              toggleSign();
              break;
            case 'percent':
              percent();
              break;
          }

          updateDisplay();
        });
      });

      document.addEventListener('keydown', (event) => {
        const { key } = event;
        if (/^[0-9]$/.test(key)) {
          appendNumber(key);
        } else if (key === '.') {
          appendNumber(key);
        } else if (['+', '-', '*', '/'].includes(key)) {
          chooseOperator(key);
        } else if (key === 'Enter' || key === '=') {
          event.preventDefault();
          calculate();
        } else if (key === 'Backspace') {
          deleteLast();
        } else if (key === 'Escape' || key.toLowerCase() === 'c') {
          clearAll();
        }
        updateDisplay();
      });

      updateDisplay();