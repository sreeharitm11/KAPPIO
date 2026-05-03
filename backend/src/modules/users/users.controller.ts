import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateTeamInvitationDto } from './dto/create-team-invitation.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.ADMIN)
  @Get('team')
  listTeam() {
    return this.usersService.listTeamMembers();
  }

  @Roles(UserRole.ADMIN)
  @Post('invitations')
  createInvitation(@Body() dto: CreateTeamInvitationDto) {
    return this.usersService.createTeamInvitation(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  updateMember(@Param('id') id: string, @Body() dto: any) {
    return this.usersService.updateMember(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  deleteMember(@Param('id') id: string) {
    return this.usersService.deleteMember(id);
  }
}
