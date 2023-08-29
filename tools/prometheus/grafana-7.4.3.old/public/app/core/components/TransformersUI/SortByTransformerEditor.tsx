import React, { useCallback, useMemo } from 'react';
import { DataTransformerID, standardTransformers, TransformerRegistyItem, TransformerUIProps } from '@grafana/data';
import { getAllFieldNamesFromDataFrames } from './OrganizeFieldsTransformerEditor';
import { InlineField, InlineSwitch, InlineFieldRow, Select } from '@grafana/ui';

import { SortByField, SortByTransformerOptions } from '@grafana/data/src/transformations/transformers/sortBy';

export const SortByTransformerEditor: React.FC<TransformerUIProps<SortByTransformerOptions>> = ({
  input,
  options,
  onChange,
}) => {
  const fieldNames = useMemo(
    () =>
      getAllFieldNamesFromDataFrames(input).map((n) => ({
        value: n,
        label: n,
      })),
    [input]
  );

  // Only supports single sort for now
  const onSortChange = useCallback(
    (idx: number, cfg: SortByField) => {
      onChange({ ...options, sort: [cfg] });
    },
    [options]
  );

  const sorts = options.sort?.length ? options.sort : [{} as SortByField];

  return (
    <div>
      {sorts.map((s, index) => {
        return (
          <InlineFieldRow key={`${s.field}/${index}`}>
            <InlineField label="Field" labelWidth={10} grow={true}>
              <Select
                options={fieldNames}
                value={fieldNames.find((v) => v.value === s.field)}
                placeholder="Select field"
                onChange={(v) => {
                  onSortChange(index, { ...s, field: v.value! });
                }}
              />
            </InlineField>
            <InlineField label="Reverse">
              <InlineSwitch
                value={!!s.desc}
                onChange={() => {
                  onSortChange(index, { ...s, desc: !!!s.desc });
                }}
              />
            </InlineField>
          </InlineFieldRow>
        );
      })}
    </div>
  );
};

export const sortByTransformRegistryItem: TransformerRegistyItem<SortByTransformerOptions> = {
  id: DataTransformerID.sortBy,
  editor: SortByTransformerEditor,
  transformation: standardTransformers.sortByTransformer,
  name: standardTransformers.sortByTransformer.name,
  description: standardTransformers.sortByTransformer.description,
};
