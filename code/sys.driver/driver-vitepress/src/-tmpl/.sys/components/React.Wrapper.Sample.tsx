// @ts-types="@types/react"
import React from 'react';

export type MyComponentProps = {
  count?: number;
};

export const MyComponent: React.FC<MyComponentProps> = (props) => {
  console.log('MyComponent.props:', props);
  return (
    <div style={{ marginTop: 5, padding: 10, backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */ }}>
      <div>Hello from React 👋</div>
    </div>
  );
};
