import moviepy

# Load the video clip original
video1 = moviepy.VideoFileClip("/Users/clrem/OneDrive/Documents/Travail/5A/S9.2/Ingenierie_Modele_Langages_Specifiques_Domaines/si5-dsl-VideoML-ordinateur/VideoML/scenarios/extensions/Transitions_Stacking/video_principale.mp4")

# Resize the video clip
if video1.size[0] / video1.size[1] == 16/9:
    video1 = video1.resized((1920, 1080))
else:
    if video1.size[0] / video1.size[1] > 1:
        video1 = video1.resized(width=1920)
    else:
        video1 = video1.resized(height=1080)
    video1 = video1.with_position("center", "center")
    
# Load the video clip original
webcam = moviepy.VideoFileClip("/Users/clrem/OneDrive/Documents/Travail/5A/S9.2/Ingenierie_Modele_Langages_Specifiques_Domaines/si5-dsl-VideoML-ordinateur/VideoML/scenarios/extensions/Transitions_Stacking/webcam.mp4")

# Resize the video clip
if webcam.size[0] / webcam.size[1] == 16/9:
    webcam = webcam.resized((1920, 1080))
else:
    if webcam.size[0] / webcam.size[1] > 1:
        webcam = webcam.resized(width=1920)
    else:
        webcam = webcam.resized(height=1080)
    webcam = webcam.with_position("center", "center")
    
# Apply fade in effect
fade_in = moviepy.video.fx.CrossFadeIn(1)
webcam = fade_in.apply(webcam)
# Apply fade out effect
fade_out = moviepy.video.fx.CrossFadeOut(1)
webcam = fade_out.apply(webcam)
# Apply resolution effect
webcam = webcam.resized((640,480))
# Apply position effect
webcam = webcam.with_position((0,600))

# Load the text clip, to apply new effects
text1 = moviepy.TextClip(text="l'autre droite...", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            
timeline_element_1 = video1
timeline_element_2 = webcam.with_start(timeline_element_1.start + 2)
timeline_element_3 = text1.with_start(timeline_element_2.start + 7).with_duration(5)
# Concatenate all clips
final_video = moviepy.CompositeVideoClip([timeline_element_1, timeline_element_2, timeline_element_3], size=(1920, 1080))

# Export the final video
final_video.write_videofile("resultat_scenario_transition.mp4")
