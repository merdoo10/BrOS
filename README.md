# BrOS

BrOS is a lightweight, browser-based "desktop" launcher. It simulates a tiny operating system entirely inside a webpage: a home screen with app icons, a window manager that lets you open, drag, and resize windows, and a handful of small self-contained web apps running inside those windows. The whole thing is deployed as a static site through Netlify, so there's no backend server involved — everything runs client-side in the browser.

The goal of the project is less about being a "real" OS and more about providing a fun, nostalgic desktop-style interface for a set of small, useful (or just entertaining) mini apps, all launched from a single home screen.

## Table of Contents
- [Features](#features)
- [Window Manager](#window-manager)
- [Calculator (HM)](#calculator-hm)
- [How Apps Launch](#how-apps-launch)
- [Developer Notes](#developer-notes)
- [Known Problems / Lessons Learned](#problems-we-faced)
- [License](#license)

## Features

### Launcher UI
The entry point of the project is `bros.html`, which acts as the home screen of the "desktop." From this screen, the user can click on app icons/buttons to open individual apps. Opening an app doesn't navigate away from the page — instead, the window manager defined in `stuff.js` spawns a new draggable window on top of the home screen, and the requested app is loaded inside that window. This keeps the experience feeling like a real desktop environment, where multiple apps can, in principle, be open and moved around at the same time.

### Small Apps
All of the individual mini apps live under the `src/apps/` directory, with each app kept in its own subfolder. The apps currently included are:

- **HM — Calculator**
  Located at `src/apps/hm/hm.html`. A basic calculator app styled to resemble a phone calculator, with rounded buttons and a wide "0" key. See the [Calculator (HM)](#calculator-hm) section below for more detail.

- **Terminal**
  Located at `src/apps/terminal/terminal.html`. A browser-based terminal emulator/app. Unlike the other apps, this one has TypeScript/React source code behind it (`src/apps/terminal/terminal.tsx`), meaning changes to it need to go through a build/type-check step rather than being edited directly as plain HTML/JS.

- **Notlar (Notes)**
  Located at `src/apps/notlar/notlar.html`. A simple notes-taking app ("Notlar" is Turkish for "Notes").

- **Clicker**
  Located at `src/apps/click/click.html`. A small clicker-style game, in the spirit of incremental/idle games.

- **Gym**
  Located at `src/apps/gym/gym.html`. Contains workout guides — likely static informational content about exercises/routines.

- **News (Haber)**
  Located at `src/apps/haber/haber.html`. News-related pages ("Haber" is Turkish for "News").

Each of these apps is a self-contained page that gets loaded inside its own window when launched from the home screen, rather than being embedded directly into `bros.html`.

## Window Manager

The window manager is the core piece of infrastructure that makes BrOS feel like a desktop rather than a plain webpage. It lives in `stuff.js` and is responsible for:

- Creating new "windows" (essentially styled `<div>` containers) when an app is launched.
- Making those windows **draggable**, so the user can move them around the screen freely.
- Making those windows **resizable**, so the user can adjust their size to fit their needs.
- Managing the lifecycle of each window/app instance — opening, focusing, and presumably closing them.

Each app runs inside an **iframe** embedded within its window. This means every app is sandboxed to its own iframe context, isolating it from the rest of the page and from other open apps. This sandboxing approach is also what allows apps written in different ways (plain HTML/JS apps vs. the React/TypeScript terminal) to coexist without interfering with one another.

## Calculator (HM)

The calculator app deserves its own callout since it's one of the more polished pieces of the project:

- **File:** `src/apps/hm/hm.html`
- **Design:** The layout is responsive and intentionally styled to resemble a phone calculator — rounded buttons and a wide zero ("0") key, similar to what you'd see on a mobile device's built-in calculator app.

## How Apps Launch

The launching mechanism ties the home screen UI together with the window manager:

1. Each launchable app is represented by a button in `bros.html`.
2. Every one of these buttons carries a `data-app-url` attribute, which points to the HTML file of the app it should open (e.g., pointing to `src/apps/hm/hm.html` for the calculator).
3. `stuff.js` sets up an event listener that watches for clicks on any element with a `data-app-url` attribute.
4. When such a click is detected, `stuff.js` calls `launchAppWindow(url, title, appId)`, passing in:
   - `url` — the app's URL (from `data-app-url`)
   - `title` — the title to display on the window
   - `appId` — an identifier for the app/window instance
5. `launchAppWindow` then creates a new draggable/resizable window and loads the given URL inside an iframe within that window, sandboxing the app to that iframe as described above.

## Developer Notes

A few practical notes for anyone working on the codebase:

- **App location:** All apps are stored under `src/apps/`. To edit an existing app or add a new one, work within this directory, following the same per-app subfolder pattern used by the existing apps.
- **Window manager & lifecycle:** The logic for the launcher and for managing app windows (creation, dragging, resizing, lifecycle) is centralized in `stuff.js`. This is the file to look at if you need to change how windows behave.
- **Styling:** Styling is split across a couple of layers:
  - Global, site-wide styling lives in `style.css`.
  - Per-app styling can either be shared across apps via `src/apps/apps.css`, or defined inline within each individual app's HTML file.
- **TypeScript/React (Terminal):** The Terminal app is the one exception to the "plain HTML/JS" pattern used elsewhere — its source lives in `src/apps/terminal/terminal.tsx` and is written in TypeScript/React. If you make changes to this file, remember to run your usual type-checking and build process before it will be reflected correctly, since it isn't just a static HTML file like the other apps.

## Problems We Faced

Some honest notes on pain points encountered during development, kept here for future reference (and to save future contributors some head-scratching):

- **Path issues:** File paths caused a significant number of problems throughout development. Things would sometimes glitch out seemingly for no discernible reason, which suggests there may be inconsistencies in how relative vs. absolute paths are handled between the launcher, the window manager, and the individual app files.
- **Button overlap:** In certain places, buttons on the UI overlapped with one another. The root cause hasn't been fully identified yet, but it's suspected to be an alignment/layout issue (likely CSS positioning or flex/grid related) rather than a functional bug.
- **Pacing:** Development pacing was inconsistent — there was a fair amount of procrastination along the way, which is worth keeping in mind when estimating timelines for future work on this project.

## License

This repository includes a `LICENSE` file. Please refer to that file directly for the exact terms governing use, modification, and distribution of this project.
