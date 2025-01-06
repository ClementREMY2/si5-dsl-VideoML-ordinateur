import shell from 'shelljs'

// copy libs to ui libs
// Types for TimelineElementInfo
shell.mkdir('-p', './ui/lib/generated/generator');
shell.cp('-fr', './src/generator/ui/types.ts', './ui/lib/generated/generator/types.ts');

// Special validator
shell.mkdir('-p', './ui/lib/generated/validators');
shell.cp('-fr', './src/language-server/validators/special-validators.ts', './ui/lib/generated/validators/special-validators.ts');

console.log('Copy libs to ui done.');