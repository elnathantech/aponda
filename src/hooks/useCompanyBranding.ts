import { useEffect } from 'react';
import { useCompany } from '@/hooks/useCompany';

/**
 * Convert a hex color (#RRGGBB) to "H S% L%" string for HSL CSS variables.
 * Returns null if input is not a valid hex.
 */
function hexToHslVar(hex: string | null | undefined): string | null {
  if (!hex) return null;
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const intVal = parseInt(m[1], 16);
  const r = ((intVal >> 16) & 255) / 255;
  const g = ((intVal >> 8) & 255) / 255;
  const b = (intVal & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  const H = Math.round(h * 360);
  const S = Math.round(s * 100);
  const L = Math.round(l * 100);
  return `${H} ${S}% ${L}%`;
}

/**
 * Applies the company brand color to the workspace by overriding
 * --primary, --ring and --sidebar-primary CSS variables.
 */
export function useApplyCompanyBranding(companyId: string | undefined) {
  const { data: company } = useCompany(companyId);

  useEffect(() => {
    const root = document.documentElement;
    const hsl = hexToHslVar(company?.brand_color);

    if (hsl) {
      root.style.setProperty('--primary', hsl);
      root.style.setProperty('--ring', hsl);
      root.style.setProperty('--sidebar-primary', hsl);
      root.style.setProperty('--sidebar-ring', hsl);
    }

    return () => {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--sidebar-primary');
      root.style.removeProperty('--sidebar-ring');
    };
  }, [company?.brand_color]);

  return company;
}
