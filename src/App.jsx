import { useState } from 'react';
import './App.css';
import ResponsiveHeatMap from './HeatMap';
import { Filters } from './Filters';

const YEARS = [2025, 2026];

function App() {
  const [selection, setSelection] = useState(YEARS[0]); // year number or "difference"
  const showDifference = selection === "difference";
  const activeYear = showDifference ? YEARS[0] : selection;

  return (
    <> 
      <div className='main-container'>

        <h1 className="app-title">
          Greek temperatures in2026:{" "}
          <span className="app-title__chill">warm</span> winter,{" "}
          <span className="app-title__warm">chill</span> summer
        </h1>

        <div className='filters-container'>
          <Filters
              years={YEARS}
              selection={selection}
              setSelection={setSelection} />
        </div>

        <div className='heatmap-container'>
            <ResponsiveHeatMap 
                years={YEARS}
                activeYear={activeYear}
                showDifference={showDifference} />
        </div>
      </div>
    </>
  )
}

export default App;
