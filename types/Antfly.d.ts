import { ReactNode } from "react";
export interface AntflyProps {
    children: ReactNode;
    url: string;
    onChange?: (params: Map<string, unknown>) => void;
    headers?: Record<string, string>;
}
export default function Antfly({ children, url, onChange, headers }: AntflyProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Antfly.d.ts.map