import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { omit } from 'lodash';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UsersService } from '../users/users.service';
import { IUser } from '../users/interfaces/user.interface';
import { UserWithToken } from './interfaces/user-token.interface';
import { LoginDto } from './dto/user-login.dto';
import { ResetPasswordDTO } from './dto/reset-password.dto';
import { RegisterAccountDTO } from './dto/register-account.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async registerAccount(registerAccountDTO: RegisterAccountDTO) {
    delete registerAccountDTO.confirmPassword;
    let user = await this.usersService.create(registerAccountDTO);
    user = omit(user.toObject(), [
      'password',
      'OTP',
      'OTPExpired',
      'pinCode',
      'resetPasswordOTP',
      'resetPasswordOTPExpired',
      'resetPasswordToken',
      'resetPasswordExpires',
      'refreshToken',
      'refreshTokenExpiresIn',
    ]);
    const token = this.createToken(user);
    const result: UserWithToken = {
      user,
      ...token,
    };
    return result;
  }

  async loginWithCredential(user) {
    const { phoneNumberVerified } = user;
    if (!phoneNumberVerified) {
      await this.usersService.sendOTP(user, 'sms');
    }

    const token = this.createToken(user);
    user = omit(user.toObject(), [
      'password',
      'OTP',
      'OTPExpired',
      'pinCode',
      'resetPasswordOTP',
      'resetPasswordOTPExpired',
      'resetPasswordToken',
      'resetPasswordExpires',
      'refreshToken',
      'refreshTokenExpiresIn',
    ]);

    const result: UserWithToken = {
      user,
      ...token,
    };
    console.log('Jayavel', result);
    return result;
  }

  async resetPassword(resetPassword: ResetPasswordDTO) {
    const { newPassword, resetPasswordToken, phone } = resetPassword;
    const user = await this.usersService.findOne({
      phone,
      resetPasswordToken,
      resetPasswordExpires: {
        $gt: new Date(),
      },
    });
    if (user) {
      user.password = newPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      return true;
    }

    return undefined;
  }

  /**
   * Verifies that the JWT payload associated with a JWT is valid by making sure the user exists and is enabled
   *
   * @param {JwtPayload} payload
   * @returns {(Promise<UserDocument | undefined>)} return undefined if there is no user or the account is not enabled
   * @memberof AuthService
   */
  async validateJwtPayload(payload: JwtPayload) {
    // This will be used when the user has already logged in and has a JWT
    const user = await this.usersService.findOne({
      _id: payload.userId,
    });

    // Ensure the user exists and their account isn't disabled
    if (user?.isActive) {
      user.lastSeenAt = new Date();
      return user;
    }

    return undefined;
  }

  createJwt(
    user: IUser,
    expiresIn: number,
  ): { data: JwtPayload; token: string } {
    const expiration: number = Date.now() + expiresIn * 1000;

    const data: JwtPayload = {
      userId: user._id,
      expiration,
    };

    const jwt = this.jwtService.sign(data, {
      expiresIn,
    });

    return {
      data,
      token: jwt,
    };
  }

  /**
   * Create a JwtPayload for the given User
   *
   * @param {UserDocument} user
   * @returns {{ data: JwtPayload; token: string }} The data contains the email and expiration of the
   * token depending on the environment variable. Expiration could be undefined if there is non set. Token is
   * token created by signing the data
   * @memberof AuthService
   */
  createAccessToken(user: IUser) {
    const expiresIn = this.configService.get<number>('auth.jwtExpiresIn');
    return this.createJwt(user, expiresIn);
  }

  createRefreshToken(user: IUser): { data: JwtPayload; token: string } {
    const expiresIn = this.configService.get<number>(
      'auth.jwtRefreshTokenExpiresIn',
    );
    return this.createJwt(user, expiresIn);
  }

  createToken(user: IUser) {
    const accessToken = this.createAccessToken(user);
    const refreshToken = this.createRefreshToken(user);
    return {
      accessToken: accessToken.token,
      refreshToken: refreshToken.token,
    };
  }

  async validateUserByPassword(loginDto: LoginDto) {
    const { phone } = loginDto;
    const userLogin = await this.usersService.findOne({ phone });

    if (!userLogin) return undefined;

    // Check the supplied password against the hash stored for this email address
    const isMatch = await userLogin.checkPassword(loginDto.password);
    if (isMatch) {
      userLogin.lastSeenAt = new Date();
      await userLogin.save();
      return userLogin;
    }

    return undefined;
  }
}
