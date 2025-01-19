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
audio1 = moviepy.AudioFileClip("/Users/clrem/OneDrive/Documents/Travail/5A/S9.2/Ingenierie_Modele_Langages_Specifiques_Domaines/si5-dsl-VideoML-ordinateur/VideoML/scenarios/other/AudioOption/audio_numero1.mp3")

# Load the audio clip
audioHaut = moviepy.AudioFileClip("/Users/clrem/OneDrive/Documents/Travail/5A/S9.2/Ingenierie_Modele_Langages_Specifiques_Domaines/si5-dsl-VideoML-ordinateur/VideoML/scenarios/other/AudioOption/audio_numero2.mp3")

# Apply audio volume effect
new_volume = moviepy.audio.fx.MultiplyStereoVolume(left=1.5, right=1.5)
audioHaut = new_volume.apply(audioHaut)
# Load the audio clip
audioBasStereoGauche = moviepy.AudioFileClip("/Users/clrem/OneDrive/Documents/Travail/5A/S9.2/Ingenierie_Modele_Langages_Specifiques_Domaines/si5-dsl-VideoML-ordinateur/VideoML/scenarios/other/AudioOption/audio_numero3.mp3")

# Apply stereo volume effect
stereo_volume = moviepy.audio.fx.MultiplyStereoVolume(left=0.5, right=1.5)
audioBasStereoGauche = stereo_volume.apply(audioBasStereoGauche)
# Load the audio clip
audioDelay = moviepy.AudioFileClip("/Users/clrem/OneDrive/Documents/Travail/5A/S9.2/Ingenierie_Modele_Langages_Specifiques_Domaines/si5-dsl-VideoML-ordinateur/VideoML/scenarios/other/AudioOption/audio_numero4.mp3")

# # Apply audio delay effect
new_volume = moviepy.audio.fx.AudioDelay(offset=2.5,n_repeats=2)
audioDelay = new_volume.apply(audioDelay)
# Load the audio clip
audioFade = moviepy.AudioFileClip("/Users/clrem/OneDrive/Documents/Travail/5A/S9.2/Ingenierie_Modele_Langages_Specifiques_Domaines/si5-dsl-VideoML-ordinateur/VideoML/scenarios/other/AudioOption/audio_numero5.mp3")

# Apply fade in effect
fade_in = moviepy.audio.fx.AudioFadeIn(3)
audioFade = fade_in.apply(audioFade)
# Apply fade out effect
fade_out = moviepy.audio.fx.AudioFadeOut(3)
audioFade = fade_out.apply(audioFade)
timeline_element_1 = video1
timeline_element_2 = audio1.with_start(timeline_element_1.start)
timeline_element_3 = s1.with_start(timeline_element_2.end).with_duration(5)
timeline_element_4 = audioHaut.with_start(timeline_element_3.end)
timeline_element_5 = audioBasStereoGauche.with_start(timeline_element_4.end)
timeline_element_6 = audioDelay.with_start(timeline_element_5.end)
timeline_element_7 = audioFade.with_start(timeline_element_6.end)
# Concatenate all clips
final_video = moviepy.CompositeVideoClip([timeline_element_1, timeline_element_3], size=(1920, 1080))

# Concatenate all audios
final_audio = moviepy.CompositeAudioClip([timeline_element_1.audio, timeline_element_2, timeline_element_4, timeline_element_5, timeline_element_6, timeline_element_7])

# Assign audio's concatenation to the final video
final_video.audio = final_audio

# Export the final video
final_video.write_videofile("resultat_scenario_audio_options.mp4")
