(function () {
  'use strict';

  const KEYS = {
    NAME: 'ai-bot:user-name',
    TODOS: 'ai-bot:todos',
  };

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
    }
  }

  const SAFE_CHARS_ONLY = /^[\d\s+\-*/^().,x]+$/;

  function safeMath(expression) {
    if (typeof expression !== 'string') return null;
    const expr = expression.trim();
    if (!expr) return null;

    const looksPure = SAFE_CHARS_ONLY.test(expr) || SAFE_FUNC_LEAD.test(expr);
    if (!looksPure) return null;
    if (FORBIDDEN.test(expr)) return null;

    const normalized = expr.replace(/\s*x\s*/gi, '*').replace(/\^/g, '**');

    try {
      const fn = new Function(MATH_PRELUDE + '\nreturn (' + normalized + ');');
      const result = fn();
      return Number.isFinite(result) ? result : null;
    } catch (error) {
      return null;
    }
  }

  function pick(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  const UNKNOWN_RESPONSES = [
    'You aint tellin me nothin',
    'Let the bodies hit the floor',
    'Grape juice is better for sure',
    'Cabbar will handle it',
    'Ill deliver a scathing remark that will leave you speechless.',
    'Lets talk to his mother',
    'Am I supposed to know my job from you soq soq',
    'Eat less and hire a worker ',
    'Oh shi, here we go again',
    'So long suckers!',
    'Man I love this game',
    'Why are we paying taxes? That money should go to fun stuff. Like chicken nuggies and milshakes ',
    'You re goddamn right',
    'You forget a thousand things every day, pal. Make sure this is one of them',
    'Does it help if I say that Im sorry?',
    'You cant see California without Marlon Brandos eyes',
    '2-3 years dagestan and forget.',
    'Your the goat man. Keep it up',
  ];

  function unknownReply() {
    return pick(UNKNOWN_RESPONSES);
  }

  function rememberedName() {
    return loadJSON(KEYS.NAME, null);
  }

  function help() {
    return [
      'Jabbar commands:',
      'help - show this message',
      'time - show the current time',
      'date - show the current date',
      'roll - roll a die',
      'flip - flip a coin',
      'todo <text> - add a task',
      'todos - list tasks',
      'name <name> - remember your name',
      'say my name - show your name',
      'clearname - forget your name',
      'about - about Jabbar',
    ].join('\n');
  }

  function runCommand(text) {
    const parts = trimmed.slice(1).trim().split(/\s+/);
    const command = (parts.shift() || '').toLowerCase();
    const arg = parts.join(' ').trim();

    switch (command) {
      case 'help':
      case 'commands':
        return help();
      case 'time':
        return 'The time is ' + new Date().toLocaleTimeString();
      case 'date':
        return 'Today is ' + new Date().toLocaleDateString();
      case 'roll':
        return 'Roll: ' + (1 + Math.floor(Math.random() * 6));
      case 'flip':
        return 'Flip: ' + (Math.random() < 0.5 ? 'Heads' : 'Tails');
      case 'todo': {
        if (!arg) return 'Use /todo followed by a task.';
        const list = loadJSON(KEYS.TODOS, []);
        list.push({ text: arg, ts: Date.now(), done: false });
        saveJSON(KEYS.TODOS, list);
        return 'Added: ' + arg;
      }
      case 'todos': {
        const list = loadJSON(KEYS.TODOS, []);
        if (!list.length) return 'No tasks yet.';
        return 'Tasks:\n' + list.map((item, index) => (index + 1) + '. ' + item.text).join('\n');
      }
      case 'name':
        if (!arg) return 'Use /name followed by your name.';
        saveJSON(KEYS.NAME, arg);
        return 'Nice to meet you, ' + arg + '.';
      case 'say my name':
        return rememberedName() ? 'I remember you man, youre ' + rememberedName() + '.' : 'I do not know your name yet.';
      case 'clearname':
        saveJSON(KEYS.NAME, null);
        return 'I forgot your name man.';
      case 'about':
        return 'Yo yo yo. Jabbar here, best agent on the block. Ready to help homie. ';
      default:
        return UNKNOWN_RESPONSES.includes(command) ? null : 'Unknown command: ' + command;
    }
  }

  function tryMath(text) {
    const result = safeMath(text);
    if (result === null) return null;
    return 'Math: ' + text.trim() + ' = ' + result;
  }

  window.aiBot = {
    name: 'Jabbar',
    async respond(text, history) {
      const t = (text || '').trim();
      if (!t) {
        return 'Lets get started homie. Type help to see what I got';
      }

      const commandResult = runCommand(t);
      if (commandResult !== null) {
        return commandResult;
      }

      if (/^(hello|hi|hey?)\b/i.test(t)) {
        const name = rememberedName();
        return name ? 'Hello, ' + name + '.' : 'Wassup. Im Jabbar.';
      }

      if (/^(how are you|how are you doing)\b/i.test(t)) {
        return 'I am doing well. How are you?';
      }

      if (/^(thanks|thank you|thx)\b/i.test(t)) {
        return 'You are welcome.';
      }

      if (/^(bye|goodbye|see you|later)\b/i.test(t)) {
        return 'Goodbye.';
      }

      const math = tryMath(t);
      if (math !== null) {
        return math;
      }

      return unknownReply();
    },
  };

  if (typeof console !== 'undefined' && console.info) {
    console.info('[Jabbar Bot] ready');
  }
})();
