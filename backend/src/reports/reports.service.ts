import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './report.entity';
import { CreateReportDto, UpdateReportStatusDto } from './report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportsRepository: Repository<Report>,
  ) {}

  async create(reporterId: string, dto: CreateReportDto): Promise<Report> {
    const report = this.reportsRepository.create({ reporterId, ...dto });
    return this.reportsRepository.save(report);
  }

  async findAll(): Promise<Report[]> {
    return this.reportsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async updateStatus(id: string, dto: UpdateReportStatusDto): Promise<Report> {
    await this.reportsRepository.update(id, { status: dto.status });
    return this.reportsRepository.findOne({ where: { id } }) as Promise<Report>;
  }
}
