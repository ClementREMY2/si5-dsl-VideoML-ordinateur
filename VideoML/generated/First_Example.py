import moviepy

# Load the video clip
video1 = moviepy.VideoFileClip("/Users/alexismalosse/NotInCloud/Courses/S9/B2/DSL/si5-dsl-VideoML-ordinateur/demo/first_sample.mp4")

# Load the video clip
video2 = moviepy.VideoFileClip("/Users/alexismalosse/NotInCloud/Courses/S9/B2/DSL/si5-dsl-VideoML-ordinateur/demo/second_sample.mp4")

first = video1.with_start(0)
second = video1.with_start(15)
third = video2.with_start(first.start + 5)

# Concatenate all clips
final_video = moviepy.CompositeVideoClip([first, third, second])

# Export the final video
final_video.write_videofile("output.mp4")
