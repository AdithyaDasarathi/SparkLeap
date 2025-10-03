export type NotionDatabasePropertyType =
  | 'title'
  | 'rich_text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'people'
  | 'relation'
  | 'checkbox'
  | 'status'
  | 'url'
  | 'email'
  | 'phone_number';

export interface NotionDatabaseProperty {
  name: string;
  type: NotionDatabasePropertyType;
  id?: string;
}

export interface NotionPropertyMapping {
  title?: string;
  status?: string;
  assignee?: string;
  dueDate?: string;
  completedAt?: string;
  createdTime?: string;
  lastEditedTime?: string;
  projectRelation?: string;
  priority?: string;
  estimate?: string;
  tags?: string;
  archived?: string;
  parentTaskRelation?: string;
  activeStatusValues?: string[];
  completedStatusValues?: string[];
  backlogStatusValues?: string[];
}

export interface NotionDatabaseRecord {
  id: string; // database_id
  userId: string;
  name: string;
  selected: boolean;
  properties: NotionDatabaseProperty[];
  propertyMapping?: NotionPropertyMapping;
  lastEditedTimeCheckpoint?: string; // ISO timestamp for incremental sync
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface NotionUserRecord {
  notionUserId: string;
  userId: string; // local user id
  name?: string;
  email?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface NotionTaskRecord {
  pageId: string;
  databaseId: string; // FK to NotionDatabaseRecord.id
  userId: string; // local user id
  title?: string;
  status?: string;
  assigneeIds?: string[]; // notion user ids
  createdAt?: string; // ISO
  dueAt?: string; // ISO
  completedAt?: string; // ISO
  priority?: string;
  estimate?: number | null;
  tags?: string[];
  lastEditedTime?: string; // ISO
  archived?: boolean;
  projectRelationIds?: string[];
  parentTaskId?: string | null;
  // Derived fields (optional)
  firstInProgressAt?: string; // ISO
}

export interface ExecutionSnapshotRecord {
  id: string;
  userId: string;
  weekStart: string; // ISO Monday 00:00 UTC
  completedTasks: number;
  onTimeRate: number; // 0..1
  medianCycleTimeDays: number | null;
  wipCount: number;
  overdueOpen: number;
  focusBreakdown: Record<string, number>; // e.g., by project/tag
  createdAt: string; // ISO
}


