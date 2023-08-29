// Libraries
import { AnyAction, createAction } from '@reduxjs/toolkit';
import { RefreshPicker } from '@grafana/ui';
import { DataSourceApi, HistoryItem } from '@grafana/data';
import { stopQueryState } from 'app/core/utils/explore';
import { ExploreItemState, ThunkResult } from 'app/types';

import { ExploreId } from 'app/types/explore';
import { importQueries, runQueries } from './query';
import { changeRefreshInterval } from './time';
import { createEmptyQueryResponse, loadAndInitDatasource, makeInitialUpdateState } from './utils';

//
// Actions and Payloads
//

/**
 * Updates datasource instance before datasource loading has started
 */
export interface UpdateDatasourceInstancePayload {
  exploreId: ExploreId;
  datasourceInstance: DataSourceApi;
  history: HistoryItem[];
}
export const updateDatasourceInstanceAction = createAction<UpdateDatasourceInstancePayload>(
  'explore/updateDatasourceInstance'
);

//
// Action creators
//

/**
 * Loads a new datasource identified by the given name.
 */
export function changeDatasource(
  exploreId: ExploreId,
  datasourceName: string,
  options?: { importQueries: boolean }
): ThunkResult<void> {
  return async (dispatch, getState) => {
    const orgId = getState().user.orgId;
    const { history, instance } = await loadAndInitDatasource(orgId, datasourceName);
    const currentDataSourceInstance = getState().explore[exploreId].datasourceInstance;

    dispatch(
      updateDatasourceInstanceAction({
        exploreId,
        datasourceInstance: instance,
        history,
      })
    );

    const queries = getState().explore[exploreId].queries;

    if (options?.importQueries) {
      await dispatch(importQueries(exploreId, queries, currentDataSourceInstance, instance));
    }

    if (getState().explore[exploreId].isLive) {
      dispatch(changeRefreshInterval(exploreId, RefreshPicker.offOption.value));
    }

    // Exception - we only want to run queries on data source change, if the queries were imported
    if (options?.importQueries) {
      dispatch(runQueries(exploreId));
    }
  };
}

//
// Reducer
//

/**
 * Reducer for an Explore area, to be used by the global Explore reducer.
 */
// Redux Toolkit uses ImmerJs as part of their solution to ensure that state objects are not mutated.
// ImmerJs has an autoFreeze option that freezes objects from change which means this reducer can't be migrated to createSlice
// because the state would become frozen and during run time we would get errors because flot (Graph lib) would try to mutate
// the frozen state.
// https://github.com/reduxjs/redux-toolkit/issues/242
export const datasourceReducer = (state: ExploreItemState, action: AnyAction): ExploreItemState => {
  if (updateDatasourceInstanceAction.match(action)) {
    const { datasourceInstance, history } = action.payload;

    // Custom components
    stopQueryState(state.querySubscription);

    return {
      ...state,
      datasourceInstance,
      graphResult: null,
      tableResult: null,
      logsResult: null,
      latency: 0,
      queryResponse: createEmptyQueryResponse(),
      loading: false,
      queryKeys: [],
      originPanelId: state.urlState && state.urlState.originPanelId,
      history,
      datasourceMissing: false,
      logsHighlighterExpressions: undefined,
      update: makeInitialUpdateState(),
    };
  }

  return state;
};
