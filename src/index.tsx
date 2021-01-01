import { FC, createContext, useContext } from "react";

export default <Props, Value>(useValueHook: (props: Props) => Value) => {
  const Context = createContext<Value | null>(null);
  const useValue = (): Value | null => {
    const value = useContext(Context);
    if (!value)
      console.error("Sub-component must be wrapped with Parent component");
    return value;
  };
  const Component: any = ({ children, ...props }: any) => {
    const value = useValueHook(props as Props);
    const Wrapper = (value as any).Wrapper as FC;
    return (
      <Context.Provider value={value}>
        {Wrapper ? <Wrapper>{children}</Wrapper> : <>{children}</>}
      </Context.Provider>
    );
  };
  const registerComponent = (
    SubComponent: FC<any>,
    name: string = SubComponent.name
  ): void => {
    Component[name] = SubComponent;
  };
  type SubComponents = { [component: string]: FC<any> };
  return [
    Component as FC<Props> & SubComponents,
    useValue,
    registerComponent,
  ] as const;
};
