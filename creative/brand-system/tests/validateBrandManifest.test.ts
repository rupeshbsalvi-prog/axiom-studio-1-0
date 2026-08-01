import { describe, expect, it } from 'vitest';
import { validateBrandManifest } from '../src/brand/core';

const validManifest = {
  id:'axiom-studio-brand-system',name:'AXIOM STUDIO',version:'1.0.0',status:'approved',
  tagline:'Imagine the Next',category:'AI-native Creative Operating System',
  authority:{sourceOfTruth:'config/brand.manifest.json',approverRole:'Brand Council',changePolicy:'controlled',runtimeEditingAllowed:false},
  security:{containsSecrets:false,externalRuntimeCode:false,networkDependencies:false,userSuppliedEndpoints:false},
  assets:{tokens:'./brand.tokens.json'}
} as const;

describe('validateBrandManifest', () => {
  it('accepts a bounded static manifest', () => {
    expect(validateBrandManifest(validManifest)).toEqual({ valid:true, issues:[] });
  });
  it('rejects runtime editing', () => {
    const result=validateBrandManifest({...validManifest,authority:{...validManifest.authority,runtimeEditingAllowed:true}});
    expect(result.valid).toBe(false);
  });
});
