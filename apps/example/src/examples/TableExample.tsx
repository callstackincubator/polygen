import { useCallback, useMemo, useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import example from '../table_test.wasm';

const iterations = new WebAssembly.Global({ value: 'i32', mutable: true }, 0);
const imports = {
  host: {
    add: (a: number, b: number) => a + b,
  },
  env: {
    iterations,
  },
};

export default function TableExample() {
  const [module, setModule] = useState<any>();
  const [instance, setInstance] = useState<any>();
  const [number, setNumber] = useState<number>(0);
  const [result, setResult] = useState<number>();

  const numberText = useMemo(() => number.toString(), [number]);

  const loadModule = useCallback(async () => {
    setModule(await WebAssembly.compile(example));
  }, []);

  const makeInstance = useCallback(async () => {
    setInstance(await WebAssembly.instantiate(module!, imports));
  }, [module]);

  const onNumberChanged = useCallback((value: string) => {
    const parsed = parseInt(value.replace(/ /g, ''), 10);
    setNumber(isNaN(parsed) ? 0 : parsed);
    setResult(undefined);
  }, []);

  const compute = useCallback(() => {
    setResult(instance.exports.fib(number));
  }, [number, instance]);

  return (
    <View style={styles.container}>
      <Button title="Load module" onPress={loadModule} disabled={!!module} />
      <Text>Module Loaded: {module != null ? 'yes' : 'no'}</Text>
      <Button
        title="Create instance"
        disabled={!module}
        onPress={makeInstance}
      />
      <Text>Instance created: {instance != null ? 'yes' : 'no'}</Text>
      {instance != null && (
        <Text>Exports: {JSON.stringify(instance.exports)}</Text>
      )}
      <TextInput
        style={styles.input}
        value={numberText}
        onChangeText={onNumberChanged}
        editable={!!instance}
        aria-disabled={!instance}
      />
      <Button title="Compute" onPress={compute} disabled={!instance} />
      <Text>
        fib({number}) = {result ?? '---'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});
