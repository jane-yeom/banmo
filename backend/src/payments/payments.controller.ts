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

  @Post('request')
  requestPayment(@CurrentUser() user: User, @Body() dto: RequestPaymentDto) {
    return this.paymentsService.requestPayment(user.id, dto.postId, dto.type);
  }

  @Post('confirm')
  confirmPayment(@Body() dto: ConfirmPaymentDto) {
    return this.paymentsService.confirmPayment(dto);
  }

  @Get('my')
  getMyPayments(@CurrentUser() user: User) {
    return this.paymentsService.getMyPayments(user.id);
  }
}
