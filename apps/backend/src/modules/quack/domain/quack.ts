import { Poll } from '@/modules/poll/domain/poll';

export const MOODS = ['happy', 'sad', 'angry', 'silly'] as const;

export type Mood = (typeof MOODS)[number];

export type QuackAuthor = {
  id: string;
  name: string;
  username: string;
};

export type Quack = {
  id: string;
  // null on a tombstone (docs/adr/0001)
  text: string | null;
  mood: Mood | null;
  userId: string;
  // set on a reply; replies are one level deep
  parentId: string | null;
  // set only on a top-level quack that still has replies
  deletedAt: Date | null;
  // counted on read, never stored
  replyCount: number;
  createdAt: Date;
  updatedAt: Date;
  user?: QuackAuthor;
  poll?: Poll | null;
  // only loaded when a thread is read
  replies?: Quack[];
};
