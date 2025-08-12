export interface ThemeDefinition { id: string; name: string; className: string; palette: Record<string,string>; dark: boolean }
const baseThemes: ThemeDefinition[] = [
  { id: 'light', name: 'Clair', className: 'theme-light', dark: false, palette: { bg: '#ffffff', text: '#111827', primary: '#2563eb'} },
  { id: 'dark', name: 'Sombre', className: 'theme-dark', dark: true, palette: { bg: '#0f172a', text: '#f1f5f9', primary: '#3b82f6'} },
  { id: 'oled', name: 'OLED', className: 'theme-oled', dark: true, palette: { bg: '#000000', text: '#f8fafc', primary: '#2563eb'} },
  { id: 'high-contrast', name: 'Contraste', className: 'theme-high-contrast', dark: false, palette: { bg: '#ffffff', text: '#000000', primary: '#000000'} }
]
function applyPalette(theme: ThemeDefinition){
  const root = document.documentElement
  Object.entries(theme.palette).forEach(([k,v]) => { root.style.setProperty(`--theme-${k}`, v) })
  root.dataset.theme = theme.id
}
export class ThemeService { 
  private themes = new Map(baseThemes.map(t => [t.id, t] as const));
  list(){return [...this.themes.values()]};
  get(id:string){return this.themes.get(id)};
  register(theme:ThemeDefinition){ this.themes.set(theme.id, theme) }
  apply(id: string){ const t = this.get(id); if (t) applyPalette(t) }
}
export const THEME_SERVICE_TOKEN = 'ThemeService'
