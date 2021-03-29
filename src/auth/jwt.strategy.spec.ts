import { JwtStrategy } from './jwt.strategy';
import { Test } from '@nestjs/testing';
import { UserRepository } from './user.repository';
import { User } from './user.entity';
import { UnauthorizedException } from '@nestjs/common';

const mockUserRepository = () => ({
  findOne: jest.fn(),
});

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let userRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UserRepository, useFactory: mockUserRepository },
      ],
    }).compile();

    jwtStrategy = await module.get<JwtStrategy>(JwtStrategy);
    userRepository = await module.get<UserRepository>(UserRepository);
  });

  describe('validate', () => {
    it('should validate the payload', async () => {
      const user = new User();
      user.username = 'johndoe';
      userRepository.findOne.mockResolvedValue(user);
      const result = await jwtStrategy.validate(user);
      expect(userRepository.findOne).toHaveBeenCalledWith(user);
      expect(result).toEqual(user);
    });

    it('should throw an error', () => {
      userRepository.findOne.mockResolvedValue(null);
      expect(jwtStrategy.validate({ username: 'johndoe' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
