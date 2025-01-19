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
Faire une interface web (ou autre) ou on a un éditeur de texte (avec la validateur) pour écrire un programme dans notre langage et au dessus on à une timeline qui est affiché avec tous les blocs (clips, audios, texte, sous titres…) pour voir ce qu’on fait en direct

## What's in the folder

This folder contains all necessary files for our VideoML language.
 * `src/language-server/video-ml.langium` -  the grammar definition of your language.
 * `src/language-server/main.ts` - the entry point of the language server process.
 * `src/language-server/video-ml-module.ts` - the dependency injection module of your language implementation. Use this to register overridden and added services.
 * `src/language-server/video-ml-validator.ts` - an example validator. You should change it to reflect the semantics of your language.
 * `src/cli/generator.ts` - the code generator used by the CLI to write output files from DSL documents.
 * `ui/` - contains the UI implementation using Electron, React and Monaco editor.

## Get up and running straight away

 * Run `npm i` to install Langium.
 * Run `npm run langium:generate` to generate TypeScript code from the grammar definition.
 * Run `npm run build` to compile all TypeScript code.

 ## Run the UI

 * Go in the `ui` folder and run `npm i` to install the dependencies.
 * Go back in `VideoML` folder and run `npm run build:ui` to build the UI.
 * Go in the `ui` folder and run `npm run dev` to start the UI, it should open a new window with the UI loaded.
