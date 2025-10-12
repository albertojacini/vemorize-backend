/**
 * Navigation data contracts
 * Base interfaces shared between frontend and backend
 */

export interface NavigationData {
  id: string;
  userId: string;
  courseId: string;
  currentLeafId: string;
  createdAt: string;
  updatedAt: string;
}