import moviepy

# Load the video clip
video_video1 = moviepy.VideoFileClip("/Users/alexismalosse/NotInCloud/Courses/S9/B2/DSL/si5-dsl-VideoML-ordinateur/demo/first_sample.mp4")

# Load the video clip
video_video2 = moviepy.VideoFileClip("/Users/alexismalosse/NotInCloud/Courses/S9/B2/DSL/si5-dsl-VideoML-ordinateur/demo/second_sample.mp4")

# Export the final video
final_video.write_videofile("output.mp4")
