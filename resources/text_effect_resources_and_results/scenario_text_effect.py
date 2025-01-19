import moviepy

# Load the video clip original
video1 = moviepy.VideoFileClip("/Users/samue/Downloads/video1.mp4")

# Resize the video clip
if video1.size[0] / video1.size[1] == 16/9:
    video1 = video1.resized((1920, 1080))
else:
    if video1.size[0] / video1.size[1] > 1:
        video1 = video1.resized(width=1920)
    else:
        video1 = video1.resized(height=1080)
    video1 = video1.with_position("center", "center")
    
# Apply fade in effect
fade_in = moviepy.video.fx.CrossFadeIn(1)
video1 = fade_in.apply(video1)
# Apply fade out effect
fade_out = moviepy.video.fx.CrossFadeOut(1)
video1 = fade_out.apply(video1)

# Load the text clip, to apply new effects
title1 = moviepy.TextClip(text="Bonjour !!!", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080))
import numpy as np
from scipy.ndimage import label, find_objects

def find_objects_custom(mask):
    from scipy.ndimage import label, find_objects

    labeled_array, num_features = label(mask)

    object_slices = find_objects(labeled_array)

    return object_slices


screensize = (1920, 1080)
cvc = moviepy.CompositeVideoClip( [title1.with_position('center')], size = screensize)

rotMatrix = lambda a: np.array( [[np.cos(a), np.sin(a)], [-np.sin(a), np.cos(a)]] )

def grouping(screenpos, i, nletters):
    d = lambda t : 1.0/(0.3 + t**8)
    a = i * np.pi / nletters 
    v = rotMatrix(a).dot([-1, 0])
     
    if i % 2 : v[1] = -v[1]
         
    return lambda t: screenpos + 400 * d(t)*rotMatrix(0.5 * d(t)*a).dot(v)

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

animated_letters = moveLetters(letters, grouping, title1)

title1 = moviepy.CompositeVideoClip( animated_letters, size = screensize).subclipped(0, 5).with_position(("center", "center"))

            
timeline_element_1 = title1.with_duration(5)
timeline_element_2 = video1.with_start(4)
# Concatenate all clips
final_video = moviepy.CompositeVideoClip([timeline_element_1, timeline_element_2], size=(1920, 1080))

# Export the final video
final_video.write_videofile("output.mp4")