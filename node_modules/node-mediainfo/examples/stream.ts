import mediainfo from '../src';

mediainfo('<full path to file>').then(
  (response) => {
    console.log(JSON.stringify(
      response, null, 2,
    ));
  },
);
