import _ from 'lodash';
import {
  DataFrame,
  DataLink,
  DataQuery,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  DateTime,
  dateTime,
  Field,
  getDefaultTimeRange,
  LogRowModel,
  MetricFindValue,
  PluginMeta,
  ScopedVars,
  TimeRange,
  toUtc,
} from '@grafana/data';
import LanguageProvider from './language_provider';
import { ElasticResponse } from './elastic_response';
import { IndexPattern } from './index_pattern';
import { ElasticQueryBuilder } from './query_builder';
import { defaultBucketAgg, hasMetricOfType } from './query_def';
import { getBackendSrv, getDataSourceSrv } from '@grafana/runtime';
import { getTemplateSrv, TemplateSrv } from 'app/features/templating/template_srv';
import { DataLinkConfig, ElasticsearchOptions, ElasticsearchQuery } from './types';
import { RowContextOptions } from '@grafana/ui/src/components/Logs/LogRowContextProvider';
import { metricAggregationConfig } from './components/QueryEditor/MetricAggregationsEditor/utils';
import {
  isMetricAggregationWithField,
  isPipelineAggregationWithMultipleBucketPaths,
} from './components/QueryEditor/MetricAggregationsEditor/aggregations';
import { bucketAggregationConfig } from './components/QueryEditor/BucketAggregationsEditor/utils';
import { isBucketAggregationWithField } from './components/QueryEditor/BucketAggregationsEditor/aggregations';
import { generate, Observable, of, throwError } from 'rxjs';
import { catchError, first, map, mergeMap, skipWhile, throwIfEmpty } from 'rxjs/operators';

// Those are metadata fields as defined in https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-fields.html#_identity_metadata_fields.
// custom fields can start with underscores, therefore is not safe to exclude anything that starts with one.
const ELASTIC_META_FIELDS = [
  '_index',
  '_type',
  '_id',
  '_source',
  '_size',
  '_field_names',
  '_ignored',
  '_routing',
  '_meta',
];

export class ElasticDatasource extends DataSourceApi<ElasticsearchQuery, ElasticsearchOptions> {
  basicAuth?: string;
  withCredentials?: boolean;
  url: string;
  name: string;
  index: string;
  timeField: string;
  esVersion: number;
  interval: string;
  maxConcurrentShardRequests?: number;
  queryBuilder: ElasticQueryBuilder;
  indexPattern: IndexPattern;
  logMessageField?: string;
  logLevelField?: string;
  dataLinks: DataLinkConfig[];
  languageProvider: LanguageProvider;

  constructor(
    instanceSettings: DataSourceInstanceSettings<ElasticsearchOptions>,
    private readonly templateSrv: TemplateSrv = getTemplateSrv()
  ) {
    super(instanceSettings);
    this.basicAuth = instanceSettings.basicAuth;
    this.withCredentials = instanceSettings.withCredentials;
    this.url = instanceSettings.url!;
    this.name = instanceSettings.name;
    this.index = instanceSettings.database ?? '';
    const settingsData = instanceSettings.jsonData || ({} as ElasticsearchOptions);

    this.timeField = settingsData.timeField;
    this.esVersion = settingsData.esVersion;
    this.indexPattern = new IndexPattern(this.index, settingsData.interval);
    this.interval = settingsData.timeInterval;
    this.maxConcurrentShardRequests = settingsData.maxConcurrentShardRequests;
    this.queryBuilder = new ElasticQueryBuilder({
      timeField: this.timeField,
      esVersion: this.esVersion,
    });
    this.logMessageField = settingsData.logMessageField || '';
    this.logLevelField = settingsData.logLevelField || '';
    this.dataLinks = settingsData.dataLinks || [];

    if (this.logMessageField === '') {
      this.logMessageField = undefined;
    }

    if (this.logLevelField === '') {
      this.logLevelField = undefined;
    }
    this.languageProvider = new LanguageProvider(this);
  }

  private request(method: string, url: string, data?: undefined): Observable<any> {
    const options: any = {
      url: this.url + '/' + url,
      method: method,
      data: data,
    };

    if (this.basicAuth || this.withCredentials) {
      options.withCredentials = true;
    }
    if (this.basicAuth) {
      options.headers = {
        Authorization: this.basicAuth,
      };
    }

    return getBackendSrv()
      .fetch<any>(options)
      .pipe(
        map((results) => {
          results.data.$$config = results.config;
          return results.data;
        }),
        catchError((err) => {
          if (err.data && err.data.error) {
            return throwError({
              message: 'Elasticsearch error: ' + err.data.error.reason,
              error: err.data.error,
            });
          }

          return throwError(err);
        })
      );
  }

  async importQueries(queries: DataQuery[], originMeta: PluginMeta): Promise<ElasticsearchQuery[]> {
    return this.languageProvider.importQueries(queries, originMeta.id);
  }

  /**
   * Sends a GET request to the specified url on the newest matching and available index.
   *
   * When multiple indices span the provided time range, the request is sent starting from the newest index,
   * and then going backwards until an index is found.
   *
   * @param url the url to query the index on, for example `/_mapping`.
   */
  private get(url: string, range = getDefaultTimeRange()): Observable<any> {
    let indexList = this.indexPattern.getIndexList(range.from, range.to);
    if (!Array.isArray(indexList)) {
      indexList = [this.indexPattern.getIndexForToday()];
    }

    const indexUrlList = indexList.map((index) => index + url);

    return this.requestAllIndices(indexUrlList);
  }

  private requestAllIndices(indexList: string[]): Observable<any> {
    const maxTraversals = 7; // do not go beyond one week (for a daily pattern)
    const listLen = indexList.length;

    return generate(
      0,
      (i) => i < Math.min(listLen, maxTraversals),
      (i) => i + 1
    ).pipe(
      mergeMap((index) => {
        // catch all errors and emit an object with an err property to simplify checks later in the pipeline
        return this.request('GET', indexList[listLen - index - 1]).pipe(catchError((err) => of({ err })));
      }),
      skipWhile((resp) => resp.err && resp.err.status === 404), // skip all requests that fail because missing Elastic index
      throwIfEmpty(() => 'Could not find an available index for this time range.'), // when i === Math.min(listLen, maxTraversals) generate will complete but without emitting any values which means we didn't find a valid index
      first(), // take the first value that isn't skipped
      map((resp) => {
        if (resp.err) {
          throw resp.err; // if there is some other error except 404 then we must throw it
        }

        return resp;
      })
    );
  }

  private post(url: string, data: any): Observable<any> {
    return this.request('POST', url, data);
  }

  annotationQuery(options: any): Promise<any> {
    const annotation = options.annotation;
    const timeField = annotation.timeField || '@timestamp';
    const timeEndField = annotation.timeEndField || null;
    const queryString = annotation.query || '*';
    const tagsField = annotation.tagsField || 'tags';
    const textField = annotation.textField || null;

    const dateRanges = [];
    const rangeStart: any = {};
    rangeStart[timeField] = {
      from: options.range.from.valueOf(),
      to: options.range.to.valueOf(),
      format: 'epoch_millis',
    };
    dateRanges.push({ range: rangeStart });

    if (timeEndField) {
      const rangeEnd: any = {};
      rangeEnd[timeEndField] = {
        from: options.range.from.valueOf(),
        to: options.range.to.valueOf(),
        format: 'epoch_millis',
      };
      dateRanges.push({ range: rangeEnd });
    }

    const queryInterpolated = this.templateSrv.replace(queryString, {}, 'lucene');
    const query = {
      bool: {
        filter: [
          {
            bool: {
              should: dateRanges,
              minimum_should_match: 1,
            },
          },
          {
            query_string: {
              query: queryInterpolated,
            },
          },
        ],
      },
    };

    const data: any = {
      query,
      size: 10000,
    };

    // fields field not supported on ES 5.x
    if (this.esVersion < 5) {
      data['fields'] = [timeField, '_source'];
    }

    const header: any = {
      search_type: 'query_then_fetch',
      ignore_unavailable: true,
    };

    // old elastic annotations had index specified on them
    if (annotation.index) {
      header.index = annotation.index;
    } else {
      header.index = this.indexPattern.getIndexList(options.range.from, options.range.to);
    }

    const payload = JSON.stringify(header) + '\n' + JSON.stringify(data) + '\n';

    return this.post('_msearch', payload)
      .pipe(
        map((res) => {
          const list = [];
          const hits = res.responses[0].hits.hits;

          const getFieldFromSource = (source: any, fieldName: any) => {
            if (!fieldName) {
              return;
            }

            const fieldNames = fieldName.split('.');
            let fieldValue = source;

            for (let i = 0; i < fieldNames.length; i++) {
              fieldValue = fieldValue[fieldNames[i]];
              if (!fieldValue) {
                console.log('could not find field in annotation: ', fieldName);
                return '';
              }
            }

            return fieldValue;
          };

          for (let i = 0; i < hits.length; i++) {
            const source = hits[i]._source;
            let time = getFieldFromSource(source, timeField);
            if (typeof hits[i].fields !== 'undefined') {
              const fields = hits[i].fields;
              if (_.isString(fields[timeField]) || _.isNumber(fields[timeField])) {
                time = fields[timeField];
              }
            }

            const event: {
              annotation: any;
              time: number;
              timeEnd?: number;
              text: string;
              tags: string | string[];
            } = {
              annotation: annotation,
              time: toUtc(time).valueOf(),
              text: getFieldFromSource(source, textField),
              tags: getFieldFromSource(source, tagsField),
            };

            if (timeEndField) {
              const timeEnd = getFieldFromSource(source, timeEndField);
              if (timeEnd) {
                event.timeEnd = toUtc(timeEnd).valueOf();
              }
            }

            // legacy support for title tield
            if (annotation.titleField) {
              const title = getFieldFromSource(source, annotation.titleField);
              if (title) {
                event.text = title + '\n' + event.text;
              }
            }

            if (typeof event.tags === 'string') {
              event.tags = event.tags.split(',');
            }

            list.push(event);
          }
          return list;
        })
      )
      .toPromise();
  }

  private interpolateLuceneQuery(queryString: string, scopedVars: ScopedVars) {
    // Elasticsearch queryString should always be '*' if empty string
    return this.templateSrv.replace(queryString, scopedVars, 'lucene') || '*';
  }

  interpolateVariablesInQueries(queries: ElasticsearchQuery[], scopedVars: ScopedVars): ElasticsearchQuery[] {
    let expandedQueries = queries;
    if (queries && queries.length > 0) {
      expandedQueries = queries.map((query) => {
        const expandedQuery = {
          ...query,
          datasource: this.name,
          query: this.interpolateLuceneQuery(query.query || '', scopedVars),
        };

        for (let bucketAgg of query.bucketAggs || []) {
          if (bucketAgg.type === 'filters') {
            for (let filter of bucketAgg.settings?.filters || []) {
              filter.query = this.interpolateLuceneQuery(filter.query, scopedVars);
            }
          }
        }
        return expandedQuery;
      });
    }
    return expandedQueries;
  }

  testDatasource() {
    // validate that the index exist and has date field
    return this.getFields('date')
      .pipe(
        mergeMap((dateFields) => {
          const timeField: any = _.find(dateFields, { text: this.timeField });
          if (!timeField) {
            return of({ status: 'error', message: 'No date field named ' + this.timeField + ' found' });
          }
          return of({ status: 'success', message: 'Index OK. Time field name OK.' });
        }),
        catchError((err) => {
          console.error(err);
          if (err.message) {
            return of({ status: 'error', message: err.message });
          } else {
            return of({ status: 'error', message: err.status });
          }
        })
      )
      .toPromise();
  }

  getQueryHeader(searchType: any, timeFrom?: DateTime, timeTo?: DateTime): string {
    const queryHeader: any = {
      search_type: searchType,
      ignore_unavailable: true,
      index: this.indexPattern.getIndexList(timeFrom, timeTo),
    };

    if (this.esVersion >= 56 && this.esVersion < 70) {
      queryHeader['max_concurrent_shard_requests'] = this.maxConcurrentShardRequests;
    }

    return JSON.stringify(queryHeader);
  }

  getQueryDisplayText(query: ElasticsearchQuery) {
    // TODO: This might be refactored a bit.
    const metricAggs = query.metrics;
    const bucketAggs = query.bucketAggs;
    let text = '';

    if (query.query) {
      text += 'Query: ' + query.query + ', ';
    }

    text += 'Metrics: ';

    text += metricAggs?.reduce((acc, metric) => {
      const metricConfig = metricAggregationConfig[metric.type];

      let text = metricConfig.label + '(';

      if (isMetricAggregationWithField(metric)) {
        text += metric.field;
      }
      if (isPipelineAggregationWithMultipleBucketPaths(metric)) {
        text += metric.settings?.script?.replace(new RegExp('params.', 'g'), '');
      }
      text += '), ';

      return `${acc} ${text}`;
    }, '');

    text += bucketAggs?.reduce((acc, bucketAgg, index) => {
      const bucketConfig = bucketAggregationConfig[bucketAgg.type];

      let text = '';
      if (index === 0) {
        text += ' Group by: ';
      }

      text += bucketConfig.label + '(';
      if (isBucketAggregationWithField(bucketAgg)) {
        text += bucketAgg.field;
      }

      return `${acc} ${text}), `;
    }, '');

    if (query.alias) {
      text += 'Alias: ' + query.alias;
    }

    return text;
  }

  /**
   * This method checks to ensure the user is running a 5.0+ cluster. This is
   * necessary bacause the query being used for the getLogRowContext relies on the
   * search_after feature.
   */
  showContextToggle(): boolean {
    return this.esVersion > 5;
  }

  getLogRowContext = async (row: LogRowModel, options?: RowContextOptions): Promise<{ data: DataFrame[] }> => {
    const sortField = row.dataFrame.fields.find((f) => f.name === 'sort');
    const searchAfter = sortField?.values.get(row.rowIndex) || [row.timeEpochMs];
    const sort = options?.direction === 'FORWARD' ? 'asc' : 'desc';

    const header =
      options?.direction === 'FORWARD'
        ? this.getQueryHeader('query_then_fetch', dateTime(row.timeEpochMs))
        : this.getQueryHeader('query_then_fetch', undefined, dateTime(row.timeEpochMs));

    const limit = options?.limit ?? 10;
    const esQuery = JSON.stringify({
      size: limit,
      query: {
        bool: {
          filter: [
            {
              range: {
                [this.timeField]: {
                  [options?.direction === 'FORWARD' ? 'gte' : 'lte']: row.timeEpochMs,
                  format: 'epoch_millis',
                },
              },
            },
          ],
        },
      },
      sort: [{ [this.timeField]: sort }, { _doc: sort }],
      search_after: searchAfter,
    });
    const payload = [header, esQuery].join('\n') + '\n';
    const url = this.getMultiSearchUrl();
    const response = await this.post(url, payload).toPromise();
    const targets: ElasticsearchQuery[] = [{ refId: `${row.dataFrame.refId}`, metrics: [], isLogsQuery: true }];
    const elasticResponse = new ElasticResponse(targets, transformHitsBasedOnDirection(response, sort));
    const logResponse = elasticResponse.getLogs(this.logMessageField, this.logLevelField);
    const dataFrame = _.first(logResponse.data);
    if (!dataFrame) {
      return { data: [] };
    }
    /**
     * The LogRowContextProvider requires there is a field in the dataFrame.fields
     * named `ts` for timestamp and `line` for the actual log line to display.
     * Unfortunatly these fields are hardcoded and are required for the lines to
     * be properly displayed. This code just copies the fields based on this.timeField
     * and this.logMessageField and recreates the dataFrame so it works.
     */
    const timestampField = dataFrame.fields.find((f: Field) => f.name === this.timeField);
    const lineField = dataFrame.fields.find((f: Field) => f.name === this.logMessageField);
    if (timestampField && lineField) {
      return {
        data: [
          {
            ...dataFrame,
            fields: [...dataFrame.fields, { ...timestampField, name: 'ts' }, { ...lineField, name: 'line' }],
          },
        ],
      };
    }
    return logResponse;
  };

  query(options: DataQueryRequest<ElasticsearchQuery>): Observable<DataQueryResponse> {
    let payload = '';
    const targets = this.interpolateVariablesInQueries(_.cloneDeep(options.targets), options.scopedVars);
    const sentTargets: ElasticsearchQuery[] = [];

    // add global adhoc filters to timeFilter
    const adhocFilters = this.templateSrv.getAdhocFilters(this.name);

    for (const target of targets) {
      if (target.hide) {
        continue;
      }

      let queryObj;
      if (target.isLogsQuery || hasMetricOfType(target, 'logs')) {
        target.bucketAggs = [defaultBucketAgg()];
        target.metrics = [];
        // Setting this for metrics queries that are typed as logs
        target.isLogsQuery = true;
        queryObj = this.queryBuilder.getLogsQuery(target, adhocFilters, target.query);
      } else {
        if (target.alias) {
          target.alias = this.templateSrv.replace(target.alias, options.scopedVars, 'lucene');
        }

        queryObj = this.queryBuilder.build(target, adhocFilters, target.query);
      }

      const esQuery = JSON.stringify(queryObj);

      const searchType = queryObj.size === 0 && this.esVersion < 5 ? 'count' : 'query_then_fetch';
      const header = this.getQueryHeader(searchType, options.range.from, options.range.to);
      payload += header + '\n';

      payload += esQuery + '\n';

      sentTargets.push(target);
    }

    if (sentTargets.length === 0) {
      return of({ data: [] });
    }

    // We replace the range here for actual values. We need to replace it together with enclosing "" so that we replace
    // it as an integer not as string with digits. This is because elastic will convert the string only if the time
    // field is specified as type date (which probably should) but can also be specified as integer (millisecond epoch)
    // and then sending string will error out.
    payload = payload.replace(/"\$timeFrom"/g, options.range.from.valueOf().toString());
    payload = payload.replace(/"\$timeTo"/g, options.range.to.valueOf().toString());
    payload = this.templateSrv.replace(payload, options.scopedVars);

    const url = this.getMultiSearchUrl();

    return this.post(url, payload).pipe(
      map((res) => {
        const er = new ElasticResponse(sentTargets, res);

        if (sentTargets.some((target) => target.isLogsQuery)) {
          const response = er.getLogs(this.logMessageField, this.logLevelField);
          for (const dataFrame of response.data) {
            enhanceDataFrame(dataFrame, this.dataLinks);
          }
          return response;
        }

        return er.getTimeSeries();
      })
    );
  }

  isMetadataField(fieldName: string) {
    return ELASTIC_META_FIELDS.includes(fieldName);
  }

  // TODO: instead of being a string, this could be a custom type representing all the elastic types
  getFields(type?: string, range?: TimeRange): Observable<MetricFindValue[]> {
    const configuredEsVersion = this.esVersion;
    return this.get('/_mapping', range).pipe(
      map((result) => {
        const typeMap: any = {
          float: 'number',
          double: 'number',
          integer: 'number',
          long: 'number',
          date: 'date',
          date_nanos: 'date',
          string: 'string',
          text: 'string',
          scaled_float: 'number',
          nested: 'nested',
        };

        const shouldAddField = (obj: any, key: string) => {
          if (this.isMetadataField(key)) {
            return false;
          }

          if (!type) {
            return true;
          }

          // equal query type filter, or via typemap translation
          return type === obj.type || type === typeMap[obj.type];
        };

        // Store subfield names: [system, process, cpu, total] -> system.process.cpu.total
        const fieldNameParts: any = [];
        const fields: any = {};

        function getFieldsRecursively(obj: any) {
          for (const key in obj) {
            const subObj = obj[key];

            // Check mapping field for nested fields
            if (_.isObject(subObj.properties)) {
              fieldNameParts.push(key);
              getFieldsRecursively(subObj.properties);
            }

            if (_.isObject(subObj.fields)) {
              fieldNameParts.push(key);
              getFieldsRecursively(subObj.fields);
            }

            if (_.isString(subObj.type)) {
              const fieldName = fieldNameParts.concat(key).join('.');

              // Hide meta-fields and check field type
              if (shouldAddField(subObj, key)) {
                fields[fieldName] = {
                  text: fieldName,
                  type: subObj.type,
                };
              }
            }
          }
          fieldNameParts.pop();
        }

        for (const indexName in result) {
          const index = result[indexName];
          if (index && index.mappings) {
            const mappings = index.mappings;

            if (configuredEsVersion < 70) {
              for (const typeName in mappings) {
                const properties = mappings[typeName].properties;
                getFieldsRecursively(properties);
              }
            } else {
              const properties = mappings.properties;
              getFieldsRecursively(properties);
            }
          }
        }

        // transform to array
        return _.map(fields, (value) => {
          return value;
        });
      })
    );
  }

  getTerms(queryDef: any, range = getDefaultTimeRange()): Observable<MetricFindValue[]> {
    const searchType = this.esVersion >= 5 ? 'query_then_fetch' : 'count';
    const header = this.getQueryHeader(searchType, range.from, range.to);
    let esQuery = JSON.stringify(this.queryBuilder.getTermsQuery(queryDef));

    esQuery = esQuery.replace(/\$timeFrom/g, range.from.valueOf().toString());
    esQuery = esQuery.replace(/\$timeTo/g, range.to.valueOf().toString());
    esQuery = header + '\n' + esQuery + '\n';

    const url = this.getMultiSearchUrl();

    return this.post(url, esQuery).pipe(
      map((res) => {
        if (!res.responses[0].aggregations) {
          return [];
        }

        const buckets = res.responses[0].aggregations['1'].buckets;
        return _.map(buckets, (bucket) => {
          return {
            text: bucket.key_as_string || bucket.key,
            value: bucket.key,
          };
        });
      })
    );
  }

  getMultiSearchUrl() {
    if (this.esVersion >= 70 && this.maxConcurrentShardRequests) {
      return `_msearch?max_concurrent_shard_requests=${this.maxConcurrentShardRequests}`;
    }

    return '_msearch';
  }

  metricFindQuery(query: string, options?: any): Promise<MetricFindValue[]> {
    const range = options?.range;
    const parsedQuery = JSON.parse(query);
    if (query) {
      if (parsedQuery.find === 'fields') {
        parsedQuery.type = this.templateSrv.replace(parsedQuery.type, {}, 'lucene');
        return this.getFields(parsedQuery.type, range).toPromise();
      }

      if (parsedQuery.find === 'terms') {
        parsedQuery.field = this.templateSrv.replace(parsedQuery.field, {}, 'lucene');
        parsedQuery.query = this.templateSrv.replace(parsedQuery.query || '*', {}, 'lucene');
        return this.getTerms(parsedQuery, range).toPromise();
      }
    }

    return Promise.resolve([]);
  }

  getTagKeys() {
    return this.getFields().toPromise();
  }

  getTagValues(options: any) {
    return this.getTerms({ field: options.key, query: '*' }).toPromise();
  }

  targetContainsTemplate(target: any) {
    if (this.templateSrv.variableExists(target.query) || this.templateSrv.variableExists(target.alias)) {
      return true;
    }

    for (const bucketAgg of target.bucketAggs) {
      if (this.templateSrv.variableExists(bucketAgg.field) || this.objectContainsTemplate(bucketAgg.settings)) {
        return true;
      }
    }

    for (const metric of target.metrics) {
      if (
        this.templateSrv.variableExists(metric.field) ||
        this.objectContainsTemplate(metric.settings) ||
        this.objectContainsTemplate(metric.meta)
      ) {
        return true;
      }
    }

    return false;
  }

  private isPrimitive(obj: any) {
    if (obj === null || obj === undefined) {
      return true;
    }
    if (['string', 'number', 'boolean'].some((type) => type === typeof true)) {
      return true;
    }

    return false;
  }

  private objectContainsTemplate(obj: any) {
    if (!obj) {
      return false;
    }

    for (const key of Object.keys(obj)) {
      if (this.isPrimitive(obj[key])) {
        if (this.templateSrv.variableExists(obj[key])) {
          return true;
        }
      } else if (Array.isArray(obj[key])) {
        for (const item of obj[key]) {
          if (this.objectContainsTemplate(item)) {
            return true;
          }
        }
      } else {
        if (this.objectContainsTemplate(obj[key])) {
          return true;
        }
      }
    }

    return false;
  }
}

/**
 * Modifies dataframe and adds dataLinks from the config.
 * Exported for tests.
 */
export function enhanceDataFrame(dataFrame: DataFrame, dataLinks: DataLinkConfig[]) {
  const dataSourceSrv = getDataSourceSrv();

  if (!dataLinks.length) {
    return;
  }

  for (const field of dataFrame.fields) {
    const dataLinkConfig = dataLinks.find((dataLink) => field.name && field.name.match(dataLink.field));

    if (!dataLinkConfig) {
      continue;
    }

    let link: DataLink;

    if (dataLinkConfig.datasourceUid) {
      const dsSettings = dataSourceSrv.getInstanceSettings(dataLinkConfig.datasourceUid);

      link = {
        title: '',
        url: '',
        internal: {
          query: { query: dataLinkConfig.url },
          datasourceUid: dataLinkConfig.datasourceUid,
          datasourceName: dsSettings?.name ?? 'Data source not found',
        },
      };
    } else {
      link = {
        title: '',
        url: dataLinkConfig.url,
      };
    }

    field.config = field.config || {};
    field.config.links = [...(field.config.links || []), link];
  }
}

function transformHitsBasedOnDirection(response: any, direction: 'asc' | 'desc') {
  if (direction === 'desc') {
    return response;
  }
  const actualResponse = response.responses[0];
  return {
    ...response,
    responses: [
      {
        ...actualResponse,
        hits: {
          ...actualResponse.hits,
          hits: actualResponse.hits.hits.reverse(),
        },
      },
    ],
  };
}
