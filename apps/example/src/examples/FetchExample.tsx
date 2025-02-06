import { useCallback, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function FetchModuleExample() {
  const [module, setModule] = useState<WebAssembly.Module>();
  const loadModule = useCallback(async () => {
    setModule(
      await WebAssembly.compileStreaming(
        fetch('http://localhost:8000/example.wasm')
      )
    );
  }, []);

  return (
    <View style={styles.container}>
      <Text>
        Before loading, make sure you have a server running at
        http://localhost:8000 that serves src/directory
      </Text>
      <Text>
        You can do this by running e.g. `python3 -m http.server` in src
        directory.
      </Text>
      <Button title="Load valid module" onPress={loadModule} />
      <Text>Loaded: {module ? 'true' : 'false'}</Text>
      {!!module && (
        <Text>
          Exports: {JSON.stringify(WebAssembly.Module.exports(module))}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
});
