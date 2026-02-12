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
  opacity: number;
}

export interface TextStroke {
  color: string;
  width: number;
  enabled: boolean;
}

export interface TextGradient {
  type: 'linear' | 'radial';
  colors: { offset: number; color: string }[];
  angle: number;
}

export interface CanvasObject {
  id: string;
  type: 'text' | 'image' | 'shape';
  text?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  draggable: boolean;
  scaleX: number;
  scaleY: number;
  rotation: number;
  locked: boolean;
  visible: boolean;
  opacity: number;
  // Advanced Styling
  shadow?: TextShadow;
  stroke?: TextStroke;
  gradient?: TextGradient;
  letterSpacing?: number;
  lineHeight?: number;
  fontStyle?: string;
  textDecoration?: string;
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
}
