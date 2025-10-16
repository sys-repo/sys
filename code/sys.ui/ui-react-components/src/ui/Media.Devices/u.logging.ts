export const logMedia = (...args: unknown[]) => {
  const time = new Date().toISOString().slice(11, 23);
  console.log(`%c[Media] ${time}`, 'color:#0af;font-weight:bold;', ...args);
};
