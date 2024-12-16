from moviepy import VideoFileClip, TextClip, CompositeVideoClip

# Create a title text clip
title_clip = TextClip(font="Arial.ttf", font_size=70, text="Introduction title\nDate: 2023", color='white', bg_color='black', size=(1280, 720)).with_duration(10)



# Load the second video clip and adjust its audio volume
clip1 = VideoFileClip("clip3.mp4")
clip1a = clip1.subclipped(2, 10).with_volume_scaled(0.8)
clip1b = clip1.subclipped(13, 20).with_volume_scaled(0.8)

# Create a subtitle text clip
s1 = TextClip(font="Arial.ttf", font_size=30, text="Subtitle 1", color='white').with_duration(8)
s2 = TextClip(font="Arial.ttf", font_size=30, text="Subtitle 2", color='white').with_duration(8)

# Create a thanks text clip
thanks_clip = TextClip(font="Arial.ttf", font_size=70, text="Thanks for watching!", color='white', bg_color='black', size=(1280, 720)).with_duration(15)

clip1a = clip1a.with_start(title_clip.duration)
clip1b = clip1b.with_start(clip1a.end)

s1 = s1.with_start(clip1a.start)
s2 = s2.with_start(s1.end + 5)
s1 = s1.with_position(('center', 690))
s2 = s2.with_position(('center', 690))
thanks_clip = thanks_clip.with_start(clip1b.end)
# Concatenate all clips
final_video = CompositeVideoClip([title_clip, clip1a, clip1b, s1, s2, thanks_clip])

# Export the final video
final_video.write_videofile("scenario2.mp4")
