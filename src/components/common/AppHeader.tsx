// src/components/common/AppHeader.tsx
import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors }    from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';
import AppText from './AppText';

interface Props {
  schoolName:  string;
  schoolLogo?: ImageSourcePropType;
  childName?:  string;
  onMenuPress: () => void;
}

const AppHeader = ({
  schoolName,
  schoolLogo,
  childName,
  onMenuPress,
}: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + vs(8) }]}>
      {/* Left: Logo + school name + child name */}
      <View style={styles.left}>
        {schoolLogo && (
          <Image source={schoolLogo} style={styles.logo} resizeMode="contain" />
        )}
        <View style={styles.textBlock}>
          <AppText
            variant="h3"
            color={colors.textWhite}
            style={styles.schoolName}
            numberOfLines={1}
          >
            {schoolName}
          </AppText>
          {childName && (
            <AppText
              variant="sm"
              color={colors.orangeLight}
              numberOfLines={1}
            >
              {childName}
            </AppText>
          )}
        </View>
      </View>

      {/* Right: 3-dot menu */}
      <TouchableOpacity onPress={onMenuPress} style={styles.menuBtn}>
        <AppText style={styles.dots}>⋮</AppText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor:  colors.headerBg,
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal: hs(16),
    paddingBottom:    vs(12),
  },
  left: {
    flexDirection: 'row',
    alignItems:    'center',
    flex:          1,
  },
  logo: {
    width:        hs(44),
    height:       hs(44),
    borderRadius: hs(6),
    marginRight:  hs(10),
  },
  textBlock: {
    flex: 1,
  },
  schoolName: {
    fontWeight: '700',
    fontSize:   ms(15),
  },
  menuBtn: {
    padding:      hs(8),
    marginLeft:   hs(8),
  },
  dots: {
    color:      colors.textWhite,
    fontSize:   ms(24),
    fontWeight: '700',
  },
});

export default AppHeader;