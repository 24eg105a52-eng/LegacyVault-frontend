import React from 'react';

export default function DemoBanner() {
  return (
    <div className="demo-banner" role="status">
      <span>⚠️</span>
      <span>
        <strong>DEMO PREVIEW MODE:</strong> This frontend interface displays mock college project data.
        Backend connection &amp; persistence will be activated in upcoming steps.
      </span>
    </div>
  );
}
