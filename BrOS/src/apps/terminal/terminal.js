      const screen = document.getElementById('terminal-screen');
      const form = document.getElementById('terminal-form');
      const input = document.getElementById('terminal-input');
      const history = [];
      let historyIndex = -1;

      const COMMANDS = {
        help: () => `Available commands:\nhelp     - Show this message\nabout    - About BrOS\nskills   - Our skills\nprojects - My projects\ncontact  - Contact info\nneofetch - System info\nclear    - Clear terminal\ndate     - Current date/time\nfortune  - Random fortune\ncowsay   - Cow says your text\nweather  - Fake weather report`,
        about: () => `BrOS Terminal\nA lightweight browser-based terminal for the BrOS environment.`,
        skills: () => `Skills: HTML, CSS, JavaScript, web apps, static UI`,
        projects: () => `BrOS     - Browser OS demo\nClick    - Idle clicker game\nMuzik    - Spotify-compatible music UI\nNotlar   - Notes app`,
        contact: () => `Email: support@bros.local\nGitHub: github.com/merdoo10`,
        neofetch: () => `BrOS 0.1.0\nTerminal: Web CLI\nBrowser: ${navigator.userAgent}`,
        date: () => new Date().toString(),
        fortune: () => {
          const fortunes = [
            'Bugün harika bir gün olacak!',
            'Kodunu yaz, sonra kahveni al.',
            'Bir hata bulmak, iyileşmektir.',
            'Her Click tıklamada daha da güçleniyorsun.',
            'Müzik ve kod, birlikte daha iyi çalışır.',
          ];
          return fortunes[Math.floor(Math.random() * fortunes.length)];
        },
        weather: () => {
          const conditions = ['☀️ Sunny', '🌧 Rainy', '🌙 Clear', '⛅ Cloudy', '🌈 Rainbow'];
          const temp = Math.floor(Math.random() * 16 + 10);
          return `${conditions[Math.floor(Math.random() * conditions.length)]} | ${temp}°C`;
        },
        cowsay: (text = 'BrOS is cute!') => {
          const top = ' ' + '_'.repeat(text.length + 2);
          const mid = `< ${text} >`;
          const bot = ' ' + '-'.repeat(text.length + 2);
          return `${top}\n${mid}\n${bot}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`;
        },
      };

      function addLine(text, type = 'output') {
        const line = document.createElement('div');
        line.className = 'terminal-line terminal-' + type;
        line.textContent = text;
        screen.appendChild(line);
        screen.scrollTop = screen.scrollHeight;
      }

      function runCommand(raw) {
        const command = raw.trim();
        if (!command) return;
        addLine('$ ' + command, 'input-line');
        history.unshift(command);
        historyIndex = -1;

        if (command === 'clear') {
          screen.innerHTML = '';
          return;
        }

        const [name, ...args] = command.split(' ');
        if (name === 'echo') {
          addLine(args.join(' '));
          return;
        }
        if (COMMANDS[name]) {
          addLine(COMMANDS[name](args.join(' ')));
          return;
        }
        addLine(`Komut bulunamadı: ${name}`, 'error');
      }

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        runCommand(input.value);
        input.value = '';
      });

      input.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowUp' && history.length) {
          event.preventDefault();
          historyIndex = Math.min(historyIndex + 1, history.length - 1);
          input.value = history[historyIndex] || '';
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          historyIndex = Math.max(historyIndex - 1, -1);
          input.value = historyIndex >= 0 ? history[historyIndex] : '';
        }
      });

      window.addEventListener('load', () => {
        addLine('Welcome to BrOS Terminal!');
        addLine('Type help to list commands.');
        input.focus();
      });
