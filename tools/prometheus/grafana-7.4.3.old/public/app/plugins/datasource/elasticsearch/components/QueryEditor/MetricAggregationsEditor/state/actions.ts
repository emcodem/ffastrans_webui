import { SettingKeyOf } from '../../../types';
import { MetricAggregation, MetricAggregationWithMeta, MetricAggregationWithSettings } from '../aggregations';
import {
  ADD_METRIC,
  CHANGE_METRIC_FIELD,
  CHANGE_METRIC_TYPE,
  REMOVE_METRIC,
  TOGGLE_METRIC_VISIBILITY,
  CHANGE_METRIC_SETTING,
  CHANGE_METRIC_META,
  CHANGE_METRIC_ATTRIBUTE,
  MetricAggregationAction,
  ChangeMetricAttributeAction,
  ChangeMetricSettingAction,
  ChangeMetricMetaAction,
} from './types';

export const addMetric = (id: MetricAggregation['id']): MetricAggregationAction => ({
  type: ADD_METRIC,
  payload: {
    id,
  },
});

export const removeMetric = (id: MetricAggregation['id']): MetricAggregationAction => ({
  type: REMOVE_METRIC,
  payload: {
    id,
  },
});

export const changeMetricType = (
  id: MetricAggregation['id'],
  type: MetricAggregation['type']
): MetricAggregationAction => ({
  type: CHANGE_METRIC_TYPE,
  payload: {
    id,
    type,
  },
});

export const changeMetricField = (id: MetricAggregation['id'], field: string): MetricAggregationAction => ({
  type: CHANGE_METRIC_FIELD,
  payload: {
    id,
    field,
  },
});

export const toggleMetricVisibility = (id: MetricAggregation['id']): MetricAggregationAction => ({
  type: TOGGLE_METRIC_VISIBILITY,
  payload: {
    id,
  },
});

export const changeMetricAttribute = <T extends MetricAggregation, K extends Extract<keyof T, string>>(
  metric: T,
  attribute: K,
  newValue: T[K]
): ChangeMetricAttributeAction<T> => ({
  type: CHANGE_METRIC_ATTRIBUTE,
  payload: {
    metric,
    attribute,
    newValue,
  },
});

export const changeMetricSetting = <T extends MetricAggregationWithSettings, K extends SettingKeyOf<T>>(
  metric: T,
  settingName: K,
  // Maybe this could have been NonNullable<T['settings']>[K], but it doesn't seem to work really well
  newValue: NonNullable<T['settings']>[K]
): ChangeMetricSettingAction<T> => ({
  type: CHANGE_METRIC_SETTING,
  payload: {
    metric,
    settingName,
    newValue,
  },
});

export const changeMetricMeta = <T extends MetricAggregationWithMeta>(
  metric: T,
  meta: Extract<keyof Required<T>['meta'], string>,
  newValue: string | number | boolean
): ChangeMetricMetaAction<T> => ({
  type: CHANGE_METRIC_META,
  payload: {
    metric,
    meta,
    newValue,
  },
});
