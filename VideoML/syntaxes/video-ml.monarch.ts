// Monarch syntax highlighting for the video-ml language.
export default {
    keywords: [
        'add','as','at','by','delayed','end','in','layer','load','of','project','start','timeline','to','video'
    ],
    operators: [
        '+'
    ],
    symbols: /\+/,

    tokenizer: {
        initial: [
            { regex: /[_a-zA-Z][\w_]*/, action: { cases: { '@keywords': {"token":"keyword"}, '@default': {"token":"ID"} }} },
            { regex: /[-+][0-5][0-9]:[0-5][0-9]/, action: {"token":"string"} },
            { regex: /[0-5][0-9]:[0-5][0-9]/, action: {"token":"string"} },
            { regex: /[0-9]+/, action: {"token":"number"} },
            { regex: /"[^"]*"|'[^']*'/, action: {"token":"string"} },
            { include: '@whitespace' },
            { regex: /@symbols/, action: { cases: { '@operators': {"token":"operator"}, '@default': {"token":""} }} },
        ],
        whitespace: [
            { regex: /\s+/, action: {"token":"white"} },
            { regex: /\/\*/, action: {"token":"comment","next":"@comment"} },
            { regex: /\/\/[^\n\r]*/, action: {"token":"comment"} },
        ],
        comment: [
            { regex: /[^/\*]+/, action: {"token":"comment"} },
            { regex: /\*\//, action: {"token":"comment","next":"@pop"} },
            { regex: /[/\*]/, action: {"token":"comment"} },
        ],
    }
};
