import './App.css'
import Pulsar from './components/Pulsar'

function App() {

  return (
    <>
      <header>
        <h1>Project: <em>Pulsar Simulation</em></h1>
      </header>
      <p>
        This project aims to emulate a pixelated version the particle effect simulation of <a href='https://pulsar.com/' target="_blank">Pulsar's homepage screen</a>.
        <br />
        Move the mouse within the border below to try the simulation:
      </p>
      <Pulsar
        borderSize={600}
        particleSize={10}
      />

      <p>Checkout the project's <a href="https://github.com/Zukurai-Kushal/pulsar-effect" target="_blank">GitHub</a> repository to see how the <em>JavaSrcipt</em> code works!</p>
    </>
  )
}

export default App
