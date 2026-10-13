import { openAPI, username } from 'better-auth/plugins';
import { BetterAuthOptions } from 'better-auth/types';

export const betterAuthCoreConfig: BetterAuthOptions = {
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'user',
        input: false,
      },
      // Edited through PATCH /api/me, which validates them; they are listed here
      // so they come back on the session.
      bio: { type: 'string', required: false, input: false },
      defaultMood: { type: 'string', required: false, input: false },
    },
  },
  plugins: [openAPI(), username()],
};
