import { Profile } from '@/modules/profile/domain/profile';
import { ProfileRepository } from '@/modules/profile/repositories/profile.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { ConflictException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { ProfileService, USERNAME_TAKEN_MESSAGE } from './profile.service';

const user = new Identity('u1', 'duck@example.com', 'Duck', 'user');
const aProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: 'u1',
  name: 'Duck',
  username: 'duck',
  bio: null,
  defaultMood: null,
  ...overrides,
});

describe('ProfileService', () => {
  it('saves the changes for the signed-in user', async () => {
    const repository = mock<ProfileRepository>();
    repository.isUsernameTaken.mockResolvedValue(false);
    repository.updateProfile.mockResolvedValue(
      aProfile({ username: 'new_duck' }),
    );

    const service = new ProfileService(repository);
    await service.updateProfile(user, { username: 'new_duck', bio: 'hi' });

    expect(repository.isUsernameTaken).toHaveBeenCalledWith('new_duck', 'u1');
    expect(repository.updateProfile).toHaveBeenCalledWith('u1', {
      username: 'new_duck',
      bio: 'hi',
    });
  });

  it('rejects a username someone else has, without saving', async () => {
    const repository = mock<ProfileRepository>();
    repository.isUsernameTaken.mockResolvedValue(true);

    const service = new ProfileService(repository);

    await expect(
      service.updateProfile(user, { username: 'deepduckthoughts' }),
    ).rejects.toThrow(new ConflictException(USERNAME_TAKEN_MESSAGE));
    expect(repository.updateProfile).not.toHaveBeenCalled();
  });

  it('turns a lost race on the unique index into the same conflict', async () => {
    const repository = mock<ProfileRepository>();
    repository.isUsernameTaken.mockResolvedValue(false);
    repository.updateProfile.mockRejectedValue({ code: 'P2002' });

    const service = new ProfileService(repository);

    await expect(
      service.updateProfile(user, { username: 'taken_now' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not check the username when it is not being changed', async () => {
    const repository = mock<ProfileRepository>();
    repository.updateProfile.mockResolvedValue(aProfile());

    const service = new ProfileService(repository);
    await service.updateProfile(user, { name: 'New name' });

    expect(repository.isUsernameTaken).not.toHaveBeenCalled();
  });

  it('stores an empty bio as no bio and null mood as no mood', async () => {
    const repository = mock<ProfileRepository>();
    repository.updateProfile.mockResolvedValue(aProfile());

    const service = new ProfileService(repository);
    await service.updateProfile(user, { bio: '', defaultMood: null });

    expect(repository.updateProfile).toHaveBeenCalledWith('u1', {
      bio: null,
      defaultMood: null,
    });
  });
});
