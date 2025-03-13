import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { VerifyOTPDto } from './dto/verify-otp.dto';
import { IUser } from './interfaces/user.interface';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { SendResetPasswordOTP } from './dto/send-reset-password-otp-dto';
import { VerifyResetPasswordOTPDTO } from './dto/verify-reset-password-otp-dto';
import { UpdatePinCodeDto } from './dto/update-pin-code.dto';
import { UserRequest } from '../../decorators/user.decorator';
import { Auth } from '../../decorators/auth.decorator';
import { ROLES } from '../../constants';
import { AuthGuard } from '../../guards/auth.guard';
import { SendOTPDTO } from './dto/send-otp.dto';
import { VerificationMethod } from '../../constants/enums';
import { TrustedContactsService } from '../trusted-contacts/trusted-contacts.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly trustedContactsService: TrustedContactsService,
  ) {}

  @Post()
  create(@Body() userData: CreateUserDto) {
    return this.usersService.create(userData);
  }

  @UseGuards(AuthGuard)
  @Post('verify-otp')
  async verifyOTP(@UserRequest() user: IUser, @Body() data: VerifyOTPDto) {
    const { OTP, verificationMethod } = data;
    const isSuccess = await this.usersService.verifyOTP(
      user,
      verificationMethod as VerificationMethod,
      OTP,
    );

    if (isSuccess) {
      return { success: true };
    }

    throw new BadRequestException('Verification code is invalid');
  }

  @UseGuards(AuthGuard)
  @Post('send-otp')
  async sendOTP(@UserRequest() user: IUser, @Body() sendOTPDTO: SendOTPDTO) {
    const { verificationMethod } = sendOTPDTO;
    const isSuccess = await this.usersService.sendOTP(
      user,
      verificationMethod as any,
    );
    return {
      success: isSuccess,
    };
  }

  @UseGuards(AuthGuard)
  @Patch('pin-code')
  async updatePinCode(
    @UserRequest('_id') userId: string,
    @Body() data: UpdatePinCodeDto,
  ) {
    const { newPinCode } = data;

    const isSuccess = await this.usersService.updatePinCode(userId, newPinCode);
    if (isSuccess) {
      return { success: true };
    }
    throw new BadRequestException('Something went wrong');
  }

  @Post('send-reset-password-otp')
  async sendResetPasswordOTP(@Body() data: SendResetPasswordOTP) {
    const { phone, verificationMethod } = data;
    await this.usersService.sendResetPasswordOTP(phone, verificationMethod);
    return { success: true };
  }

  @Post('verify-reset-password-otp')
  async verifyResetPasswordOTP(@Body() data: VerifyResetPasswordOTPDTO) {
    const { OTP, phone, verificationMethod } = data;
    const resetPasswordToken = await this.usersService.verifyResetPasswordOTP({
      phone,
      OTP,
      verificationMethod,
    });

    if (resetPasswordToken) {
      return { resetPasswordToken };
    }

    throw new BadRequestException('Verification code is invalid');
  }

  @Auth(ROLES.admin)
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
  })
  @Get()
  findAll(@Query('offset') offset?: number, @Query('limit') limit?: number) {
    return this.usersService.findAll({
      limit: limit ? Number(limit) : 10,
      offset: offset ? Number(offset) : 0,
    });
  }

  @UseGuards(AuthGuard)
  @Get('me/settings')
  getUserSetting(@UserRequest() user: IUser) {
    return user.getUserSettings();
  }

  @UseGuards(AuthGuard)
  @Patch('me/settings')
  updateUserSetting(
    @UserRequest('_id') userId: string,
    @Body() userSettings: UpdateUserSettingsDto,
  ) {
    return this.usersService.updateUserSettings(userId, userSettings);
  }

  @UseGuards(AuthGuard)
  @Patch('me/profile')
  updateUserProfile(
    @UserRequest('_id') userId: string,
    @Body() userInput: UpdateUserProfileDto,
  ) {
    return this.usersService.updateUserProfile(userId, userInput);
  }

  @Get('me/trusted-contacts')
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
  })
  @UseGuards(AuthGuard)
  async get(
    @UserRequest() user: IUser,
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
  ) {
    const userId = user._id;
    return await this.trustedContactsService.getTrustedContacts({
      limit: limit ? Number(limit) : 10,
      offset: offset ? Number(offset) : 0,
      query: { userId },
    });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getUserOfMe(@UserRequest() user: IUser) {
    return user;
  }

  @Auth(ROLES.admin)
  @Get(':id/settings')
  getUserSettingOfUser(@Param('id') id: string) {
    return this.usersService.getUserSettings(id);
  }

  @Auth(ROLES.admin)
  @Get(':id')
  getUserById(@Param('_id') id: string) {
    return this.usersService.findOneById(id);
  }

  @Auth(ROLES.admin)
  @Delete(':id')
  deleteOneById(@Param('id') id: string) {
    return this.usersService.deleteOneById(id);
  }

  @UseGuards(AuthGuard)
  @Post('check-password')
  async checkUserPassword(
    @UserRequest('_id') userId: string,
    @Body('password') password: string,
  ) {
    const isMatch = await this.usersService.checkUserPassword(userId, password);
    return {
      isMatch,
    };
  }
}
