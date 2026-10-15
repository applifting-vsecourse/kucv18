export const POLL_MIN_OPTIONS = 2;
export const POLL_MAX_OPTIONS = 6;
export const POLL_OPTION_MAX_LENGTH = 80;

export type PollOption = {
  id: string;
  text: string;
  votes: number;
};

export type Poll = {
  id: string;
  options: PollOption[];
  totalVotes: number;
  // The option the requesting user voted for. Other people's votes are never
  // exposed — only the counts.
  myVoteOptionId: string | null;
};
