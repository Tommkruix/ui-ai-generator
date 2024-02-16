import React, { useState, useEffect, FunctionComponent } from 'react';
import * as Babel from '@babel/standalone';

interface LiveCodeExecutorProps {
  codeString: string;
}

const LiveCodeExecutor: FunctionComponent<LiveCodeExecutorProps> = ({ codeString }) => {
  const [Component, setComponent] = useState<FunctionComponent | null>(null);

  useEffect(() => {
    try {
      const transformedCode = Babel.transform(codeString, {
        presets: ['react']
      }).code;
      const ComponentFunction = new Function('React', `return function() { ${transformedCode} };`) as (react: typeof React) => FunctionComponent;
      setComponent(() => ComponentFunction(React));
    } catch (error) {
      console.error('Error executing code:', error);
    }
  }, [codeString]);

  return Component ? <Component /> : null;
};

export default LiveCodeExecutor;
