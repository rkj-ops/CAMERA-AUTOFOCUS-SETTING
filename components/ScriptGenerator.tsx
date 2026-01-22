import React, { useState } from 'react';
import { CameraSettings, OS, ScriptGenerationParams, ScriptType } from '../types';
import { generateSystemScript } from '../services/geminiService';
import { Terminal, Copy, Loader2, Save, FileCode, Command } from 'lucide-react';

interface ScriptGeneratorProps {
  currentSettings: CameraSettings;
  cameraLabel: string;
}

export const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({ currentSettings, cameraLabel }) => {
  const [selectedOS, setSelectedOS] = useState<OS>(OS.WINDOWS);
  const [scriptType, setScriptType] = useState<ScriptType>('native');
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: ScriptGenerationParams = {
        os: selectedOS,
        cameraName: cameraLabel || 'Default Camera',
        settings: currentSettings,
        scriptType: scriptType
      };
      const script = await generateSystemScript(params);
      setGeneratedScript(script);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedScript) {
      navigator.clipboard.writeText(generatedScript);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-green-400" />
          Startup Script Generator
        </h2>
        <div className="flex gap-2 bg-gray-900 p-1 rounded-lg">
          {(Object.values(OS) as OS[]).map((os) => (
            <button
              key={os}
              onClick={() => setSelectedOS(os)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                selectedOS === os
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {os}
            </button>
          ))}
        </div>
      </div>

      <div className="flex bg-gray-900 p-1 rounded-lg mb-4 w-full">
        <button
          onClick={() => setScriptType('native')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
            scriptType === 'native' 
              ? 'bg-gray-700 text-white shadow-sm' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <Command className="w-4 h-4" />
          Native Shell (Bash/PS)
        </button>
        <button
          onClick={() => setScriptType('python')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
            scriptType === 'python' 
              ? 'bg-gray-700 text-white shadow-sm' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <FileCode className="w-4 h-4" />
          Python (Standalone)
        </button>
      </div>

      <p className="text-gray-400 text-sm mb-4">
        {scriptType === 'native' 
          ? "Generates a shell script (PowerShell or Bash) using system tools. Lightweight, but relies on installed utilities like v4l2-ctl or specific Windows commands."
          : "Generates a Python script. Can be compiled into a standalone .exe file that runs without Python installed. Ideal for portability across similar systems."
        }
      </p>

      <button
        onClick={handleGenerate}
        disabled={isLoading}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Generate {scriptType === 'python' ? 'Python' : 'System'} Script
      </button>

      {error && (
        <div className="bg-red-900/50 border border-red-800 text-red-200 p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {generatedScript && (
        <div className="flex-1 min-h-0 relative group rounded-lg overflow-hidden border border-gray-700 bg-gray-950">
          <button
            onClick={copyToClipboard}
            className="absolute top-2 right-2 p-2 bg-gray-800/80 hover:bg-gray-700 text-gray-300 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy to Clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>
          <div className="h-full overflow-auto scrollbar-thin p-4">
            <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap">
              {generatedScript}
            </pre>
          </div>
        </div>
      )}
      
      {!generatedScript && !isLoading && (
        <div className="flex-1 flex items-center justify-center border border-dashed border-gray-700 rounded-lg bg-gray-800/50">
          <span className="text-gray-500 text-sm">Select options and click Generate</span>
        </div>
      )}
    </div>
  );
};