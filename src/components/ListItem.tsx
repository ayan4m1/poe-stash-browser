import { useCallback, useMemo } from 'react';
import {
  Button,
  Card,
  Col,
  Container,
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

export default function ListItem({ item }: IProps) {
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
    <Col className="mb-2" xs={12}>
      <Card style={{ backgroundColor: '#262323' }}>
        <Card.Body>
          <Container fluid>
            <Row>
              <OverlayTrigger
                overlay={(props) => (
                  <Tooltip {...props}>{item?.stashTab}</Tooltip>
                )}
                placement="right"
              >
                <Col className="text-center" sm={2} xs={12}>
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
                    <img src={item.icon} />
                  </p>
                  <h5 style={{ color }}>
                    {item.name} {item.typeLine}{' '}
                    {item.stackSize ? `(${item.stackSize})` : null}
                  </h5>
                </Col>
              </OverlayTrigger>
              {!slimDisplay && (
                <Col sm={10} xs={12}>
                  <ModList item={item} />
                </Col>
              )}
            </Row>
          </Container>
        </Card.Body>
      </Card>
    </Col>
  );
}
