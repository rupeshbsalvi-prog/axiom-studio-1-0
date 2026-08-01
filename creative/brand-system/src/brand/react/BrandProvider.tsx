import { createContext, type PropsWithChildren, useContext, useMemo } from 'react';
import type { BrandManifest } from '../core';
import { validateBrandManifest } from '../core';

const BrandContext = createContext<BrandManifest | null>(null);
export interface BrandProviderProps extends PropsWithChildren { manifest: BrandManifest; }

export function BrandProvider({ manifest, children }: BrandProviderProps) {
  const value = useMemo(() => {
    const result = validateBrandManifest(manifest);
    if (!result.valid) {
      throw new Error(`Invalid brand manifest: ${result.issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ')}`);
    }
    return Object.freeze({ ...manifest });
  }, [manifest]);
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandManifest {
  const value = useContext(BrandContext);
  if (!value) throw new Error('useBrand must be used within BrandProvider.');
  return value;
}
