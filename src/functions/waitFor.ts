/**
  Waits for `delay` milliseconds asynchronously

  @param delay milliseconds to wait for.
 */
const waitFor = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay));

export default waitFor;
