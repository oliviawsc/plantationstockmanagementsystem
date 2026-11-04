import { useI18n } from '../i18n';

interface Props {
  estates: string[];
  value: string;
  onChange: (estate: string) => void;
}

/** Estate pill in the top header (legacy #topEstateLabel). The legacy app
 *  sized it with a hidden measuring span; `ch` width does the same here. */
export function EstateSelect({ estates, value, onChange }: Props) {
  const { t } = useI18n();
  const label = value || t('select_estate_opt');
  return (
    <select
      id="topEstateLabel"
      aria-label="Estate"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-[13px] font-semibold whitespace-nowrap outline-none cursor-pointer rounded-full border py-1 pl-3.5 pr-7"
      style={{ color: '#1B5E20', background: '#E8F5E9', borderColor: '#A5D6A7', width: `calc(${label.length}ch + 56px)`, maxWidth: 'calc(100vw - 160px)' }}
    >
      <option value="">{t('select_estate_opt')}</option>
      {estates.map((e) => <option key={e} value={e}>{e}</option>)}
    </select>
  );
}
