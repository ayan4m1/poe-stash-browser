import { Fragment, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button, Container, Form, Nav, Navbar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDoorClosed,
  faDoorOpen,
  faGears,
  faListSquares
} from '@fortawesome/free-solid-svg-icons';

import useLeagues from '../hooks/useLeagues';
import useAuthContext from '../hooks/useAuthContext';
import useAppContext from '../hooks/useAppContext';

export default function Heading() {
  const selectRef = useRef<HTMLSelectElement>(null);
  const { setSelectedLeague } = useAppContext();
  const { logIn, token } = useAuthContext();
  const { data } = useLeagues();
  const handleLeagueChange = useCallback(() => {
    const league = data.leagues.find(
      (league) => league.id === selectRef.current.value
    );

    if (!league) {
      return;
    }

    setSelectedLeague(league);
  }, [data, setSelectedLeague]);

  return (
    <Container fluid className="g-0">
      <Navbar bg="primary" variant="dark" className="mb-4">
        <Navbar.Brand as={Link} className="ms-4" to="/">
          Stashr
        </Navbar.Brand>
        <Nav className="ms-4">
          <Nav.Link as={Link} className="nav-item" to="/stashes">
            <FontAwesomeIcon icon={faListSquares} /> Stashes
          </Nav.Link>
          <Nav.Link as={Link} className="nav-item" to="/settings">
            <FontAwesomeIcon icon={faGears} /> Settings
          </Nav.Link>
        </Nav>
        <Nav className="ms-auto me-4">
          {Boolean(data) && (
            <Fragment>
              <Nav.Item>
                <Form.Select ref={selectRef}>
                  {data.leagues.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Form.Select>
              </Nav.Item>
              <Nav.Item>
                <Button onClick={handleLeagueChange}>Set</Button>
              </Nav.Item>
            </Fragment>
          )}
          <Nav.Link className="nav-item" onClick={() => logIn('test')}>
            {token ? (
              <Fragment>
                <FontAwesomeIcon icon={faDoorClosed} /> Logout
              </Fragment>
            ) : (
              <Fragment>
                <FontAwesomeIcon icon={faDoorOpen} /> Login
              </Fragment>
            )}
          </Nav.Link>
        </Nav>
      </Navbar>
    </Container>
  );
}
