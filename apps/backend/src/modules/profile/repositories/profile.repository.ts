import { PrismaService } from '@/core/prisma/prisma.service';
import { User as PrismaUser } from '@/generated/prisma/client';
import { Profile, ProfileChanges } from '@/modules/profile/domain/profile';
import { Injectable } from '@nestjs/common';

const mapPrismaUserToDomain = (user: PrismaUser): Profile => ({
  id: user.id,
  name: user.name,
  username: user.username ?? '',
  bio: user.bio,
  defaultMood: user.defaultMood,
});

/** The only place that knows profile data lives on the Prisma `User` row. */
@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async isUsernameTaken(
    username: string,
    exceptUserId: string,
  ): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        username: { equals: username, mode: 'insensitive' },
        id: { not: exceptUserId },
      },
    });
    return count > 0;
  }

  async updateProfile(
    userId: string,
    changes: ProfileChanges,
  ): Promise<Profile> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...changes,
        // better-auth keeps the typed form in displayUsername; keep it in step.
        ...(changes.username !== undefined && {
          displayUsername: changes.username,
        }),
      },
    });
    return mapPrismaUserToDomain(user);
  }
}
