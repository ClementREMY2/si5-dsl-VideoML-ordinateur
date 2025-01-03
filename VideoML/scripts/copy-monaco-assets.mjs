import shell from 'shelljs'

// copy workers to public
shell.mkdir('-p', './ui/public/monaco-editor-wrapper/dist/workers');
shell.cp('-fr', './ui/node_modules/monaco-editor-wrapper/dist/workers/editorWorker-es.js', './ui/public/monaco-editor-wrapper/dist/workers/editorWorker-es.js');
