// import { useState } from 'react'
import { Editor } from './Editor'
import { Container } from 'reactstrap';

function App() {

  return (
    <Container className="d-flex flex-column mh-100">
      <div style={{ height: '50vh' }}></div>
      <Editor style={{ height: '50vh' }} />
    </Container>
  )
}

export default App
