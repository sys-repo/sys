export const Styles = {
  focus: {
    dashedUnderline: {
      ':focus': { outline: 'none' },
      ':focus-visible': {
        outline: 'none',
        textDecorationLine: 'underline',
        textDecorationStyle: 'dashed',
        textUnderlineOffset: '0.15em',
      },
    },
  },
} as const;
