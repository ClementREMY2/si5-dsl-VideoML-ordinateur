import moviepy

# Load the video clip original
video1 = moviepy.VideoFileClip("/Users/clrem/OneDrive/Documents/Travail/5A/S9.2/Ingenierie_Modele_Langages_Specifiques_Domaines/si5-dsl-VideoML-ordinateur/VideoML/scenarios/other/TextOption/VideoTextOption.mp4")

# Resize the video clip
if video1.size[0] / video1.size[1] == 16/9:
    video1 = video1.resized((1920, 1080))
else:
    if video1.size[0] / video1.size[1] > 1:
        video1 = video1.resized(width=1920)
    else:
        video1 = video1.resized(height=1080)
    video1 = video1.with_position("center", "center")
    

# Load the text clip, to apply new effects
t1 = moviepy.TextClip(text="Bienvenue dans cette vidéo!", bg_color="red", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            

# Load the text clip, to apply new effects
t2 = moviepy.TextClip(text="Je vais essayer différentes options de texte, comme de réduire celui-ci", bg_color="red", font="C:/Windows/Fonts/Arial.ttf", font_size=40, color="white", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            

# Load the text clip, to apply new effects
t3 = moviepy.TextClip(text="... et de lui mettre une autre couleur, en changeant celle du fond également...", bg_color="blue", font="C:/Windows/Fonts/Arial.ttf", font_size=40, color="yellow", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            

# Load the text clip, to apply new effects
t4 = moviepy.TextClip(text="bien, voyons ce que ça donne sur une vidéo!", bg_color="blue", font="C:/Windows/Fonts/Arial.ttf", font_size=40, color="yellow", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            

# Load the text clip, to apply new effects
t5 = moviepy.TextClip(text="ceci est un message en Arial", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            

# Load the text clip, to apply new effects
t6 = moviepy.TextClip(text="tandis que celui ci est en Verdana", font="C:/Windows/Fonts/Verdana.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            
timeline_element_1 = t1.with_duration(5)
timeline_element_2 = t2.with_start(timeline_element_1.end).with_duration(5)
timeline_element_3 = t3.with_start(timeline_element_2.end).with_duration(5)
timeline_element_4 = t4.with_start(timeline_element_3.end).with_duration(5)
timeline_element_5 = video1.with_start(timeline_element_4.end)
timeline_element_6 = t5.with_start(timeline_element_5.start + 1).with_duration(8)
timeline_element_7 = t6.with_start(timeline_element_6.end).with_duration(8)
# Concatenate all clips
final_video = moviepy.CompositeVideoClip([timeline_element_1, timeline_element_2, timeline_element_3, timeline_element_4, timeline_element_5, timeline_element_6, timeline_element_7], size=(1920, 1080))

# Export the final video
final_video.write_videofile("resultat_scenario_options_text.mp4")
