import * as React from 'react';
import './App.css';

// Import Entrance of PBSimulation
import Viewer from './PBSimulation/Viewer/Viewer';
import ClothSimulation from './PBSimulation/Example/ClothSimulation';

const logo = require('./logo.svg');

class App extends React.Component {
  sim: ClothSimulation;
  constructor() {
    super();
    this.sim = new ClothSimulation();
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to PBS Playground</h2>
        </div>
        <p className="App-intro">
          ...
        </p>
        <div className="Playground"><Viewer {...this.sim.getInfoForRender()}/></div>
      </div>
    );
  }
}

export default App;
