import {
  Controller, Get, Post, Body, Param, Delete, UseGuards, Query, HttpCode, HttpStatus, Patch,
} from '@nestjs/common';
import { KhatmaService } from './khatma.service';
import { ReservationService } from './reservation.service';
import { MailService } from '@/modules/mail/mail.service';
import { CreateKhatmaDto } from './dto/create-khatma.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('khatmas')
export class KhatmaController {
  constructor(
    private khatmaService: KhatmaService,
    private reservationService: ReservationService,
    private mailService: MailService,
  ) {}

  // ── Static routes first (must be before /:id) ──────────────────────

  @Get()
  findAll(@Query() query: any) {
    return this.khatmaService.findAll(query);
  }

  @Get('join/:token')
  getInvitation(@Param('token') token: string) {
    return this.khatmaService.getInvitationByToken(token);
  }

  // ── Dynamic :id routes ─────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateKhatmaDto, @CurrentUser() user: any) {
    return this.khatmaService.create(user.id, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.khatmaService.findById(id, user?.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  deleteKhatma(@Param('id') id: string, @CurrentUser() user: any) {
    return this.khatmaService.deleteKhatma(user.id, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  editKhatma(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { title?: string; description?: string },
  ) {
    return this.khatmaService.editKhatma(user.id, id, body);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  join(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { invitationToken?: string },
  ) {
    return this.khatmaService.join(id, user.id, body.invitationToken);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  leave(@Param('id') id: string, @CurrentUser() user: any) {
    return this.khatmaService.leave(id, user.id);
  }

  @Patch(':id/participants/:userId/approve')
  @UseGuards(JwtAuthGuard)
  approve(@Param('id') id: string, @Param('userId') userId: string, @CurrentUser() admin: any) {
    return this.khatmaService.approveJoin(id, userId, admin.id);
  }

  @Patch(':id/settings')
  @UseGuards(JwtAuthGuard)
  updateSettings(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { allowRepeat?: boolean; requireApproval?: boolean; isContinuous?: boolean; maxMembers?: number | null; visibility?: string },
  ) {
    return this.khatmaService.updateSettings(id, user.id, body);
  }

  @Post(':id/invite')
  @UseGuards(JwtAuthGuard)
  createInvitation(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body?: { expiresInHours?: number },
  ) {
    return this.khatmaService.createInvitation(id, user.id, body?.expiresInHours);
  }

  @Post(':id/invite/email')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async inviteByEmail(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { email: string; name?: string },
  ) {
    const result = await this.khatmaService.inviteByEmail(id, user.id, body.email);
    await this.mailService.sendKhatmaInvite({
      toEmail: result.toEmail,
      toName: body.name,
      fromName: result.senderName,
      khatmaTitle: result.khatmaTitle,
      inviteUrl: result.inviteUrl,
    });
    return { success: true, inviteUrl: result.inviteUrl, message: 'تم إرسال الدعوة' };
  }

  // ── Reservation endpoints ──────────────────────────────────────────

  @Post(':id/parts/:partId/reserve')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  reserve(@Param('id') khatmaId: string, @Param('partId') partId: string, @CurrentUser() user: any) {
    return this.reservationService.reserve(user.id, khatmaId, partId);
  }

  @Post(':id/parts/:partId/complete')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  complete(@Param('id') khatmaId: string, @Param('partId') partId: string, @CurrentUser() user: any) {
    return this.reservationService.complete(user.id, khatmaId, partId);
  }

  @Delete(':id/parts/:partId/my-reservation')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  cancelReservation(@Param('id') khatmaId: string, @Param('partId') partId: string, @CurrentUser() user: any) {
    return this.reservationService.cancelReservation(user.id, khatmaId, partId);
  }

  @Delete(':id/parts/:partId/reservation')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  adminUnreserve(@Param('id') khatmaId: string, @Param('partId') partId: string, @CurrentUser() user: any) {
    return this.reservationService.adminUnreserve(user.id, khatmaId, partId);
  }
}
