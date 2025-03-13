import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Patch,
  Query,
  UnprocessableEntityException,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

import { TrustedContactsService } from './trusted-contacts.service';
import { CreateTrustedContactDto } from './dto/create-trusted-contact.dto';
import { UpdateTrustedContactDto } from './dto/update-trusted-contact.dto';
import { MESSAGES_RESPONSE } from '../../constants';
import { getErrorMessage } from '../../common/helpers/error-handler';
import { AuthGuard } from '../../guards/auth.guard';
import { UserRequest } from '../../decorators/user.decorator';
import { IUser } from '../users/interfaces/user.interface';
import { Auth } from '../../decorators/auth.decorator';
import { ROLES } from '../../constants/index';
@ApiTags('trusted-contacts')
@ApiBearerAuth()
@Controller('trusted-contacts')
export class TrustedContactsController {
  constructor(
    private readonly trustedContactsService: TrustedContactsService,
  ) {}

  @UseGuards(AuthGuard)
  @Post(':id/resend-verify-link')
  resendVerifyLink(
    @UserRequest() user: IUser,
    @Param('id') trustedContactId: string,
  ) {
    return this.trustedContactsService.resendVerifyLink(trustedContactId, user);
  }

  @UseGuards(AuthGuard)
  @Post()
  create(
    @UserRequest() user: IUser,
    @Body() trustedContactData: CreateTrustedContactDto,
  ) {
    // const totalTrustedContacts = await this.trustedContactsService.getTotal(
    //   user._id,
    // );

    // if (totalTrustedContacts >= 5) {
    //   throw new BadRequestException('Only Maximum 5 trusted contacts.');
    // }

    return this.trustedContactsService.create(trustedContactData, user);
  }

  @Get('verify/:verifyToken')
  async activeTrustedContact(@Param('verifyToken') verifyToken: string) {
    try {
      return await this.trustedContactsService.verifyPhone(verifyToken);
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      
      if (
        errorMsg === 'Can not find your verify token' ||
        errorMsg === 'Already verified!' 
      ) {
        return errorMsg;
      }
      throw error;
    }
  }

  @Get()
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
  @Auth(ROLES.admin, ROLES.moderator)
  get(@Query('offset') offset?: number, @Query('limit') limit?: number) {
    return this.trustedContactsService.getTrustedContacts({
      limit: limit ? Number(limit) : 10,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async findOneById(@UserRequest() user: IUser, @Param('id') id: string) {
    const trustedContact = await this.trustedContactsService.findOneById(id);
    if (!trustedContact) {
      throw new UnprocessableEntityException(MESSAGES_RESPONSE.NoRecord);
    }

    if (user.id === trustedContact.userId.toString()) {
      return trustedContact;
    } else {
      throw new ForbiddenException(MESSAGES_RESPONSE.Forbidden);
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteOneById(@UserRequest() user: IUser, @Param('id') id: string) {
    const trustedContact = await this.trustedContactsService.findOneById(id);
    if (!trustedContact) {
      throw new UnprocessableEntityException(MESSAGES_RESPONSE.NoRecord);
    }

    if (user.id === trustedContact.userId.toString()) {
      return await this.trustedContactsService.deleteOneById(id);
    }

    throw new ForbiddenException(MESSAGES_RESPONSE.Forbidden);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  async updateOneById(
    @UserRequest() user: IUser,
    @Param('id') id: string,
    @Body() trustedContactData: UpdateTrustedContactDto,
  ) {
    const trustedContact = await this.trustedContactsService.findOneById(id);
    if (!trustedContact) {
      throw new UnprocessableEntityException(MESSAGES_RESPONSE.NoRecord);
    }

    if (user.id === trustedContact.userId.toString()) {
      return await this.trustedContactsService.findOneAndUpdate(
        id,
        trustedContactData,
      );
    }
    throw new ForbiddenException(MESSAGES_RESPONSE.Forbidden);
  }
}
