import * as React from 'react';

export interface ListenerProps {
  children: React.ReactNode;
  onChange?: (params: Map<string, any>) => void;
}

declare const Listener: React.FC<ListenerProps>;
export default Listener;