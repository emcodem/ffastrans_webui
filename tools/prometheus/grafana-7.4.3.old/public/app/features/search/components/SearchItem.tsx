import React, { FC, useCallback } from 'react';
import { css } from 'emotion';
import { selectors as e2eSelectors } from '@grafana/e2e-selectors';
import { TagList, Card, useStyles } from '@grafana/ui';
import { GrafanaTheme } from '@grafana/data';
import { DashboardSectionItem, OnToggleChecked } from '../types';
import { SearchCheckbox } from './SearchCheckbox';
import { SEARCH_ITEM_HEIGHT } from '../constants';

export interface Props {
  item: DashboardSectionItem;
  editable?: boolean;
  onTagSelected: (name: string) => any;
  onToggleChecked?: OnToggleChecked;
}

const selectors = e2eSelectors.pages.Dashboards;

export const SearchItem: FC<Props> = ({ item, editable, onToggleChecked, onTagSelected }) => {
  const styles = useStyles(getStyles);
  const tagSelected = useCallback((tag: string, event: React.MouseEvent<HTMLElement>) => {
    onTagSelected(tag);
  }, []);

  const toggleItem = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      if (onToggleChecked) {
        onToggleChecked(item);
      }
    },
    [item]
  );

  return (
    <Card
      aria-label={selectors.dashboards(item.title)}
      heading={item.title}
      href={item.url}
      style={{ minHeight: SEARCH_ITEM_HEIGHT }}
      className={styles.container}
    >
      <Card.Figure align={'center'}>
        <SearchCheckbox editable={editable} checked={item.checked} onClick={toggleItem} />
      </Card.Figure>
      {item.folderTitle && <Card.Meta>{item.folderTitle}</Card.Meta>}
      <Card.Tags>
        <TagList tags={item.tags} onClick={tagSelected} />
      </Card.Tags>
    </Card>
  );
};

const getStyles = (theme: GrafanaTheme) => {
  return {
    container: css`
      padding: ${theme.spacing.sm} ${theme.spacing.md};
    `,
  };
};
