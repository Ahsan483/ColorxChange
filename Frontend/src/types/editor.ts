export interface ColorChange {
  original: string;
  newColor: string;
  transparent: boolean;
  brightness: number;
}

export interface TextShadow {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  opacity?: number;
}

export interface TextGradient {
  type: 'linear' | 'radial';
  rotation: number;
  stops: { offset: number; color: string }[];
}

export interface FillPattern {
  source: string;
  repeat: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat';
  scaleX: number;
  scaleY: number;
  rotation: number;
}

export interface AdvancedStroke {
  id: string;
  color: string;
  width: number;
  opacity: number;
}

export interface AdvancedShadow {
  id: string;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
}

export interface CanvasObject {
  // ... existing props ...
  id: string;
  type: 'text' | 'image' | 'shape' | 'line';
  text?: string;
  points?: number[];
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  
  // Fill System
  fill?: string;
  fillType?: 'solid' | 'gradient' | 'pattern';
  gradient?: TextGradient; 
  pattern?: FillPattern;
  noise?: number;

  // Advanced Effects
  strokes?: AdvancedStroke[];
  shadows?: AdvancedShadow[];
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';
  warp?: {
    style: 'none' | 'arc' | 'arc-lower' | 'arch' | 'wave';
    amount: number;
  };
  threeD?: {
    enabled: boolean;
    depth: number;
    rotationX: number;
    rotationY: number;
    rotationZ: number;
    materialType: 'standard' | 'metal' | 'glass' | 'neon';
    color?: string;
  };

  // Legacy (Keep for migration or simple objects)
  stroke?: string; 
  strokeWidth?: number;
  shadow?: TextShadow;

  // Image Specific
  src?: string;
  crop?: { x: number; y: number; width: number; height: number };

  draggable: boolean;
  scaleX: number;
  scaleY: number;
  rotation: number;
  locked: boolean;
  visible: boolean;
  opacity: number;
  
  // Typography
  letterSpacing?: number;
  lineHeight?: number;
  fontStyle?: string;
  tension?: number;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
  align?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  direction?: 'ltr' | 'rtl';
  textDecoration?: 'underline' | 'line-through' | '';
}

export interface HistoryState {
  canvasObjects: CanvasObject[];
  selectedColors: ColorChange[];
  uploadedFile: string | null;
  activeLayerId: string | null;
}

export interface EditorState {
  uploadedFile: string | null;
  fileType: string | null;
  canvasObjects: CanvasObject[];
  selectedColors: ColorChange[];
  colorHistory: ColorChange[];
  tolerance: number;
  brightness: number;
  contrast: number;
  saturation: number;
  zoomLevel: number;
  isDrawingMode: boolean;
  brushColor: string;
  activeLayerId: string | null;
  realTimePreview: boolean;
  selectedTool: string;
  theme: 'dark' | 'light' | 'amoled';
  history: HistoryState[];
  historyIndex: number;

  // Auth & Project
  user: any | null;
  token: string | null;
  currentProjectId: string | null;
  activeProjectName: string;
  isSaving: boolean;
  lastSavedAt: Date | null;
  isAuthModalOpen: boolean;
}
