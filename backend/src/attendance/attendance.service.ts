import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MoreThanOrEqual, Repository } from 'typeorm'
import { Attendance } from './attendance.entity'
import { UsersService } from '../users/users.service'

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    private readonly usersService: UsersService,
  ) {}

  async checkIn(userId: string): Promise<{ attendance: Attendance; streakDays: number; isNew: boolean }> {
    const today = new Date().toISOString().slice(0, 10)

    const existing = await this.attendanceRepo.findOne({ where: { userId, date: today } })
    if (existing) throw new BadRequestException('오늘 이미 출석했습니다')

    // 어제 출석 여부 확인 → 연속 출석 계산
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    const prevAttendance = await this.attendanceRepo.findOne({
      where: { userId, date: yesterdayStr },
      order: { createdAt: 'DESC' },
    })
    const streakDays = prevAttendance ? prevAttendance.streakDays + 1 : 1

    const attendance = await this.attendanceRepo.save(
      this.attendanceRepo.create({ userId, date: today, streakDays }),
    )

    // 출석 신뢰점수 +1, 7일 연속 시 추가 +2
    await this.usersService.addTrustScore(userId, 1, 'attendance')
    if (streakDays % 7 === 0) {
      await this.usersService.addTrustScore(userId, 2, 'streak_bonus')
    }

    return { attendance, streakDays, isNew: true }
  }

  async getAttendanceStatus(userId: string): Promise<{
    todayChecked: boolean
    streakDays: number
    totalDays: number
    recentDates: string[]
  }> {
    const today = new Date().toISOString().slice(0, 10)
    const todayRecord = await this.attendanceRepo.findOne({ where: { userId, date: today } })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentRecords = await this.attendanceRepo.find({
      where: { userId, date: MoreThanOrEqual(thirtyDaysAgo.toISOString().slice(0, 10)) },
      order: { date: 'DESC' },
    })

    const totalDays = await this.attendanceRepo.count({ where: { userId } })

    return {
      todayChecked: !!todayRecord,
      streakDays: todayRecord?.streakDays ?? (recentRecords[0]?.streakDays ?? 0),
      totalDays,
      recentDates: recentRecords.map(r => r.date),
    }
  }
}
