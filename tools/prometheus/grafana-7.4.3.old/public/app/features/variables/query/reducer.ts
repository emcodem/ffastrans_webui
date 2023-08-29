import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import _ from 'lodash';
import { DataSourceApi, MetricFindValue, stringToJsRegex } from '@grafana/data';

import {
  initialVariableModelState,
  QueryVariableModel,
  VariableOption,
  VariableQueryEditorType,
  VariableRefresh,
  VariableSort,
  VariableTag,
} from '../types';

import {
  ALL_VARIABLE_TEXT,
  ALL_VARIABLE_VALUE,
  getInstanceState,
  NONE_VARIABLE_TEXT,
  NONE_VARIABLE_VALUE,
  VariablePayload,
} from '../state/types';
import { initialVariablesState, VariablesState } from '../state/variablesReducer';

interface VariableOptionsUpdate {
  templatedRegex: string;
  results: MetricFindValue[];
}

export interface QueryVariableEditorState {
  VariableQueryEditor: VariableQueryEditorType;
  dataSource: DataSourceApi | null;
}

export const initialQueryVariableModelState: QueryVariableModel = {
  ...initialVariableModelState,
  type: 'query',
  datasource: null,
  query: '',
  regex: '',
  sort: VariableSort.disabled,
  refresh: VariableRefresh.never,
  multi: false,
  includeAll: false,
  allValue: null,
  options: [],
  current: {} as VariableOption,
  tags: [],
  useTags: false,
  tagsQuery: '',
  tagValuesQuery: '',
  definition: '',
};

export const sortVariableValues = (options: any[], sortOrder: VariableSort) => {
  if (sortOrder === VariableSort.disabled) {
    return options;
  }

  const sortType = Math.ceil(sortOrder / 2);
  const reverseSort = sortOrder % 2 === 0;

  if (sortType === 1) {
    options = _.sortBy(options, 'text');
  } else if (sortType === 2) {
    options = _.sortBy(options, (opt) => {
      if (!opt.text) {
        return -1;
      }

      const matches = opt.text.match(/.*?(\d+).*/);
      if (!matches || matches.length < 2) {
        return -1;
      } else {
        return parseInt(matches[1], 10);
      }
    });
  } else if (sortType === 3) {
    options = _.sortBy(options, (opt) => {
      return _.toLower(opt.text);
    });
  }

  if (reverseSort) {
    options = options.reverse();
  }

  return options;
};

const getAllMatches = (str: string, regex: RegExp): RegExpExecArray[] => {
  const results: RegExpExecArray[] = [];
  let matches = null;

  regex.lastIndex = 0;

  do {
    matches = regex.exec(str);
    if (matches) {
      results.push(matches);
    }
  } while (regex.global && matches && matches[0] !== '' && matches[0] !== undefined);

  return results;
};

export const metricNamesToVariableValues = (variableRegEx: string, sort: VariableSort, metricNames: any[]) => {
  let regex;
  let options: VariableOption[] = [];

  if (variableRegEx) {
    regex = stringToJsRegex(variableRegEx);
  }

  for (let i = 0; i < metricNames.length; i++) {
    const item = metricNames[i];
    let text = item.text === undefined || item.text === null ? item.value : item.text;
    let value = item.value === undefined || item.value === null ? item.text : item.value;

    if (_.isNumber(value)) {
      value = value.toString();
    }

    if (_.isNumber(text)) {
      text = text.toString();
    }

    if (regex) {
      const matches = getAllMatches(value, regex);
      if (!matches.length) {
        continue;
      }

      const valueGroup = matches.find((m) => m.groups && m.groups.value);
      const textGroup = matches.find((m) => m.groups && m.groups.text);
      const firstMatch = matches.find((m) => m.length > 1);
      const manyMatches = matches.length > 1 && firstMatch;

      if (valueGroup || textGroup) {
        value = valueGroup?.groups?.value ?? textGroup?.groups?.text;
        text = textGroup?.groups?.text ?? valueGroup?.groups?.value;
      } else if (manyMatches) {
        for (let j = 0; j < matches.length; j++) {
          const match = matches[j];
          options.push({ text: match[1], value: match[1], selected: false });
        }
        continue;
      } else if (firstMatch) {
        text = firstMatch[1];
        value = firstMatch[1];
      }
    }

    options.push({ text: text, value: value, selected: false });
  }

  options = _.uniqBy(options, 'value');
  return sortVariableValues(options, sort);
};

export const queryVariableSlice = createSlice({
  name: 'templating/query',
  initialState: initialVariablesState,
  reducers: {
    updateVariableOptions: (state: VariablesState, action: PayloadAction<VariablePayload<VariableOptionsUpdate>>) => {
      const { results, templatedRegex } = action.payload.data;
      const instanceState = getInstanceState<QueryVariableModel>(state, action.payload.id);
      const { includeAll, sort } = instanceState;
      const options = metricNamesToVariableValues(templatedRegex, sort, results);

      if (includeAll) {
        options.unshift({ text: ALL_VARIABLE_TEXT, value: ALL_VARIABLE_VALUE, selected: false });
      }

      if (!options.length) {
        options.push({ text: NONE_VARIABLE_TEXT, value: NONE_VARIABLE_VALUE, isNone: true, selected: false });
      }

      instanceState.options = options;
    },
    updateVariableTags: (state: VariablesState, action: PayloadAction<VariablePayload<any[]>>) => {
      const instanceState = getInstanceState<QueryVariableModel>(state, action.payload.id);
      const results = action.payload.data;
      const tags: VariableTag[] = [];
      for (let i = 0; i < results.length; i++) {
        tags.push({ text: results[i].text, selected: false });
      }

      instanceState.tags = tags;
    },
  },
});

export const queryVariableReducer = queryVariableSlice.reducer;

export const { updateVariableOptions, updateVariableTags } = queryVariableSlice.actions;
