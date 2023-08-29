// Libraries
import _ from 'lodash';
// Utils
import { getTemplateSrv } from '@grafana/runtime';
import { getNextRefIdChar } from 'app/core/utils/query';
// Types
import {
  DataConfigSource,
  DataLink,
  DataQuery,
  DataTransformerConfig,
  FieldConfigSource,
  PanelPlugin,
  ScopedVars,
  EventBus,
  EventBusSrv,
  DataFrameDTO,
  urlUtil,
  DataLinkBuiltInVars,
} from '@grafana/data';
import { EDIT_PANEL_ID } from 'app/core/constants';
import config from 'app/core/config';
import { PanelQueryRunner } from '../../query/state/PanelQueryRunner';
import {
  PanelOptionsChangedEvent,
  PanelQueriesChangedEvent,
  PanelTransformationsChangedEvent,
  RefreshEvent,
  RenderEvent,
} from 'app/types/events';
import { getTimeSrv } from '../services/TimeSrv';
import { getAllVariableValuesForUrl } from '../../variables/getAllVariableValuesForUrl';
import {
  filterFieldConfigOverrides,
  getPanelOptionsWithDefaults,
  isStandardFieldProp,
  restoreCustomOverrideRules,
} from './getPanelOptionsWithDefaults';

export interface GridPos {
  x: number;
  y: number;
  w: number;
  h: number;
  static?: boolean;
}

const notPersistedProperties: { [str: string]: boolean } = {
  events: true,
  isViewing: true,
  isEditing: true,
  isInView: true,
  hasRefreshed: true,
  cachedPluginOptions: true,
  plugin: true,
  queryRunner: true,
  replaceVariables: true,
  editSourceId: true,
};

// For angular panels we need to clean up properties when changing type
// To make sure the change happens without strange bugs happening when panels use same
// named property with different type / value expectations
// This is not required for react panels
const mustKeepProps: { [str: string]: boolean } = {
  id: true,
  gridPos: true,
  type: true,
  title: true,
  scopedVars: true,
  repeat: true,
  repeatIteration: true,
  repeatPanelId: true,
  repeatDirection: true,
  repeatedByRow: true,
  minSpan: true,
  collapsed: true,
  panels: true,
  targets: true,
  datasource: true,
  timeFrom: true,
  timeShift: true,
  hideTimeOverride: true,
  description: true,
  links: true,
  fullscreen: true,
  isEditing: true,
  hasRefreshed: true,
  events: true,
  cacheTimeout: true,
  cachedPluginOptions: true,
  transparent: true,
  pluginVersion: true,
  queryRunner: true,
  transformations: true,
  fieldConfig: true,
  editSourceId: true,
  maxDataPoints: true,
  interval: true,
  replaceVariables: true,
};

const defaults: any = {
  gridPos: { x: 0, y: 0, h: 3, w: 6 },
  targets: [{ refId: 'A' }],
  cachedPluginOptions: {},
  transparent: false,
  options: {},
  datasource: null,
};

export class PanelModel implements DataConfigSource {
  /* persisted id, used in URL to identify a panel */
  id: number;
  editSourceId: number;
  gridPos: GridPos;
  type: string;
  title: string;
  alert?: any;
  scopedVars?: ScopedVars;
  repeat?: string;
  repeatIteration?: number;
  repeatPanelId?: number;
  repeatDirection?: string;
  repeatedByRow?: boolean;
  maxPerRow?: number;
  collapsed?: boolean;

  panels?: any;
  targets: DataQuery[];
  transformations?: DataTransformerConfig[];
  datasource: string | null;
  thresholds?: any;
  pluginVersion?: string;

  snapshotData?: DataFrameDTO[];
  timeFrom?: any;
  timeShift?: any;
  hideTimeOverride?: any;
  options: {
    [key: string]: any;
  };
  fieldConfig: FieldConfigSource;

  maxDataPoints?: number | null;
  interval?: string | null;
  description?: string;
  links?: DataLink[];
  transparent: boolean;

  // non persisted
  isViewing: boolean;
  isEditing: boolean;
  isInView: boolean;

  hasRefreshed: boolean;
  events: EventBus;
  cacheTimeout?: any;
  cachedPluginOptions: Record<string, PanelOptionsCache>;
  legend?: { show: boolean; sort?: string; sortDesc?: boolean };
  plugin?: PanelPlugin;

  private queryRunner?: PanelQueryRunner;

  constructor(model: any) {
    this.events = new EventBusSrv();
    this.restoreModel(model);
    this.replaceVariables = this.replaceVariables.bind(this);
  }

  /** Given a persistened PanelModel restores property values */
  restoreModel(model: any) {
    // Start with clean-up
    for (const property in this) {
      if (notPersistedProperties[property] || !this.hasOwnProperty(property)) {
        continue;
      }

      if (model[property]) {
        continue;
      }

      if (typeof (this as any)[property] === 'function') {
        continue;
      }

      if (typeof (this as any)[property] === 'symbol') {
        continue;
      }

      delete (this as any)[property];
    }

    // copy properties from persisted model
    for (const property in model) {
      (this as any)[property] = model[property];
    }

    // defaults
    _.defaultsDeep(this, _.cloneDeep(defaults));

    // queries must have refId
    this.ensureQueryIds();
  }

  ensureQueryIds() {
    if (this.targets && _.isArray(this.targets)) {
      for (const query of this.targets) {
        if (!query.refId) {
          query.refId = getNextRefIdChar(this.targets);
        }
      }
    }
  }

  getOptions() {
    return this.options;
  }

  getFieldConfig() {
    return this.fieldConfig;
  }

  updateOptions(options: object) {
    this.options = options;
    this.events.publish(new PanelOptionsChangedEvent());
    this.render();
  }

  updateFieldConfig(config: FieldConfigSource) {
    this.fieldConfig = config;
    this.events.publish(new PanelOptionsChangedEvent());

    this.resendLastResult();
    this.render();
  }

  getSaveModel() {
    const model: any = {};

    for (const property in this) {
      if (notPersistedProperties[property] || !this.hasOwnProperty(property)) {
        continue;
      }

      if (_.isEqual(this[property], defaults[property])) {
        continue;
      }

      model[property] = _.cloneDeep(this[property]);
    }

    if (model.datasource === undefined) {
      // This is part of defaults as defaults are removed in save model and
      // this should not be removed in save model as exporter needs to templatize it
      model.datasource = null;
    }

    return model;
  }

  setIsViewing(isViewing: boolean) {
    this.isViewing = isViewing;
  }

  updateGridPos(newPos: GridPos) {
    this.gridPos.x = newPos.x;
    this.gridPos.y = newPos.y;
    this.gridPos.w = newPos.w;
    this.gridPos.h = newPos.h;
  }

  refresh() {
    this.hasRefreshed = true;
    this.events.publish(new RefreshEvent());
  }

  render() {
    if (!this.hasRefreshed) {
      this.refresh();
    } else {
      this.events.publish(new RenderEvent());
    }
  }

  private getOptionsToRemember() {
    return Object.keys(this).reduce((acc, property) => {
      if (notPersistedProperties[property] || mustKeepProps[property]) {
        return acc;
      }
      return {
        ...acc,
        [property]: (this as any)[property],
      };
    }, {});
  }

  private restorePanelOptions(pluginId: string) {
    if (!this.cachedPluginOptions) {
      return;
    }

    const prevOptions = this.cachedPluginOptions[pluginId];

    if (!prevOptions) {
      return;
    }

    Object.keys(prevOptions.properties).map((property) => {
      (this as any)[property] = prevOptions.properties[property];
    });

    this.fieldConfig = restoreCustomOverrideRules(this.fieldConfig, prevOptions.fieldConfig);
  }

  applyPluginOptionDefaults(plugin: PanelPlugin, isAfterPluginChange: boolean) {
    const options = getPanelOptionsWithDefaults({
      plugin,
      currentOptions: this.options,
      currentFieldConfig: this.fieldConfig,
      isAfterPluginChange: isAfterPluginChange,
    });

    this.fieldConfig = options.fieldConfig;
    this.options = options.options;
  }

  pluginLoaded(plugin: PanelPlugin) {
    this.plugin = plugin;

    if (plugin.onPanelMigration) {
      const version = getPluginVersion(plugin);

      if (version !== this.pluginVersion) {
        this.options = plugin.onPanelMigration(this);
        this.pluginVersion = version;
      }
    }

    this.applyPluginOptionDefaults(plugin, false);
    this.resendLastResult();
  }

  clearPropertiesBeforePluginChange() {
    // remove panel type specific  options
    for (const key of _.keys(this)) {
      if (mustKeepProps[key]) {
        continue;
      }
      delete (this as any)[key];
    }

    this.options = {};

    // clear custom options
    this.fieldConfig = {
      defaults: {
        ...this.fieldConfig.defaults,
        custom: {},
      },
      // filter out custom overrides
      overrides: filterFieldConfigOverrides(this.fieldConfig.overrides, isStandardFieldProp),
    };
  }

  changePlugin(newPlugin: PanelPlugin) {
    const pluginId = newPlugin.meta.id;
    const oldOptions: any = this.getOptionsToRemember();
    const prevFieldConfig = this.fieldConfig;
    const oldPluginId = this.type;
    const wasAngular = this.isAngularPlugin();

    this.cachedPluginOptions[oldPluginId] = {
      properties: oldOptions,
      fieldConfig: prevFieldConfig,
    };

    this.clearPropertiesBeforePluginChange();
    this.restorePanelOptions(pluginId);

    // Let panel plugins inspect options from previous panel and keep any that it can use
    if (newPlugin.onPanelTypeChanged) {
      const prevOptions = wasAngular ? { angular: oldOptions } : oldOptions.options;
      Object.assign(this.options, newPlugin.onPanelTypeChanged(this, oldPluginId, prevOptions, prevFieldConfig));
    }

    // switch
    this.type = pluginId;
    this.plugin = newPlugin;

    // For some reason I need to rebind replace variables here, otherwise the viz repeater does not work
    this.replaceVariables = this.replaceVariables.bind(this);
    this.applyPluginOptionDefaults(newPlugin, true);

    if (newPlugin.onPanelMigration) {
      this.pluginVersion = getPluginVersion(newPlugin);
    }
  }

  updateQueries(queries: DataQuery[]) {
    this.events.publish(new PanelQueriesChangedEvent());
    this.targets = queries;
  }

  addQuery(query?: Partial<DataQuery>) {
    query = query || { refId: 'A' };
    query.refId = getNextRefIdChar(this.targets);
    this.targets.push(query as DataQuery);
  }

  changeQuery(query: DataQuery, index: number) {
    // ensure refId is maintained
    query.refId = this.targets[index].refId;

    // update query in array
    this.targets = this.targets.map((item, itemIndex) => {
      if (itemIndex === index) {
        return query;
      }
      return item;
    });
  }

  getEditClone() {
    const sourceModel = this.getSaveModel();

    // Temporary id for the clone, restored later in redux action when changes are saved
    sourceModel.id = EDIT_PANEL_ID;
    sourceModel.editSourceId = this.id;

    const clone = new PanelModel(sourceModel);
    clone.isEditing = true;
    const sourceQueryRunner = this.getQueryRunner();

    // Copy last query result
    clone.getQueryRunner().useLastResultFrom(sourceQueryRunner);

    return clone;
  }

  getTransformations() {
    return this.transformations;
  }

  getFieldOverrideOptions() {
    if (!this.plugin) {
      return undefined;
    }

    return {
      fieldConfig: this.fieldConfig,
      replaceVariables: this.replaceVariables,
      fieldConfigRegistry: this.plugin.fieldConfigRegistry,
      theme: config.theme,
    };
  }

  getQueryRunner(): PanelQueryRunner {
    if (!this.queryRunner) {
      this.queryRunner = new PanelQueryRunner(this);
    }
    return this.queryRunner;
  }

  hasTitle() {
    return this.title && this.title.length > 0;
  }

  isAngularPlugin(): boolean {
    return (this.plugin && this.plugin.angularPanelCtrl) !== undefined;
  }

  destroy() {
    this.events.removeAllListeners();

    if (this.queryRunner) {
      this.queryRunner.destroy();
    }
  }

  setTransformations(transformations: DataTransformerConfig[]) {
    this.transformations = transformations;
    this.resendLastResult();
    this.events.publish(new PanelTransformationsChangedEvent());
  }

  replaceVariables(value: string, extraVars: ScopedVars | undefined, format?: string | Function) {
    let vars = this.scopedVars;

    if (extraVars) {
      vars = vars ? { ...vars, ...extraVars } : extraVars;
    }
    const allVariablesParams = getAllVariableValuesForUrl(vars);
    const variablesQuery = urlUtil.toUrlParams(allVariablesParams);
    const timeRangeUrl = urlUtil.toUrlParams(getTimeSrv().timeRangeForUrl());

    vars = {
      ...vars,
      [DataLinkBuiltInVars.keepTime]: {
        text: timeRangeUrl,
        value: timeRangeUrl,
      },
      [DataLinkBuiltInVars.includeVars]: {
        text: variablesQuery,
        value: variablesQuery,
      },
    };

    return getTemplateSrv().replace(value, vars, format);
  }

  resendLastResult() {
    if (!this.plugin) {
      return;
    }

    this.getQueryRunner().resendLastResult();
  }

  /*
   * Panel have a different id while in edit mode (to more easily be able to discard changes)
   * Use this to always get the underlying source id
   * */
  getSavedId(): number {
    return this.editSourceId ?? this.id;
  }
}

function getPluginVersion(plugin: PanelPlugin): string {
  return plugin && plugin.meta.info.version ? plugin.meta.info.version : config.buildInfo.version;
}

interface PanelOptionsCache {
  properties: any;
  fieldConfig: FieldConfigSource;
}
