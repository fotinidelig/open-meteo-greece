import { useState } from 'react';
import './App.css';
import ResponsiveHeatMap from './HeatMap';
import { Filters } from './Filters';
import { useMediaQuery } from './use-media-query';

const YEARS = [2025, 2026];

function App() {
  const [selection, setSelection] = useState(YEARS[0]); // year number or "difference"
  const showDifference = selection === "difference";
  const activeYear = showDifference ? YEARS[0] : selection;
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <>
      <div className={`main-container${isMobile ? ' is-mobile' : ''}`}>
        <h1 className={`app-title${isMobile ? ' is-mobile' : ''}`}>
          Greek temperatures in 2026:{" "}
          <span className="app-title__chill">warm</span> winter,{" "}
          <span className="app-title__warm">chill</span> summer
        </h1>

        <div className="filters-container">
          <Filters
            years={YEARS}
            selection={selection}
            setSelection={setSelection}
            isMobile={isMobile}
          />
        </div>

        <div className="heatmap-container">
          <ResponsiveHeatMap
            years={YEARS}
            activeYear={activeYear}
            showDifference={showDifference}
            isMobile={isMobile}
          />
        </div>
      </div>

      <div className={`footer${isMobile ? ' is-mobile' : ''}`}>
        <span>&copy; Fotini Deligiannaki</span>
        <circle className="footer-circle" />
        <span style={{ fontSize: '13px' }}>
          <a
            href="https://github.com/fotinidelig/open-meteo-greece"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Github
          </a>
        </span>
      </div>
    </>
  );
}

export default App;
