import React from 'react';
import { hot } from 'react-hot-loader';
import { css, cx } from 'emotion';
import { compose } from 'redux';
import { connect } from 'react-redux';
import AutoSizer from 'react-virtualized-auto-sizer';
import memoizeOne from 'memoize-one';
import { selectors } from '@grafana/e2e-selectors';
import { ErrorBoundaryAlert, stylesFactory, withTheme } from '@grafana/ui';
import {
  AbsoluteTimeRange,
  DataQuery,
  DataSourceApi,
  GrafanaTheme,
  LoadingState,
  PanelData,
  RawTimeRange,
  TimeRange,
  TimeZone,
  ExploreUrlState,
  LogsModel,
  EventBusExtended,
  EventBusSrv,
  TraceViewData,
  DataFrame,
} from '@grafana/data';

import store from 'app/core/store';
import LogsContainer from './LogsContainer';
import QueryRows from './QueryRows';
import TableContainer from './TableContainer';
import RichHistoryContainer from './RichHistory/RichHistoryContainer';
import ExploreQueryInspector from './ExploreQueryInspector';
import { splitOpen } from './state/main';
import { changeSize, initializeExplore, refreshExplore } from './state/explorePane';
import { updateTimeRange } from './state/time';
import { scanStopAction, addQueryRow, modifyQueries, setQueries, scanStart } from './state/query';
import { ExploreId, ExploreItemState, ExploreUpdateState } from 'app/types/explore';
import { StoreState } from 'app/types';
import {
  DEFAULT_RANGE,
  ensureQueries,
  getFirstNonQueryRowSpecificError,
  getTimeRange,
  getTimeRangeFromUrl,
  lastUsedDatasourceKeyForOrgId,
} from 'app/core/utils/explore';
import { ExploreToolbar } from './ExploreToolbar';
import { NoDataSourceCallToAction } from './NoDataSourceCallToAction';
import { getTimeZone } from '../profile/state/selectors';
import { ErrorContainer } from './ErrorContainer';
//TODO:unification
import { TraceView } from './TraceView/TraceView';
import { SecondaryActions } from './SecondaryActions';
import { FILTER_FOR_OPERATOR, FILTER_OUT_OPERATOR, FilterItem } from '@grafana/ui/src/components/Table/types';
import { ExploreGraphNGPanel } from './ExploreGraphNGPanel';
import { NodeGraphContainer } from './NodeGraphContainer';

const getStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    exploreMain: css`
      label: exploreMain;
      // Is needed for some transition animations to work.
      position: relative;
      margin-top: 21px;
    `,
    button: css`
      label: button;
      margin: 1em 4px 0 0;
    `,
    queryContainer: css`
      label: queryContainer;
      // Need to override normal css class and don't want to count on ordering of the classes in html.
      height: auto !important;
      flex: unset !important;
      padding: ${theme.panelPadding}px;
    `,
  };
});

export interface ExploreProps {
  changeSize: typeof changeSize;
  datasourceInstance: DataSourceApi | null;
  datasourceMissing: boolean;
  exploreId: ExploreId;
  initializeExplore: typeof initializeExplore;
  initialized: boolean;
  modifyQueries: typeof modifyQueries;
  update: ExploreUpdateState;
  refreshExplore: typeof refreshExplore;
  scanning?: boolean;
  scanRange?: RawTimeRange;
  scanStart: typeof scanStart;
  scanStopAction: typeof scanStopAction;
  setQueries: typeof setQueries;
  split: boolean;
  queryKeys: string[];
  initialDatasource: string;
  initialQueries: DataQuery[];
  initialRange: TimeRange;
  isLive: boolean;
  syncedTimes: boolean;
  updateTimeRange: typeof updateTimeRange;
  graphResult: DataFrame[] | null;
  logsResult?: LogsModel;
  absoluteRange: AbsoluteTimeRange;
  timeZone: TimeZone;
  onHiddenSeriesChanged?: (hiddenSeries: string[]) => void;
  queryResponse: PanelData;
  originPanelId: number;
  addQueryRow: typeof addQueryRow;
  theme: GrafanaTheme;
  loading: boolean;
  showMetrics: boolean;
  showTable: boolean;
  showLogs: boolean;
  showTrace: boolean;
  showNodeGraph: boolean;
  splitOpen: typeof splitOpen;
}

enum ExploreDrawer {
  RichHistory,
  QueryInspector,
}

interface ExploreState {
  openDrawer?: ExploreDrawer;
}

/**
 * Explore provides an area for quick query iteration for a given datasource.
 * Once a datasource is selected it populates the query section at the top.
 * When queries are run, their results are being displayed in the main section.
 * The datasource determines what kind of query editor it brings, and what kind
 * of results viewers it supports. The state is managed entirely in Redux.
 *
 * SPLIT VIEW
 *
 * Explore can have two Explore areas side-by-side. This is handled in `Wrapper.tsx`.
 * Since there can be multiple Explores (e.g., left and right) each action needs
 * the `exploreId` as first parameter so that the reducer knows which Explore state
 * is affected.
 *
 * DATASOURCE REQUESTS
 *
 * A click on Run Query creates transactions for all DataQueries for all expanded
 * result viewers. New runs are discarding previous runs. Upon completion a transaction
 * saves the result. The result viewers construct their data from the currently existing
 * transactions.
 *
 * The result viewers determine some of the query options sent to the datasource, e.g.,
 * `format`, to indicate eventual transformations by the datasources' result transformers.
 */
export class Explore extends React.PureComponent<ExploreProps, ExploreState> {
  el: any;
  exploreEvents: EventBusExtended;

  constructor(props: ExploreProps) {
    super(props);
    this.exploreEvents = new EventBusSrv();
    this.state = {
      openDrawer: undefined,
    };
  }

  componentDidMount() {
    const { initialized, exploreId, initialDatasource, initialQueries, initialRange, originPanelId } = this.props;
    const width = this.el ? this.el.offsetWidth : 0;

    // initialize the whole explore first time we mount and if browser history contains a change in datasource
    if (!initialized) {
      this.props.initializeExplore(
        exploreId,
        initialDatasource,
        initialQueries,
        initialRange,
        width,
        this.exploreEvents,
        originPanelId
      );
    }
  }

  componentWillUnmount() {
    this.exploreEvents.removeAllListeners();
  }

  componentDidUpdate(prevProps: ExploreProps) {
    this.refreshExplore();
  }

  getRef = (el: any) => {
    this.el = el;
  };

  onChangeTime = (rawRange: RawTimeRange) => {
    const { updateTimeRange, exploreId } = this.props;
    updateTimeRange({ exploreId, rawRange });
  };

  // Use this in help pages to set page to a single query
  onClickExample = (query: DataQuery) => {
    this.props.setQueries(this.props.exploreId, [query]);
  };

  onCellFilterAdded = (filter: FilterItem) => {
    const { value, key, operator } = filter;
    if (operator === FILTER_FOR_OPERATOR) {
      this.onClickFilterLabel(key, value);
    }

    if (operator === FILTER_OUT_OPERATOR) {
      this.onClickFilterOutLabel(key, value);
    }
  };

  onClickFilterLabel = (key: string, value: string) => {
    this.onModifyQueries({ type: 'ADD_FILTER', key, value });
  };

  onClickFilterOutLabel = (key: string, value: string) => {
    this.onModifyQueries({ type: 'ADD_FILTER_OUT', key, value });
  };

  onClickAddQueryRowButton = () => {
    const { exploreId, queryKeys } = this.props;
    this.props.addQueryRow(exploreId, queryKeys.length);
  };

  onModifyQueries = (action: any, index?: number) => {
    const { datasourceInstance } = this.props;
    if (datasourceInstance?.modifyQuery) {
      const modifier = (queries: DataQuery, modification: any) =>
        datasourceInstance.modifyQuery!(queries, modification);
      this.props.modifyQueries(this.props.exploreId, action, modifier, index);
    }
  };

  onResize = (size: { height: number; width: number }) => {
    this.props.changeSize(this.props.exploreId, size);
  };

  onStartScanning = () => {
    // Scanner will trigger a query
    this.props.scanStart(this.props.exploreId);
  };

  onStopScanning = () => {
    this.props.scanStopAction({ exploreId: this.props.exploreId });
  };

  onUpdateTimeRange = (absoluteRange: AbsoluteTimeRange) => {
    const { exploreId, updateTimeRange } = this.props;
    updateTimeRange({ exploreId, absoluteRange });
  };

  toggleShowRichHistory = () => {
    this.setState((state) => {
      return {
        openDrawer: state.openDrawer === ExploreDrawer.RichHistory ? undefined : ExploreDrawer.RichHistory,
      };
    });
  };

  toggleShowQueryInspector = () => {
    this.setState((state) => {
      return {
        openDrawer: state.openDrawer === ExploreDrawer.QueryInspector ? undefined : ExploreDrawer.QueryInspector,
      };
    });
  };

  refreshExplore = () => {
    const { exploreId, update } = this.props;

    if (update.queries || update.range || update.datasource || update.mode) {
      this.props.refreshExplore(exploreId);
    }
  };

  renderEmptyState() {
    return (
      <div className="explore-container">
        <NoDataSourceCallToAction />
      </div>
    );
  }

  renderGraphPanel(width: number) {
    const { graphResult, absoluteRange, timeZone, splitOpen, queryResponse, loading } = this.props;
    return (
      <ExploreGraphNGPanel
        data={graphResult!}
        width={width}
        absoluteRange={absoluteRange}
        timeZone={timeZone}
        onUpdateTimeRange={this.onUpdateTimeRange}
        annotations={queryResponse.annotations}
        splitOpenFn={splitOpen}
        isLoading={loading}
      />
    );
  }

  renderTablePanel(width: number) {
    const { exploreId, datasourceInstance } = this.props;
    return (
      <TableContainer
        ariaLabel={selectors.pages.Explore.General.table}
        width={width}
        exploreId={exploreId}
        onCellFilterAdded={datasourceInstance?.modifyQuery ? this.onCellFilterAdded : undefined}
      />
    );
  }

  renderLogsPanel(width: number) {
    const { exploreId, syncedTimes } = this.props;
    return (
      <LogsContainer
        width={width}
        exploreId={exploreId}
        syncedTimes={syncedTimes}
        onClickFilterLabel={this.onClickFilterLabel}
        onClickFilterOutLabel={this.onClickFilterOutLabel}
        onStartScanning={this.onStartScanning}
        onStopScanning={this.onStopScanning}
      />
    );
  }

  renderNodeGraphPanel() {
    const { exploreId, showTrace, queryResponse } = this.props;
    return (
      <NodeGraphContainer
        dataFrames={this.getNodeGraphDataFrames(queryResponse.series)}
        exploreId={exploreId}
        short={showTrace}
      />
    );
  }

  getNodeGraphDataFrames = memoizeOne((frames: DataFrame[]) => {
    // TODO: this not in sync with how other types of responses are handled. Other types have a query response
    //  processing pipeline which ends up populating redux state with proper data. As we move towards more dataFrame
    //  oriented API it seems like a better direction to move such processing into to visualisations and do minimal
    //  and lazy processing here. Needs bigger refactor so keeping nodeGraph and Traces as they are for now.
    return frames.filter((frame) => frame.meta?.preferredVisualisationType === 'nodeGraph');
  });

  renderTraceViewPanel() {
    const { queryResponse, splitOpen } = this.props;
    const dataFrames = queryResponse.series.filter((series) => series.meta?.preferredVisualisationType === 'trace');

    return (
      // We expect only one trace at the moment to be in the dataframe
      // If there is no data (like 404) we show a separate error so no need to show anything here
      dataFrames[0] && (
        <TraceView trace={dataFrames[0].fields[0].values.get(0) as TraceViewData | undefined} splitOpenFn={splitOpen} />
      )
    );
  }

  render() {
    const {
      datasourceInstance,
      datasourceMissing,
      exploreId,
      split,
      queryKeys,
      graphResult,
      queryResponse,
      isLive,
      theme,
      showMetrics,
      showTable,
      showLogs,
      showTrace,
      showNodeGraph,
    } = this.props;
    const { openDrawer } = this.state;
    const exploreClass = split ? 'explore explore-split' : 'explore';
    const styles = getStyles(theme);
    const showPanels = queryResponse && queryResponse.state !== LoadingState.NotStarted;

    // gets an error without a refID, so non-query-row-related error, like a connection error
    const queryErrors =
      queryResponse.state === LoadingState.Error && queryResponse.error ? [queryResponse.error] : undefined;
    const queryError = getFirstNonQueryRowSpecificError(queryErrors);

    const showRichHistory = openDrawer === ExploreDrawer.RichHistory;
    const showQueryInspector = openDrawer === ExploreDrawer.QueryInspector;

    return (
      <div className={exploreClass} ref={this.getRef} aria-label={selectors.pages.Explore.General.container}>
        <ExploreToolbar exploreId={exploreId} onChangeTime={this.onChangeTime} />
        {datasourceMissing ? this.renderEmptyState() : null}
        {datasourceInstance && (
          <div className="explore-container">
            <div className={cx('panel-container', styles.queryContainer)}>
              <QueryRows exploreEvents={this.exploreEvents} exploreId={exploreId} queryKeys={queryKeys} />
              <SecondaryActions
                addQueryRowButtonDisabled={isLive}
                // We cannot show multiple traces at the same time right now so we do not show add query button.
                //TODO:unification
                addQueryRowButtonHidden={false}
                richHistoryButtonActive={showRichHistory}
                queryInspectorButtonActive={showQueryInspector}
                onClickAddQueryRowButton={this.onClickAddQueryRowButton}
                onClickRichHistoryButton={this.toggleShowRichHistory}
                onClickQueryInspectorButton={this.toggleShowQueryInspector}
              />
            </div>
            <ErrorContainer queryError={queryError} />
            <AutoSizer onResize={this.onResize} disableHeight>
              {({ width }) => {
                if (width === 0) {
                  return null;
                }

                return (
                  <main className={cx(styles.exploreMain)} style={{ width }}>
                    <ErrorBoundaryAlert>
                      {showPanels && (
                        <>
                          {showMetrics && graphResult && this.renderGraphPanel(width)}
                          {showTable && this.renderTablePanel(width)}
                          {showLogs && this.renderLogsPanel(width)}
                          {showNodeGraph && this.renderNodeGraphPanel()}
                          {showTrace && this.renderTraceViewPanel()}
                        </>
                      )}
                      {showRichHistory && (
                        <RichHistoryContainer
                          width={width}
                          exploreId={exploreId}
                          onClose={this.toggleShowRichHistory}
                        />
                      )}
                      {showQueryInspector && (
                        <ExploreQueryInspector
                          exploreId={exploreId}
                          width={width}
                          onClose={this.toggleShowQueryInspector}
                        />
                      )}
                    </ErrorBoundaryAlert>
                  </main>
                );
              }}
            </AutoSizer>
          </div>
        )}
      </div>
    );
  }
}

const ensureQueriesMemoized = memoizeOne(ensureQueries);
const getTimeRangeFromUrlMemoized = memoizeOne(getTimeRangeFromUrl);

function mapStateToProps(state: StoreState, { exploreId }: ExploreProps): Partial<ExploreProps> {
  const explore = state.explore;
  const { split, syncedTimes } = explore;
  const item: ExploreItemState = explore[exploreId];
  const timeZone = getTimeZone(state.user);
  const {
    datasourceInstance,
    datasourceMissing,
    initialized,
    queryKeys,
    urlState,
    update,
    isLive,
    graphResult,
    logsResult,
    showLogs,
    showMetrics,
    showTable,
    showTrace,
    absoluteRange,
    queryResponse,
    showNodeGraph,
    loading,
  } = item;

  const { datasource, queries, range: urlRange, originPanelId } = (urlState || {}) as ExploreUrlState;
  const initialDatasource = datasource || store.get(lastUsedDatasourceKeyForOrgId(state.user.orgId));
  const initialQueries: DataQuery[] = ensureQueriesMemoized(queries);
  const initialRange = urlRange
    ? getTimeRangeFromUrlMemoized(urlRange, timeZone)
    : getTimeRange(timeZone, DEFAULT_RANGE);

  return {
    datasourceInstance,
    datasourceMissing,
    initialized,
    split,
    queryKeys,
    update,
    initialDatasource,
    initialQueries,
    initialRange,
    isLive,
    graphResult,
    logsResult: logsResult ?? undefined,
    absoluteRange,
    queryResponse,
    originPanelId,
    syncedTimes,
    timeZone,
    showLogs,
    showMetrics,
    showTable,
    showTrace,
    showNodeGraph,
    loading,
  };
}

const mapDispatchToProps: Partial<ExploreProps> = {
  changeSize,
  initializeExplore,
  modifyQueries,
  refreshExplore,
  scanStart,
  scanStopAction,
  setQueries,
  updateTimeRange,
  addQueryRow,
  splitOpen,
};

export default compose(
  hot(module),
  connect(mapStateToProps, mapDispatchToProps),
  withTheme
)(Explore) as React.ComponentType<{ exploreId: ExploreId }>;
