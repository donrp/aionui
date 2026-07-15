/**
 * Submit leads to HubSpot using the same field IDs as the shareable form:
 * https://7bnnz1.share-ap1.hsforms.com/2lVPjj6VSSa60eg7-DAXqQQ
 */

const HUBSPOT_PORTAL_ID = '442843165';
const HUBSPOT_FORM_ID = '9553e38f-a552-49ae-b47a-0efe0c05ea41';
const HUBSPOT_CONTACT_OBJECT = '0-1';

export const HUBSPOT_USE_CASE_VALUES = {
  leadGeneration: 'Lead Generation',
  aiAds: 'Ads',
  contentLab: 'Content Lab',
  nurturingLab: 'Nurturing',
} as const;

export type HubSpotUseCase = keyof typeof HUBSPOT_USE_CASE_VALUES;

export type HubSpotLeadPayload = {
  firstname: string;
  lastname: string;
  company: string;
  email: string;
  useCases: HubSpotUseCase[];
};

export type HubSpotSubmitResult =
  | { success: true }
  | { success: false; message: string };

function contactField(name: string, value: string) {
  return {
    objectTypeId: HUBSPOT_CONTACT_OBJECT,
    name,
    value,
  };
}

export async function submitHubSpotLeadForm(
  payload: HubSpotLeadPayload,
  context?: { pageUri?: string; pageName?: string }
): Promise<HubSpotSubmitResult> {
  const productTypeFields = payload.useCases.map((useCase) =>
    contactField('product_type', HUBSPOT_USE_CASE_VALUES[useCase])
  );

  const body = {
    fields: [
      contactField('firstname', payload.firstname.trim()),
      contactField('lastname', payload.lastname.trim()),
      contactField('company', payload.company.trim()),
      contactField('email', payload.email.trim()),
      ...productTypeFields,
    ],
    context: {
      pageUri: context?.pageUri ?? (typeof window !== 'undefined' ? window.location.href : ''),
      pageName: context?.pageName ?? 'Supernodes Register',
    },
  };

  try {
    const response = await fetch(
      `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_ID}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return {
        success: false,
        message: text || `Submission failed (${response.status})`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[hubspot] lead form submission failed:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
    };
  }
}
