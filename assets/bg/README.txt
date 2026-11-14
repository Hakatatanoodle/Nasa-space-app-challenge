Put ONE looping video here named  space.mp4  (muted is fine, the game mutes it).
Where to get real footage: NASA Image and Video Library (images.nasa.gov), NASA Scientific Visualization Studio (svs.gsfc.nasa.gov), ESA/Hubble.
Before using any clip: read its usage/credit line. NASA media is generally free to use but some clips contain third-party material,
and you must not imply NASA endorses your game or use NASA logos. Put the credit in data.js -> bg.credit.
Shrink it so the game stays small (720p, no audio, ~10-20 MB):
  ffmpeg -i input.mp4 -an -vf "scale=-2:720,fps=24" -c:v libx264 -crf 28 -preset slow -movflags +faststart space.mp4
Use a slow, dark clip (Earth limb, star field, nebula flythrough): bright or fast footage makes the meters hard to read.
