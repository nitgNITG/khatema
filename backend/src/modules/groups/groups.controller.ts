import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('groups')
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  // ── Public listing ──────────────────────────────────────────────────
  @Get()
  findAll(@Query() query: any) {
    return this.groupsService.findAll(query);
  }

  // ── My groups ───────────────────────────────────────────────────────
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: any) {
    return this.groupsService.findMyGroups(user.id);
  }

  // ── Join by invite code ─────────────────────────────────────────────
  @Post('join-by-code')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  joinByCode(@Body('inviteCode') inviteCode: string, @CurrentUser() user: any) {
    return this.groupsService.joinByCode(inviteCode, user.id);
  }

  // ── Create ──────────────────────────────────────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateGroupDto, @CurrentUser() user: any) {
    return this.groupsService.create(user.id, dto);
  }

  // ── Get one ─────────────────────────────────────────────────────────
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.groupsService.findById(id, user?.id);
  }

  // ── Update ──────────────────────────────────────────────────────────
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto, @CurrentUser() user: any) {
    return this.groupsService.update(id, user.id, dto);
  }

  // ── Delete ──────────────────────────────────────────────────────────
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.groupsService.delete(id, user.id);
  }

  // ── Join public group ───────────────────────────────────────────────
  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  join(@Param('id') id: string, @CurrentUser() user: any) {
    return this.groupsService.join(id, user.id);
  }

  // ── Leave group ─────────────────────────────────────────────────────
  @Post(':id/leave')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  leave(@Param('id') id: string, @CurrentUser() user: any) {
    return this.groupsService.leave(id, user.id);
  }

  // ── Get invite code ─────────────────────────────────────────────────
  @Get(':id/invite-code')
  @UseGuards(JwtAuthGuard)
  getInviteCode(@Param('id') id: string, @CurrentUser() user: any) {
    return this.groupsService.getInviteCode(id, user.id);
  }

  // ── Approve/reject pending member ───────────────────────────────────
  @Post(':id/members/:userId/approve')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  approveMember(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @Body('approve') approve: boolean,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.approveMember(id, targetUserId, user.id, approve);
  }

  // ── Remove member ───────────────────────────────────────────────────
  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  removeMember(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.removeMember(id, targetUserId, user.id);
  }
}
