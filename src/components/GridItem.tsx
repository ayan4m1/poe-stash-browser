import { useCallback, useMemo } from 'react';
import {
  Button,
  Card,
  Col,
  OverlayTrigger,
  Row,
  Tooltip
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRemove, faSave } from '@fortawesome/free-solid-svg-icons';

import ModList from './ModList';
import useAppContext from '../hooks/useAppContext';
import { Item, ItemRarity } from '../types';
import { cannotSaveTypes, rarityColors, shouldUseSlimDisplay } from '../utils';

interface IProps {
  item: Item;
}

export default function GridItem({ item }: IProps) {
  const { savedItems, setSavedItems } = useAppContext();
  const color = useMemo(
    () => rarityColors[item.rarity ?? ItemRarity.Normal],
    [item]
  );
  const slimDisplay = useMemo(() => shouldUseSlimDisplay(item), [item]);
  const saved = useMemo(
    () => savedItems?.includes(item.id),
    [savedItems, item]
  );
  const handleSaveToggle = useCallback(() => {
    if (saved) {
      setSavedItems((prev) => {
        const result = [...prev];

        result.splice(
          result.findIndex((itemId) => item.id === itemId),
          1
        );

        return result;
      });
    } else {
      setSavedItems((prev) => [...prev, item.id]);
    }
  }, [item, saved, setSavedItems]);

  return (
    <Col className="mb-2 d-flex" md={3} sm={4} xs={12}>
      <Card
        style={{
          borderRadius: 16,
          backgroundColor: 'black',
          color: 'white',
          flexGrow: 1
        }}
      >
        <OverlayTrigger
          overlay={(props) => <Tooltip {...props}>{item?.stashTab}</Tooltip>}
          placement="bottom"
        >
          <Card.Header style={{ backgroundColor: '#262323' }}>
            <Card.Title className="text-center" style={{ color }}>
              {!cannotSaveTypes.includes(item.frameTypeId) && (
                <p className="text-end">
                  <Button
                    onClick={handleSaveToggle}
                    variant={saved ? 'danger' : 'success'}
                  >
                    <FontAwesomeIcon icon={saved ? faRemove : faSave} />
                  </Button>
                </p>
              )}
              <p>
                <img
                  src={item.icon}
                  style={{ minHeight: '141px', objectFit: 'scale-down' }}
                />
              </p>
              <p>
                {item.name} {item.typeLine}{' '}
                {item.stackSize ? `(${item.stackSize})` : null}
              </p>
            </Card.Title>
          </Card.Header>
        </OverlayTrigger>
        {!slimDisplay && (
          <Card.Body>
            <Row className="text-center">
              <Col>
                <ModList item={item} />
              </Col>
            </Row>
          </Card.Body>
        )}
      </Card>
    </Col>
  );
}
