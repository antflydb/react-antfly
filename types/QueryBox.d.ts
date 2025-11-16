import { ReactNode } from 'react';
export interface QueryBoxProps {
    id: string;
    mode?: "live" | "submit";
    initialValue?: string;
    placeholder?: string;
    children?: ReactNode;
    buttonLabel?: string;
    onSubmit?: (value: string) => void;
    onInputChange?: (value: string) => void;
    onEscape?: (clearInput: () => void) => boolean;
}
export default function QueryBox({ id, mode, initialValue, placeholder, children, buttonLabel, onSubmit, onInputChange, onEscape, }: QueryBoxProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=QueryBox.d.ts.map