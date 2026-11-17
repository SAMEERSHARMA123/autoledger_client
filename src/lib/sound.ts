// client/src/lib/sound.ts
export const setWebsiteSoundMute = (mute: boolean) => {
  if (typeof window === 'undefined') return;

  const media = document.querySelectorAll<HTMLMediaElement>('audio, video');
  media.forEach((el) => {
    el.muted = mute;
  });
};
