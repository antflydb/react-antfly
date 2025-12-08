import { default as React, ReactNode } from 'react';
/**
 * Props passed to custom input components via renderInput.
 * Custom inputs must call onChange when value changes and onSubmit for form submission.
 */
export interface CustomInputProps {
    /** Current input value */
    value: string;
    /** Called when the input value changes */
    onChange: (value: string) => void;
    /** Called to submit the current value */
    onSubmit: (value: string) => void;
    /** Keyboard event handler - custom input should forward keyboard events */
    onKeyDown: (event: React.KeyboardEvent) => void;
    /** Whether the autosuggest dropdown is open */
    isSuggestOpen: boolean;
    /** Close the autosuggest dropdown */
    onSuggestClose: () => void;
    /** Placeholder text */
    placeholder?: string;
    /** Whether the input is disabled */
    disabled?: boolean;
    /** ID for the input element */
    id?: string;
}
export interface QueryBoxProps {
    id: string;
    mode?: 'live' | 'submit';
    initialValue?: string;
    placeholder?: string;
    children?: ReactNode;
    buttonLabel?: string;
    onSubmit?: (value: string) => void;
    onInputChange?: (value: string) => void;
    onEscape?: (clearInput: () => void) => boolean;
    /**
     * Custom input renderer. When provided, replaces the default <input> element.
     * The custom component receives props for value management, submission, and keyboard handling.
     * Note: When renderInput is provided, QueryBox does not wrap content in a <form> element,
     * as custom inputs like PromptInput may have their own form handling.
     */
    renderInput?: (props: CustomInputProps) => React.ReactNode;
}
export default function QueryBox({ id, mode, initialValue, placeholder, children, buttonLabel, onSubmit, onInputChange, onEscape, renderInput, }: QueryBoxProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=QueryBox.d.ts.map