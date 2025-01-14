# Welcome to the VideoML VS Code Extension

## What's in the folder

This folder contains all necessary files for your language extension.
 * `package.json` - the manifest file in which you declare your language support.
 * `language-configuration.json` - the language configuration used in the VS Code editor, defining the tokens that are used for comments and brackets.
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

## Make changes

 * Run `npm run watch` to have the TypeScript compiler run automatically after every change of the source files.
 * Run `npm run langium:watch` to have the Langium generator run automatically afer every change of the grammar declaration.
 * You can relaunch the extension from the debug toolbar after making changes to the files listed above.
 * You can also reload (`Ctrl+R` or `Cmd+R` on Mac) the VS Code window with your extension to load your changes.

## Install your extension

* To start using your extension with VS Code, copy it into the `<user home>/.vscode/extensions` folder and restart Code.
* To share your extension with the world, read the [VS Code documentation](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) about publishing an extension.

## To Go Further

Documentation about the Langium framework is available at https://langium.org
