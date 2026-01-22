import React, { useState } from 'react';
import { CameraSettings, OS, ScriptGenerationParams, ScriptType } from '../types';
import { generateSystemScript } from '../services/geminiService';
import { Terminal, Copy, Loader2, Save, FileCode, Command, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ScriptGeneratorProps {
  currentSettings: CameraSettings;
  cameraLabel: string;
}

export const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({ currentSettings, cameraLabel }) => {
  const [selectedOS, setSelectedOS] = useState<OS>(OS.WINDOWS);
  const [scriptType, setScriptType] = useState<ScriptType>('python');
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
          Persistence Script
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
          onClick={() => setScriptType('python')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
            scriptType === 'python' 
              ? 'bg-gray-700 text-white shadow-sm' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <FileCode className="w-4 h-4" />
          Python (Recommended)
        </button>
        <button
          onClick={() => setScriptType('native')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
            scriptType === 'native' 
              ? 'bg-gray-700 text-white shadow-sm' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <Command className="w-4 h-4" />
          Shell Script
        </button>
      </div>

      <p className="text-gray-400 text-xs mb-4 leading-relaxed">
        {scriptType === 'native' 
          ? "Generates a shell script. Good for Linux (Bash). For Windows, Python is recommended as native PowerShell lacks webcam controls."
          : "Generates a standalone script using OpenCV. Can be compiled to .exe (Windows) or binary (Linux/Mac) and runs reliably on startup."
        }
      </p>

      <button
        onClick={handleGenerate}
        disabled={isLoading}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Generate Script
      </button>

      {error && (
        <div className="bg-red-900/50 border border-red-800 text-red-200 p-4 rounded-lg text-sm mb-4">
          <div className="flex items-center gap-2 font-bold mb-2 text-red-100">
            <AlertCircle className="w-5 h-5" />
            <span>Generation Failed</span>
          </div>
          <p>{error}</p>
        </div>
      )}

      {generatedScript && (
        <div className="flex-1 min-h-0 relative group rounded-lg overflow-hidden border border-gray-700 bg-gray-950 flex flex-col">
          <div className="absolute top-2 right-2 flex gap-2">
             <span className="text-xs text-green-500 bg-green-900/30 px-2 py-1 rounded flex items-center gap-1">
               <CheckCircle2 className="w-3 h-3" /> Ready
             </span>
             <button
              onClick={copyToClipboard}
              className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md transition-colors"
              title="Copy to Clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          
          <div className="h-full overflow-auto scrollbar-thin p-4 pt-10">
            <pre className="text-sm font-mono text-blue-300 whitespace-pre-wrap">
              {generatedScript}
            </pre>
          </div>
        </div>
      )}
      
      {!generatedScript && !isLoading && !error && (
        <div className="flex-1 flex items-center justify-center border border-dashed border-gray-700 rounded-lg bg-gray-800/50">
          <span className="text-gray-500 text-sm text-center px-4">
            Adjust settings on the left,<br/>then click Generate to create a startup script.
          </span>
        </div>
      )}
    </div>
  );
};