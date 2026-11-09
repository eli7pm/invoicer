import { Select as BaseSelect } from '@base-ui/react/select'
import { Check, ChevronsUpDown } from 'lucide-react'

export function Select({ value, onValueChange, groups, placeholder, className = '', ...triggerProps }) {
  const items = groups.flat()
  return (
    <BaseSelect.Root items={items} value={value} onValueChange={onValueChange}>
      <BaseSelect.Trigger className={`select-trigger ${className}`} {...triggerProps}>
        <BaseSelect.Value className="select-value" placeholder={placeholder} />
        <BaseSelect.Icon className="select-icon">
          <ChevronsUpDown size={14} />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner className="select-positioner" sideOffset={6} alignItemWithTrigger={false}>
          <BaseSelect.Popup className="select-popup">
            <BaseSelect.List className="select-list">
              {groups.map((group, i) => [
                i > 0 && <BaseSelect.Separator key={`sep-${i}`} className="select-separator" />,
                ...group.map((item) => (
                  <BaseSelect.Item key={item.value} value={item.value} className="select-item">
                    <BaseSelect.ItemText>{item.label}</BaseSelect.ItemText>
                    <BaseSelect.ItemIndicator className="select-check">
                      <Check size={14} />
                    </BaseSelect.ItemIndicator>
                  </BaseSelect.Item>
                )),
              ])}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}
