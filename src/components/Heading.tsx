import { Container, Nav, Navbar } from 'react-bootstrap';

export default function Heading() {
  return (
    <Container fluid className="g-0">
      <Navbar bg="primary" variant="dark" className="mb-4">
        <Navbar.Brand className="ms-4">Stashr</Navbar.Brand>
        <Nav className="ms-4">
          <Nav.Item className="nav-item">Testing</Nav.Item>
        </Nav>
      </Navbar>
    </Container>
  );
}
