import * as React from 'react';
import { AntflyState, AntflyAction } from './Antfly';

export interface CustomWidgetChildProps {
  ctx: AntflyState;
  dispatch: React.Dispatch<AntflyAction>;
}

export interface CustomWidgetProps {
  children: React.ReactElement<CustomWidgetChildProps> | React.ReactElement<CustomWidgetChildProps>[];
}

declare const CustomWidget: React.FC<CustomWidgetProps>;
export default CustomWidget;