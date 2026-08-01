import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'..');
const manifest=JSON.parse(await readFile(resolve(root,'config/brand.manifest.json'),'utf8'));
const errors=[];
for (const key of ['id','name','version','status','tagline','category']) {
  if (typeof manifest[key] !== 'string' || manifest[key].trim()==='') errors.push(`${key} must be a non-empty string`);
}
if (manifest.id!=='axiom-studio-brand-system') errors.push('unexpected manifest id');
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(manifest.version)) errors.push('version must use semantic versioning');
if (manifest.authority?.runtimeEditingAllowed!==false) errors.push('runtime brand editing must remain disabled');
for (const key of ['containsSecrets','externalRuntimeCode','networkDependencies','userSuppliedEndpoints']) {
  if (manifest.security?.[key]!==false) errors.push(`security.${key} must be false`);
}
for (const [name,relativePath] of Object.entries(manifest.assets??{})) {
  const path=resolve(root,'config',relativePath.replace(/^\.\//,''));
  try { JSON.parse(await readFile(path,'utf8')); }
  catch (error) { errors.push(`${name} cannot be loaded: ${error.message}`); }
}
if (errors.length) { console.error('Brand validation failed:\n- '+errors.join('\n- ')); process.exit(1); }
console.log(`Brand validation passed: ${manifest.name} ${manifest.version}`);
