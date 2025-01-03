import shell from 'shelljs'

// copy types to ui sources
shell.mkdir('-p', './ui/src/lib/generated/generator');
shell.cp('-fr', './src/generator/ui/types.ts', './ui/src/lib/generated/generator/types.ts');
