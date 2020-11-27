import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ChartVoronoiContainer } from '@patternfly/react-charts';
import { LoadingInline } from '@console/internal/components/utils';
import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';
import {
  formatDate,
  formatTimeSeriesValues,
  PipelineMetricsGraphProps,
} from './pipeline-metrics-utils';
import { TimeSeriesChart } from './charts/TimeSeriesChart';
import { DEFAULT_CHART_HEIGHT, DEFAULT_SAMPLES } from '../const';
import { usePipelineRunPoll } from '../hooks';

import './pipeline-chart.scss';

const PipelineRunCount: React.FC<PipelineMetricsGraphProps> = ({
  pipeline,
  timespan,
  interval,
  width = 650,
  loaded = true,
  onLoad: onInitialLoad,
}) => {
  const {
    metadata: { name, namespace },
  } = pipeline;
  const { t } = useTranslation();
  const [pipelineRunResult, error, loading] = usePipelineRunPoll({
    name,
    namespace,
    timespan,
    delay: interval,
  });
  const pipelineRunResultData = pipelineRunResult?.data?.result ?? [];

  if (loading) {
    return <LoadingInline />;
  }

  if (!loaded) {
    onInitialLoad &&
      onInitialLoad({ chartName: 'pipelineRunCount', hasData: !!pipelineRunResultData.length });
  }

  if ((!loaded && pipelineRunResultData.length) || error || pipelineRunResultData.length === 0) {
    return <GraphEmpty height={DEFAULT_CHART_HEIGHT} />;
  }

  const newGraphData = _.map(pipelineRunResultData, (result) => {
    return formatTimeSeriesValues(result, DEFAULT_SAMPLES, timespan);
  });
  const grouped = _.groupBy(newGraphData[0], (g) => formatDate(g.x));
  const finalArray = _.compact(_.keys(grouped).map((x) => _.maxBy(grouped[x], 'y')));

  return (
    <TimeSeriesChart
      ariaDesc={t('pipelines-plugin~Pipeline run count chart')}
      ariaTitle={t('pipelines-plugin~Pipeline run count')}
      data={finalArray}
      timespan={timespan}
      width={width}
      containerComponent={
        <ChartVoronoiContainer
          constrainToVisibleArea
          labels={({ datum }) =>
            datum.childName.includes('bar-') && datum.y !== null
              ? `${formatDate(datum.x)}
              ${datum.y}`
              : null
          }
        />
      }
    />
  );
};

export default PipelineRunCount;
