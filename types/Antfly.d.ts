import * as React from 'react';

export interface Widget {
  id: string;
  needsQuery?: boolean;
  needsConfiguration?: boolean;
  isFacet?: boolean;
  wantResults?: boolean;
  query?: any;
  semanticQuery?: any;
  isSemantic?: boolean;
  value?: any;
  configuration?: any;
  result?: any;
}

export interface AntflyState {
  url: string;
  listenerEffect: any;
  widgets: Map<string, Widget>;
  headers?: Record<string, string>;
}

export interface AntflyAction {
  type: 'setWidget' | 'deleteWidget' | 'setListenerEffect';
  key?: string;
  value?: any;
  needsQuery?: boolean;
  needsConfiguration?: boolean;
  isFacet?: boolean;
  wantResults?: boolean;
  query?: any;
  semanticQuery?: any;
  isSemantic?: boolean;
  configuration?: any;
  result?: any;
}

export interface AntflyProps {
  children: React.ReactNode;
  url: string;
  onChange?: (state: AntflyState) => void;
  headers?: Record<string, string>;
}

declare const Antfly: React.FC<AntflyProps>;
export default Antfly;