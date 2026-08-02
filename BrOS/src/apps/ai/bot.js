

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

  const MATH_PRELUDE = [
    'const sqrt = Math.sqrt,',
    '      pow  = Math.pow,',
    '      log  = Math.log,',
    '      ln   = Math.log,',
    '      exp  = Math.exp,',
    '      abs  = Math.abs,',
    '      min  = Math.min,',
    '      max  = Math.max,',
    '      pi   = Math.PI,',
    '      e    = Math.E;',
  ].join('\n');

  const FORBIDDEN = /(alert|prompt|confirm|console|window|document|fetch|eval|Function|setTimeout|setInterval|require|import|globalThis|self|prototype|constructor|__proto__|__|location|navigator|XMLHttpRequest|webkit)/i;
  const SAFE_CHARS_ONLY = /^[\d\s+\-*/^().,x]+$/;
  const SAFE_FUNC_LEAD = /^(sqrt|pow|log|ln|exp|abs|min|max|pi|e)\b/i;

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

  function rememberedName() {
    return loadJSON(KEYS.NAME, null);
  }

  function help() {
    return [
      'Jabbar commands:',
      '/help - show this help',
      '/time - show the current time',
      '/date - show the current date',
      '/roll - roll a die',
      '/flip - flip a coin',
      '/math <expression> - evaluate a safe expression',
      '/todo <text> - add a task',
      '/todos - list tasks',
      '/name <name> - remember your name',
      '/whoami - show your name',
      '/clearname - forget your name',
      '/about - about Jabbar',
      'You can also talk to me normally.',
    ].join('\n');
  }

  function runCommand(text) {
    const trimmed = (text || '').trim();
    if (!trimmed.startsWith('/')) return null;

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
      case 'math': {
        if (!arg) return 'Use /math with an expression such as 2 + 3 or sqrt(16).';
        const value = safeMath(arg);
        return value == null ? 'I could not evaluate that expression.' : 'Result: ' + value;
      }
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
      case 'whoami':
        return rememberedName() ? 'Your name is ' + rememberedName() + '.' : 'I do not know your name yet.';
      case 'clearname':
        saveJSON(KEYS.NAME, null);
        return 'I forgot your name.';
      case 'about':
        return 'I am Jabbar, a simple local assistant. I can help with commands, math, tasks, and basic chat.';
      default:
        return 'Unknown command. Try /help.';
    }
  }

  function tryMath(text) {
    const result = safeMath(text);
    if (result === null) return null;
    return 'Math: ' + text.trim() + ' = ' + result;
  }

  window.aiBot = {
    name: 'Jabbar',
    version: '1.0.0',
    capabilities: ['commands', 'math', 'tasks', 'basic chat'],
    async respond(text, history) {
      const t = (text || '').trim();
      if (!t) {
        return 'Say something or use /help.';
      }

      const commandResult = runCommand(t);
      if (commandResult !== null) {
        return commandResult;
      }

      if (/^(hello|hi|hey|greetings?)\b/i.test(t)) {
        const name = rememberedName();
        return name ? 'Hello, ' + name + '.' : 'Hello. I am Jabbar.';
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

      if (/^(who are you|what is your name)\b/i.test(t)) {
        return 'I am Jabbar, a simple local assistant.';
      }

      const math = tryMath(t);
      if (math !== null) {
        return math;
      }

      return 'I did not understand that. Try /help for available commands.';
    },
  };

  if (typeof console !== 'undefined' && console.info) {
    console.info('[Jabbar Bot] ready');
  }
})();
