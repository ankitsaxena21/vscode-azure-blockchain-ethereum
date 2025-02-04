// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ItemType } from '../ItemType';
import { ExtensionItem, ExtensionItemData } from './ExtensionItem';
import { NetworkNode } from './NetworkNode';

export type ProjectTypes = ItemType.AZURE_BLOCKCHAIN_PROJECT | ItemType.LOCAL_PROJECT;

export abstract class Project extends ExtensionItem {
  protected constructor(itemType: ProjectTypes, label: string, data: ExtensionItemData) {
    super(itemType, label, data);
  }

  public async getRPCAddress(): Promise<string> {
    const networkNodes = this.children.filter((child) => child instanceof NetworkNode) as NetworkNode[];
    if (networkNodes.length === 0) {
      return '';
    }

    // FIXME: suggest user the list of nodes
    return networkNodes[0].getRPCAddress();
  }
}
