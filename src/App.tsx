import React from 'react';
import logo from './logo.svg';
import './App.css';
import WhepViewer from './WhepViewer';
import WhipViewer from './WhipViewer';

function App() {
  const [mode, setMode] = React.useState(true);
  return (
    <div className="App">
      <button onClick={() => setMode(true)} disabled={mode}>WHIP</button>
      <button onClick={() => setMode(false)} disabled={!mode}>WHEP</button>
      {mode ? <WhipViewer /> : <WhepViewer />}

    </div>
  );
}

export default App;
