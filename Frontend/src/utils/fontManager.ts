/**
 * FontManager - Handles dynamic font loading and custom uploads.
 */

export const loadGoogleFont = (fontFamily: string) => {
  if (!fontFamily) return;
  
  const id = `font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return; // Already loaded

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@300;400;500;700;900&display=swap`;
  document.head.appendChild(link);
};

export const uploadCustomFont = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fontData = e.target?.result as ArrayBuffer;
        const fontName = file.name.split('.')[0];
        const fontFace = new FontFace(fontName, fontData);
        
        await fontFace.load();
        document.fonts.add(fontFace);
        
        resolve(fontName);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const commonFonts = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 
  'Oswald', 'Source Sans Pro', 'Slabo 27px', 'Raleway', 
  'PT Sans', 'Merriweather', 'Nunito', 'Playfair Display',
  'Rubik', 'Lora', 'Fira Sans', 'Work Sans', 'Quicksand'
];

export const displayFonts = [
  'Lobster', 'Pacifico', 'Abril Fatface', 'Bebas Neue', 'Anton',
  'Dancing Script', 'Shadows Into Light', 'Righteous', 'Russo One',
  'Bungee', 'Permanent Marker', 'Orbitron', 'Cinzel', 'Monoton',
  'Press Start 2P', 'Bangers', 'Creepster', 'Fascinate', 'Modak'
];
