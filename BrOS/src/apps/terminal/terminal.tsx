import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any
    }
  }
}

interface Line {
    text: string
    type: 'input' | 'output' | 'error'
}

const COMMANDS: Record<string, (text?: string) => string> = {
    help: () => `Available commands:
  help       - Show this message
  about      - About MewoOS
  skills     - Our skills
  projects   - My projects
  contact    - Contact info
  neofetch   - System info
  clear      - Clear terminal
  date       - Current date/time
  hacker     - Opens Hacker Mode (type anything to stop)
  party      - Disco mode!
  fortune    - Random fortune
  weather    - Shows real weather where we live
  cowsay     - Cow says your text
  sudo rm -rf /*       - Super cool Command >:)`,

   whoami: () => 'subhansh -- builder, researcher, vibe coder extraordinaire',

  about: () => `MewoOS v1.0.0
A kawaii web-based operating system built for the Hack Club Stardance jam.
Made with React, TypeScript, Tailwind CSS, and a lot of pastel colors.
Inspired by macOS aesthetics with a GenZ vocaloid twist.`,

  skills: () => `Languages:    Python, TypeScript, JavaScript, Rust
Frameworks:  React, FastAPI, Next.js, Tailwind
AI/ML:       PyTorch, DSPy, LLM pipelines, RAG
Tools:       Git, Docker, Linux, Vim
Vibes:       Kawaii, Vocaloid, Terminal aesthetics`,

  projects: () => `RUMI         Autonomous scientific discovery AI (95K+ lines)
FRIDAY       Cognitive AI OS (95K lines)
Chronovisor  Temporal archaeology engine
MewoOS       This very operating system you're using right now!`,

  contact: () => `Email:    subhansh.dev@gmail.com
GitHub:   github.com/subhansh-dev
Discord:  nernearr
Portfolio: subhanshh.vercel.app`,

  neofetch: () => `
  /\\_/\\      subhansh@mewoos
 ( o.o )     ----------------
  > ^ <      OS: MewoOS 1.0.0
 /|   |\\     Kernel: React 19 + TypeScript
(_|   |_)    Shell: mewosh 1.0
             Resolution: responsive
             DE: Kawaii Desktop Environment
             WM: Framer Motion
             Theme: Pastel Kawaii [Light]
             Terminal: MewoTerm
             CPU: Brain v17.0
             Memory: unlimited (cloud-based)`,

  kawaii: () => {
    const faces = ['(◕ᴗ◕✿)', '(◠‿◠)', '(ﾉ◕ヮ◕)ﾉ*:・ﾟ✿', '(｡◕‿◕｡)', '(✿╹◡╹)', '♡(ӦｖӦ｡)', '(っ˘ω˘ς )', '(─‿─)', 'ヽ(>∀<☆)ノ', '(★ω★)']
    return faces[Math.floor(Math.random() * faces.length)]
  },

  date: () => new Date().toString(),

  matrix: () => 'MATRIX MODE ACTIVATED\n' + Array.from({ length: 8 }, () =>
    Array.from({ length: 40 }, () => String.fromCharCode(0x30A0 + Math.random() * 96)).join('')
  ).join('\n'),

  party: () => {
    const colors = ['🟥','🟧','🟨','🟩','🟦','🟪','🟥','🟧','🟨','🟩','🟦','🟪']
    return colors.join('') + '\n' + colors.reverse().join('') + '\nPARTY MODE! ヽ(>∀<☆)ノ\n' + colors.reverse().join('')
  },

  cat: () => {
    const cats = [
      `  /\\_/\\  \n ( o.o ) \n  > ^ <  \n /|   |\\ \n(_|   |_)`,
      `  /\\_/\\  \n ( =.= ) \n  > ^ <  zzz`,
      `  /\\_/\\  \n ( @.@ ) \n  > ^ <  * startled *`,
      `  /\\_/\\  \n ( ^.^ ) \n  > ♡ <  mewo!`,
      `    |\\_/|  \n    |o o|  \n    | > |  meow~`,
    ]
    return cats[Math.floor(Math.random() * cats.length)]
  },

  fortune: () => {
    const fortunes = [
      'The best time to plant a tree was 20 years ago. The second best time is now.',
      'Code is like humor. When you have to explain it, it\'s bad.',
      'First, solve the problem. Then, write the code.',
      'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.',
      'The only way to learn a new programming language is by writing programs in it.',
      'Talk is cheap. Show me the code. - Linus Torvalds',
      'Meow. - Every cat ever',
      'The kawaii is strong with this one.',
      'Your future is as bright as a sakura blossom in spring.',
    ]
    return fortunes[Math.floor(Math.random() * fortunes.length)]
  },

  weather: () => {
    const conditions = ['☀️ Sunny', '🌤 Partly cloudy', '🌧 Rainy', '⛅ Cloudy', '🌈 Rainbow', '❄️ Snowy', '🌙 Clear night']
    const cond = conditions[Math.floor(Math.random() * conditions.length)]
    const temp = Math.floor(Math.random() * 30 + 5)
    return `MewoOS Weather Service\n${cond} | ${temp}°C\nHumidity: ${Math.floor(Math.random() * 60 + 30)}%\nWind: ${Math.floor(Math.random() * 20 + 1)} km/h\nVibes: Immaculate ✨`
  },

  cowsay: (text?: string) => {
    const msg = text || 'MewoOS is kawaii!'
    const top = ' ' + '_'.repeat(msg.length + 2)
    const mid = `< ${msg} >`
    const bot = ' ' + '-'.repeat(msg.length + 2)
    return `${top}\n${mid}\n${bot}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`
  },

   sudo: () => {
    const responses = [
      'Aww hell nahh man this aint linux this is BrOS :)',
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  },
}

export default function Terminal() {
  const [lines, setLines] = useState<Line[]>([
    { text: 'Welcome to MewoTerm v1.0.0', type: 'output' },
    { text: 'Type "help" for available commands. (◕ᴗ◕✿)', type: 'output' },
    { text: '', type: 'output' },
  ])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [lines])

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim()
    if (!trimmed) return

    const newLines: Line[] = [{ text: `$ ${trimmed}`, type: 'input' }]
    setHistory((h: string[]) => [trimmed, ...h])
    setHistIdx(-1)

    const [command, ...args] = trimmed.split(' ')

    if (command === 'clear') {
      setLines([])
      return
    }

    if (command === 'echo') {
      newLines.push({ text: args.join(' '), type: 'output' })
    } else if (COMMANDS[command]) {
      const result = COMMANDS[command](args.join(' '))
      newLines.push({ text: result, type: 'output' })
    } else {
      newLines.push({ text: `mewosh: command not found: ${command}`, type: 'error' })
    }

    newLines.push({ text: '', type: 'output' })
    setLines((l: Line[]) => [...l, ...newLines])
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(input)
      setInput('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const newIdx = Math.min(histIdx + 1, history.length - 1)
        setHistIdx(newIdx)
        setInput(history[newIdx])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (histIdx > 0) {
        const newIdx = histIdx - 1
        setHistIdx(newIdx)
        setInput(history[newIdx])
      } else {
        setHistIdx(-1)
        setInput('')
      }
    }
  }

  return (
    <div className="app-terminal" ref={scrollRef} onClick={() => inputRef.current?.focus()}>
      {lines.map((line: Line, i: number) => (
        <div key={i} className="app-terminal-line">
          {line.type === 'input' ? (
            <span>
              <span className="app-terminal-prompt">{line.text.slice(0, 2)}</span>
              <span>{line.text.slice(2)}</span>
            </span>
          ) : (
            <span style={{ color: line.type === 'error' ? '#F38BA8' : '#CDD6F4' }}>
              {line.text}
            </span>
          )}
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span className="app-terminal-prompt">$ </span>
        <input
          ref={inputRef}
          className="app-terminal-input"
          value={input}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          spellCheck={false}
        />
      </div>
    </div>
  )
}