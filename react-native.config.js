// module.exports = {
//   dependencies: {
//     // React Native Vector Icons v12+ handles autolinking automatically
//   },
//   assets: [
//     './src/assets/fonts/',
//     './src/assets/images/',
//     './node_modules/react-native-vector-icons/Fonts/',
//   ],
//   project: {
//     ios: {},
//     android: {},
//   },
// };

module.exports = {
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        ios: null,
        android: null,
      },
    },
  },
};