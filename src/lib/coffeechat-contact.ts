import { createAdminClient } from '@/lib/supabase/admin'

type ApplicationWithContact = {
  applicant_id: string
  status: 'pending' | 'accepted' | 'rejected'
  contact_email?: string | null
}

export async function attachAcceptedApplicantEmails<T extends ApplicationWithContact>(
  applications: T[]
): Promise<T[]> {
  const acceptedApplicantIds = applications
    .filter((application) => application.status === 'accepted')
    .map((application) => application.applicant_id)

  if (acceptedApplicantIds.length === 0) {
    return applications.map((application) => ({ ...application, contact_email: null }))
  }

  const adminClient = createAdminClient()
  const { data: members, error } = await adminClient
    .from('vcx_members')
    .select('id, email')
    .in('id', acceptedApplicantIds)

  if (error) {
    console.error('Accepted applicant contact lookup failed:', error)
  }

  const emailByMemberId = new Map((members ?? []).map((member) => [member.id, member.email]))

  return applications.map((application) => ({
    ...application,
    contact_email:
      application.status === 'accepted'
        ? emailByMemberId.get(application.applicant_id) ?? null
        : null,
  }))
}
