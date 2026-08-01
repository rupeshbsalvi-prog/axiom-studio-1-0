import { BaseRegistry } from "./Registry";

export class AssetRegistry extends BaseRegistry<any> {
  override validate(entry: any): boolean {
    return super.validate(entry);
  }
}

export const assetRegistry = new AssetRegistry();
