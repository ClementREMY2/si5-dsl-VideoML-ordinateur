import moviepy

# Load the video clip original
video1 = moviepy.VideoFileClip("/Users/clrem/OneDrive/Documents/Travail/5A/S9.2/Ingenierie_Modele_Langages_Specifiques_Domaines/si5-dsl-VideoML-ordinateur/VideoML/scenarios/basics/Scenario1/video_italie_1.mp4")

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
video2 = moviepy.VideoFileClip("/Users/clrem/OneDrive/Documents/Travail/5A/S9.2/Ingenierie_Modele_Langages_Specifiques_Domaines/si5-dsl-VideoML-ordinateur/VideoML/scenarios/basics/Scenario1/video_italie_2.mp4")

# Resize the video clip
if video2.size[0] / video2.size[1] == 16/9:
    video2 = video2.resized((1920, 1080))
else:
    if video2.size[0] / video2.size[1] > 1:
        video2 = video2.resized(width=1920)
    else:
        video2 = video2.resized(height=1080)
    video2 = video2.with_position("center", "center")
    

# Load the text clip, to apply new effects
textDebut = moviepy.TextClip(text="Nous étions en vacances en Italie! :)", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            

# Load the text clip, to apply new effects
textFin = moviepy.TextClip(text="Merci d'avoir regardé nos vidéos de vacances! :)", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            
timeline_element_1 = textDebut.with_duration(10)
timeline_element_2 = video1.with_start(timeline_element_1.end)
timeline_element_3 = video2.with_start(timeline_element_2.end)
timeline_element_4 = textFin.with_start(timeline_element_3.end).with_duration(15)
# Concatenate all clips
final_video = moviepy.CompositeVideoClip([timeline_element_1, timeline_element_2, timeline_element_3, timeline_element_4])

# Export the final video
final_video.write_videofile("resultat_scenario_1.mp4")
