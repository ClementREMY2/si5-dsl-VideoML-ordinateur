import moviepy

# Load the video clip original
video_partie1 = moviepy.VideoFileClip("/Users/clrem/Downloads/scenarios_resources/video_presentation/resources/video_partie1.mp4")

# Resize the video clip
if video_partie1.size[0] / video_partie1.size[1] == 16/9:
    video_partie1 = video_partie1.resized((1920, 1080))
else:
    if video_partie1.size[0] / video_partie1.size[1] > 1:
        video_partie1 = video_partie1.resized(width=1920)
    else:
        video_partie1 = video_partie1.resized(height=1080)
    video_partie1 = video_partie1.with_position("center", "center")
    
# Load the video clip original
webcam_partie1 = moviepy.VideoFileClip("/Users/clrem/Downloads/scenarios_resources/video_presentation/resources/webcam_partie1.mp4")

# Resize the video clip
if webcam_partie1.size[0] / webcam_partie1.size[1] == 16/9:
    webcam_partie1 = webcam_partie1.resized((1920, 1080))
else:
    if webcam_partie1.size[0] / webcam_partie1.size[1] > 1:
        webcam_partie1 = webcam_partie1.resized(width=1920)
    else:
        webcam_partie1 = webcam_partie1.resized(height=1080)
    webcam_partie1 = webcam_partie1.with_position("center", "center")
    
# Apply fade in effect
fade_in = moviepy.video.fx.CrossFadeIn(1)
webcam_partie1 = fade_in.apply(webcam_partie1)
# Apply fade out effect
fade_out = moviepy.video.fx.CrossFadeOut(1)
webcam_partie1 = fade_out.apply(webcam_partie1)
# Apply resolution effect
webcam_partie1 = webcam_partie1.resized((640,480))
# Apply position effect
webcam_partie1 = webcam_partie1.with_position((1280,0))
# Load the video clip original
video_partie2 = moviepy.VideoFileClip("/Users/clrem/Downloads/scenarios_resources/video_presentation/resources/video_partie2.mp4")

# Resize the video clip
if video_partie2.size[0] / video_partie2.size[1] == 16/9:
    video_partie2 = video_partie2.resized((1920, 1080))
else:
    if video_partie2.size[0] / video_partie2.size[1] > 1:
        video_partie2 = video_partie2.resized(width=1920)
    else:
        video_partie2 = video_partie2.resized(height=1080)
    video_partie2 = video_partie2.with_position("center", "center")
    
# Load the video clip original
video_1_partie3 = moviepy.VideoFileClip("/Users/clrem/Downloads/scenarios_resources/video_presentation/resources/video_validateurs_elements_options_partie3.mp4")

# Resize the video clip
if video_1_partie3.size[0] / video_1_partie3.size[1] == 16/9:
    video_1_partie3 = video_1_partie3.resized((1920, 1080))
else:
    if video_1_partie3.size[0] / video_1_partie3.size[1] > 1:
        video_1_partie3 = video_1_partie3.resized(width=1920)
    else:
        video_1_partie3 = video_1_partie3.resized(height=1080)
    video_1_partie3 = video_1_partie3.with_position("center", "center")
    
# Load the video clip original
video_2_partie3 = moviepy.VideoFileClip("/Users/clrem/Downloads/scenarios_resources/video_presentation/resources/video_validateurs_timeline_partie3.mp4")

# Resize the video clip
if video_2_partie3.size[0] / video_2_partie3.size[1] == 16/9:
    video_2_partie3 = video_2_partie3.resized((1920, 1080))
else:
    if video_2_partie3.size[0] / video_2_partie3.size[1] > 1:
        video_2_partie3 = video_2_partie3.resized(width=1920)
    else:
        video_2_partie3 = video_2_partie3.resized(height=1080)
    video_2_partie3 = video_2_partie3.with_position("center", "center")
    
# Load the video clip original
video_generation_1 = moviepy.VideoFileClip("/Users/clrem/Downloads/scenarios_resources/video_presentation/resources/video_generation1.mp4")

# Resize the video clip
if video_generation_1.size[0] / video_generation_1.size[1] == 16/9:
    video_generation_1 = video_generation_1.resized((1920, 1080))
else:
    if video_generation_1.size[0] / video_generation_1.size[1] > 1:
        video_generation_1 = video_generation_1.resized(width=1920)
    else:
        video_generation_1 = video_generation_1.resized(height=1080)
    video_generation_1 = video_generation_1.with_position("center", "center")
    
# Load the video clip original
video_generation_2 = moviepy.VideoFileClip("/Users/clrem/Downloads/scenarios_resources/video_presentation/resources/video_generation2.mp4")

# Resize the video clip
if video_generation_2.size[0] / video_generation_2.size[1] == 16/9:
    video_generation_2 = video_generation_2.resized((1920, 1080))
else:
    if video_generation_2.size[0] / video_generation_2.size[1] > 1:
        video_generation_2 = video_generation_2.resized(width=1920)
    else:
        video_generation_2 = video_generation_2.resized(height=1080)
    video_generation_2 = video_generation_2.with_position("center", "center")
    
# Extract a subclip from the video
video_clip_normal_partie3 = video_1_partie3.subclipped(0, 5)

# Resize the video clip
if video_clip_normal_partie3.size[0]/video_clip_normal_partie3.size[1] == 16/9:
    video_clip_normal_partie3 = video_clip_normal_partie3.resized((1920, 1080))
else:
    video_clip_normal_partie3 = video_clip_normal_partie3.with_position("center", "center")

# Extract a subclip from the video
video_clip_saturation_partie3 = video_1_partie3.subclipped(0, 5)

# Resize the video clip
if video_clip_saturation_partie3.size[0]/video_clip_saturation_partie3.size[1] == 16/9:
    video_clip_saturation_partie3 = video_clip_saturation_partie3.resized((1920, 1080))
else:
    video_clip_saturation_partie3 = video_clip_saturation_partie3.with_position("center", "center")

# Apply saturation effect
painting_effect = moviepy.video.fx.Painting(saturation=3, black=0.0)
video_clip_saturation_partie3 = painting_effect.apply(video_clip_saturation_partie3)
# Apply brightness effect
multiply_effect = moviepy.video.fx.MultiplyColor(factor=2)
video_clip_saturation_partie3 = multiply_effect.apply(video_clip_saturation_partie3)
# Apply resolution effect
resize_effect = moviepy.video.fx.Resize(0.5)
video_clip_saturation_partie3 = resize_effect.apply(video_clip_saturation_partie3)
# Extract a subclip from the video
video_clip_contraste_partie3 = video_1_partie3.subclipped(0, 5)

# Resize the video clip
if video_clip_contraste_partie3.size[0]/video_clip_contraste_partie3.size[1] == 16/9:
    video_clip_contraste_partie3 = video_clip_contraste_partie3.resized((1920, 1080))
else:
    video_clip_contraste_partie3 = video_clip_contraste_partie3.with_position("center", "center")

# Apply contrast effect
lum_contrast_effect = moviepy.video.fx.LumContrast(lum=20, contrast=5, contrast_threshold=127)
video_clip_contraste_partie3 = lum_contrast_effect.apply(video_clip_contraste_partie3)
# Extract a subclip from the video
video_clip_brightness_and_scale_partie3 = video_1_partie3.subclipped(0, 5)

# Resize the video clip
if video_clip_brightness_and_scale_partie3.size[0]/video_clip_brightness_and_scale_partie3.size[1] == 16/9:
    video_clip_brightness_and_scale_partie3 = video_clip_brightness_and_scale_partie3.resized((1920, 1080))
else:
    video_clip_brightness_and_scale_partie3 = video_clip_brightness_and_scale_partie3.with_position("center", "center")

# Extract a subclip from the video
video_clip_opacity_partie3 = video_1_partie3.subclipped(0, 5)

# Resize the video clip
if video_clip_opacity_partie3.size[0]/video_clip_opacity_partie3.size[1] == 16/9:
    video_clip_opacity_partie3 = video_clip_opacity_partie3.resized((1920, 1080))
else:
    video_clip_opacity_partie3 = video_clip_opacity_partie3.with_position("center", "center")

# Apply opacity effect
video_clip_opacity_partie3 = video_clip_opacity_partie3.with_opacity(0.5)
# Extract a subclip from the video
video_clip_rotate_partie3 = video_1_partie3.subclipped(0, 5)

# Resize the video clip
if video_clip_rotate_partie3.size[0]/video_clip_rotate_partie3.size[1] == 16/9:
    video_clip_rotate_partie3 = video_clip_rotate_partie3.resized((1920, 1080))
else:
    video_clip_rotate_partie3 = video_clip_rotate_partie3.with_position("center", "center")

# Apply rotation effect
rotate_effect = moviepy.video.fx.Rotate(angle=180, unit="deg", resample="bicubic", expand=True)
video_clip_rotate_partie3 = rotate_effect.apply(video_clip_rotate_partie3)
# Extract a subclip from the video
video_clip_generation_2 = video_generation_2.subclipped(35, 50)

# Resize the video clip
if video_clip_generation_2.size[0]/video_clip_generation_2.size[1] == 16/9:
    video_clip_generation_2 = video_clip_generation_2.resized((1920, 1080))
else:
    video_clip_generation_2 = video_clip_generation_2.with_position("center", "center")


# Load the text clip, to apply new effects
text_intro = moviepy.TextClip(text="Bienvenue dans cette vidéo de présentation du projet VideoML! :)", bg_color="white", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="black", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            

# Load the text clip, to apply new effects
text_partie1 = moviepy.TextClip(text="Partie 1 - Comment installer et utiliser le projet? (commentaires avec webcam)", bg_color="white", font="C:/Windows/Fonts/Arial.ttf", font_size=40, color="black", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            

# Load the text clip, to apply new effects
text_partie2 = moviepy.TextClip(text="Partie 2 - Présentation et utilisation de la UI (commentaires textuels)", bg_color="blue", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="yellow", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            

# Load the text clip, to apply new effects
text_1_partie2 = moviepy.TextClip(text="En arrivant sur la UI, on remarque qu'il nous manque la vidéo webcam partie 1...", font="C:/Windows/Fonts/Arial.ttf", font_size=30, color="white", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            

# Load the text clip, to apply new effects
subtitle_1_partie2 = moviepy.TextClip(text="Heureusement, nous pouvons ajouter ce fichier en cliquant ou en glissant/déposant juste au dessus", font="C:/Windows/Fonts/Arial.ttf", font_size=30, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            

# Load the text clip, to apply new effects
subtitle_2_partie2 = moviepy.TextClip(text="Et voilà! la vidéo a été chargée, et on la voit apparaître sur la timeline!", font="C:/Windows/Fonts/Arial.ttf", font_size=30, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            

# Load the text clip, to apply new effects
text_2_partie2 = moviepy.TextClip(text="Il est également possible d'étendre la timeline pour pouvoir voir le nom des éléments trop petits", font="C:/Windows/Fonts/Arial.ttf", font_size=30, color="white", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            

# Load the text clip, to apply new effects
text_3_partie2 = moviepy.TextClip(text="Voyons désormais la partie génération de code python", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            

# Load the text clip, to apply new effects
subtitle_3_partie2 = moviepy.TextClip(text="Le code correspondant a été généré. Mais, que se passe t-il si je décide de supprimer une ligne de mon scénario?", font="C:/Windows/Fonts/Arial.ttf", font_size=25, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            

# Load the text clip, to apply new effects
text_4_partie2 = moviepy.TextClip(text="On constate que le code python est mis à jour!", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            

# Load the text clip, to apply new effects
subtitle_4_partie2 = moviepy.TextClip(text="!!! INCROYABLE !!!", font="C:/Windows/Fonts/Gadugi.ttf", font_size=80, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            

# Load the text clip, to apply new effects
text_5_partie2 = moviepy.TextClip(text="Si on remet la ligne du scénario, le code se remet à jour.", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            

# Load the text clip, to apply new effects
text_6_partie2 = moviepy.TextClip(text="Regardons désormais la partie vidéo", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            

# Load the text clip, to apply new effects
subtitle_5_partie2 = moviepy.TextClip(text="Rien n'a encore été généré, il faut cliquer sur le bouton generate", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            

# Load the text clip, to apply new effects
text_7_partie2 = moviepy.TextClip(text="La génération se lance. Cela peut prendre du temps...", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            

# Load the text clip, to apply new effects
text_8_partie2 = moviepy.TextClip(text="Bien, ça se lance, mais nous ne regarderons pas toute la génération. Passons à la suite...", font="C:/Windows/Fonts/Arial.ttf", font_size=30, color="white", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            

# Load the text clip, to apply new effects
subtitle_6_partie2 = moviepy.TextClip(text="Musique : One piece : We did it! Party", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            

# Load the text clip, to apply new effects
text_partie3 = moviepy.TextClip(text="Partie 3 - fonctionnalités de montage vidéos (commentaires par audio)", font="C:/Windows/Fonts/Calibri.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            

# Load the text clip, to apply new effects
subtitle_option_audio1 = moviepy.TextClip(text="NB : les options audios ne sont pas explicitement présentées en vidéo, cependant...", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            

# Load the text clip, to apply new effects
subtitle_option_audio2 = moviepy.TextClip(text="Vous avez pu constaté du changement de volume", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            

# Load the text clip, to apply new effects
subtitle_option_audio3 = moviepy.TextClip(text="Et vous constaterez une répétition d'un même audio, à intervalle régulier dans la partie 3", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            

# Load the text clip, to apply new effects
subtitle_option_audio4 = moviepy.TextClip(text="C'est ainsi que sont présentées les options audios :)", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            

# Load the text clip, to apply new effects
subtitle_saturate = moviepy.TextClip(text="Vidéo clip saturé", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            

# Load the text clip, to apply new effects
subtitle_contrast = moviepy.TextClip(text="Vidéo clip contrasté", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            

# Load the text clip, to apply new effects
subtitle_bright_scale = moviepy.TextClip(text="Vidéo clip lumineux et scalé", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            

# Load the text clip, to apply new effects
subtitle_opacity = moviepy.TextClip(text="Vidéo clip opaque", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            

# Load the text clip, to apply new effects
subtitle_rotate = moviepy.TextClip(text="Vidéo clip tourné à 180°", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", 400))
            

# Load the text clip, to apply new effects
texteFin = moviepy.TextClip(text="Merci pour votre attention! :)", font="C:/Windows/Fonts/Arial.ttf", font_size=60, color="white", text_align="left", size=(1920, 1080)).with_position(("center", "center"))
            
# Load the audio clip
audio_partie2 = moviepy.AudioFileClip("/Users/clrem/Downloads/scenarios_resources/video_presentation/resources/audio_partie2.mp3")

# Extract a subclip from the audio
audio_clip_partie_2 = audio_partie2.subclipped(0, 63)

# Apply audio volume effect
new_volume = moviepy.audio.fx.MultiplyStereoVolume(left=0.3, right=0.3)
audio_clip_partie_2 = new_volume.apply(audio_clip_partie_2)
# Apply fade out effect
fade_out = moviepy.audio.fx.AudioFadeOut(3)
audio_clip_partie_2 = fade_out.apply(audio_clip_partie_2)
# Load the audio clip
audio_intro_partie3 = moviepy.AudioFileClip("/Users/clrem/Downloads/scenarios_resources/video_presentation/resources/audio_intro_partie3.mp3")

# Load the audio clip
audio_validateur_element_1 = moviepy.AudioFileClip("/Users/clrem/Downloads/scenarios_resources/video_presentation/resources/audio_validateurs_elements_options1.mp3")

# Apply stereo volume effect
stereo_volume = moviepy.audio.fx.MultiplyStereoVolume(left=1.2, right=1.3)
audio_validateur_element_1 = stereo_volume.apply(audio_validateur_element_1)
# Load the audio clip
audio_validateur_element_2 = moviepy.AudioFileClip("/Users/clrem/Downloads/scenarios_resources/video_presentation/resources/audio_validateurs_elements_options2.mp3")

# Apply audio volume effect
new_volume = moviepy.audio.fx.MultiplyStereoVolume(left=1.5, right=1.5)
audio_validateur_element_2 = new_volume.apply(audio_validateur_element_2)
# Apply fade out effect
fade_out = moviepy.audio.fx.AudioFadeOut(3)
audio_validateur_element_2 = fade_out.apply(audio_validateur_element_2)
# Load the audio clip
audio_validateur_element_3 = moviepy.AudioFileClip("/Users/clrem/Downloads/scenarios_resources/video_presentation/resources/audio_validateurs_elements_options3.mp3")

# Apply fade in effect
fade_in = moviepy.audio.fx.AudioFadeIn(2)
audio_validateur_element_3 = fade_in.apply(audio_validateur_element_3)
# Load the audio clip
audio_validateur_timeline = moviepy.AudioFileClip("/Users/clrem/Downloads/scenarios_resources/video_presentation/resources/audio_validateurs_timeline.mp3")

# Load the audio clip
audio_video_option1 = moviepy.AudioFileClip("/Users/clrem/Downloads/scenarios_resources/video_presentation/resources/audio_video_option1.mp3")

# Load the audio clip
audio_video_option2 = moviepy.AudioFileClip("/Users/clrem/Downloads/scenarios_resources/video_presentation/resources/audio_video_option2.mp3")

# # Apply audio delay effect
new_volume = moviepy.audio.fx.AudioDelay(offset=5,n_repeats=4)
audio_video_option2 = new_volume.apply(audio_video_option2)
# Load the audio clip
audio_generation_1 = moviepy.AudioFileClip("/Users/clrem/Downloads/scenarios_resources/video_presentation/resources/audio_generation1.mp3")

# Load the audio clip
audio_generation_2 = moviepy.AudioFileClip("/Users/clrem/Downloads/scenarios_resources/video_presentation/resources/audio_generation2.mp3")

timeline_element_1 = text_intro.with_duration(5)
timeline_element_2 = text_partie1.with_start(timeline_element_1.end).with_duration(5)
timeline_element_3 = video_partie1.with_start(timeline_element_2.end)
timeline_element_4 = webcam_partie1.with_start(timeline_element_3.start)
timeline_element_5 = text_partie2.with_start(timeline_element_3.end).with_duration(5)
timeline_element_6 = video_partie2.with_start(timeline_element_5.end)
timeline_element_7 = text_1_partie2.with_start(timeline_element_6.start).with_duration(3)
timeline_element_8 = subtitle_1_partie2.with_start(timeline_element_7.end).with_duration(4)
timeline_element_9 = subtitle_2_partie2.with_start(timeline_element_8.end).with_duration(5)
timeline_element_10 = text_2_partie2.with_start(timeline_element_9.end - 2).with_duration(10)
timeline_element_11 = text_3_partie2.with_start(timeline_element_10.end).with_duration(5)
timeline_element_12 = subtitle_3_partie2.with_start(timeline_element_11.end - 2).with_duration(6)
timeline_element_13 = text_4_partie2.with_start(timeline_element_12.end).with_duration(5)
timeline_element_14 = subtitle_4_partie2.with_start(timeline_element_13.start + 1).with_duration(5)
timeline_element_15 = text_5_partie2.with_start(timeline_element_14.end).with_duration(3)
timeline_element_16 = text_6_partie2.with_start(timeline_element_15.end).with_duration(5)
timeline_element_17 = subtitle_5_partie2.with_start(timeline_element_16.start + 3).with_duration(7)
timeline_element_18 = text_7_partie2.with_start(timeline_element_17.end).with_duration(8)
timeline_element_19 = text_8_partie2.with_start(timeline_element_18.end).with_duration(7)
timeline_element_20 = subtitle_6_partie2.with_start(timeline_element_18.end).with_duration(7)
timeline_element_21 = audio_clip_partie_2.with_start(timeline_element_6.start)
timeline_element_22 = text_partie3.with_start(timeline_element_21.end).with_duration(74)
timeline_element_23 = audio_intro_partie3.with_start(timeline_element_22.start)
timeline_element_24 = video_1_partie3.with_start(timeline_element_22.end)
timeline_element_25 = audio_validateur_element_1.with_start(timeline_element_24.start)
timeline_element_26 = audio_validateur_element_2.with_start(timeline_element_25.end)
timeline_element_27 = audio_validateur_element_3.with_start(timeline_element_26.end)
timeline_element_28 = video_2_partie3.with_start(timeline_element_27.end)
timeline_element_29 = audio_validateur_timeline.with_start(timeline_element_28.start)
timeline_element_30 = video_clip_normal_partie3.with_start(timeline_element_28.end)
timeline_element_31 = video_clip_saturation_partie3.with_start(timeline_element_30.end)
timeline_element_32 = video_clip_contraste_partie3.with_start(timeline_element_31.end)
timeline_element_33 = video_clip_brightness_and_scale_partie3.with_start(timeline_element_32.end)
timeline_element_34 = video_clip_opacity_partie3.with_start(timeline_element_33.end)
timeline_element_35 = video_clip_rotate_partie3.with_start(timeline_element_34.end)
timeline_element_36 = audio_video_option1.with_start(timeline_element_30.start)
timeline_element_37 = audio_video_option2.with_start(timeline_element_36.end)
timeline_element_38 = video_generation_1.with_start(timeline_element_35.end)
timeline_element_39 = video_clip_generation_2.with_start(timeline_element_38.end)
timeline_element_40 = audio_generation_1.with_start(timeline_element_38.start)
timeline_element_41 = audio_generation_2.with_start(timeline_element_40.end)
timeline_element_42 = subtitle_saturate.with_start(timeline_element_31.start).with_duration(5)
timeline_element_43 = subtitle_contrast.with_start(timeline_element_32.start).with_duration(5)
timeline_element_44 = subtitle_bright_scale.with_start(timeline_element_33.start).with_duration(5)
timeline_element_45 = subtitle_opacity.with_start(timeline_element_34.start).with_duration(5)
timeline_element_46 = subtitle_rotate.with_start(timeline_element_35.start).with_duration(5)
timeline_element_47 = subtitle_option_audio1.with_start(timeline_element_22.end - 15).with_duration(4)
timeline_element_48 = subtitle_option_audio2.with_start(timeline_element_47.end).with_duration(4)
timeline_element_49 = subtitle_option_audio3.with_start(timeline_element_48.end).with_duration(4)
timeline_element_50 = subtitle_option_audio4.with_start(timeline_element_49.end).with_duration(3)
timeline_element_51 = texteFin.with_start(timeline_element_39.end).with_duration(10)
# Concatenate all clips
final_video = moviepy.CompositeVideoClip([timeline_element_1, timeline_element_2, timeline_element_3, timeline_element_5, timeline_element_6, timeline_element_22, timeline_element_24, timeline_element_28, timeline_element_30, timeline_element_31, timeline_element_32, timeline_element_33, timeline_element_34, timeline_element_35, timeline_element_38, timeline_element_39, timeline_element_51, timeline_element_4, timeline_element_7, timeline_element_8, timeline_element_9, timeline_element_11, timeline_element_13, timeline_element_15, timeline_element_16, timeline_element_18, timeline_element_19, timeline_element_42, timeline_element_43, timeline_element_44, timeline_element_45, timeline_element_46, timeline_element_47, timeline_element_48, timeline_element_49, timeline_element_50, timeline_element_10, timeline_element_12, timeline_element_14, timeline_element_17, timeline_element_20], size=(1920, 1080))

# Concatenate all audios
final_audio = moviepy.CompositeAudioClip([timeline_element_21, timeline_element_23, timeline_element_25, timeline_element_26, timeline_element_27, timeline_element_29, timeline_element_36, timeline_element_37, timeline_element_40, timeline_element_41, timeline_element_3.audio, timeline_element_6.audio, timeline_element_24.audio, timeline_element_28.audio, timeline_element_30.audio, timeline_element_31.audio, timeline_element_32.audio, timeline_element_33.audio, timeline_element_34.audio, timeline_element_35.audio, timeline_element_38.audio, timeline_element_39.audio, timeline_element_4.audio])

# Assign audio's concatenation to the final video
final_video.audio = final_audio

# Export the final video
final_video.write_videofile("video_presentation_finale.mp4")
