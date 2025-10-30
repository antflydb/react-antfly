import { ReactNode } from 'react';
export interface AntflyProps {
    children: ReactNode;
    url: string;
    table: string;
    onChange?: (params: Map<string, unknown>) => void;
    headers?: Record<string, string>;
}
export default function Antfly({ children, url, table, onChange, headers }: AntflyProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Antfly.d.ts.map