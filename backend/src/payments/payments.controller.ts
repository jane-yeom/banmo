// TODO: 유료 결제 기능 - 추후 활성화 예정
// 토스페이먼츠 연동 후 주석 해제

import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';
import { PremiumType } from './payment.entity';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';

class RequestPaymentDto {
  postId: string;
  type: PremiumType;
}

class ConfirmPaymentDto {
  paymentKey: string;
  orderId: string;
  amount: number;
}

@Controller('payments')
@UseGuards(AuthGuard('jwt'))
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // TODO: 유료 기능 활성화시 주석 해제
  // @Post('request')
  // requestPayment(@CurrentUser() user: User, @Body() dto: RequestPaymentDto) {
  //   return this.paymentsService.requestPayment(user.id, dto.postId, dto.type);
  // }

  // TODO: 유료 기능 활성화시 주석 해제
  // @Post('confirm')
  // confirmPayment(@Body() dto: ConfirmPaymentDto) {
  //   return this.paymentsService.confirmPayment(dto);
  // }

  // TODO: 유료 기능 활성화시 주석 해제
  // @Get('my')
  // getMyPayments(@CurrentUser() user: User) {
  //   return this.paymentsService.getMyPayments(user.id);
  // }
}
