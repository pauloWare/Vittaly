import { View, type ViewProps } from 'react-native';

import { useTema } from '@/hooks/use-tema';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const { cores, tema } = useTema();
  const backgroundColor = tema === 'light' ? (lightColor ?? cores.fundo) : (darkColor ?? cores.fundo);

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}

