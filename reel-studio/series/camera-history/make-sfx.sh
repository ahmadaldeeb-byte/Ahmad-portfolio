#!/usr/bin/env bash
# Synthesised SFX + ambient bed for the camera-history series (no third-party audio, no licence issues).
#   bash series/camera-history/make-sfx.sh   → public/sfx/series/*.wav, bed.mp3
set -euo pipefail
cd "$(dirname "$0")/../.."
O=public/sfx/series; mkdir -p "$O"
f() { ffmpeg -loglevel error -y "$@"; }
f -f lavfi -i "anoisesrc=d=0.7:c=pink:a=0.7" -af "highpass=f=250,lowpass=f=3500,afade=t=in:d=0.32,afade=t=out:st=0.34:d=0.36,volume=0.7" "$O/whoosh.wav"
f -f lavfi -i "anoisesrc=d=0.05:c=white:a=0.9" -af "highpass=f=1800,afade=t=out:st=0.004:d=0.045" "$O/click.wav"
f -f lavfi -i "anoisesrc=d=0.06:c=white:a=0.9" -f lavfi -i "anoisesrc=d=0.06:c=white:a=0.7" -filter_complex "[0]highpass=f=1200,afade=t=out:st=0.004:d=0.05[a];[1]highpass=f=900,afade=t=out:st=0.004:d=0.05,adelay=95[b];[a][b]amix=inputs=2:normalize=0,apad=pad_dur=0.1" "$O/shutter.wav"
f -f lavfi -i "sine=f=2200:d=0.03" -af "afade=t=out:st=0.002:d=0.028,volume=0.5" "$O/tick.wav"
f -f lavfi -i "anoisesrc=d=1.4:c=brown:a=0.8" -af "lowpass=f=700,tremolo=f=7:d=0.6,afade=t=in:d=0.25,afade=t=out:st=0.9:d=0.5,volume=1.4" "$O/liquid.wav"
f -f lavfi -i "sine=f=110:d=0.16" -f lavfi -i "anoisesrc=d=0.04:c=white:a=0.8" -filter_complex "[0]afade=t=out:st=0.01:d=0.15,volume=0.9[a];[1]highpass=f=1000,afade=t=out:st=0.003:d=0.035[b];[a][b]amix=inputs=2:normalize=0" "$O/thud.wav"
f -f lavfi -i "sine=f=380:d=0.7" -af "vibrato=f=18:d=0.3,tremolo=f=30:d=0.4,afade=t=in:d=0.08,afade=t=out:st=0.5:d=0.2,volume=0.35" "$O/whirr.wav"
f -f lavfi -i "aevalsrc=0.18*sin(2*PI*1318*t)+0.14*sin(2*PI*1760*t)+0.1*sin(2*PI*2637*t):d=1.4" -af "afade=t=in:d=0.05,afade=t=out:st=0.2:d=1.2,aecho=0.8:0.6:60:0.4" "$O/shimmer.wav"
f -f lavfi -i "anoisesrc=d=2.2:c=brown:a=0.5" -f lavfi -i "sine=f=60:d=2.2" -filter_complex "[0]lowpass=f=1200[a];[1]volume=0.15[b];[a][b]amix=inputs=2:normalize=0,tremolo=f=12:d=0.3,afade=t=in:d=0.1,afade=t=out:st=1.8:d=0.4" "$O/tape.wav"
# ambient bed: A-minor pad with slow movement, soft low-pass and a little space (80 s)
f -f lavfi -i "aevalsrc=0.06*sin(2*PI*110*t)*(0.6+0.4*sin(2*PI*0.05*t))+0.045*sin(2*PI*164.81*t)*(0.6+0.4*sin(2*PI*0.07*t+1))+0.035*sin(2*PI*220*t)*(0.5+0.5*sin(2*PI*0.04*t+2))+0.025*sin(2*PI*329.63*t)*(0.5+0.5*sin(2*PI*0.11*t))+0.015*sin(2*PI*493.88*t)*(0.5+0.5*sin(2*PI*0.09*t+0.5)):d=80:s=44100" -af "lowpass=f=1800,aecho=0.8:0.7:180|340:0.35|0.25,afade=t=in:d=3,afade=t=out:st=76:d=4,loudnorm=I=-20:TP=-3" -c:a libmp3lame -q:a 4 "$O/bed.mp3"
ls -1 "$O"
