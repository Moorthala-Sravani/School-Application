// src/theme/typography.ts
import { ms } from './scale';
import { colors } from './colors';

export const typography = {
  h1:     { fontSize: ms(26), fontWeight: '700' as const, color: colors.textPrimary },
  h2:     { fontSize: ms(20), fontWeight: '700' as const, color: colors.textPrimary },
  h3:     { fontSize: ms(17), fontWeight: '600' as const, color: colors.textPrimary },
  body:   { fontSize: ms(14), fontWeight: '400' as const, color: colors.textPrimary },
  sm:     { fontSize: ms(12), fontWeight: '400' as const, color: colors.textSecond  },
  xs:     { fontSize: ms(10), fontWeight: '400' as const, color: colors.textSecond  },
  label:  { fontSize: ms(13), fontWeight: '500' as const, color: colors.textSecond  },
  button: { fontSize: ms(15), fontWeight: '600' as const, color: colors.textWhite   },
  price:  { fontSize: ms(16), fontWeight: '700' as const, color: colors.feeAmount   },
  link:   { fontSize: ms(13), fontWeight: '500' as const, color: colors.textOrange  },
};