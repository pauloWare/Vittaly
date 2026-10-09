/**
 * Cores legadas do template Expo (constants/theme).
 * O tema oficial do app vive em `styles/temas.ts` + `hooks/use-tema.tsx`
 * (claro = padrão, escuro = visual anterior). Este arquivo é mantido apenas
 * para compatibilidade de componentes do template.
 */

import { Platform } from 'react-native';

import { TEMA_CLARO, TEMA_ESCURO } from '@/styles/temas';

const tintColorLight = TEMA_CLARO.primaria;
const tintColorDark = TEMA_ESCURO.destaque;

export const Colors = {
  light: {
    text: TEMA_CLARO.texto,
    background: TEMA_CLARO.fundo,
    tint: tintColorLight,
    icon: TEMA_CLARO.textoSecundario,
    tabIconDefault: TEMA_CLARO.textoSecundario,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: TEMA_ESCURO.texto,
    background: TEMA_ESCURO.fundo,
    tint: tintColorDark,
    icon: TEMA_ESCURO.textoSecundario,
    tabIconDefault: TEMA_ESCURO.textoSecundario,
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
