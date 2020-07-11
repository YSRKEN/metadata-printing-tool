import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import OptionForm from 'container/OptionForm';
import PhotoView from 'container/PhotoView';
import 'App.css';

const App = () => {
  return (
    <Container>
      <Row className="my-3">
        <Col sm={9}>
          <PhotoView />
        </Col>
        <Col sm={3}>
          <OptionForm />
        </Col>
      </Row>
    </Container>
  );
}

export default App;
