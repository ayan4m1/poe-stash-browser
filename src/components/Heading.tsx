import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from 'react-oauth2-code-pkce';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDoorOpen,
  faGears,
  faListSquares
} from '@fortawesome/free-solid-svg-icons';

export default function Heading() {
  const { logIn } = useContext(AuthContext);

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
          <Nav.Link className="nav-item" onClick={() => logIn('test')}>
            <FontAwesomeIcon icon={faDoorOpen} /> Login
          </Nav.Link>
        </Nav>
      </Navbar>
    </Container>
  );
}
