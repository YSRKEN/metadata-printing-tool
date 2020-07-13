import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import OptionForm from 'container/OptionForm';
import PhotoView from 'container/PhotoView';
import 'App.css';
import { ApplicationContext, useApplicationState } from 'service/state';

const App = () => {
  return (
    <ApplicationContext.Provider value={useApplicationState()}>
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
    </ApplicationContext.Provider>
  );
}

export default App;
