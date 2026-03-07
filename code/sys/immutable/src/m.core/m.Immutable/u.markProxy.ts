const proxyCache = new WeakSet<object>();

export const markProxy = {
  set(value: unknown) {
    if (value && typeof value === 'object') proxyCache.add(value);
  },
  has(value: unknown) {
    return value != null && typeof value === 'object' && proxyCache.has(value);
  },
};
