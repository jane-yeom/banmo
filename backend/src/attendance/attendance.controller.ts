import { Controller, Get, Post, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { AttendanceService } from './attendance.service'
import { CurrentUser } from '../auth/current-user.decorator'
import { User } from '../users/user.entity'

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @UseGuards(AuthGuard('jwt'))
  checkIn(@CurrentUser() user: User) {
    return this.attendanceService.checkIn(user.id)
  }

  @Get('status')
  @UseGuards(AuthGuard('jwt'))
  getStatus(@CurrentUser() user: User) {
    return this.attendanceService.getAttendanceStatus(user.id)
  }
}
