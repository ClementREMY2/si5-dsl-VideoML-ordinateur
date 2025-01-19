import moviepy

# Load the video clip original
video1 = moviepy.VideoFileClip("/Users/clrem/OneDrive/Documents/Travail/5A/S9.2/Ingenierie_Modele_Langages_Specifiques_Domaines/si5-dsl-VideoML-ordinateur/VideoML/scenarios/basics/Scenario2/video_drone.mp4")

# Resize the video clip
if video1.size[0] / video1.size[1] == 16/9:
    video1 = video1.resized((1920, 1080))
else:
    if video1.size[0] / video1.size[1] > 1:
        video1 = video1.resized(width=1920)
    else:
        video1 = video1.resized(height=1080)
    video1 = video1.with_position("center", "center")
    
# Extract a subclip from the video
videoNormal = video1.subclipped(20, 30)

# Resize the video clip
if videoNormal.size[0]/videoNormal.size[1] == 16/9:
    videoNormal = videoNormal.resized((1920, 1080))
else:
    videoNormal = videoNormal.with_position("center", "center")

# Extract a subclip from the video
videoSaturation = video1.subclipped(20, 30)

# Resize the video clip
if videoSaturation.size[0]/videoSaturation.size[1] == 16/9:
    videoSaturation = videoSaturation.resized((1920, 1080))
else:
    videoSaturation = videoSaturation.with_position("center", "center")

# Apply saturation effect
painting_effect = moviepy.video.fx.Painting(saturation=3, black=0.0)
videoSaturation = painting_effect.apply(videoSaturation)
# Extract a subclip from the video
videoContrast = video1.subclipped(20, 30)

# Resize the video clip
if videoContrast.size[0]/videoContrast.size[1] == 16/9:
    videoContrast = videoContrast.resized((1920, 1080))
else:
    videoContrast = videoContrast.with_position("center", "center")

# Apply contrast effect
lum_contrast_effect = moviepy.video.fx.LumContrast(lum=20, contrast=5, contrast_threshold=127)
videoContrast = lum_contrast_effect.apply(videoContrast)
# Extract a subclip from the video
videoBrightnessAndScale = video1.subclipped(20, 30)

# Resize the video clip
if videoBrightnessAndScale.size[0]/videoBrightnessAndScale.size[1] == 16/9:
    videoBrightnessAndScale = videoBrightnessAndScale.resized((1920, 1080))
else:
    videoBrightnessAndScale = videoBrightnessAndScale.with_position("center", "center")

# Apply brightness effect
multiply_effect = moviepy.video.fx.MultiplyColor(factor=2)
videoBrightnessAndScale = multiply_effect.apply(videoBrightnessAndScale)
# Apply resolution effect
resize_effect = moviepy.video.fx.Resize(0.5)
videoBrightnessAndScale = resize_effect.apply(videoBrightnessAndScale)
# Apply position effect
videoBrightnessAndScale = videoBrightnessAndScale.with_position(('center','center'))
# Extract a subclip from the video
videoOpacity = video1.subclipped(20, 30)

# Resize the video clip
if videoOpacity.size[0]/videoOpacity.size[1] == 16/9:
    videoOpacity = videoOpacity.resized((1920, 1080))
else:
    videoOpacity = videoOpacity.with_position("center", "center")

# Apply opacity effect
videoOpacity = videoOpacity.with_opacity(0.5)

# Load the text clip, to apply new effects
st0 = moviepy.TextClip(text="Voici la vidéo normale!", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            

# Load the text clip, to apply new effects
st1 = moviepy.TextClip(text="Voici la vidéo saturée!", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            

# Load the text clip, to apply new effects
st2 = moviepy.TextClip(text="Voici la vidéo contrastée!", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            

# Load the text clip, to apply new effects
st3 = moviepy.TextClip(text="Voici la vidéo réduite, et plus lumineuse!", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            

# Load the text clip, to apply new effects
st4 = moviepy.TextClip(text="Voici la vidéo moins opaque!", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            
timeline_element_1 = videoNormal
timeline_element_2 = videoSaturation.with_start(timeline_element_1.end)
timeline_element_3 = videoContrast.with_start(timeline_element_2.end)
timeline_element_4 = videoBrightnessAndScale.with_start(timeline_element_3.end)
timeline_element_5 = videoOpacity.with_start(timeline_element_4.end)
timeline_element_7 = st0.with_start(timeline_element_1.start).with_duration(10)
timeline_element_8 = st1.with_start(timeline_element_2.start).with_duration(10)
timeline_element_9 = st2.with_start(timeline_element_3.start).with_duration(10)
timeline_element_10 = st3.with_start(timeline_element_4.start).with_duration(10)
timeline_element_11 = st4.with_start(timeline_element_5.start).with_duration(10)
# Concatenate all clips
final_video = moviepy.CompositeVideoClip([timeline_element_1, timeline_element_2, timeline_element_3, timeline_element_4, timeline_element_5, timeline_element_7, timeline_element_8, timeline_element_9, timeline_element_10, timeline_element_11], size=(1920, 1080))

# Export the final video
final_video.write_videofile("resultat_scenario_options_videos.mp4")
