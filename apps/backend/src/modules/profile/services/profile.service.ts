import { Profile, ProfileChanges } from '@/modules/profile/domain/profile';
import { ProfileRepository } from '@/modules/profile/repositories/profile.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { ConflictException, Injectable } from '@nestjs/common';

export const USERNAME_TAKEN_MESSAGE = 'That username is already taken';

// Prisma's unique-constraint violation: two people claimed the name at once.
const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  (error as { code?: unknown }).code === 'P2002';

@Injectable()
export class ProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async updateProfile(
    user: Identity,
    changes: ProfileChanges,
  ): Promise<Profile> {
    const data: ProfileChanges = {
      ...changes,
      // an empty bio means "no bio"
      ...(changes.bio !== undefined && { bio: changes.bio || null }),
    };

    if (
      data.username !== undefined &&
      (await this.profileRepository.isUsernameTaken(data.username, user.id))
    ) {
      throw new ConflictException(USERNAME_TAKEN_MESSAGE);
    }

    try {
      // the profile is always the caller's own — the id comes from the session
      return await this.profileRepository.updateProfile(user.id, data);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(USERNAME_TAKEN_MESSAGE);
      }
      throw error;
    }
  }
}
