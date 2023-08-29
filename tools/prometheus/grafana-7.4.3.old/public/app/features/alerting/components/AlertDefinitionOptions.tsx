import React, { FC, FormEvent, useMemo } from 'react';
import { css } from 'emotion';
import { GrafanaTheme, SelectableValue } from '@grafana/data';
import { Field, Input, Select, TextArea, useStyles } from '@grafana/ui';
import { AlertDefinition, NotificationChannelType, QueryGroupOptions } from 'app/types';

interface Props {
  alertDefinition: AlertDefinition;
  notificationChannelTypes: NotificationChannelType[];
  onChange: (event: FormEvent) => void;
  onIntervalChange: (interval: SelectableValue<number>) => void;
  onConditionChange: (refId: SelectableValue<string>) => void;
  queryOptions: QueryGroupOptions;
}

export const AlertDefinitionOptions: FC<Props> = ({
  alertDefinition,
  onChange,
  onIntervalChange,
  onConditionChange,
  queryOptions,
}) => {
  const styles = useStyles(getStyles);
  const refIds = useMemo(() => queryOptions.queries.map((q) => ({ value: q.refId, label: q.refId })), [
    queryOptions.queries,
  ]);

  return (
    <div style={{ paddingTop: '16px' }}>
      <div className={styles.container}>
        <h4>Alert definition</h4>
        <Field label="Title">
          <Input width={25} name="title" value={alertDefinition.title} onChange={onChange} />
        </Field>
        <Field label="Description" description="What does the alert do and why was it created">
          <TextArea
            rows={5}
            width={25}
            name="description"
            value={alertDefinition.description}
            onChange={onChange}
            readOnly={true}
          />
        </Field>
        <Field label="Evaluate">
          <div className={styles.optionRow}>
            <span className={styles.optionName}>Every</span>
            <Select
              onChange={onIntervalChange}
              value={alertDefinition.interval}
              options={[
                { value: 60, label: '1m' },
                { value: 300, label: '5m' },
                { value: 600, label: '10m' },
              ]}
              width={10}
            />
          </div>
        </Field>
        <Field label="Conditions">
          <div className={styles.optionRow}>
            <Select
              onChange={onConditionChange}
              value={alertDefinition.condition.refId}
              options={refIds}
              noOptionsMessage="No queries added"
            />
          </div>
        </Field>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme) => {
  return {
    wrapper: css`
      padding-top: ${theme.spacing.md};
    `,
    container: css`
      padding: ${theme.spacing.md};
      background-color: ${theme.colors.panelBg};
    `,
    optionRow: css`
      display: flex;
      align-items: baseline;
    `,
    optionName: css`
      font-size: ${theme.typography.size.md};
      color: ${theme.colors.formInputText};
      margin-right: ${theme.spacing.sm};
    `,
  };
};
