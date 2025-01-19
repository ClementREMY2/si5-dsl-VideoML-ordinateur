import moviepy

# Load the video clip original
video1 = moviepy.VideoFileClip("/Users/clrem/OneDrive/Documents/Travail/5A/S9.2/Ingenierie_Modele_Langages_Specifiques_Domaines/si5-dsl-VideoML-ordinateur/VideoML/scenarios/extensions/Audio/VideoScenarioAudio.mp4")

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
s1 = moviepy.TextClip(text="prochaine partie dans 5 secondes!", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            
# Load the audio clip
audio1 = moviepy.AudioFileClip("/Users/clrem/OneDrive/Documents/Travail/5A/S9.2/Ingenierie_Modele_Langages_Specifiques_Domaines/si5-dsl-VideoML-ordinateur/VideoML/scenarios/extensions/Audio/audio_numero1.mp3")

# Load the audio clip
audioHaut = moviepy.AudioFileClip("/Users/clrem/OneDrive/Documents/Travail/5A/S9.2/Ingenierie_Modele_Langages_Specifiques_Domaines/si5-dsl-VideoML-ordinateur/VideoML/scenarios/extensions/Audio/audio_numero2.mp3")

# Apply brightness effect
new_volume = moviepy.audio.fx.MultiplyStereoVolume(left=1.5, right=1.5)
audioHaut = new_volume.apply(audioHaut)
# Load the audio clip
audioBas = moviepy.AudioFileClip("/Users/clrem/OneDrive/Documents/Travail/5A/S9.2/Ingenierie_Modele_Langages_Specifiques_Domaines/si5-dsl-VideoML-ordinateur/VideoML/scenarios/extensions/Audio/audio_numero3.mp3")

# Apply brightness effect
new_volume = moviepy.audio.fx.MultiplyStereoVolume(left=0.5, right=0.5)
audioBas = new_volume.apply(audioBas)
timeline_element_1 = video1
timeline_element_2 = audio1.with_start(timeline_element_1.start)
timeline_element_3 = s1.with_start(timeline_element_2.end).with_duration(5)
timeline_element_4 = audioHaut.with_start(timeline_element_3.end)
timeline_element_5 = audioBas.with_start(timeline_element_4.end)
# Concatenate all clips
final_video = moviepy.CompositeVideoClip([timeline_element_1, timeline_element_3], size=(1920, 1080))

# Concatenate all audios
final_audio = moviepy.CompositeAudioClip([timeline_element_1.audio, timeline_element_2, timeline_element_4, timeline_element_5])

# Assign audio's concatenation to the final video
final_video.audio = final_audio

# Export the final video
final_video.write_videofile("resultat_scenario_audio.mp4")
