import { Modal, Stack, Button, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export const LANG_KEY = 'barrier-lab-lang';

interface Props {
  opened: boolean;
  onSelect: (lang: string) => void;
}

export function LangModal({ opened, onSelect }: Props) {
  const { t } = useTranslation();
  return (
    <Modal
      opened={opened}
      onClose={() => {}}
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      title={t('lang.modal.title')}
      centered
    >
      <Stack>
        <Text size="sm" c="dimmed">{t('lang.modal.subtitle')}</Text>
        <Button size="lg" variant="outline" onClick={() => onSelect('en')}>
          {t('lang.en')}
        </Button>
        <Button size="lg" variant="outline" onClick={() => onSelect('uk')}>
          {t('lang.uk')}
        </Button>
      </Stack>
    </Modal>
  );
}
