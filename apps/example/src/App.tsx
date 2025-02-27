import { enableScreens } from 'react-native-screens';
// run this before any screen render(usually in App.js)
enableScreens();
import '@callstack/polygen/polyfill';

import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';

import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  useNavigation,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ExternalModuleExample from './examples/ExternalModuleExample';
import FetchModuleExample from './examples/FetchExample';
import ImportValidationExample from './examples/ImportValidationExample';
import ModuleFromBuffer from './examples/ModuleFromBufferExample';
import TableExample from './examples/TableExample';

const examples = [
  {
    component: ImportValidationExample,
    title: 'Import Validation',
  },
  {
    component: ExternalModuleExample,
    title: 'External Module',
  },
  {
    component: ModuleFromBuffer,
    title: 'Creating Module from Buffer',
  },
  {
    component: FetchModuleExample,
    title: 'Creating Module using Fetch',
  },
  {
    component: TableExample,
    title: 'Table Example',
  },
];

const Stack = createStackNavigator();

function Examples() {
  const navigation = useNavigation();
  return (
    <ScrollView>
      {examples
        .filter((example) =>
          'platform' in example ? example?.platform === Platform.OS : example
        )
        .map((example) => (
          <TouchableOpacity
            key={example.title}
            testID={example.title}
            style={styles.exampleTouchable}
            onPress={() => {
              //@ts-ignore
              navigation.navigate(example.title);
            }}
          >
            <Text style={styles.exampleText}>{example.title}</Text>
          </TouchableOpacity>
        ))}
    </ScrollView>
  );
}

const examplesForPlatform = examples
  .filter((example) =>
    'platform' in example ? example?.platform === Platform.OS : example
  )
  .map((example) => (
    <Stack.Screen
      key={example.title}
      name={example.title}
      component={example.component}
    />
  ));

export default function Navigation() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={theme}>
        <Stack.Navigator initialRouteName="BottomTabs Example">
          <Stack.Screen name="BottomTabs Example" component={Examples} />
          {examplesForPlatform}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  exampleTouchable: {
    padding: 16,
  },
  exampleText: {
    fontSize: 16,
  },
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
