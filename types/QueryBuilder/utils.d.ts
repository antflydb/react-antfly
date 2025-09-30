export interface QueryItem {
    query?: unknown;
    combinator?: "AND" | "OR";
}
export interface Operator {
    value: string;
    text: string;
    useInput: boolean;
    query: (key: string | string[], value?: string) => unknown;
}
export interface Combinator {
    value: "AND" | "OR";
    text: string;
}
export interface Rule {
    key?: string;
}
export declare function mergedQueries(queries: QueryItem[]): Record<string, unknown>;
export declare const defaultOperators: Operator[];
export declare const defaultCombinators: Combinator[];
export declare function uuidv4(): string;
export declare function withUniqueKey<T extends Rule>(rules: T[]): (T & {
    key: string;
})[];
//# sourceMappingURL=utils.d.ts.map