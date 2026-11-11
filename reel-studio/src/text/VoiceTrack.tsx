import React from 'react';
import {Sequence, staticFile} from 'remotion';
import {Audio} from '@remotion/media';

/** Plays public/<voiceover>.mp3 from `voiceFrom`. Lives in the text layer, so the reel and the text
 *  preview both carry the same voice for side-by-side review in Studio. */
export const VoiceTrack: React.FC<{voiceover: string; voiceFrom: number; voiceStatus: 'none' | 'temp' | 'recorded'}> = ({voiceover, voiceFrom, voiceStatus}) =>
  voiceover && voiceStatus === 'recorded' ? (
    <Sequence from={voiceFrom} name="Voice-over" layout="none">
      <Audio src={staticFile(`${voiceover}.mp3`)} />
    </Sequence>
  ) : null;
