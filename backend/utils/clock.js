let mockedNow = null;

function now() {
  if (mockedNow !== null) {
    return new Date(mockedNow);
  }
  return new Date();
}

function setNow(date) {
  if (date === null || date === undefined) {
    mockedNow = null;
  } else {
    mockedNow = new Date(date).getTime();
  }
}

module.exports = {
  now,
  setNow,
};
