// =============================================================================
// Best Practices Feature Components
// Re-exports all Best Practices related components
// =============================================================================

// BestPracticeCard
export { BestPracticeCard } from "./best-practice-card";
export type {
  BestPracticeCardProps,
  BestPracticeCardData,
  BestPracticeCategory,
} from "./best-practice-card";
export { categoryConfig } from "./best-practice-card";

// CategoryFilter
export { CategoryFilter } from "./category-filter";
export type {
  CategoryFilterProps,
  CategoryFilterValue,
} from "./category-filter";

// CommentSection
export { CommentSection } from "./comment-section";
export type {
  CommentSectionProps,
  CommentData,
} from "./comment-section";
