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
clip1a = video1.subclipped(23, 107)

# Resize the video clip
if clip1a.size[0]/clip1a.size[1] == 16/9:
    clip1a = clip1a.resized((1920, 1080))
else:
    clip1a = clip1a.with_position("center", "center")

# Extract a subclip from the video
clip1b = video1.subclipped(121, 141)

# Resize the video clip
if clip1b.size[0]/clip1b.size[1] == 16/9:
    clip1b = clip1b.resized((1920, 1080))
else:
    clip1b = clip1b.with_position("center", "center")


# Load the text clip, to apply new effects
textDebut = moviepy.TextClip(text="Voici la vidéo de présentation d'un nouveau drone", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            

# Load the text clip, to apply new effects
textFin = moviepy.TextClip(text="Merci d'avoir regardé cette vidéo", bg_color="black", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            

# Load the text clip, to apply new effects
s1 = moviepy.TextClip(text="sous titre 1", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            

# Load the text clip, to apply new effects
s2 = moviepy.TextClip(text="sous titre 2", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            

# Load the text clip, to apply new effects
s3 = moviepy.TextClip(text="le deuxième extrait de clip arrive dans 5 secondes...", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            
timeline_element_1 = textDebut.with_duration(10)
timeline_element_2 = clip1a.with_start(timeline_element_1.end)
timeline_element_3 = s1.with_start(timeline_element_2.start).with_duration(10)
timeline_element_4 = s2.with_start(timeline_element_3.start + 30).with_duration(10)
timeline_element_5 = clip1b.with_start(timeline_element_2.end)
timeline_element_6 = s3.with_start(timeline_element_5.start - 5).with_duration(15)
timeline_element_7 = textFin.with_start(timeline_element_6.end).with_duration(15)
# Concatenate all clips
final_video = moviepy.CompositeVideoClip([timeline_element_1, timeline_element_2, timeline_element_3, timeline_element_4, timeline_element_5, timeline_element_6, timeline_element_7])

# Export the final video
final_video.write_videofile("resultat_scenario_2.mp4")
