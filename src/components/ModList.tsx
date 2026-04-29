import { Fragment } from 'react';
import { Col, ListGroup } from 'react-bootstrap';

import { Item } from '../types';
import { interpolateProperties } from '../utils';

interface IProps {
  item: Item;
}

export default function ModList({ item }: IProps) {
  return (
    <Fragment>
      <Col xs={12}>
        <ListGroup>
          {item.properties?.map((property) => {
            if (property.name.startsWith('Currently')) {
              return null;
            }

            return (
              <ListGroup.Item key={property.name}>
                {interpolateProperties(property)}
              </ListGroup.Item>
            );
          })}
        </ListGroup>
        {Boolean(item.properties?.length) && <hr />}
        <ListGroup>
          {item.ilvl > 0 && (
            <ListGroup.Item>Item Level: {item.ilvl}</ListGroup.Item>
          )}
          {item.requirements?.map((requirement) => (
            <ListGroup.Item key={requirement.name}>
              {interpolateProperties(requirement, true)}
            </ListGroup.Item>
          ))}
        </ListGroup>
        {(item.ilvl > 0 || item.requirements?.length) && <hr />}
      </Col>
      <Col xs={12}>
        <ListGroup>
          {item.implicitMods?.map((implicit) => (
            <ListGroup.Item key={implicit}>{implicit}</ListGroup.Item>
          ))}
        </ListGroup>
        {Boolean(item.implicitMods?.length && item.explicitMods?.length) && (
          <hr />
        )}
        <ListGroup>
          {item.explicitMods?.map((explicit) => (
            <ListGroup.Item key={explicit}>{explicit}</ListGroup.Item>
          ))}
        </ListGroup>
      </Col>
    </Fragment>
  );
}
