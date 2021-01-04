# React Compound Components

Create compound components with common managed state using React hooks.

> Compound components is a pattern where components are used together such that they share an implicit state that lets them communicate with each other in the background. A compound component is composed of a subset of child components that all work in tandem to produce some functionality. - [Alexi Taylor - dev.to](https://dev.to/alexi_be3/react-component-patterns-49ho)

## Installation

[![NPM](https://nodei.co/npm/react-compound-components.png?compact=true)](https://npmjs.org/package/react-compound-components)

npm: `npm i react-compound-components`

Yarn: `yarn add react-compound-components`

## Usage

Import the default exported function from library

```tsx
import createCompoundComponent from "react-compound-components";
// OR (recommended)
import ccc from "react-compound-components";
```

### `ccc`

`ccc` function takes one react-hook function as parameter which is responsible for managing state of the compound component.
It returns a tuple of 3 values:

- Compound component,
- hook-function to access state, and
- a register function to register sub-components.

```tsx
// Naming could/should be changed to suit the case.
const [Component, useCompoundState, register] = ccc(useManageStateHook);
```

#### `useManageStateHook`

In above example, `useManageStateHook` is a simple react-hook which can take some props and return state value and modifiers as an object.

```tsx
const useManageStateHook = ({ initialValue }: { initialValue: number }) => {
  const [value, setValue] = React.useState(initialValue);
  const changeValue = (newValue: number) => setValue(value);
  return { value, changeValue };
};
```

In addition to returning state values and modifiers, an optional `Wrapper` component can be returned as well. As name suggests, this Wrapper component wraps around the Compound Component. The Wrapper component can only receive `children` as prop and should return it somehow.

```tsx
const useManageStateHook = ({ initialValue }: { initialValue: number }) => {
  const [value, setValue] = React.useState(initialValue);
  const changeValue = (newValue: number) => setValue(value);
  const Wrapper: FC = ({ children }) => (
    <div>
      <h1>Compound component</h1>{" "}
      <button onClick={() => changeValue(initialValue)}>Reset</button>
      <hr />
      {children}
    </div>
  );
  return { Wrapper, value, changeValue };
};
```

#### `Component`

The first item in returned tuple is the actual Compound Component which is used to everywhere. This Component acts as a wrapper for all its sub-components. The sub-components can be accessed by using dot-notation of this Component. Eg.

```tsx
<Component>
  <Component.SubComponent1 />
  <Component.SubComponent2 />
  <Component.SubComponent3 />
</Component>
```

#### `useCompoundState`

The resulting state can be accessed in any sub-component using the `useCompoundState` hook, which is returned in the tuple.

```tsx
const SubComponent = () => {
  const { value } = useCompoundState();
  return <pre>{JSON.stringify(value, null, 2)}</pre>;
};
```

#### `register`

A callback provided to simplify attaching Sub-components to parent/main component. It takes 2 parameters

1. Functional component (mandatory, type: React.FC) - React functional component which return an Element. Use `useCompoundState` to access state properties. The component can take props as well.
2. Name (optional, type: string) - In case the functional component is anonymous, the name string provided will be used as the dot-notation reference to the component.

```tsx
// 1. Register component with anonymous function and name as second parameter
register(() => <div />, "SubComponent1");
// 2. Register component as named component
register(function SubComponent2() {
  return <div />;
});
// 3. Register component with declared function
const SubComponent3 = () => <div />;
register(SubComponent3);
```

## Example

Playground on [CodeSandBox](https://codesandbox.io/s/react-compound-component-vqfoq?file=/src/Tabs.tsx).

### Basic example

```tsx
import { useState, FC } from "react";
import { render } from "react-dom";
import ccc from "react-compound-components";

interface Props {
  initState?: number;
}

const [Counter, useCountState, register] = ccc((props: Props) => {
  const { initCount = 0 } = props;
  const [count, setCount] = useState(initCount);
  const increment = () => setCount((count) => count + 1);
  const decrement = () => setCount((count) => count - 1);
  return { count, increment, decrement };
});

register(() => {
  const { increment } = useCountState();
  return <button onClick={increment}>Increase</button>;
}, "Increase");

register(function Decrease() {
  const { decrement } = useCountState();
  return <button onClick={decrement}>Decrease</button>;
});

const Count: FC = () => {
  const { count } = useCountState();
  return <span>{count}</span>;
};
register(Count);

const App = () => (
  <Counter initCount={10}>
    <Counter.Decrease />
    <Counter.Count />
    <Counter.Increase />
  </Counter>
);

render(<App />, document.getElementById("root"));
```

### Advanced example

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
  const Wrapper: FC = ({ children }) => (
    <div className="tabs">
      <h1>
        Tabs
        <button onClick={() => changeActiveTabId(defaultActiveTabId)}>
          Reset active tab
        </button>
      </h1>
      {children}
    </div>
  );
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
import { FC } from "react";
import { render } from "react-dom";
import Tabs from "./Tabs";

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

## Contributing

If you find a bug, please [create an issue](https://github.com/GuptaSiddhant/react-compound-component/issues/new) providing instructions to reproduce it. It's always very appreciable if you find the time to fix it. In this case, please [submit a PR](https://github.com/GuptaSiddhant/react-compound-component/pulls).

If you're a beginner, it'll be a pleasure to help you contribute. You can start by reading [the beginner's guide to contributing to a GitHub project](https://akrabat.com/the-beginners-guide-to-contributing-to-a-github-project/).

### Know issues

- When registering a sub-component, the TypeScript type of Sub-component isn't inferred automatically.

## License

MIT © Siddhant Gupta
