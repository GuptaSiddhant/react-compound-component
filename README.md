# React Compound Components

> Compound components is a pattern where components are used together such that they share an implicit state that lets them communicate with each other in the background. A compound component is composed of a subset of child components that all work in tandem to produce some functionality. - [Alexi Taylor - dev.to](https://dev.to/alexi_be3/react-component-patterns-49ho)

Create compound components with common managed state using React hooks.

## Basic example

```tsx
import { useState, FC } from "react";
import { render } from "react-dom";
import ccc from "react-compound-components";

interface Props {
  initState?: number;
}

/** INIT
 * Create Compound component by providing a hook function to manage state.
 * This returns a tuple of
 * - Compound Component
 * - Hook to access state
 * - Registration callback to register sub-components
 */
const [Counter, useCountState, register] = ccc((props: Props) => {
  const { initCount = 0 } = props;
  const [count, setCount] = useState(initCount);
  const increment = () => setCount((count) => count + 1);
  const decrement = () => setCount((count) => count - 1);
  return { count, increment, decrement };
});

// 1. Register "Increase" component with
// anonymous function and Component name as second parameter
register(() => {
  const { increment } = useCountState();
  return <button onClick={increment}>Increase</button>;
}, "Increase");

// 2. Register "Decrease" component as named component
register(function Decrease() {
  const { decrement } = useCountState();
  return <button onClick={decrement}>Decrease</button>;
});

// 3. Register "Count" component with declared function
const Count: FC = () => {
  const { count } = useCountState();
  return <span>{count}</span>;
};
register(Count);

// Use Compound Component elsewhere.
const App = () => (
  <Counter initCount={10}>
    <Counter.Decrease />
    <Counter.Count />
    <Counter.Increase />
  </Counter>
);

render(<App />, document.getElementById("root"));
```

## Advanced example

Note: Not needed for JavaScript

The function assumes that the sub-components do not require/expect props. If any sub-component expects props, then some extra work is needed to be done for TypeScript.

In such case, it is recommended to split the component code to a new file.

```tsx
// Tabs.tsx
import { useState, useCallback, FC } from "react";
import ccc from "react-compound-components";

interface TabsProps {
  defaultActiveTabId?: string;
}

const [Tabs, useTabs, register] = ccc((props: TabsProps) => {
  const { defaultActiveTabId = "" } = props;
  const [activeTabId, setActiveTabId] = useState(defaultActiveTabId);
  const changeActiveTabId = useCallback(
    (tabId: string) => setActiveTabId(tabId),
    []
  );
  // Optional component to wrap Compound component
  const Wrapper: FC = ({ children }) => <div className="tabs">{children}</div>;
  return { Wrapper, activeTabId, changeActiveTabId };
});

interface TabProps {
  tabId: string;
  disabled?: boolean;
}

const Tab: FC<ITabProps> = (props) => {
  const { tabId, disabled, children } = props;
  const { changeActiveTabId } = useTabs();
  return (
    <button
      className="tab"
      disabled={disabled}
      onClick={() => changeActiveTabId(tabId)}
    >
      {children}
    </button>
  );
};

interface PanelProps {
  tabId: string;
}

const Panel: FC<PanelProps> = (props) => {
  const { tabId, children } = props;
  const { activeTabId } = useTabs();
  return activeTabId === tabId ? (
    <div className="tabPanel">{children}</div>
  ) : null;
};

register(Tab);
register(Panel);

// The additional part is forcefully setting component types
// to recognize prop-types of sub-components.
export default (Tabs as unknown) as FC<TabsProps> & {
  Tab: typeof Tab;
  Panel: typeof Panel;
};
```

and import the component for usage:

```tsx
// index.tsx
import Tabs from "./Tabs";
import { render } from "react-dom";

const App: FC = () => (
  <Tabs defaultActiveTabId="tab2">
    <Tabs.Tab tabId="tab1">Tab 1</Tabs.Tab>
    <Tabs.Tab tabId="tab2">Tab 2</Tabs.Tab>
    <Tabs.Tab tabId="tab3" disabled>
      Tab 3
    </Tabs.Tab>
    <hr />
    <Tabs.Panel tabId="tab1">Content of Tab 1</Tabs.Panel>
    <Tabs.Panel tabId="tab2">Content of Tab 2</Tabs.Panel>
    <Tabs.Panel tabId="tab3">Content of Tab 3</Tabs.Panel>
  </Tabs>
);

render(<App />, document.getElementById("root"));
```
