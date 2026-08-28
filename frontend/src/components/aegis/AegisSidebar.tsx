/**
 * AegisSidebar — now delegates to the full LayerPanel accordion.
 * This file is kept for backward compatibility; the UI is in LayerPanel.tsx.
 */
import React from 'react';
import { LayerPanel } from './LayerPanel';

export const AegisSidebar: React.FC = () => {
  return <LayerPanel />;
};
