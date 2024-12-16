from moviepy import VideoFileClip, TextClip, CompositeVideoClip

# Create a title text clip
title_clip = TextClip(font="Arial.ttf", font_size=70, text="Bob and Alice's Holiday\nLocation: XYZ\nDate: 2023", color='white', bg_color='black', size=(1280, 720)).with_duration(5)

# Load the first video clip and adjust its audio volume
clip1 = VideoFileClip("clip2.mp4").subclipped(2, 8).with_volume_scaled(0.8)

# Load the second video clip and adjust its audio volume
clip2 = VideoFileClip("clip3.mp4").subclipped(2, 6).with_volume_scaled(0.8)

# Create a thanks text clip
thanks_clip = TextClip(font="Arial.ttf", font_size=70, text="Thanks for watching!", color='white', bg_color='black', size=(1280, 720)).with_duration(15)

clip1 = clip1.with_start(title_clip.duration)
clip2 = clip2.with_start(clip1.end)
thanks_clip = thanks_clip.with_start(clip2.end)
# Concatenate all clips
final_video = CompositeVideoClip([title_clip, clip1, clip2, thanks_clip])

# Export the final video
final_video.write_videofile("scenario1.mp4")
