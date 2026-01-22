export interface CameraDevice {
  deviceId: string;
  label: string;
}

export interface CameraCapabilities {
  focusMode?: string[];
  focusDistance?: { min: number; max: number; step: number };
  zoom?: { min: number; max: number; step: number };
  brightness?: { min: number; max: number; step: number };
  contrast?: { min: number; max: number; step: number };
  saturation?: { min: number; max: number; step: number };
  sharpness?: { min: number; max: number; step: number };
}

export interface CameraSettings {
  focusMode: 'continuous' | 'manual';
  focusDistance: number;
  zoom: number;
  brightness: number;
  contrast: number;
}

export enum OS {
  WINDOWS = 'Windows',
  LINUX = 'Linux',
  MACOS = 'macOS'
}

export type ScriptType = 'native' | 'python';

export interface ScriptGenerationParams {
  os: OS;
  cameraName: string;
  settings: CameraSettings;
  scriptType: ScriptType;
}