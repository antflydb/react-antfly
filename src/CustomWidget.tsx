import React, { ReactNode } from "react";
import { useSharedContext, SharedState, SharedAction } from "./SharedContextProvider";
import { Dispatch } from "react";

// Interface for components that can receive context props
export interface ContextAwareProps {
  ctx?: SharedState;
  dispatch?: Dispatch<SharedAction>;
}

export interface CustomWidgetProps {
  children: ReactNode;
}

export default function CustomWidget({ children }: CustomWidgetProps) {
  const [ctx, dispatch] = useSharedContext();
  return (
    <>
      {React.Children.map(children, (child) => {
        // Only clone if it's a valid React element
        if (React.isValidElement(child)) {
          return React.cloneElement(
            child as React.ReactElement<ContextAwareProps>,
            {
              ctx,
              dispatch
            } as ContextAwareProps
          );
        }
        return child;
      })}
    </>
  );
}