import { useFieldArray, useWatch } from 'react-hook-form';

export default function LineItems({ control, register }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });
  const lineItems = useWatch({ control, name: 'lineItems' });

  return (
    <div className="line-items">
      <table>
        <thead>
        <tr>
          <th>Item</th>
          <th>Quantity</th>
          <th>Rate</th>
          <th>Amount</th>
          <th></th>
        </tr>
        </thead>
        <tbody>
        {fields.map((field, index) => {
          const qty = lineItems?.[index]?.quantity || 0;
          const rate = lineItems?.[index]?.rate || 0;
          return (
            <tr key={field.id}>
              <td>
                <input
                  {...register(`lineItems.${index}.description`)}
                  placeholder="Item description"
                />
              </td>
              <td>
                <input
                  {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
                  type="number"
                  placeholder="1"
                />
              </td>
              <td>
                <input
                  {...register(`lineItems.${index}.rate`, { valueAsNumber: true })}
                  type="number"
                  placeholder="0.00"
                />
              </td>
              <td>{(qty * rate).toFixed(2)}</td>
              <td>
                <button type="button" onClick={() => remove(index)}>✕</button>
              </td>
            </tr>
          );
        })}
        </tbody>
      </table>
      <button
        type="button"
        onClick={() => append({ description: '', quantity: 1, rate: 0 })}
      >
        + Line Item
      </button>
    </div>
  );
}
