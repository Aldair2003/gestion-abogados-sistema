import { Prisma, ActivityCategory } from '@prisma/client';

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface LogDetails extends Prisma.JsonObject {
  description: string;
  metadata: Record<string, any>;
  changes?: {
    before?: Record<string, JsonValue>;
    after?: Record<string, JsonValue>;
  };
}

export interface LogActivity {
  category: ActivityCategory;
  targetId?: number;
  details: LogDetails;
  isImportant?: boolean;
}

export type ActivityLogCreateInput = Prisma.ActivityLogCreateInput;
export type ActivityLogWhereInput = Prisma.ActivityLogWhereInput; 