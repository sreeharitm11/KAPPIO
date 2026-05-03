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
  aadhaar?: string;
  doj?: string;
  emergencyContact?: string;
}) {
  return apiRequest<TeamInvitationResult>('/users/invitations', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function deleteTeamMember(id: string) {
  return apiRequest<{ success: boolean }>(`/users/${id}`, {
    method: 'DELETE',
    auth: true,
  });
}

export function updateTeamMember(id: string, payload: Partial<StaffMember>) {
  return apiRequest<StaffMember>(`/users/${id}`, {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify(payload),
  });
}
