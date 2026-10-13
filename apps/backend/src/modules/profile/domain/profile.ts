import { Mood } from '@/modules/quack/domain/quack';

export type Profile = {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  defaultMood: Mood | null;
};

// `undefined` leaves a field alone; `null` clears it (bio, defaultMood).
export type ProfileChanges = {
  name?: string;
  username?: string;
  bio?: string | null;
  defaultMood?: Mood | null;
};
