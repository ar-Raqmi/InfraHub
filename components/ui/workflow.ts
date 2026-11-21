import { ProjectStatus } from '../../types';

/** The six project statuses in workflow order (types.ts enum order). */
export const STATUS_ORDER: ProjectStatus[] = Object.values(ProjectStatus);

export const statusIndex = (status: ProjectStatus): number => Math.max(0, STATUS_ORDER.indexOf(status));
