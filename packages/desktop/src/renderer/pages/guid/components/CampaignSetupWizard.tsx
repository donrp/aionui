/**
 * Guided campaign setup — composes the first orchestrator message from structured choices.
 */
import { SUPERDNODES_BRAND } from '@/renderer/brand/supernodes';
import { Button, Checkbox, Form, Input, Message, Modal, Radio, Steps } from '@arco-design/web-react';
import React, { useEffect, useMemo, useState } from 'react';

const GOALS = [
  { value: 'awareness', label: 'Awareness', hint: 'Reach and recognition' },
  { value: 'lead_gen', label: 'Lead generation', hint: 'Capture and nurture leads' },
  { value: 'full', label: 'Full campaign', hint: 'All deliverables' },
] as const;

const ASSETS = [
  { value: 'strategy', label: 'Strategy deck' },
  { value: 'landing', label: 'Landing page' },
  { value: 'email_newsletter', label: 'Newsletter email' },
  { value: 'email_promo', label: 'Promo email' },
  { value: 'social_posts', label: 'Social posts + images' },
  { value: 'social_mockup', label: 'Social mockup (calendar + grid)' },
  { value: 'financials', label: 'Financials' },
  { value: 'compliance', label: 'Compliance' },
] as const;

const DEFAULT_ASSETS: Record<string, string[]> = {
  awareness: ['strategy', 'landing', 'social_posts', 'social_mockup', 'compliance'],
  lead_gen: ['strategy', 'landing', 'email_newsletter', 'email_promo', 'social_posts', 'financials', 'compliance'],
  full: ASSETS.map((a) => a.value),
};

type CampaignSetupWizardProps = {
  visible: boolean;
  onClose: () => void;
  /** Called with composed prompt — parent should start the chat. */
  onSubmit: (prompt: string) => void | Promise<void>;
};

function composePrompt(values: {
  goal: string;
  website: string;
  promoUrl?: string;
  brandName?: string;
  theme?: string;
  audience?: string;
  offer?: string;
  timing?: string;
  assets: string[];
  fetchBrand: boolean;
}): string {
  const website = values.website.trim();
  const brand =
    values.brandName?.trim() ||
    website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split('.')[0];
  const brandTitle = brand.charAt(0).toUpperCase() + brand.slice(1);
  const assetLabels = values.assets
    .map((id) => ASSETS.find((a) => a.value === id)?.label || id)
    .map((l) => `- ${l}`)
    .join('\n');

  const lines = [`Create a campaign end-to-end for ${brandTitle} (${website})`];
  if (values.promoUrl?.trim()) {
    lines[0] += ` promoting ${values.promoUrl.trim()}`;
  }
  if (values.theme?.trim()) {
    lines.push(`Campaign theme: "${values.theme.trim()}".`);
  }
  const goalLabel = GOALS.find((g) => g.value === values.goal)?.label || values.goal;
  lines.push(`Goal: ${goalLabel}. Timing: ${values.timing || 'Q3 2026'}.`);
  if (values.audience?.trim()) lines.push(`Audience: ${values.audience.trim()}.`);
  if (values.offer?.trim()) lines.push(`Offer: ${values.offer.trim()}.`);

  lines.push('');
  lines.push('Deliverables (only these — skeleton pipeline, no golf/wine templates):');
  lines.push(assetLabels);
  lines.push('');
  lines.push('Use campaign build after brand research. Package and share the download link when complete.');
  if (values.fetchBrand) {
    lines.push('Harvest brand colours, voice, and product images from the website.');
  }

  return lines.join('\n');
}

const CampaignSetupWizard: React.FC<CampaignSetupWizardProps> = ({ visible, onClose, onSubmit }) => {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const goal = Form.useWatch('goal', form) as string | undefined;
  const defaultAssets = useMemo(() => DEFAULT_ASSETS[goal || 'awareness'] || DEFAULT_ASSETS.full, [goal]);

  useEffect(() => {
    if (visible && goal) {
      form.setFieldValue('assets', defaultAssets);
    }
  }, [visible, goal, defaultAssets, form]);

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const values = await form.validate();
      const website = (values.website as string | undefined)?.trim();
      if (!website) {
        Message.warning('Website URL is required');
        setStep(1);
        return;
      }

      const prompt = composePrompt({
        goal: values.goal as string,
        website,
        promoUrl: values.promoUrl as string | undefined,
        brandName: values.brandName as string | undefined,
        theme: values.theme as string | undefined,
        audience: values.audience as string | undefined,
        offer: values.offer as string | undefined,
        timing: values.timing as string | undefined,
        assets: (values.assets as string[] | undefined)?.length
          ? (values.assets as string[])
          : defaultAssets,
        fetchBrand: values.fetchBrand !== false,
      });

      await onSubmit(prompt);
      onClose();
      setStep(0);
      form.resetFields();
    } catch {
      Message.warning('Please complete the required fields (website URL on step 2).');
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = async () => {
    if (step === 1) {
      try {
        await form.validate(['website']);
        setStep(2);
      } catch {
        Message.warning('Enter your website URL to continue.');
      }
      return;
    }
    setStep((s) => s + 1);
  };

  if (!SUPERDNODES_BRAND.showCampaignSetupWizard) {
    return null;
  }

  const hidden = { display: 'none' } as const;

  return (
    <Modal
      title='Set up your campaign'
      visible={visible}
      onCancel={onClose}
      footer={null}
      style={{ width: 560, maxWidth: '95vw' }}
      unmountOnExit={false}
    >
      <Steps current={step} style={{ marginBottom: 24 }} size='small'>
        <Steps.Step title='Goal' />
        <Steps.Step title='Brand' />
        <Steps.Step title='Assets' />
      </Steps>

      <Form
        form={form}
        layout='vertical'
        initialValues={{
          goal: 'awareness',
          timing: 'Q3 2026',
          assets: DEFAULT_ASSETS.awareness,
          fetchBrand: true,
        }}
      >
        {/* Keep all steps mounted so validate() sees website on step 3 */}
        <div style={step === 0 ? undefined : hidden}>
          <Form.Item label='What type of campaign?' field='goal' rules={[{ required: true }]}>
            <Radio.Group direction='vertical'>
              {GOALS.map((g) => (
                <Radio key={g.value} value={g.value}>
                  {g.label}
                  <span style={{ color: 'var(--color-text-3)', marginLeft: 8, fontSize: 12 }}>{g.hint}</span>
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item label='Timing' field='timing'>
            <Input placeholder='Q3 2026' />
          </Form.Item>
          <Form.Item label='Campaign theme (optional)' field='theme'>
            <Input placeholder='One prompt. Full campaign.' />
          </Form.Item>
        </div>

        <div style={step === 1 ? undefined : hidden}>
          <Form.Item
            label='Website URL'
            field='website'
            rules={[{ required: true, message: 'Website is required' }]}
          >
            <Input placeholder='https://supernodes.ai/' />
          </Form.Item>
          <Form.Item label='Product / promo URL (optional)' field='promoUrl'>
            <Input placeholder='https://agents.supernodes.ai/' />
          </Form.Item>
          <Form.Item label='Brand name (optional)' field='brandName'>
            <Input placeholder='Inferred from URL if empty' />
          </Form.Item>
          <Form.Item label='Target audience (optional)' field='audience'>
            <Input placeholder='AU marketing managers at B2B teams' />
          </Form.Item>
          <Form.Item label='Offer / CTA (optional)' field='offer'>
            <Input placeholder='Free demo at agents.supernodes.ai' />
          </Form.Item>
          <Form.Item field='fetchBrand' triggerPropName='checked'>
            <Checkbox>Fetch brand colours and voice from website</Checkbox>
          </Form.Item>
        </div>

        <div style={step === 2 ? undefined : hidden}>
          <Form.Item label='Which deliverables do you need?' field='assets'>
            <Checkbox.Group options={ASSETS.map((a) => ({ label: a.label, value: a.value }))} />
          </Form.Item>
        </div>
      </Form>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
        <Button disabled={step === 0 || submitting} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          Back
        </Button>
        {step < 2 ? (
          <Button type='primary' onClick={goNext}>
            Next
          </Button>
        ) : (
          <Button type='primary' loading={submitting} onClick={handleFinish}>
            Start campaign
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default CampaignSetupWizard;
