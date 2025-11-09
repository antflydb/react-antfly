/**
 * Default renderer for thumbs up/down feedback (scale=1)
 * @param currentRating - The currently selected rating (0 or 1), or null if not rated
 * @param onRate - Callback to set the rating
 */
export declare function renderThumbsUpDown(currentRating: number | null, onRate: (rating: number) => void): import("react/jsx-runtime").JSX.Element;
/**
 * Default renderer for star rating (scale=4 for 5 stars: 0-4)
 * @param currentRating - The currently selected rating (0-4), or null if not rated
 * @param onRate - Callback to set the rating
 */
export declare function renderStars(currentRating: number | null, onRate: (rating: number) => void): import("react/jsx-runtime").JSX.Element;
/**
 * Default renderer for numeric scale (works with any scale value)
 * @param currentRating - The currently selected rating (0-scale), or null if not rated
 * @param onRate - Callback to set the rating
 * @param scale - Maximum value of the scale (e.g., 4 for 0-4)
 */
export declare function renderNumeric(currentRating: number | null, onRate: (rating: number) => void, scale: number): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=feedback-renderers.d.ts.map