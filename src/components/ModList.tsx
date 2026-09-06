import { Fragment } from 'react';
import { Col, ListGroup } from 'react-bootstrap';

import { Item, ItemMod } from '../types';
import {
  craftedModColor,
  interpolateProperties,
  modColor,
  unidentifiedColor
} from '../utils';

interface IProps {
  item: Item;
}

const modStyle = (mod: ItemMod) => ({
  color: mod.flags?.crafted ? craftedModColor : modColor
});

export default function ModList({ item }: IProps) {
  return (
    <Fragment>
      <Col xs={12}>
        <ListGroup>
          {item.properties?.map((property, i) => {
            if (property.name.startsWith('Currently')) {
              return null;
            }

            return (
              <ListGroup.Item key={`property-${i}`}>
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
          {item.requirements?.map((requirement, i) => (
            <ListGroup.Item key={`requirement-${i}`}>
              {interpolateProperties(requirement, true)}
            </ListGroup.Item>
          ))}
        </ListGroup>
        {(item.ilvl > 0 || item.requirements?.length) && <hr />}
      </Col>
      <Col xs={12}>
        <ListGroup>
          {item.implicitMods?.map((implicit, i) => (
            <ListGroup.Item key={`implicit-${i}`} style={modStyle(implicit)}>
              {implicit.description}
            </ListGroup.Item>
          ))}
        </ListGroup>
        {Boolean(item.implicitMods?.length && item.explicitMods?.length) && (
          <hr />
        )}
        <ListGroup>
          {item.explicitMods?.map((explicit, i) => (
            <ListGroup.Item key={`explicit-${i}`} style={modStyle(explicit)}>
              {explicit.description}
            </ListGroup.Item>
          ))}
        </ListGroup>
        {!item.identified && (
          <ListGroup>
            <ListGroup.Item style={{ color: unidentifiedColor }}>
              Unidentified
            </ListGroup.Item>
          </ListGroup>
        )}
      </Col>
    </Fragment>
  );
}
