import { ReactNode } from "react";
import { SharedState, SharedAction } from "./SharedContextProvider";
import { Dispatch } from "react";
export interface ContextAwareProps {
    ctx?: SharedState;
    dispatch?: Dispatch<SharedAction>;
}
export interface CustomWidgetProps {
    children: ReactNode;
}
export default function CustomWidget({ children }: CustomWidgetProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=CustomWidget.d.ts.map