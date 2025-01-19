import { CompositeGeneratorNode, NL } from "langium/generate";
import { TextualElement, GroupOptionText, TextOption, isTextFont, isTextFontColor, isTextFontSize, isVisualElementBackground, isVisualElementPosition, isVisualElementSizePixels, isText, isVisualElementPositionCoordinates, isVisualElementPositionAlignment, isSubtitle } from "../language-server/generated/ast.js";

export function populateTextualElements(textualElements: TextualElement[], groupTextOptions: GroupOptionText[]): TextualElement[] {
    return textualElements.map((text) => {
        const relatedGroupOptions = groupTextOptions.filter((groupOption) => groupOption.elements.some((element) => element.ref?.name === text.name));

        // This list can have duplicates
        const mergedOptions = [
            ...(text.options || []), // Video options
            ...relatedGroupOptions.map((groupOption) => groupOption.options).flat(), // Group options
        ];

        // This map filters the duplicates (video option applied when declaring the video are prioritized)
        const uniqueOptionMap = mergedOptions.reduce((acc, option) => {
            // Check if the option is already in the list
            if (acc.has(option.$type)) {
                return acc;
            }

            // Add the option to the list
            acc.set(option.$type, option);
            return acc;
        }, new Map<string, TextOption>());

        // Map to array and sort for some special cases
        text.options = Array.from(uniqueOptionMap.values()).sort((a, b) => {
            const order = ['VisualElementSize', 'VisualElementPosition'];
            return order.indexOf(a.$type) - order.indexOf(b.$type);
        });

        return text;
    });
}

export function compileTextualElement(text: TextualElement, fileNode: CompositeGeneratorNode) {
        fileNode.append(
            `
# Load the text clip, to apply new effects
${text.name} = moviepy.TextClip(${compileOptionsToTextClip(text)})
            `, NL);
}

function compileOptionsToTextClip(text: TextualElement): string {
    let bgColor = 'no';
    let bgSizeX = 1920;
    let bgSizeY = 1080;

    let font = fontDependingOnOS();
    
    let fontSize = 60;
    let fontColor = 'white';
    let posX: number | string = `"center"`;
    let posY: number | string = `"center"`;

    const applyOption = (option: TextOption) => {
        if (isTextFont(option)) {
            font = fontDependingOnOS(option.name); 
        } 
        else if (isTextFontSize(option)) {
            fontSize = option.size;
        } else if (isTextFontColor(option)) {
            fontColor = option.color;
        } else if (isVisualElementBackground(option)) {
            bgColor = option.color;
        } else if (isVisualElementSizePixels(option)) {
            if(option.width && option.height){
                bgSizeX = option.width;
                bgSizeY = option.height;
            }
        } else if (isVisualElementPosition(option) && isText(text)) {
            if (isVisualElementPositionCoordinates(option)) {
                if(option.x)
                    posX = option.x;
                if(option.y)
                    posY = option.y;
            } else if (isVisualElementPositionAlignment(option)) {
                // Rmove \" from alignmentX and alignmentY
                option.alignmentX = option.alignmentX?.replace(/"/g, '');
                option.alignmentY = option.alignmentY?.replace(/"/g, '');
                if(option.alignmentX){
                    if(option.alignmentX === 'center'){
                        posX = `"center"`;
                    }
                    if(option.alignmentX === 'left'){
                        posX = 0;
                    }
                    if(option.alignmentX === 'right'){
                        posX = 1920 - bgSizeX;
                    }
                }
                if(option.alignmentY){
                    if(option.alignmentY === 'center'){
                        posY = `"center"`;
                    }
                    if(option.alignmentY === 'top'){
                        posY = 0;
                    }
                    if(option.alignmentY === 'bottom'){
                        posY = 1080 - bgSizeY;
                    }
                }
            }
        }
    };
    
    text.options.forEach(applyOption);
    
    if (isSubtitle(text)) {
        posY = 400;
        posX = `"center"`
    }
    
    const optionsString = `
        text="${text.text}",
        ${bgColor !== 'no' ? `bg_color="${bgColor}",` : ''}
        font="${font}",
        font_size=${fontSize},
        color="${fontColor}",
        size=(${bgSizeX}, ${bgSizeY}))
    `.trim().replace(/\s+/g, ' ');
    
    return `${optionsString}.with_position((${posX}, ${posY})`;
}
    
function fontDependingOnOS(font?: string) {
    const platform = navigator.userAgent || "unknown";
    if (platform.toLowerCase().includes('win')) {
        if (font) {
            return `C:/Windows/Fonts/${font}.ttf`;
        } 
        return 'C:/Windows/Fonts/Arial.ttf';
    } 
    else {
        if (font) {
            return `${font}`;
        }
        return 'Arial';
    }
}
    