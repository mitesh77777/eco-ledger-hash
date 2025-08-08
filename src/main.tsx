import { createRoot } from 'react-dom/client'
import { Buffer } from 'buffer'
import process from 'process'
import App from './App.tsx'
import './index.css'

// Polyfills for browser compatibility
// @ts-ignore
window.global = window as any;
// @ts-ignore
window.Buffer = window.Buffer || Buffer;
// @ts-ignore
window.process = window.process || process;

createRoot(document.getElementById("root")!).render(<App />);
