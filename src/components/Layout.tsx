import { Fragment, ReactNode } from 'react';
import { Container } from 'react-bootstrap';
import Heading from './Heading';

interface IProps {
  children: ReactNode;
}

export default function Layout({ children }: IProps) {
  return (
    <Fragment>
      <Heading />
      <Container>{children}</Container>
    </Fragment>
  );
}
