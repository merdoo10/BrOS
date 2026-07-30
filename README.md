
# BrOS

A lightweight browser-based desktop launcher with small web apps (calculator, terminal, notes, clicker, gym guides, news). Deployed with Netlify.

## Features
- Launcher UI: open apps from the home screen (bros.html) using the window manager in stuff.js.
- Small apps in `src/apps/`:
  - `HM` — basic calculator (`src/apps/hm/hm.html`)
  - `Terminal` — browser terminal app (`src/apps/terminal/terminal.html`)
  - `Notlar` — notes app (`src/apps/notlar/notlar.html`)
  - `Clicker` — clicker game (`src/apps/click/click.html`)
  - `Gym` — workout guides (`src/apps/gym/gym.html`)
  - `News` — news pages (`src/apps/haber/haber.html`)
- Window manager: draggable/resizable app windows powered by stuff.js.

## Developer notes
- Apps are stored under `src/apps/`. Edit or add pages there.
- Window launcher and app lifecycle are in stuff.js.
- Styles: global site styling in style.css and per-app styles (e.g., `src/apps/apps.css` or inline styles inside each app file).
- TypeScript/React code (terminal) lives at `src/apps/terminal/terminal.tsx`. If you change TypeScript, run your usual type checks/build.

## Calculator (HM)
- Calculator UI: `src/apps/hm/hm.html`.
- Layout is responsive and styled to look like a phone calculator (rounded buttons, wide zero key).


## How apps launch
- Buttons in bros.html have `data-app-url` attributes.
- stuff.js listens for clicks on elements with `data-app-url` and calls `launchAppWindow(url, title, appId)`.
- Apps load inside an iframe inside the draggable window and are sandboxed to that iframe.

## Problems we faced
- Paths caused a lot of problem in making. It sometimes glitched out for no reason
- Buttons overlaped at someplaces and we still dont know why :( Probably an alignment issue
- Pacing. we procastinated a lot

## License
This repository includes a LICENSE file — follow the license terms there.
