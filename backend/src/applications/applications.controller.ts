import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';
import { ApplicationsService } from './applications.service';
import { ApplicationStatus } from './application.entity';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';

class ApplyDto {
  @IsUUID()
  postId: string;

  @IsOptional()
  @IsString()
  message?: string;
}

class UpdateStatusDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;
}

@Controller('applications')
@UseGuards(AuthGuard('jwt'))
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  apply(@CurrentUser() user: User, @Body() dto: ApplyDto) {
    return this.applicationsService.apply(user.id, dto.postId, dto.message);
  }

  @Get('my')
  getMyApplications(@CurrentUser() user: User) {
    return this.applicationsService.getMyApplications(user.id);
  }

  @Get('received')
  getReceivedApplications(@CurrentUser() user: User) {
    return this.applicationsService.getReceivedApplications(user.id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.applicationsService.updateStatus(user.id, id, dto.status);
  }
}
