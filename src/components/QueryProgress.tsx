import { Fragment, useMemo } from 'react';
import { UseQueryResult } from '@tanstack/react-query';
import { addSeconds, formatDistanceToNow } from 'date-fns';
import { Col, ProgressBar, Row, Spinner } from 'react-bootstrap';

interface IProps {
  queries: UseQueryResult[];
  timeEstimate: number;
}

export default function QueryProgress({ queries, timeEstimate }: IProps) {
  const fetched = useMemo(
    () =>
      queries.filter((query) => query.isFetched && !query.isRefetching).length,
    [queries]
  );

  return (
    <Fragment>
      <Row>
        <Col sm={6} xs={12}>
          <h4>
            Fetching{' '}
            {
              queries.filter((query) => !query.isFetched || query.isRefetching)
                .length
            }{' '}
            stash tabs&hellip;
          </h4>
        </Col>
        <Col className="text-end" sm={6} xs={12}>
          <Spinner />
        </Col>
      </Row>
      <Row>
        <Col xs={12}>
          Approximately{' '}
          {formatDistanceToNow(addSeconds(new Date(), timeEstimate))}
        </Col>
      </Row>
      <Row>
        <Col xs={12}>
          <ProgressBar animated max={queries.length} min={1} now={fetched} />
        </Col>
      </Row>
    </Fragment>
  );
}
