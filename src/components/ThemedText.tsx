import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

const FONT_FAMILY = 'Barlow-Regular';

const styles = StyleSheet.create({
  default: {
    fontFamily: FONT_FAMILY,
  },
});


function capitalizeWords(text: string) {
  return text.replace(/\b\w/g, char => char.toUpperCase());
}

const ThemedText: React.FC<TextProps> = ({ style, children, ...props }) => {
  let processedChildren = children;
  if (typeof children === 'string') {
    processedChildren = capitalizeWords(children);
  } else if (Array.isArray(children)) {
    processedChildren = children.map(child =>
      typeof child === 'string' ? capitalizeWords(child) : child
    );
  }
  return (
    <Text style={[styles.default, style]} {...props}>
      {processedChildren}
    </Text>
  );
};

export default ThemedText;