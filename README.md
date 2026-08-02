# BrOS

BrOs is a WebOS project developed by two Bros! The project was made for Hack club Macondo using HTML, CSS and Java Script.
## Table of Contents
- [BrOS](#bros)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
    - [Launcher UI](#launcher-ui)
    - [Apps](#apps)
  - [Window Manager](#window-manager)
  - [Calculator (HM)](#calculator-hm)
  - [How Apps Launch](#how-apps-launch)
  - [Quick start (serve locally)](#quick-start-serve-locally)
  - [Developer Notes](#developer-notes)
  - [Problems We Faced](#problems-we-faced)

## Features

### Launcher UI
The main homepage lives at `bros.html`. 

### Apps
All of the individual mini apps live under the `src/apps/` directory, with each app kept in its own subfolder. The apps currently included are:

- **Calc — Calculator**
  Located at `src/apps/hm/hm.html`. A basic calculator app styled to resemble a phone calculator, with rounded buttons and a wide "0" key. See the [Calculator (HM)](#calculator-hm) section below for more detail.

- **Terminal**
  Located at `src/apps/terminal/terminal.html`. A browser-based terminal emulator/app. Unlike the other apps, this one has TypeScript/React source code behind it (`src/apps/terminal/terminal.tsx`), meaning changes to it need to go through a build/type-check step rather than being edited directly as plain HTML/JS.

- **Notes**
  Located at `src/apps/notlar/notlar.html`. A simple notes-taking app ("Notlar" is Turkish for "Notes").

- **Clicker**
  Located at `src/apps/click/click.html`. A small game inspired by cookie clicker.

- **Gym**
  Located at `src/apps/gym/gym.html`. Contains workout guides — likely static informational content about exercises/routines.

- **News**
  Located at `src/apps/haber/haber.html`. News-related pages ("Haber" is Turkish for "News").

Each of these apps is a self-contained page that gets loaded inside its own window when launched from the home screen, rather than being embedded directly into `bros.html`.

## Window Manager

The window manager is the core piece of infrastructure that makes BrOS feel like a desktop rather than a plain webpage. It lives in `stuff.js` and is responsible for:

- Creating new "windows" (essentially styled `<div>` containers) when an app is launched.
- Making those windows **draggable**, so the user can move them around the screen freely.
- Making those windows **resizable**, so the user can adjust their size to fit their needs. A small light appears when you're able to resize the window. Look out for that sign to resize
- Managing the lifecycle of each window/app instance — opening, focusing, and presumably closing them.

Each app runs inside an **iframe** embedded within its window. This means every app is sandboxed to its own iframe context, isolating it from the rest of the page and from other open apps. This sandboxing approach is also what allows apps written in different ways (plain HTML/JS apps vs. the React/TypeScript terminal) to coexist without interfering with one another.

## Calculator (HM)

The calculator app deserves its own callout since it's one of the more polished pieces of the project:

- **File:** `src/apps/hm/hm.html`
- **Design:** The layout is responsive and intentionally styled to resemble a phone calculator — rounded buttons and a wide zero ("0") key, similar to what you'd see on a mobile device's built-in calculator app.

## How Apps Launch

The launching mechanism ties the home screen UI together with the window manager:

- Each launchable app is represented by a button in `bros.html`.
- Every one of these buttons carries a `data-app-url` attribute, which points to the HTML file of the app it should open (e.g., pointing to `src/apps/hm/hm.html` for the calculator).
- `stuff.js` sets up an event listener that watches for clicks on any element with a `data-app-url` attribute.
- When such a click is detected, `stuff.js` calls `launchAppWindow(url, title, appId)`, passing in:
   * `url` — the app's URL (from `data-app-url`)
   * `title` — the title to display on the window
   * `appId` — an identifier for the app/window instance
- `launchAppWindow` then creates a new draggable/resizable window and loads the given URL inside an iframe within that window, sandboxing the app to that iframe as described above.

## Quick start (serve locally)
Serve the project root and open bros.html in your browser.

- With Node (http-server):
```
npm install -g http-server
http-server . -p 3000
# then open http://localhost:3000/bros.html
```

- With Python:
```
python3 -m http.server 8000
# then open http://localhost:8000/bros.html
```

Opening bros.html is enough — click app buttons to launch apps in windows.
İf you're using VsCode you can download the `Live Server` extension for easier use and testing. 
We will keep up the demo site on Netlify until Macondo ends so you can look there too. 

## Developer Notes

A few notes for anyone that want to see our code:

- **App location:** All apps have their own folder inside `src`. you can make delete or create folders there and make new apps.
- **Window manager & lifecycle:** Pretty much all functions live `stuff.js`. So if you want to make any changes you can do them there.
- **Styling:** Styling is divided into independent files inside every app folder. You can edit the contents there.
- **Easter Eggs** We hidden a few easter eggs across the side. Hope you find all of them >:3

## Problems We Faced

Some honest notes on pain points encountered during development, kept here for future reference (and to save future contributors some head-scratching):

- **Path issues:** File paths caused a significant number of problems throughout development. Things would sometimes glitch out seemingly for no discernible reason, which suggests there may be inconsistencies in how relative vs. absolute paths are handled between the launcher, the window manager, and the individual app files.
- **Button overlap:** In certain places, buttons on the UI overlapped with one another. The root cause hasn't been fully identified yet, but it's suspected to be an alignment/layout issue (likely CSS positioning or flex/grid related) rather than a functional bug.
- **Pacing:** Development pacing was inconsistent — there was a fair amount of procrastination along the way, which is worth keeping in mind when estimating timelines for future work on this project.
