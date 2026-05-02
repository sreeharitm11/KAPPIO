import { apiRequest } from '../../../shared/lib/api-client';
import type { StaffMember, TeamInvitationResult, UserRole } from '../../../shared/types/api';

export function fetchTeamMembers() {
  return apiRequest<StaffMember[]>('/users/team', { auth: true });
}

export function createTeamInvitation(payload: {
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
}) {
  return apiRequest<TeamInvitationResult>('/users/invitations', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  });
}
