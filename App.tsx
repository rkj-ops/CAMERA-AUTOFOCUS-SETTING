import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, RefreshCw, AlertCircle, Settings2, Video, Lock } from 'lucide-react';
import { CameraDevice, CameraCapabilities, CameraSettings } from './types';
import { ControlSlider } from './components/ControlSlider';
import { ScriptGenerator } from './components/ScriptGenerator';

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Capabilities supported by the hardware
  const [capabilities, setCapabilities] = useState<CameraCapabilities>({});
  
  // Current active settings
  const [settings, setSettings] = useState<CameraSettings>({
    focusMode: 'continuous',
    focusDistance: 0,
    zoom: 1,
    brightness: 100,
    contrast: 100,
  });

  // Get list of cameras
  const getCameras = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true }); // Request perm first
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 5)}...`
        }));
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      setError("Failed to access camera permissions. Please allow camera access.");
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    getCameras();
  }, [getCameras]);

  // Start stream and read capabilities
  const startStream = useCallback(async () => {
    if (!selectedDeviceId) return;

    // Stop previous stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: selectedDeviceId },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          // Try to request capabilities immediately if possible
          advanced: [{ focusMode: 'continuous' } as any] 
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const track = stream.getVideoTracks()[0];
      const caps = track.getCapabilities() as CameraCapabilities;
      const currentSettings = track.getSettings();

      setCapabilities(caps);
      
      // Initialize state with current hardware values
      setSettings(prev => ({
        ...prev,
        // @ts-ignore
        focusMode: currentSettings.focusMode || 'continuous',
        // @ts-ignore
        focusDistance: currentSettings.focusDistance || caps.focusDistance?.min || 0,
        // @ts-ignore
        zoom: currentSettings.zoom || caps.zoom?.min || 1,
        // @ts-ignore
        brightness: currentSettings.brightness || caps.brightness?.min || 100,
        // @ts-ignore
        contrast: currentSettings.contrast || caps.contrast?.min || 100,
      }));
      
      setError(null);

    } catch (err) {
      console.error(err);
      setError("Failed to start video stream. The camera might be in use by another app.");
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    if (selectedDeviceId) {
      startStream();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedDeviceId, startStream]);

  // Apply constraints when settings change
  const applyConstraint = async (constraint: any) => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [constraint]
      });
    } catch (err) {
      console.warn("Failed to apply constraint:", constraint, err);
    }
  };

  const updateSetting = (key: keyof CameraSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    applyConstraint({ [key]: value });
  };

  const toggleFocusMode = () => {
    const newMode = settings.focusMode === 'continuous' ? 'manual' : 'continuous';
    updateSetting('focusMode', newMode);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8 font-sans">
      
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-purple-500 flex items-center gap-3">
            <Lock className="w-8 h-8 text-primary-500" />
            FocusLock
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Webcam Control & Persistence Utility</p>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-800 p-2 rounded-lg border border-gray-700 shadow-sm">
          <Video className="w-5 h-5 text-gray-400" />
          <select 
            value={selectedDeviceId} 
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm font-medium text-white max-w-[200px] truncate"
          >
            {devices.map(d => (
              <option key={d.deviceId} value={d.deviceId} className="bg-gray-800">
                {d.label}
              </option>
            ))}
          </select>
          <button onClick={getCameras} className="p-1 hover:bg-gray-700 rounded-full transition-colors" title="Refresh Devices">
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
        
        {/* Left Col: Preview & Live Controls */}
        <div className="lg:col-span-7 flex flex-col gap-6 h-full">
          
          {/* Video Preview */}
          <div className="bg-black rounded-xl overflow-hidden border border-gray-700 shadow-2xl relative aspect-video flex items-center justify-center group">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-contain"
            />
            {error && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-red-400 p-6 text-center">
                <AlertCircle className="w-12 h-12 mb-2" />
                <p>{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 px-4 py-2 bg-red-900/50 rounded hover:bg-red-900 transition"
                >
                  Reload App
                </button>
              </div>
            )}
            <div className="absolute top-4 left-4 px-2 py-1 bg-black/50 backdrop-blur rounded text-xs text-gray-300 font-mono">
              LIVE PREVIEW
            </div>
          </div>

          {/* Quick Controls */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex-1">
            <div className="flex items-center gap-2 mb-6">
              <Settings2 className="w-5 h-5 text-primary-500" />
              <h2 className="text-xl font-bold">Live Adjustments</h2>
            </div>

            <div className="space-y-6">
              {/* Autofocus Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div>
                  <h3 className="font-medium text-white">Autofocus</h3>
                  <p className="text-xs text-gray-400">
                    {settings.focusMode === 'continuous' ? 'Camera is adjusting focus automatically' : 'Focus is locked to manual value'}
                  </p>
                </div>
                <button
                  onClick={toggleFocusMode}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    settings.focusMode === 'continuous'
                      ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.3)]'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {settings.focusMode === 'continuous' ? 'AUTO' : 'MANUAL'}
                </button>
              </div>

              {/* Manual Focus Slider - Only enabled if manual mode OR if user forces it */}
              <ControlSlider
                label="Manual Focus Distance"
                value={settings.focusDistance}
                min={capabilities.focusDistance?.min ?? 0}
                max={capabilities.focusDistance?.max ?? 1}
                step={capabilities.focusDistance?.step ?? 0.01}
                onChange={(val) => updateSetting('focusDistance', val)}
                disabled={settings.focusMode === 'continuous'}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ControlSlider
                  label="Zoom"
                  value={settings.zoom}
                  min={capabilities.zoom?.min ?? 1}
                  max={capabilities.zoom?.max ?? 5}
                  step={capabilities.zoom?.step ?? 0.1}
                  onChange={(val) => updateSetting('zoom', val)}
                  unit="x"
                />
                <ControlSlider
                  label="Brightness"
                  value={settings.brightness}
                  min={capabilities.brightness?.min ?? 0}
                  max={capabilities.brightness?.max ?? 255}
                  step={capabilities.brightness?.step ?? 1}
                  onChange={(val) => updateSetting('brightness', val)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Script Generator */}
        <div className="lg:col-span-5 h-full">
           <ScriptGenerator 
             currentSettings={settings} 
             cameraLabel={devices.find(d => d.deviceId === selectedDeviceId)?.label || ''} 
           />
        </div>

      </main>
    </div>
  );
};

export default App;