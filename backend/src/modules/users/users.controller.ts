import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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
}
