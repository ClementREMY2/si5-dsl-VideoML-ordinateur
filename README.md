# VideoML

#### Team Ordinateur
Members : 
  - Arnaud AVOCAT GROS
  - Alexis MALOSSE
  - Clément REMY
  - Samuel BOIS

### Features "à la carte" implemented : 
  - Support for Audio
  - Support for stacking and transitions between clips

### Add-on : 
Desktop application, made with Electron, featuring code editor with validator, visual timeline display and video generation.

### Prerequisites

If you want to use the project, you'll need at least :
- Python 3 executable on your machine (accessible via the command "python3" on Linux/macOS and "py" on Windows)
- Node, version 18 or higher

## What's in the folder

This folder contains all necessary files for our VideoML language.
 * `src/language-server/video-ml.langium` -  the grammar definition our VideoML langauge.
 * `src/language-server/main-browser.ts` - the entry point of the language server process (used as Web Worker in the browser).
 * `src/language-server/video-ml-module.ts` - the dependency injection module of our language implementation.
 * `src/language-server/video-ml-validator.ts` - our custom validator implementation.
 * `src/generator/generator.ts` - the code generator used by the server to generate Python moviepy code.
 * `ui/` - contains the UI implementation using Electron, React and Monaco editor.

## Get up and running straight away

 * Run `npm i` to install Langium.
 * Run `npm run langium:generate` to generate TypeScript code from the grammar definition.
 * Run `npm run build` to compile all TypeScript code.

 ## Run the UI

 * Go in the `ui` folder and run `npm i` to install the dependencies.
 * Go back in the root folder and run `npm run build:ui` to build the UI.
 * Go in the `ui` folder and run `npm run dev` to start the UI, it should open a new window with the UI loaded.
