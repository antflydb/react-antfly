import React, { ReactNode } from "react";
import { useSharedContext, SharedState, SharedAction } from "./SharedContextProvider";
import { Dispatch } from "react";

export interface CustomWidgetProps {
  children: ReactNode;
}

export default function CustomWidget({ children }: CustomWidgetProps) {
  const [ctx, dispatch] = useSharedContext();
  return (
    <>
      {React.Children.map(children, (child) =>
        React.cloneElement(child as React.ReactElement, {
          ctx,
          dispatch
        })
      )}
    </>
  );
}