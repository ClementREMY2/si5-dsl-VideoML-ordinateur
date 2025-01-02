import shell from 'shelljs'

// copy workers to public
shell.mkdir('-p', './web-ui/public/monaco-editor-wrapper/dist/workers');
shell.cp('-fr', './web-ui/node_modules/monaco-editor-wrapper/dist/workers/editorWorker-es.js', './web-ui/public/monaco-editor-wrapper/dist/workers/editorWorker-es.js');
