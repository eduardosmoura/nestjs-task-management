import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthCredentialsDto } from './dto/auth.credentials.dto';
import { UserRepository } from './user.repository';
import * as bcrypt from 'bcryptjs';

const authCredentialsDto: AuthCredentialsDto = {
  username: 'johndoe',
  password: 'JohnDoe12345+',
};

describe('UserRepository', () => {
  let userRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserRepository],
    }).compile();

    userRepository = await module.get<UserRepository>(UserRepository);
  });

  describe('signUp', () => {
    let save;

    beforeEach(() => {
      save = jest.fn();
      userRepository.create = jest.fn().mockReturnValue({ save });
    });

    it('should signUp the user', async () => {
      save.mockResolvedValue(undefined);
      expect(userRepository.signUp(authCredentialsDto)).resolves.not.toThrow();
    });

    it('should throw an error as user already exists', async () => {
      save.mockRejectedValue({ code: '23505' });
      expect(userRepository.signUp(authCredentialsDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw an error', async () => {
      save.mockRejectedValue({ code: '12345' });
      expect(userRepository.signUp(authCredentialsDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('isValidPassword', () => {
    let user;

    beforeEach(() => {
      userRepository.findOne = jest.fn();
      user = authCredentialsDto;
      user.isValidPassword = jest.fn();
    });

    it('should return the username', async () => {
      userRepository.findOne.mockResolvedValue(user);
      user.isValidPassword.mockResolvedValue(true);
      const result = await userRepository.isValidPassword(authCredentialsDto);
      expect(result).toEqual(authCredentialsDto.username);
    });

    it('should return null as the user could not be found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const result = await userRepository.isValidPassword(authCredentialsDto);
      expect(user.isValidPassword).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null as the password is invalid', async () => {
      userRepository.findOne.mockResolvedValue(user);
      user.isValidPassword.mockResolvedValue(false);
      const result = await userRepository.isValidPassword(authCredentialsDto);
      expect(user.isValidPassword).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('hashPassword', () => {
    it('should return a hashed password', async () => {
      bcrypt.hash = jest.fn().mockResolvedValue('testHash');
      expect(bcrypt.hash).not.toHaveBeenCalled();
      const result = await userRepository.hashPassword(
        'testPassword',
        'testSalt',
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('testPassword', 'testSalt');
      expect(result).toEqual('testHash');
    });
  });
});
