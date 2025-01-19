# VideoML

#### Team Ordinateur
Membres : 
  - Arnaud AVOCAT GROS
  - Alexis MALOSSE
  - Clément REMY
  - Samuel BOIS

### Features à la carte choisies : 
  - Support for Audio
  - Support for stacking and transitions between clips

### Add-on : 
Application de bureau Electron intégrant l'éditeur de code avec validateur, affichage de d'une timeline visuelle et génération de vidéo.

## What's in the folder

This folder contains all necessary files for our VideoML language.
 * `src/language-server/video-ml.langium` -  the grammar definition out VideoML langauge.
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
 * Go back in `VideoML` folder and run `npm run build:ui` to build the UI.
 * Go in the `ui` folder and run `npm run dev` to start the UI, it should open a new window with the UI loaded.
