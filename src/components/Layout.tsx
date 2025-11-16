import { Fragment, ReactNode } from 'react';
import { Container } from 'react-bootstrap';

interface IProps {
  children: ReactNode;
}

export default function Layout({ children }: IProps) {
  return (
    <Fragment>
      <title>Path of Exile Stash Browser v0.1</title>
      <Container>{children}</Container>
    </Fragment>
  );
}
