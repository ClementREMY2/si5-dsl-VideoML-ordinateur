import { CompositeGeneratorNode, NL } from "langium/generate";
import { TextualElement, GroupOptionText, TextOption, isTextAligment, isTextFont, isTextFontColor, isTextFontSize, isVisualElementBackground, isVisualElementPosition, isVisualElementSize, isTextEffect } from "../language-server/generated/ast.js";

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
${text.name} = moviepy.TextClip(${compileOptionsToTextClip(text)}
            `, NL);
}

let alreadyTextEffectCompiled = false;
let alreadyFallingTextEffectCompiled = false;
let alreadyGroupingTextEffectCompiled = false;

function compileOptionsToTextClip(text: TextualElement): string {
    let bgColor = 'no';
    let bgSizeX = 1920;
    let bgSizeY = 1080;

    let font = fontDependingOnOS();
    
    let fontSize = 60;
    let fontColor = 'white';
    let align = 'left';
    let posX: number | string = `"center"`;
    let posY: number | string = `"center"`;
    let effect = false;

    const applyOption = (option: TextOption) => {
        if (isTextEffect(option)) {
            effect = true;
        }
        if (isTextFont(option)) {
            font = fontDependingOnOS(option.name); 
        } 
        else if (isTextFontSize(option)) {
            fontSize = option.size;
        } else if (isTextAligment(option)) {
            align = option.alignment;
        } else if (isTextFontColor(option)) {
            fontColor = option.color;
        } else if (isVisualElementBackground(option)) {
            bgColor = option.color;
        } else if (isVisualElementSize(option)) {
            if(option.width && option.height){
                bgSizeX = option.width;
                bgSizeY = option.height;
            }
        } else if (isVisualElementPosition(option) && text.type === 'text') {
            if(option.x)
                posX = option.x;
            if(option.y)
                posY = option.y;
            if(option.alignmentx){
                if(option.alignmentx === 'center'){
                    posX = `"center"`;
                }
                if(option.alignmentx === 'left'){
                    posX = 0;
                }
                if(option.alignmentx === 'right'){
                    posX = 1920 - bgSizeX;
                }
            }
            if(option.alignmenty){
                if(option.alignmenty === 'center'){
                    posY = `"center"`;
                }
                if(option.alignmenty === 'top'){
                    posY = 0;
                }
                if(option.alignmenty === 'bottom'){
                    posY = 1080 - bgSizeY;
                }
            }
        }
    };

    text.options?.forEach(applyOption);

    if (text.type === 'subtitle') {
        posY = 400;
        posX = `"center"`;
    }

    let optionsString = `
        text="${text.text}",
        ${bgColor !== 'no' ? `bg_color="${bgColor}",` : ''}
        font="${font}",
        font_size=${fontSize},
        color="${fontColor}",
        text_align="${align}",
        size=(${bgSizeX}, ${bgSizeY}))
    `.trim().replace(/\s+/g, ' ');

    if (effect === false) {
        return `${optionsString}.with_position((${posX}, ${posY}))`;
    }

    let effectText;
    let boolEffect = false;

    text.options?.forEach(option => {
        if (isTextEffect(option)) {
            effectText = option.type;
            boolEffect = true;
            if (alreadyTextEffectCompiled === false) {
            optionsString += `
import numpy as np
from scipy.ndimage import label, find_objects

def find_objects_custom(mask):
    from scipy.ndimage import label, find_objects

    labeled_array, num_features = label(mask)

    object_slices = find_objects(labeled_array)

    return object_slices


screensize = (1920, 1080)
cvc = moviepy.CompositeVideoClip( [${text.name}.with_position('center')], size = screensize)

rotMatrix = lambda a: np.array( [[np.cos(a), np.sin(a)], [-np.sin(a), np.cos(a)]] )
`}};})

if (effectText === 'grouping' && alreadyGroupingTextEffectCompiled === false) {
    optionsString += `
def grouping(screenpos, i, nletters):
    d = lambda t : 1.0/(0.3 + t**8)
    a = i * np.pi / nletters 
    v = rotMatrix(a).dot([-1, 0])
     
    if i % 2 : v[1] = -v[1]
         
    return lambda t: screenpos + 400 * d(t)*rotMatrix(0.5 * d(t)*a).dot(v)
`
    alreadyGroupingTextEffectCompiled = true;
}

else if (effectText === 'falling' && alreadyFallingTextEffectCompiled === false) {
    optionsString += `
def falling(screenpos, i, nletters):
    v = np.array([0, -1])
     
    d = lambda t : 1 if t<0 else abs(np.sinc(t)/(1 + t**4))
     
    return lambda t: screenpos + v * 400 * d(t-0.15 * i)
`
    alreadyFallingTextEffectCompiled = true;
}

if (boolEffect && alreadyTextEffectCompiled === false) {
optionsString += `
binary_mask = title1.mask.get_frame(0)
letters = find_objects_custom(binary_mask)

if not letters:
    print("Aucun objet trouvé dans le masque binaire.")
else:
    print(f"{len(letters)} objets trouvés dans le masque.")

def moveLetters(letters, funcpos, original_clip):
    animated_letters = []
    for i, letter_slice in enumerate(letters):
        # Créer un sous-clip pour chaque lettre
        x_min, x_max = letter_slice[1].start, letter_slice[1].stop
        y_min, y_max = letter_slice[0].start, letter_slice[0].stop
        
        cropped_letter = original_clip.cropped(x1=x_min, x2=x_max, y1=y_min, y2=y_max)

        # Appliquer la position animée
        animated_letter = cropped_letter.with_position(funcpos((x_min, y_min), i, len(letters)))
        animated_letters.append(animated_letter)
    
    return animated_letters

animated_letters = moveLetters(letters, ${effectText}, title1)

${text.name} = moviepy.CompositeVideoClip( animated_letters, size = screensize).subclipped(0, 5).with_position((${posX}, ${posY}))
`
    alreadyTextEffectCompiled = true;
}
    return optionsString;
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
};
    