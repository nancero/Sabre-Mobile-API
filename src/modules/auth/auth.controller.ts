import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  BadRequestException,
  UseFilters,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import get from 'lodash/get';
import { ApiTags, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { UserWithToken } from './interfaces/user-token.interface';
import { LoginDto } from './dto/user-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthService } from './auth.service';
import { ResetPasswordDTO } from './dto/reset-password.dto';
import { MongoExceptionFilter } from '../../filters/mongo-exception.filter';
import { UserRequest } from '../../decorators/user.decorator';
import { IUser } from '../users/interfaces/user.interface';
import { RegisterAccountDTO } from './dto/register-account.dto';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
@UseFilters(new MongoExceptionFilter())
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  registerAccount(@Body() registerAccountDTO: RegisterAccountDTO) {
    return this.authService.registerAccount(registerAccountDTO);
  }

  @ApiBody({
    type: LoginDto,
    description: 'User credentials',
    required: true,
    isArray: false,
  })
  @Post('login')
  @UseGuards(AuthGuard('local'))
  loginWithCredential(@UserRequest() user: IUser): Promise<UserWithToken> {
    return this.authService.loginWithCredential(user);
  }

  @ApiBody({
    type: ChangePasswordDto,
    description: 'data',
    required: true,
    isArray: false,
  })
  @UseGuards(AuthGuard('jwt'))
  @Post('change-password')
  async changePassword(
    @UserRequest() user: IUser,
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    const isMatch = await user.checkPassword(oldPassword);
    if (isMatch) {
      user.password = newPassword;
      await user.save();
      return {
        message: 'The password has been successfully changed.',
      };
    }
    throw new BadRequestException('Incorrect password');
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPassword: ResetPasswordDTO) {
    const isSuccess = await this.authService.resetPassword(resetPassword);
    if (isSuccess) {
      return {
        isSuccess: true,
        message: 'The password has been successfully changed.',
      };
    }
    throw new BadRequestException(
      'Something went wrong. Cannot reset your password.',
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('refresh-token')
  getAccessToken(@UserRequest() user: IUser) {
    return this.authService.createAccessToken(user);
  }
}
