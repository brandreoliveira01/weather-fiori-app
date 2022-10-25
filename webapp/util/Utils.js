sap.ui.define([], function () {
  'use strict';

  return {
    capitalizeSentence: function (sSentence) {
      const words = sSentence.split(' ');

      return words
        .map((word) => {
          return word[0].toUpperCase() + word.substring(1);
        })
        .join(' ');
    },
  };
});
