import { GoogleGenAI } from "@google/genai";
import { ScriptGenerationParams, OS } from "../types";

const generateSystemScript = async (params: ScriptGenerationParams): Promise<string> => {
  // Safe access to process.env to avoid ReferenceErrors in strict browser environments
  const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;

  if (!apiKey) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable in your deployment settings.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  let prompt = '';

  if (params.scriptType === 'python') {
    prompt = `
    You are an expert system automation engineer.
    The user wants a Python script to enforce webcam settings.
    CRITICAL REQUIREMENT: The user intends to compile this script into a standalone executable (e.g., .exe for Windows) so it can run on systems WITHOUT Python installed.

    Target OS: ${params.os}
    Camera Name: "${params.cameraName}"
    
    Desired Settings:
    - Autofocus: ${params.settings.focusMode === 'continuous' ? 'On' : 'Off (Manual)'}
    - Focus Distance: ${params.settings.focusDistance}
    - Zoom: ${params.settings.zoom}
    - Brightness: ${params.settings.brightness}
    - Contrast: ${params.settings.contrast}

    Task:
    Generate a Python script.
    
    Requirements:
    1. Use a robust library like 'opencv-python' (cv2) or standard platform libraries ('ctypes' for Windows DirectShow if cv2 is unreliable for specific focus control, or 'v4l2' ioctls for Linux). Prefer OpenCV for simplicity if it supports the properties, but ensure it works.
    2. The script must attempt to find the camera by name or try the first available index.
    3. The script should apply the settings and exit.
    
    Documentation Requirements (Include as a comment block at the VERY TOP of the code):
    1. List necessary pip packages (e.g., 'pip install opencv-python pyinstaller').
    2. Provide the EXACT command to compile this script into a standalone executable using PyInstaller (e.g., 'pyinstaller --onefile --noconsole script.py').
    3. Explain how to schedule the resulting executable on startup (Task Scheduler/Cron).

    Output Format:
    Return ONLY the markdown code block containing the Python code.
    `;
  } else {
    // Native Shell Script Logic
    prompt = `
    You are an expert system automation engineer.
    The user wants to persist webcam settings for their device so they remain set even after a reboot.
    
    Target OS: ${params.os}
    Camera Name: "${params.cameraName}"
    
    Desired Settings:
    - Autofocus: ${params.settings.focusMode === 'continuous' ? 'On' : 'Off (Manual)'}
    - Focus Distance: ${params.settings.focusDistance} (Normalized value 0-1 or raw driver value)
    - Zoom: ${params.settings.zoom}
    - Brightness: ${params.settings.brightness}
    - Contrast: ${params.settings.contrast}

    Task:
    Generate a complete, ready-to-use script (PowerShell for Windows, Bash for Linux/macOS) that applies these settings.
    
    Specific Requirements:
    1. If Windows, use PowerShell. Suggest using 'FocusLock' helper or generic 'DirectShow' interface via ffmpeg or similar if native cmdlets aren't available. If specific Logitech CLI tools (like Logi Tune or GHub) are common, mention how to interface with them, but prefer a generic DirectShow approach if possible. 
    2. If Linux, use 'v4l2-ctl'. This is the standard.
    3. Include comments explaining exactly how to run this script on startup (e.g., Task Scheduler for Windows, Cron or systemd for Linux).
    4. Make the script robust.
    
    Output Format:
    Return ONLY the markdown code block containing the script and the setup instructions. Do not include conversational filler before or after.
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Gemini generation error:", error);
    throw error; // Re-throw to be handled by the UI
  }
};

export { generateSystemScript };