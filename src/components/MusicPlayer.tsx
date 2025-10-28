import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Shuffle } from 'lucide-react';

const PLAYLIST = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
];

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(true); // По умолчанию включено
  const [volume, setVolume] = useState(0.3);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [shuffled, setShuffled] = useState(false);
  const [playlist, setPlaylist] = useState(PLAYLIST);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Запускаем музыку при монтировании компонента
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      audioRef.current.volume = volume;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTrackEnd = () => {
    const nextTrack = (currentTrack + 1) % playlist.length;
    setCurrentTrack(nextTrack);
  };

  const shufflePlaylist = () => {
    if (!shuffled) {
      const shuffledList = [...PLAYLIST].sort(() => Math.random() - 0.5);
      setPlaylist(shuffledList);
      setShuffled(true);
    } else {
      setPlaylist(PLAYLIST);
      setShuffled(false);
    }
    setCurrentTrack(0);
  };

  return (
    <div className="fixed bottom-4 left-4 bg-stone-800/90 backdrop-blur-sm rounded-lg p-3 shadow-2xl border border-stone-600">
      <audio
        ref={audioRef}
        src={playlist[currentTrack]}
        onEnded={handleTrackEnd}
        autoPlay
      />

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="text-amber-200 hover:text-amber-100 transition"
        >
          {isPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-24 accent-amber-600"
        />

        <button
          onClick={shufflePlaylist}
          className={`transition ${shuffled ? 'text-amber-400' : 'text-amber-200'} hover:text-amber-100`}
        >
          <Shuffle size={20} />
        </button>
      </div>
    </div>
  );
}
