import React, { useState, useEffect } from 'react';
import Globe from './components/Globe';
import { AppState, DiscoveryContent } from './types';
import * as GeminiService from './services/geminiService';
import { playPCMAudio } from './utils/audio';
import { Loader2, Volume2, RefreshCw, MapPin } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [content, setContent] = useState<DiscoveryContent | null>(null);
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);

  const handleLocationSelect = async (lat: number, lng: number) => {
    if (appState === AppState.THINKING) return;
    
    setAppState(AppState.THINKING);
    setCoordinates({ lat, lng });
    setContent(null);

    try {
      // 1. Get Text Info
      const textData = await GeminiService.generateLocationInfo(lat, lng);
      
      // 2. Generate Image & Audio in parallel
      const imagePromise = GeminiService.generateKidImage(textData.animalName, textData.placeName);
      const audioPromise = GeminiService.generateVoiceNarration(
        `Welcome to ${textData.placeName}! Look at this ${textData.animalName}. ${textData.description} ${textData.funFact}`
      );

      const [imageUri, audioData] = await Promise.all([imagePromise, audioPromise]);

      const fullContent: DiscoveryContent = {
        ...textData,
        imageUri,
        audioData
      };

      setContent(fullContent);
      setAppState(AppState.SHOWING_RESULT);

      // Auto play audio when ready
      if (audioData) {
        setTimeout(() => playPCMAudio(audioData), 500);
      }

    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
    }
  };

  const handleClose = () => {
    setAppState(AppState.IDLE);
    setContent(null);
  };

  const handlePlayAudio = () => {
    if (content?.audioData) {
      playPCMAudio(content.audioData);
    }
  };

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden font-bubblegum text-white">
      
      {/* 3D Globe Background */}
      <div className="absolute inset-0 z-0">
        <Globe 
          onLocationSelect={handleLocationSelect} 
          isInteracting={appState !== AppState.IDLE} 
        />
      </div>

      {/* Header UI */}
      <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-start pointer-events-none">
        <div>
          <h1 className="text-4xl md:text-6xl font-bubblegum text-yellow-400 drop-shadow-lg tracking-wide" style={{ textShadow: '2px 2px 0px #d97706' }}>
            Little Earth Explorer
          </h1>
          <p className="text-xl md:text-2xl mt-2 text-blue-200 font-bold drop-shadow-md">
            {appState === AppState.IDLE ? "Spin the Earth and tap a place! 🌍" : "Discovering wonders..."}
          </p>
        </div>
      </div>

      {/* Loading Overlay */}
      {appState === AppState.THINKING && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white/10 p-8 rounded-3xl flex flex-col items-center animate-pulse border border-white/20">
            <Loader2 className="w-16 h-16 text-yellow-400 animate-spin mb-4" />
            <span className="text-3xl font-bold text-yellow-400">Traveling there... 🚀</span>
            <p className="text-white mt-2">Asking the magic telescope!</p>
          </div>
        </div>
      )}

      {/* Result Card */}
      {appState === AppState.SHOWING_RESULT && content && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-[2rem] max-w-4xl w-full shadow-2xl overflow-hidden transform transition-all animate-[twinkle_0.3s_ease-out] border-8 border-yellow-400 relative">
            
            {/* Close Button */}
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg z-10 transition-transform hover:scale-110"
            >
              ✕
            </button>

            <div className="flex flex-col md:flex-row h-full">
              
              {/* Image Section */}
              <div className="w-full md:w-1/2 bg-sky-100 relative h-64 md:h-auto">
                <img 
                  src={content.imageUri} 
                  alt={content.animalName} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/50 to-transparent p-4">
                   <span className="text-white text-lg font-bold flex items-center gap-2">
                     <MapPin className="w-5 h-5 text-yellow-400" />
                     {content.placeName}
                   </span>
                </div>
              </div>

              {/* Info Section */}
              <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between bg-gradient-to-b from-yellow-50 to-white">
                <div>
                  <h2 className="text-4xl md:text-5xl text-indigo-600 mb-2" style={{ textShadow: '2px 2px 0px #a5b4fc' }}>
                    {content.animalName}
                  </h2>
                  
                  <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-indigo-100 mb-4">
                    <p className="text-2xl text-slate-700 leading-relaxed">
                      {content.description}
                    </p>
                  </div>

                  <div className="bg-yellow-100 p-4 rounded-2xl border-l-8 border-yellow-400">
                    <h3 className="text-yellow-700 font-bold uppercase text-sm mb-1">Did you know?</h3>
                    <p className="text-xl text-slate-800 italic">
                      "{content.funFact}"
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button 
                    onClick={handlePlayAudio}
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-4 rounded-xl font-bold text-xl shadow-[0_6px_0_rgb(55,48,163)] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-2"
                  >
                    <Volume2 className="w-8 h-8" />
                    Play Sound
                  </button>
                  
                  <button 
                    onClick={handleClose}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold text-xl shadow-[0_6px_0_rgb(21,128,61)] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-8 h-8" />
                    Explore More
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
